import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import {
  CreateOrderDto, VerifyPaymentDto, WalletTopupDto, WalletWithdrawDto,
  RefundRequestDto, ProcessRefundDto, PaymentSearchDto, GenerateInvoiceDto,
  UpiIntentDto, WebhookRazorpayDto, WebhookStripeDto
} from './payment.dto';
import { Permission } from '@shared/enums';

export const createPaymentRoutes = (controller: PaymentController): Router => {
  const router = Router();

  // ─── CUSTOMER PAYMENT ───
  router.post('/orders/razorpay', authenticate, validate(CreateOrderDto), controller.createRazorpayOrder);
  router.post('/orders/stripe', authenticate, validate(CreateOrderDto), controller.createStripeIntent);
  router.post('/orders/upi', authenticate, validate(UpiIntentDto), controller.createUpiIntent);
  router.post('/verify/razorpay', authenticate, validate(VerifyPaymentDto), controller.verifyRazorpay);
  router.post('/verify/stripe', authenticate, validate(VerifyPaymentDto), controller.verifyStripe);

  // ─── WALLET ───
  router.get('/wallet', authenticate, controller.getWallet);
  router.get('/wallet/transactions', authenticate, controller.getWalletTransactions);
  router.post('/wallet/topup', authenticate, validate(WalletTopupDto), controller.topUpWallet);
  router.post('/wallet/topup/verify', authenticate, controller.verifyWalletTopup);
  router.post('/wallet/withdraw', authenticate, validate(WalletWithdrawDto), controller.requestWithdrawal);

  // ─── REFUNDS ───
  router.post('/refunds/request', authenticate, validate(RefundRequestDto), controller.requestRefund);

  // ─── INVOICES ───
  router.get('/invoices', authenticate, controller.getMyInvoices);

  // ─── WEBHOOKS (No auth - signature verified internally) ───
  router.post('/webhooks/razorpay', controller.razorpayWebhook);
  router.post('/webhooks/stripe', controller.stripeWebhook);

  // ─── ADMIN ───
  router.get('/admin/all', authenticate, authorize(Permission.MANAGE_BOOKINGS), validateQuery(PaymentSearchDto), controller.getAllPayments);
  router.post('/admin/refund', authenticate, authorize(Permission.MANAGE_BOOKINGS), validate(ProcessRefundDto), controller.processRefund);
  router.get('/admin/stats', authenticate, authorize(Permission.MANAGE_BOOKINGS), controller.getPaymentStats);
  router.get('/admin/pending-refunds', authenticate, authorize(Permission.MANAGE_BOOKINGS), controller.getPendingRefunds);

  return router;
};
