import { Router } from 'express';
import { listingController } from '@shared/container';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import {
  CreateTourDto,
  CreateActivityDto,
  CreateHotelDto,
  CreateTransportDto,
  UpdateListingDto,
  ListingSearchDto,
  AvailabilityCheckDto,
  ReviewListingDto,
  BulkListingActionDto,
  UpdateItineraryDto,
  UpdateCalendarDto,
  UpdatePricingDto,
} from './listing.dto';
import { Permission } from '@shared/enums';

const router = Router();

// Public routes
router.get('/', validateQuery(ListingSearchDto), listingController.searchListings);
router.get('/featured', listingController.getFeaturedListings);
router.get('/slug/:slug', listingController.getListingBySlug);
router.get('/:id', listingController.getListingById);
router.get('/:id/related', listingController.getRelatedListings);
router.post('/:id/availability', validate(AvailabilityCheckDto), listingController.checkAvailability);

// Vendor routes (require authentication)
router.use(authenticate);

router.post(
  '/vendor/tours',
  authorize(Permission.VENDOR_CREATE_LISTING),
  validate(CreateTourDto),
  listingController.createListing
);

router.post(
  '/vendor/activities',
  authorize(Permission.VENDOR_CREATE_LISTING),
  validate(CreateActivityDto),
  listingController.createListing
);

router.post(
  '/vendor/hotels',
  authorize(Permission.VENDOR_CREATE_LISTING),
  validate(CreateHotelDto),
  listingController.createListing
);

router.post(
  '/vendor/transport',
  authorize(Permission.VENDOR_CREATE_LISTING),
  validate(CreateTransportDto),
  listingController.createListing
);

router.patch(
  '/vendor/:id',
  authorize(Permission.VENDOR_CREATE_LISTING),
  validate(UpdateListingDto),
  listingController.updateListing
);

router.delete(
  '/vendor/:id',
  authorize(Permission.VENDOR_CREATE_LISTING),
  listingController.deleteListing
);

router.get(
  '/vendor/me',
  authorize(Permission.VENDOR_CREATE_LISTING),
  listingController.getVendorListings
);

router.patch(
  '/vendor/:id/itinerary',
  authorize(Permission.VENDOR_CREATE_LISTING),
  validate(UpdateItineraryDto),
  listingController.updateItinerary
);

router.patch(
  '/vendor/:id/calendar',
  authorize(Permission.VENDOR_CREATE_LISTING),
  validate(UpdateCalendarDto),
  listingController.updateCalendar
);

router.patch(
  '/vendor/:id/pricing',
  authorize(Permission.VENDOR_CREATE_LISTING),
  validate(UpdatePricingDto),
  listingController.updatePricing
);

// Admin routes
router.get(
  '/admin',
  authorize(Permission.MANAGE_LISTINGS),
  validateQuery(ListingSearchDto),
  listingController.listListings
);

router.get(
  '/admin/stats',
  authorize(Permission.MANAGE_LISTINGS),
  listingController.getListingStats
);

router.get(
  '/admin/review-queue',
  authorize(Permission.MANAGE_LISTINGS),
  listingController.getPendingReviewQueue
);

router.get(
  '/admin/:id',
  authorize(Permission.MANAGE_LISTINGS),
  listingController.getListingByIdAdmin
);

router.patch(
  '/admin/:id/review',
  authorize(Permission.MANAGE_LISTINGS),
  validate(ReviewListingDto),
  listingController.reviewListing
);

router.post(
  '/admin/bulk-action',
  authorize(Permission.MANAGE_LISTINGS),
  validate(BulkListingActionDto),
  listingController.bulkAction
);

export default router;
