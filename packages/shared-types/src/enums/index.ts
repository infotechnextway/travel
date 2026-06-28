export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  GUIDE = 'guide',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export enum ListingType {
  TOUR = 'tour',
  HOTEL = 'hotel',
  ACTIVITY = 'activity',
  TRANSPORT = 'transport'
}
