import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  // ─── ORDER CREATION ───

  createRazorpayOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.paymentService.createRazorpayOrder(req.user.userId, req.body);
      successResponse(res, 200, result, 'Razorpay order created');
    } catch (err) { next(err); }
  };

  createStripeIntent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.paymentService.createStripeIntent(req.user.userId, req.body);
      successResponse(res, 200, result, 'Stripe payment intent created');
    } catch (err) { next(err); }
  };

  createUpiIntent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.paymentService.createUpiIntent(req.user.userId, req.body);
      successResponse(res, 200, result, 'UPI intent created');
    } catch (err) { next(err); }
  };

  // ─── VERIFICATION ───

  verifyRazorpay = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.paymentService.verifyRazorpayPayment(req.user.userId, req.body);
      successResponse(res, 200, result, 'Payment verified and booking confirmed');
    } catch (err) { next(err); }
  };

  verifyStripe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.paymentService.verifyStripePayment(req.user.userId, req.body);
      successResponse(res, 200, result, 'Payment verified and booking confirmed');
    } catch (err) { next(err); }
  };

  // ─── WALLET ───

  topUpWallet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.paymentService.topUpWallet(req.user.userId, req.body);
      successResponse(res, 200, result, 'Wallet top-up initiated');
    } catch (err) { next(err); }
  };

  verifyWalletTopup = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.paymentService.verifyWalletTopup(req.user.userId, req.body);
      successResponse(res, 200, result, 'Wallet topped up successfully');
    } catch (err) { next(err); }
  };

  requestWithdrawal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.paymentService.requestWithdrawal(req.user.userId, req.body);
      successResponse(res, 200, result, 'Withdrawal request submitted');
    } catch (err) { next(err); }
  };

  getWallet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.paymentService.getWallet(req.user.userId);
      successResponse(res, 200, result, 'Wallet retrieved');
    } catch (err) { next(err); }
  };

  getWalletTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.paymentService.getWalletTransactions(req.user.userId, page, limit);
      successResponse(res, 200, result.transactions, 'Wallet transactions retrieved', { page, limit, total: result.total });
    } catch (err) { next(err); }
  };

  // ─── REFUNDS ───

  requestRefund = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.paymentService.requestRefund(req.user.userId, req.body);
      successResponse(res, 200, result, 'Refund requested');
    } catch (err) { next(err); }
  };

  // ─── INVOICES ───

  getMyInvoices = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.paymentService.getMyInvoices(req.user.userId, page, limit);
      successResponse(res, 200, result.invoices, 'Invoices retrieved', { page, limit, total: result.total });
    } catch (err) { next(err); }
  };

  // ─── WEBHOOKS ───

  razorpayWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      await this.paymentService.handleRazorpayWebhook(req.body, signature);
      successResponse(res, 200, null, 'Webhook processed');
    } catch (err) { next(err); }
  };

  stripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      await this.paymentService.handleStripeWebhook(req.body, signature);
      successResponse(res, 200, null, 'Webhook processed');
    } catch (err) { next(err); }
  };

  // ─── ADMIN ───

  getAllPayments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status as any,
        gateway: req.query.gateway as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await this.paymentService.getAllPayments(filters);
      successResponse(res, 200, result.payments, 'Payments retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  processRefund = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.paymentService.processRefund(req.user.userId, req.body);
      successResponse(res, 200, result, 'Refund processed');
    } catch (err) { next(err); }
  };

  getPaymentStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await this.paymentService.getPaymentStats(startDate, endDate);
      successResponse(res, 200, stats, 'Payment statistics');
    } catch (err) { next(err); }
  };

  getPendingRefunds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const refunds = await this.paymentService.getPendingRefunds();
      successResponse(res, 200, refunds, 'Pending refunds');
    } catch (err) { next(err); }
  };
}
