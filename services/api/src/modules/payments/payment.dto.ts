import Joi from 'joi';
import { PaymentStatus, Currency } from '@shared/enums';

export const CreateOrderDto = Joi.object({
  bookingId: Joi.string().uuid().required(),
  gateway: Joi.string().valid('razorpay', 'stripe', 'upi').required(),
  currency: Joi.string().valid(...Object.values(Currency)).default(Currency.INR),
  useWalletBalance: Joi.boolean().default(false),
  walletAmount: Joi.number().min(0).default(0)
});

export const VerifyPaymentDto = Joi.object({
  bookingId: Joi.string().uuid().required(),
  gateway: Joi.string().valid('razorpay', 'stripe').required(),
  gatewayOrderId: Joi.string().required(),
  gatewayPaymentId: Joi.string().required(),
  gatewaySignature: Joi.string().required(),
  method: Joi.string().optional()
});

export const WalletTopupDto = Joi.object({
  amount: Joi.number().min(10).max(100000).required(),
  gateway: Joi.string().valid('razorpay', 'stripe').required()
});

export const WalletWithdrawDto = Joi.object({
  amount: Joi.number().min(100).max(100000).required(),
  bankAccountId: Joi.string().uuid().required(),
  reason: Joi.string().trim().max(200).optional()
});

export const RefundRequestDto = Joi.object({
  bookingId: Joi.string().uuid().required(),
  amount: Joi.number().min(1).required(),
  reason: Joi.string().trim().min(10).max(500).required(),
  method: Joi.string().valid('original', 'wallet').required()
});

export const ProcessRefundDto = Joi.object({
  paymentId: Joi.string().uuid().required(),
  amount: Joi.number().min(1).required(),
  reason: Joi.string().trim().min(10).max(500).required()
});

export const PaymentSearchDto = Joi.object({
  status: Joi.string().valid(...Object.values(PaymentStatus)).optional(),
  gateway: Joi.string().valid('razorpay', 'stripe', 'wallet', 'upi', 'cash').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const GenerateInvoiceDto = Joi.object({
  bookingId: Joi.string().uuid().required(),
  type: Joi.string().valid('customer', 'vendor', 'commission').required(),
  gstin: Joi.string().trim().optional()
});

export const UpiIntentDto = Joi.object({
  bookingId: Joi.string().uuid().required(),
  amount: Joi.number().min(1).required(),
  upiId: Joi.string().trim().required(),
  provider: Joi.string().valid('google_pay', 'phonepe', 'paytm', 'bhim', 'other').required()
});

export const WebhookRazorpayDto = Joi.object({
  event: Joi.string().required(),
  payload: Joi.object().required()
}).unknown(true);

export const WebhookStripeDto = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().required(),
  data: Joi.object().required()
}).unknown(true);
