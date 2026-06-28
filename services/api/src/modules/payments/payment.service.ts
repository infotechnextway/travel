import { PaymentRepository } from './payment.repository';
import { WalletRepository } from './wallet.repository';
import { InvoiceRepository } from './invoice.repository';
import { IPayment } from './payment.model';
import { IInvoice, IInvoiceItem } from './invoice.model';
import { BookingRepository } from '@modules/bookings/booking.repository';
import { BookingModel, IBooking } from '@modules/bookings/booking.model';
import { AppError, NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@shared/errors';
import { PaymentStatus, BookingStatus, Currency, UserRole } from '@shared/enums';
import crypto from 'crypto';

// Razorpay & Stripe SDKs would be imported here in production
// import Razorpay from 'razorpay';
// import Stripe from 'stripe';

export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private walletRepo: WalletRepository,
    private invoiceRepo: InvoiceRepository,
    private bookingRepo: BookingRepository
  ) {}

  // ─── RAZORPAY ORDER CREATION ───

  async createRazorpayOrder(userId: string, dto: any): Promise<{ order: any; paymentRecord: IPayment }> {
    const booking = await this.bookingRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== userId) throw new ForbiddenError('Not your booking');
    if (booking.status !== BookingStatus.PENDING) throw new ConflictError('Booking is not in draft state');

    let amount = booking.finalAmount;
    let walletUsed = 0;

    // Check wallet balance if requested
    if (dto.useWalletBalance && dto.walletAmount > 0) {
      const wallet = await this.walletRepo.getOrCreate(userId);
      walletUsed = Math.min(wallet.balance, dto.walletAmount, amount);
      if (walletUsed > 0) {
        amount -= walletUsed;
      }
    }

    // Create Razorpay order (mocked for Phase 11)
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const order = {
      id: orderId,
      amount: Math.round(amount * 100), // paise
      currency: booking.currency,
      receipt: booking.bookingCode,
      status: 'created',
      notes: {
        bookingId: booking._id,
        userId,
        walletUsed: walletUsed.toString()
      }
    };

    // Create payment record
    const payment = await this.paymentRepo.create({
      bookingId: dto.bookingId,
      userId,
      gateway: 'razorpay',
      gatewayOrderId: orderId,
      amount: amount,
      currency: booking.currency as Currency,
      status: PaymentStatus.PENDING,
      metadata: { walletUsed, originalAmount: booking.finalAmount }
    } as any);

    return { order, paymentRecord: payment };
  }

  // ─── STRIPE PAYMENT INTENT ───

  async createStripeIntent(userId: string, dto: any): Promise<{ clientSecret: string; paymentRecord: IPayment }> {
    const booking = await this.bookingRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== userId) throw new ForbiddenError('Not your booking');
    if (booking.status !== BookingStatus.PENDING) throw new ConflictError('Booking is not in draft state');

    let amount = booking.finalAmount;
    let walletUsed = 0;

    if (dto.useWalletBalance && dto.walletAmount > 0) {
      const wallet = await this.walletRepo.getOrCreate(userId);
      walletUsed = Math.min(wallet.balance, dto.walletAmount, amount);
      if (walletUsed > 0) amount -= walletUsed;
    }

    // Create Stripe PaymentIntent (mocked)
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substring(2, 16)}`;

    const payment = await this.paymentRepo.create({
      bookingId: dto.bookingId,
      userId,
      gateway: 'stripe',
      gatewayOrderId: paymentIntentId,
      amount: amount,
      currency: booking.currency as Currency,
      status: PaymentStatus.PENDING,
      metadata: { walletUsed, originalAmount: booking.finalAmount, clientSecret }
    } as any);

    return { clientSecret, paymentRecord: payment };
  }

  // ─── UPI INTENT / DEEP LINK ───

  async createUpiIntent(userId: string, dto: any): Promise<{ upiUrl: string; paymentRecord: IPayment }> {
    const booking = await this.bookingRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== userId) throw new ForbiddenError('Not your booking');

    const upiUrl = this.buildUpiUrl(dto.upiId, dto.amount, booking.bookingCode, `Booking ${booking.bookingCode}`);

    const payment = await this.paymentRepo.create({
      bookingId: dto.bookingId,
      userId,
      gateway: 'upi',
      amount: dto.amount,
      currency: booking.currency as Currency,
      status: PaymentStatus.PENDING,
      upiDetails: { vpa: dto.upiId, provider: dto.provider },
      metadata: { upiUrl, provider: dto.provider }
    } as any);

    return { upiUrl, paymentRecord: payment };
  }

  // ─── VERIFY RAZORPAY PAYMENT ───

  async verifyRazorpayPayment(userId: string, dto: any): Promise<{ payment: IPayment; booking: IBooking }> {
    const payment = await this.paymentRepo.findByGatewayOrderId(dto.gatewayOrderId);
    if (!payment) throw new NotFoundError('Payment order not found');
    if (payment.userId !== userId) throw new ForbiddenError('Not your payment');

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
    const body = dto.gatewayOrderId + '|' + dto.gatewayPaymentId;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expectedSignature !== dto.gatewaySignature) {
      throw new ValidationError('Invalid payment signature');
    }

    // Update payment
    const updatedPayment = await this.paymentRepo.update(payment._id, {
      gatewayPaymentId: dto.gatewayPaymentId,
      gatewaySignature: dto.gatewaySignature,
      status: PaymentStatus.COMPLETED,
      method: dto.method || 'card',
      receiptUrl: `https://dashboard.razorpay.com/payments/${dto.gatewayPaymentId}`
    }) as IPayment;

    // Deduct wallet if used
    if (payment.metadata?.walletUsed > 0) {
      await this.walletRepo.debit(userId, payment.metadata.walletUsed, 'booking', `Wallet payment for booking ${payment.bookingId}`, payment.bookingId, 'booking');
    }

    // Confirm booking
    const booking = await this.bookingRepo.update(payment.bookingId, {
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: dto.method || 'card'
    }) as IBooking;

    // Generate invoice
    await this.generateInvoice(booking, updatedPayment, 'customer');

    return { payment: updatedPayment, booking };
  }

  // ─── VERIFY STRIPE PAYMENT ───

  async verifyStripePayment(userId: string, dto: any): Promise<{ payment: IPayment; booking: IBooking }> {
    const payment = await this.paymentRepo.findByGatewayOrderId(dto.gatewayOrderId);
    if (!payment) throw new NotFoundError('Payment intent not found');
    if (payment.userId !== userId) throw new ForbiddenError('Not your payment');

    // Verify with Stripe (mocked)
    const updatedPayment = await this.paymentRepo.update(payment._id, {
      gatewayPaymentId: dto.gatewayPaymentId,
      status: PaymentStatus.COMPLETED,
      method: dto.method || 'card',
      receiptUrl: `https://dashboard.stripe.com/payments/${dto.gatewayPaymentId}`
    }) as IPayment;

    if (payment.metadata?.walletUsed > 0) {
      await this.walletRepo.debit(userId, payment.metadata.walletUsed, 'booking', `Wallet payment for booking ${payment.bookingId}`, payment.bookingId, 'booking');
    }

    const booking = await this.bookingRepo.update(payment.bookingId, {
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: dto.method || 'card'
    }) as IBooking;

    await this.generateInvoice(booking, updatedPayment, 'customer');

    return { payment: updatedPayment, booking };
  }

  // ─── WALLET TOP-UP ───

  async topUpWallet(userId: string, dto: any): Promise<{ order: any; paymentRecord: IPayment }> {
    const orderId = `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const order = {
      id: orderId,
      amount: Math.round(dto.amount * 100),
      currency: 'INR',
      receipt: `wallet_topup_${userId}`,
      notes: { userId, type: 'wallet_topup' }
    };

    const payment = await this.paymentRepo.create({
      bookingId: 'wallet_topup',
      userId,
      gateway: dto.gateway,
      gatewayOrderId: orderId,
      amount: dto.amount,
      currency: Currency.INR,
      status: PaymentStatus.PENDING,
      metadata: { type: 'wallet_topup', userId }
    } as any);

    return { order, paymentRecord: payment };
  }

  async verifyWalletTopup(userId: string, dto: any): Promise<{ wallet: any; payment: IPayment }> {
    const payment = await this.paymentRepo.findByGatewayOrderId(dto.gatewayOrderId);
    if (!payment) throw new NotFoundError('Top-up order not found');
    if (payment.userId !== userId) throw new ForbiddenError('Not your top-up');

    // Verify signature based on gateway
    if (dto.gateway === 'razorpay') {
      const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
      const body = dto.gatewayOrderId + '|' + dto.gatewayPaymentId;
      const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
      if (expected !== dto.gatewaySignature) throw new ValidationError('Invalid signature');
    }

    await this.paymentRepo.update(payment._id, {
      gatewayPaymentId: dto.gatewayPaymentId,
      status: PaymentStatus.COMPLETED,
      method: dto.method || 'card'
    });

    const wallet = await this.walletRepo.credit(userId, payment.amount, 'topup', `Wallet top-up via ${dto.gateway}`, payment._id, 'payment');
    const updatedPayment = await this.paymentRepo.findById(payment._id) as IPayment;

    return { wallet, payment: updatedPayment };
  }

  // ─── WALLET WITHDRAWAL ───

  async requestWithdrawal(userId: string, dto: any): Promise<{ wallet: any; transaction: any }> {
    const wallet = await this.walletRepo.getOrCreate(userId);
    if (wallet.balance < dto.amount) throw new ValidationError('Insufficient wallet balance');

    // Debit wallet
    const updatedWallet = await this.walletRepo.debit(userId, dto.amount, 'withdrawal', `Withdrawal to bank account ${dto.bankAccountId}`, undefined, 'payout');

    // Create payout record (mocked)
    const payoutId = `payout_${Date.now()}`;
    await this.paymentRepo.create({
      bookingId: 'wallet_withdrawal',
      userId,
      gateway: 'cash',
      amount: dto.amount,
      currency: wallet.currency,
      status: PaymentStatus.COMPLETED,
      metadata: { type: 'withdrawal', bankAccountId: dto.bankAccountId, payoutId }
    } as any);

    return { wallet: updatedWallet, transaction: { payoutId, amount: dto.amount, status: 'pending' } };
  }

  // ─── REFUNDS ───

  async requestRefund(userId: string, dto: any): Promise<{ payment: IPayment; booking: IBooking }> {
    const booking = await this.bookingRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== userId) throw new ForbiddenError('Not your booking');
    if (booking.refundStatus !== 'none' && booking.refundStatus !== 'requested') {
      throw new ConflictError('Refund already processed or not eligible');
    }

    // Find original payment
    const payments = await this.paymentRepo.findByBookingId(dto.bookingId);
    const originalPayment = payments.find(p => p.status === PaymentStatus.COMPLETED && p.gateway !== 'wallet');
    if (!originalPayment) throw new NotFoundError('No eligible payment found for refund');

    // Update booking refund status
    const updatedBooking = await this.bookingRepo.update(dto.bookingId, {
      refundStatus: 'requested',
      refundAmount: dto.amount,
      cancellationReason: dto.reason
    }) as IBooking;

    // Update payment refund status
    const updatedPayment = await this.paymentRepo.update(originalPayment._id, {
      refundStatus: 'pending',
      refundAmount: dto.amount
    }) as IPayment;

    return { payment: updatedPayment, booking: updatedBooking };
  }

  async processRefund(adminId: string, dto: any): Promise<{ payment: IPayment; booking: IBooking }> {
    const payment = await this.paymentRepo.findById(dto.paymentId);
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.refundStatus !== 'pending') throw new ConflictError('No pending refund for this payment');

    const booking = await this.bookingRepo.findById(payment.bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    // Process via gateway (mocked)
    const refundId = `refund_${Date.now()}`;

    // Update payment
    const updatedPayment = await this.paymentRepo.update(payment._id, {
      refundStatus: 'processed',
      refundId,
      status: PaymentStatus.REFUNDED
    }) as IPayment;

    // Update booking
    const updatedBooking = await this.bookingRepo.update(payment.bookingId, {
      refundStatus: 'processed',
      paymentStatus: PaymentStatus.REFUNDED
    }) as IBooking;

    // Credit wallet if refund to wallet
    if (booking.refundBreakdown?.refundMethod === 'wallet') {
      await this.walletRepo.credit(
        booking.customerId,
        dto.amount,
        'refund',
        `Refund for booking ${booking.bookingCode}`,
        booking._id,
        'booking'
      );
    }

    // Generate refund invoice
    await this.generateRefundInvoice(booking, updatedPayment, dto.amount);

    return { payment: updatedPayment, booking: updatedBooking };
  }

  // ─── WEBHOOKS ───

  async handleRazorpayWebhook(payload: any, signature: string): Promise<void> {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_test';
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    if (expected !== signature) throw new ValidationError('Invalid webhook signature');

    const event = payload.event;
    const data = payload.payload?.payment?.entity;

    if (!data) return;

    const payment = await this.paymentRepo.findByGatewayPaymentId(data.id);
    if (!payment) return;

    // Store encrypted webhook payload
    await this.paymentRepo.update(payment._id, {
      webhookPayload: JSON.stringify(payload),
      status: event === 'payment.captured' ? PaymentStatus.COMPLETED : event === 'payment.failed' ? PaymentStatus.FAILED : payment.status,
      failureReason: event === 'payment.failed' ? data.error_description : payment.failureReason
    });

    if (event === 'payment.captured') {
      await this.bookingRepo.update(payment.bookingId, {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.COMPLETED
      });
    }
  }

  async handleStripeWebhook(payload: any, signature: string): Promise<void> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
    // Stripe uses a different signature scheme - mocked for Phase 11
    const event = payload.type;
    const data = payload.data?.object;

    if (!data) return;

    const payment = await this.paymentRepo.findByGatewayPaymentId(data.id);
    if (!payment) return;

    await this.paymentRepo.update(payment._id, {
      webhookPayload: JSON.stringify(payload),
      status: event === 'payment_intent.succeeded' ? PaymentStatus.COMPLETED : event === 'payment_intent.payment_failed' ? PaymentStatus.FAILED : payment.status
    });

    if (event === 'payment_intent.succeeded') {
      await this.bookingRepo.update(payment.bookingId, {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.COMPLETED
      });
    }
  }

  // ─── INVOICES ───

  async generateInvoice(booking: IBooking, payment: IPayment, type: 'customer' | 'vendor' | 'commission'): Promise<IInvoice> {
    const taxRate = 18;
    const taxableAmount = booking.totalAmount - booking.discountAmount;
    const totalTax = taxableAmount * (taxRate / 100);
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    const items: IInvoiceItem[] = [{
      description: booking.metadata.listingTitle,
      quantity: booking.travelers.length || 1,
      unitPrice: booking.metadata.pricePerPerson || 0,
      total: taxableAmount,
      hsnCode: '9985', // Travel agency services
      taxRate,
      cgst,
      sgst,
      igst: 0
    }];

    if (booking.platformFee > 0) {
      items.push({
        description: 'Platform Service Fee',
        quantity: 1,
        unitPrice: booking.platformFee,
        total: booking.platformFee,
        taxRate: 18,
        cgst: booking.platformFee * 0.09,
        sgst: booking.platformFee * 0.09,
        igst: 0
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const cgstTotal = items.reduce((sum, item) => sum + item.cgst, 0);
    const sgstTotal = items.reduce((sum, item) => sum + item.sgst, 0);
    const totalAmount = subtotal + cgstTotal + sgstTotal;

    const invoice = await this.invoiceRepo.create({
      bookingId: booking._id,
      userId: booking.customerId,
      vendorId: type === 'vendor' ? booking.vendorId : undefined,
      type,
      items,
      subtotal,
      totalTax: cgstTotal + sgstTotal,
      cgstTotal,
      sgstTotal,
      igstTotal: 0,
      totalAmount,
      currency: booking.currency as Currency,
      status: 'issued',
      issuedAt: new Date(),
      gstin: type === 'vendor' ? undefined : undefined, // Would come from user profile
      billingAddress: {
        name: 'Customer', // Would come from user profile
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      }
    } as any);

    // Link invoice to payment
    await this.paymentRepo.update(payment._id, { invoiceId: invoice._id });

    return invoice;
  }

  async generateRefundInvoice(booking: IBooking, payment: IPayment, refundAmount: number): Promise<IInvoice> {
    const items: IInvoiceItem[] = [{
      description: `Refund - ${booking.metadata.listingTitle}`,
      quantity: 1,
      unitPrice: -refundAmount,
      total: -refundAmount,
      taxRate: 0,
      cgst: 0,
      sgst: 0,
      igst: 0
    }];

    return this.invoiceRepo.create({
      bookingId: booking._id,
      userId: booking.customerId,
      type: 'customer',
      items,
      subtotal: -refundAmount,
      totalTax: 0,
      cgstTotal: 0,
      sgstTotal: 0,
      igstTotal: 0,
      totalAmount: -refundAmount,
      currency: booking.currency as Currency,
      status: 'issued',
      issuedAt: new Date()
    } as any);
  }

  async getMyInvoices(userId: string, page: number = 1, limit: number = 20): Promise<{ invoices: IInvoice[]; total: number }> {
    return this.invoiceRepo.findByUserId(userId, page, limit);
  }

  // ─── WALLET QUERIES ───

  async getWallet(userId: string): Promise<any> {
    const wallet = await this.walletRepo.getOrCreate(userId);
    const { transactions, total } = await this.walletRepo.getTransactions(userId, 1, 10);
    return { wallet, recentTransactions: transactions, totalTransactions: total };
  }

  async getWalletTransactions(userId: string, page: number, limit: number): Promise<{ transactions: any[]; total: number }> {
    return this.walletRepo.getTransactions(userId, page, limit);
  }

  // ─── ADMIN ───

  async getAllPayments(filters: any): Promise<{ payments: IPayment[]; total: number }> {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.gateway) query.gateway = filters.gateway;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const [payments, total] = await Promise.all([
      this.paymentRepo.model.find(query).sort({ createdAt: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(),
      this.paymentRepo.model.countDocuments(query)
    ]);
    return { payments, total };
  }

  async getPaymentStats(startDate?: Date, endDate?: Date): Promise<any> {
    return this.paymentRepo.getPaymentStats(startDate, endDate);
  }

  async getPendingRefunds(): Promise<IPayment[]> {
    return this.paymentRepo.getPendingRefunds();
  }

  // ─── HELPERS ───

  private buildUpiUrl(vpa: string, amount: number, txnId: string, note: string): string {
    const merchantUpi = process.env.UPI_MERCHANT_VPA || 'merchant@upi';
    const params = new URLSearchParams({
      pa: merchantUpi,
      pn: 'IndiaTravel Marketplace',
      mc: '5411',
      tid: txnId,
      tr: txnId,
      tn: note,
      am: amount.toFixed(2),
      cu: 'INR',
      url: 'https://indiatravel.market/payment/callback'
    });
    return `upi://pay?${params.toString()}`;
  }
}
