export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  GUIDE = 'guide',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum VerificationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum ListingType {
  TOUR = 'tour',
  HOTEL = 'hotel',
  ACTIVITY = 'activity',
  TRANSPORT = 'transport',
}

export enum ListingStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  INITIATED = 'initiated',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentGateway {
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  WALLET = 'wallet',
  UPI = 'upi',
}

export enum PaymentMethod {
  CARD = 'card',
  UPI = 'upi',
  NETBANKING = 'netbanking',
  WALLET = 'wallet',
  EMI = 'emi',
  PAY_LATER = 'paylater',
}

export enum CouponType {
  GLOBAL = 'global',
  VENDOR = 'vendor',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
  CASHBACK = 'cashback',
}

export enum NotificationType {
  PUSH = 'push',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in_app',
}

export enum NotificationTopic {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  SUPPORT = 'support',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum CmsType {
  PAGE = 'page',
  BLOG = 'blog',
  BANNER = 'banner',
  FAQ = 'faq',
}

export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum WalletTransactionSource {
  BOOKING = 'booking',
  REFUND = 'refund',
  REWARD = 'reward',
  REFERRAL = 'referral',
  PAYOUT = 'payout',
  TOPUP = 'topup',
  WITHDRAWAL = 'withdrawal',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MODERATE = 'moderate',
  HARD = 'hard',
  EXTREME = 'extreme',
}

export enum CancellationPolicy {
  FLEXIBLE = 'flexible',
  MODERATE = 'moderate',
  STRICT = 'strict',
  NON_REFUNDABLE = 'non_refundable',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum Permission {
  VIEW_DASHBOARD = 'view_dashboard',
  MANAGE_USERS = 'manage_users',
  MANAGE_VENDORS = 'manage_vendors',
  MANAGE_GUIDES = 'manage_guides',
  MANAGE_LISTINGS = 'manage_listings',
  MANAGE_BOOKINGS = 'manage_bookings',
  MANAGE_PAYMENTS = 'manage_payments',
  MANAGE_COUPONS = 'manage_coupons',
  MANAGE_REVIEWS = 'manage_reviews',
  MANAGE_REWARDS = 'manage_rewards',
  MANAGE_NOTIFICATIONS = 'manage_notifications',
  MANAGE_ANALYTICS = 'manage_analytics',
  MANAGE_SUPPORT = 'manage_support',
  MANAGE_CMS = 'manage_cms',
  VENDOR_CREATE_LISTING = 'vendor_create_listing',
  VENDOR_MANAGE_BOOKINGS = 'vendor_manage_bookings',
  VENDOR_VIEW_ANALYTICS = 'vendor_view_analytics',
  GUIDE_VIEW_ASSIGNMENTS = 'guide_view_assignments',
  GUIDE_UPDATE_AVAILABILITY = 'guide_update_availability',
}
