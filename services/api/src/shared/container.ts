import { UserRepository } from '@modules/users/user.repository';
import { UserService } from '@modules/users/user.service';
import { UserController } from '@modules/users/user.controller';
import { AuthService } from '@modules/auth/auth.service';
import { AuthController } from '@modules/auth/auth.controller';
import { SocialAuthService } from '@modules/auth/social-auth.service';
import { VendorRepository } from '@modules/vendors/vendor.repository';
import { VendorService } from '@modules/vendors/vendor.service';
import { VendorController } from '@modules/vendors/vendor.controller';
import { GuideRepository } from '@modules/guides/guide.repository';
import { GuideService } from '@modules/guides/guide.service';
import { GuideController } from '@modules/guides/guide.controller';
import { DestinationRepository } from '@modules/destinations/destination.repository';
import { DestinationService } from '@modules/destinations/destination.service';
import { DestinationController } from '@modules/destinations/destination.controller';
import { ListingRepository } from '@modules/listings/listing.repository';
import { ListingService } from '@modules/listings/listing.service';
import { ListingController } from '@modules/listings/listing.controller';
import { JwtService } from '@shared/utils/jwt';
import { OtpService } from '@shared/utils/otp';
import { PasswordService } from '@shared/utils/password';
import { EncryptionService } from '@shared/utils/encryption';
import { RefreshToken } from '@modules/auth/refresh-token.model';
import { User } from '@modules/users/user.model';
import {
  BookingRepository, BookingService, BookingController, createBookingRoutes,
} from '@modules/bookings';
import {
  PaymentRepository, WalletRepository, InvoiceRepository,
  PaymentService, PaymentController, createPaymentRoutes,
} from '@modules/payments';
import {
  CouponRepository, RewardRepository, ReferralRepository,
  CouponService, RewardService, ReferralService,
  CouponController, RewardController, ReferralController,
  createCouponRoutes, createRewardRoutes, createReferralRoutes,
} from '@modules/coupons-rewards';
import {
  ReviewRepository, ReviewService, ReviewController, createReviewRoutes,
} from '@modules/reviews';
import {
  NotificationRepository, NotificationPreferenceRepository, NotificationTemplateRepository,
  NotificationService, NotificationController, createNotificationRoutes,
} from '@modules/notifications';
import {
  TicketRepository, FaqRepository, DisputeRepository,
  SupportService, SupportController, createSupportRoutes,
} from '@modules/support';

// Utils
export const jwtService = new JwtService();
export const otpService = new OtpService();
export const passwordService = new PasswordService();
export const encryptionService = new EncryptionService();

// Users
export const userRepository = new UserRepository();
export const userService = new UserService(userRepository, encryptionService);
export const userController = new UserController(userService);

// Auth
export const authService = new AuthService(
  userRepository,
  RefreshToken,
  otpService,
  jwtService,
  passwordService
);
export const socialAuthService = new SocialAuthService(
  userRepository,
  jwtService,
  passwordService
);
export const authController = new AuthController(authService, socialAuthService);

// Vendors
export const vendorRepository = new VendorRepository();
export const vendorService = new VendorService(vendorRepository);
export const vendorController = new VendorController(vendorService);

// Guides
export const guideRepository = new GuideRepository();
export const guideService = new GuideService(guideRepository);
export const guideController = new GuideController(guideService);

// Destinations
export const destinationRepository = new DestinationRepository();
export const destinationService = new DestinationService(destinationRepository);
export const destinationController = new DestinationController(destinationService);

// Listings
export const listingRepository = new ListingRepository();
export const listingService = new ListingService(listingRepository);
export const listingController = new ListingController(listingService);


// ─────────────────────────────────────────────────────────────
// Transactional modules (phases 10-15)
// ─────────────────────────────────────────────────────────────

// Repositories
export const bookingRepository = new BookingRepository();
export const paymentRepository = new PaymentRepository();
export const walletRepository = new WalletRepository();
export const invoiceRepository = new InvoiceRepository();
export const couponRepository = new CouponRepository();
export const rewardRepository = new RewardRepository();
export const referralRepository = new ReferralRepository();
export const reviewRepository = new ReviewRepository();
export const notificationRepo = new NotificationRepository();
export const notificationPrefRepo = new NotificationPreferenceRepository();
export const notificationTemplateRepo = new NotificationTemplateRepository();
export const ticketRepository = new TicketRepository();
export const faqRepository = new FaqRepository();
export const disputeRepository = new DisputeRepository();

// Services (instantiation order respects dependencies)
export const bookingService = new BookingService(
  bookingRepository, listingRepository, userRepository, vendorRepository,
);
export const paymentService = new PaymentService(
  paymentRepository, walletRepository, invoiceRepository, bookingRepository,
);
export const rewardService = new RewardService(rewardRepository, walletRepository);
export const couponService = new CouponService(couponRepository, bookingRepository, userRepository);
export const referralService = new ReferralService(referralRepository, rewardService, walletRepository);
export const reviewService = new ReviewService(reviewRepository, bookingRepository, rewardService);
export const notificationService = new NotificationService(
  notificationRepo, notificationPrefRepo, notificationTemplateRepo, userRepository,
);
export const supportService = new SupportService(
  ticketRepository, faqRepository, disputeRepository, bookingRepository,
);

// Controllers
export const bookingController = new BookingController(bookingService);
export const paymentController = new PaymentController(paymentService);
export const couponController = new CouponController(couponService);
export const rewardController = new RewardController(rewardService);
export const referralController = new ReferralController(referralService);
export const reviewController = new ReviewController(reviewService);
export const notificationController = new NotificationController(notificationService);
export const supportController = new SupportController(supportService);

// Route factories re-exported for app.ts
export {
  createBookingRoutes, createPaymentRoutes,
  createCouponRoutes, createRewardRoutes, createReferralRoutes,
  createReviewRoutes, createNotificationRoutes, createSupportRoutes,
};
