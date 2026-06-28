import { UserValidationSchema, VendorValidationSchema } from '../modules';

export const CollectionValidationRules = {
  users: UserValidationSchema,
  vendors: VendorValidationSchema,
  // Additional validation rules can be applied via db.createCollection() or collMod
  bookings: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['bookingCode', 'customerId', 'listingId', 'vendorId', 'status', 'travelDates', 'travelers', 'totalAmount', 'finalAmount', 'currency'],
      properties: {
        bookingCode: { bsonType: 'string' },
        customerId: { bsonType: 'string' },
        listingId: { bsonType: 'string' },
        vendorId: { bsonType: 'string' },
        status: { enum: ['pending', 'confirmed', 'completed', 'cancelled', 'refunded', 'no_show'] },
        totalAmount: { bsonType: 'double', minimum: 0 },
        finalAmount: { bsonType: 'double', minimum: 0 },
        currency: { bsonType: 'string' },
      },
    },
  },
  listings: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['vendorId', 'destinationId', 'listingType', 'title', 'slug', 'description', 'pricing', 'status'],
      properties: {
        vendorId: { bsonType: 'string' },
        destinationId: { bsonType: 'string' },
        listingType: { enum: ['tour', 'hotel', 'activity', 'transport'] },
        title: { bsonType: 'string', maxLength: 150 },
        slug: { bsonType: 'string' },
        status: { enum: ['draft', 'pending_review', 'published', 'archived', 'suspended'] },
        'pricing.basePrice': { bsonType: 'double', minimum: 0 },
        'pricing.pricePerPerson': { bsonType: 'double', minimum: 0 },
      },
    },
  },
  payments: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['bookingId', 'userId', 'gateway', 'gatewayOrderId', 'amount', 'currency', 'status'],
      properties: {
        bookingId: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        gateway: { enum: ['razorpay', 'stripe', 'wallet', 'upi'] },
        amount: { bsonType: 'double', minimum: 0 },
        currency: { bsonType: 'string' },
        status: { enum: ['pending', 'initiated', 'success', 'failed', 'refunded', 'partially_refunded'] },
      },
    },
  },
};
