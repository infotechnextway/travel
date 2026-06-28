import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import passport from 'passport';
import authRoutes from '@modules/auth/auth.routes';
import userRoutes from '@modules/users/user.routes';
import vendorRoutes from '@modules/vendors/vendor.routes';
import guideRoutes from '@modules/guides/guide.routes';
import destinationRoutes from '@modules/destinations/destination.routes';
import listingRoutes from '@modules/listings/listing.routes';
import {
  bookingController, paymentController,
  couponController, rewardController, referralController,
  reviewController, notificationController, supportController,
  createBookingRoutes, createPaymentRoutes,
  createCouponRoutes, createRewardRoutes, createReferralRoutes,
  createReviewRoutes, createNotificationRoutes, createSupportRoutes,
} from '@shared/container';
import { errorHandler } from '@shared/middleware/error.middleware';
import { NotFoundError } from '@shared/errors';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(compression());
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport initialization
app.use(passport.initialize());

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api',
      version: '1.0.0',
    },
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/guides', guideRoutes);
app.use('/api/v1/destinations', destinationRoutes);
app.use('/api/v1/listings', listingRoutes);

// Transactional modules (phases 10-15)
app.use('/api/v1/bookings', createBookingRoutes(bookingController));
app.use('/api/v1/payments', createPaymentRoutes(paymentController));
app.use('/api/v1/coupons', createCouponRoutes(couponController));
app.use('/api/v1/rewards', createRewardRoutes(rewardController));
app.use('/api/v1/referrals', createReferralRoutes(referralController));
app.use('/api/v1/reviews', createReviewRoutes(reviewController));
app.use('/api/v1/notifications', createNotificationRoutes(notificationController));
app.use('/api/v1/support', createSupportRoutes(supportController));

// 404 handler
app.use((_req, _res, next) => {
  next(new NotFoundError('Route not found'));
});

// Global error handler
app.use(errorHandler);

export default app;
