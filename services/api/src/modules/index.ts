// Barrel exports for all API modules.
// Core domain models (phases 2-9)
export { User, IUserDocument, IAddress, ISocialAccount } from './users/user.model';
export { Vendor, IVendorDocument } from './vendors/vendor.model';
export { Guide, IGuideDocument } from './guides/guide.model';
export { Destination, IDestinationDocument } from './destinations/destination.model';
export { Listing, IListingDocument } from './listings/listing.model';
export { CmsPage, ICmsPageDocument } from './cms/cms-page.model';
export { AnalyticsEvent, IAnalyticsEventDocument } from './analytics/analytics-event.model';
export { RefreshToken, IRefreshTokenDocument } from './auth/refresh-token.model';
export { OTP, IOtpDocument } from './auth/otp.model';

// Transactional modules (phases 10-15)
export * from './bookings';
export * from './payments';
export * from './coupons-rewards';
export * from './reviews';
export * from './notifications';
export * from './support';
