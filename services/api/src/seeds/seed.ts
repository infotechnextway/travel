import mongoose from 'mongoose';
import { config } from '../config';
import {
  User, Vendor, Guide, Destination, Listing,
  Booking, Payment, Wallet, WalletTransaction,
  Coupon, Review, Notification, SupportTicket,
  CmsPage, AnalyticsEvent
} from '../modules';
import { UserRole, KycStatus, VerificationStatus, ListingType, ListingStatus, BookingStatus, PaymentStatus, PaymentGateway, CouponType, DiscountType, CancellationPolicy, TicketStatus, TicketPriority, CmsType, WalletTransactionType, WalletTransactionSource, DifficultyLevel } from '../shared/enums';

const connectDatabase = async () => {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB for seeding');
};

const clearCollections = async () => {
  const models = [User, Vendor, Guide, Destination, Listing, Booking, Payment, Wallet, WalletTransaction, Coupon, Review, Notification, SupportTicket, CmsPage, AnalyticsEvent];
  for (const model of models) {
    await model.deleteMany({});
  }
  console.log('Cleared all collections');
};

const seedUsers = async () => {
  const users = await User.insertMany([
    {
      _id: 'user_001',
      email: 'arjun.sharma@example.com',
      phone: '+919876543210',
      passwordHash: 'password123',
      role: UserRole.CUSTOMER,
      isVerified: true,
      isActive: true,
      profile: { firstName: 'Arjun', lastName: 'Sharma', avatar: 'https://i.pravatar.cc/150?u=1', languagePreferences: ['en', 'hi'] },
      kycStatus: KycStatus.VERIFIED,
      addresses: [{ label: 'Home', line1: '42, Park Street', city: 'Kolkata', state: 'West Bengal', postalCode: '700016', country: 'India', isDefault: true }],
    },
    {
      _id: 'user_002',
      email: 'priya.patel@example.com',
      phone: '+919876543211',
      passwordHash: 'password123',
      role: UserRole.CUSTOMER,
      isVerified: true,
      isActive: true,
      profile: { firstName: 'Priya', lastName: 'Patel', avatar: 'https://i.pravatar.cc/150?u=2', languagePreferences: ['en', 'gu'] },
      kycStatus: KycStatus.VERIFIED,
    },
    {
      _id: 'user_003',
      email: 'rajesh.kumar@example.com',
      phone: '+919876543212',
      passwordHash: 'password123',
      role: UserRole.VENDOR,
      isVerified: true,
      isActive: true,
      profile: { firstName: 'Rajesh', lastName: 'Kumar', avatar: 'https://i.pravatar.cc/150?u=3', languagePreferences: ['en', 'hi'] },
      kycStatus: KycStatus.VERIFIED,
    },
    {
      _id: 'user_004',
      email: 'anita.guide@example.com',
      phone: '+919876543213',
      passwordHash: 'password123',
      role: UserRole.GUIDE,
      isVerified: true,
      isActive: true,
      profile: { firstName: 'Anita', lastName: 'Desai', avatar: 'https://i.pravatar.cc/150?u=4', languagePreferences: ['en', 'hi', 'de'] },
      kycStatus: KycStatus.VERIFIED,
    },
    {
      _id: 'user_005',
      email: 'admin@indiatravel.market',
      phone: '+919876543214',
      passwordHash: 'password123',
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
      isActive: true,
      profile: { firstName: 'Super', lastName: 'Admin', languagePreferences: ['en'] },
      kycStatus: KycStatus.VERIFIED,
      twoFactorEnabled: true,
    },
  ]);
  console.log(`Seeded ${users.length} users`);
  return users;
};

const seedVendors = async () => {
  const vendors = await Vendor.insertMany([
    {
      _id: 'vendor_001',
      userId: 'user_003',
      businessName: 'Himalayan Expeditions Pvt Ltd',
      businessType: 'Tour Operator',
      gstin: '07AABCU9603R1ZX',
      pan: 'AABCU9603R',
      description: 'Premium adventure tours across the Indian Himalayas since 2005.',
      verificationStatus: VerificationStatus.VERIFIED,
      commissionRate: 0.15,
      bankDetails: { accountHolderName: 'Rajesh Kumar', accountNumber: '123456789012', ifscCode: 'HDFC0001234', bankName: 'HDFC Bank', accountType: 'current' },
      payoutSchedule: 'monthly',
      rating: 4.8,
      totalBookings: 1250,
      totalRevenue: 25000000,
      responseTimeMinutes: 45,
      responseRate: 0.98,
      isActive: true,
      address: { line1: '15, Mall Road', city: 'Manali', state: 'Himachal Pradesh', postalCode: '175131' },
      contactEmail: 'contact@himalayanexpeditions.com',
      contactPhone: '+919876543212',
    },
  ]);
  console.log(`Seeded ${vendors.length} vendors`);
  return vendors;
};

const seedGuides = async () => {
  const guides = await Guide.insertMany([
    {
      _id: 'guide_001',
      userId: 'user_004',
      vendorId: 'vendor_001',
      bio: 'Certified mountaineer with 10 years of experience leading treks in Ladakh, Himachal, and Uttarakhand. Fluent in Hindi, English, and German.',
      languages: ['English', 'Hindi', 'German'],
      skills: ['Trekking', 'Mountaineering', 'Rock Climbing', 'First Aid', 'Photography'],
      certifications: [
        { name: 'Advanced Mountaineering Course', issuedBy: 'NIM Uttarkashi', issuedAt: new Date('2018-06-15'), documentUrl: 'https://cdn.example.com/cert1.pdf', isVerified: true },
      ],
      experienceYears: 10,
      rating: 4.9,
      tripCount: 340,
      totalEarnings: 850000,
      isActive: true,
      verificationStatus: VerificationStatus.VERIFIED,
      preferredDestinations: ['Ladakh', 'Manali', 'Spiti', 'Uttarkashi'],
      maxGroupSize: 12,
      emergencyContact: { name: 'Ravi Desai', phone: '+919876543215' },
    },
  ]);
  console.log(`Seeded ${guides.length} guides`);
  return guides;
};

const seedDestinations = async () => {
  const destinations = await Destination.insertMany([
    {
      _id: 'dest_001',
      name: 'Goa',
      slug: 'goa',
      type: 'state',
      description: 'India\'s beach paradise known for its golden sands, vibrant nightlife, Portuguese heritage, and seafood cuisine.',
      shortDescription: 'Sun, sand, and serenity on the Konkan coast.',
      images: ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2'],
      coverImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2',
      tags: ['beach', 'nightlife', 'heritage', 'seafood', 'water-sports'],
      coordinates: { type: 'Point', coordinates: [73.8567, 15.2993] },
      bestTimeToVisit: { months: ['November', 'December', 'January', 'February', 'March'], notes: 'Avoid monsoon (June-September) for beach activities.' },
      weather: {
        summer: { temp: '30-35°C', notes: 'Hot and humid. Beach mornings are pleasant.' },
        monsoon: { temp: '25-30°C', notes: 'Heavy rainfall. Lush greenery but limited water sports.' },
        winter: { temp: '20-30°C', notes: 'Perfect weather. Peak tourist season.' },
      },
      safetyIndex: 8,
      isFeatured: true,
      seo: { title: 'Goa Travel Guide - Best Beaches & Tours', description: 'Discover Goa with curated tours and experiences.', keywords: ['goa', 'beach', 'tour'] },
    },
    {
      _id: 'dest_002',
      name: 'Ladakh',
      slug: 'ladakh',
      type: 'state',
      description: 'The land of high passes, featuring stark mountain landscapes, ancient Buddhist monasteries, and thrilling adventure routes.',
      shortDescription: 'High-altitude desert wonderland in the Himalayas.',
      images: ['https://images.unsplash.com/photo-1548013146-72479768bada'],
      coverImage: 'https://images.unsplash.com/photo-1548013146-72479768bada',
      tags: ['mountain', 'adventure', 'buddhist', 'trekking', 'road-trip'],
      coordinates: { type: 'Point', coordinates: [77.5770, 34.1526] },
      bestTimeToVisit: { months: ['June', 'July', 'August', 'September'], notes: 'Roads are open. Winters are extremely harsh.' },
      weather: {
        summer: { temp: '15-25°C', notes: 'Pleasant days, cold nights. Ideal for trekking.' },
        monsoon: { temp: '10-20°C', notes: 'Minimal rainfall due to rain shadow effect.' },
        winter: { temp: '-20 to 5°C', notes: 'Chadar Trek season. Most roads closed.' },
      },
      safetyIndex: 7,
      isFeatured: true,
      seo: { title: 'Ladakh Tours - Leh, Pangong, Nubra Valley', description: 'Adventure tours in Ladakh.', keywords: ['ladakh', 'leh', 'pangong'] },
    },
    {
      _id: 'dest_003',
      name: 'Kerala',
      slug: 'kerala',
      type: 'state',
      description: 'God\'s Own Country — backwaters, tea plantations, wildlife sanctuaries, and Ayurvedic wellness.',
      shortDescription: 'Backwaters, beaches, and lush green hills.',
      images: ['https://images.unsplash.com/photo-1609766857041-40366a20d93e'],
      coverImage: 'https://images.unsplash.com/photo-1609766857041-40366a20d93e',
      tags: ['backwaters', 'ayurveda', 'wildlife', 'tea', 'houseboat'],
      coordinates: { type: 'Point', coordinates: [76.2711, 10.8505] },
      bestTimeToVisit: { months: ['October', 'November', 'December', 'January', 'February', 'March'], notes: 'Post-monsoon greenery is spectacular.' },
      safetyIndex: 9,
      isFeatured: true,
      seo: { title: 'Kerala Travel - Backwaters & Ayurveda', description: 'Experience Kerala.', keywords: ['kerala', 'backwaters', 'munnar'] },
    },
    {
      _id: 'dest_004',
      name: 'Rajasthan',
      slug: 'rajasthan',
      type: 'state',
      description: 'The land of kings — majestic forts, palaces, desert safaris, and vibrant folk culture.',
      shortDescription: 'Royal heritage and Thar desert adventures.',
      images: ['https://images.unsplash.com/photo-1477587458883-47145ed94245'],
      coverImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245',
      tags: ['heritage', 'desert', 'forts', 'palace', 'camel-safari', 'culture'],
      coordinates: { type: 'Point', coordinates: [74.2179, 27.0238] },
      bestTimeToVisit: { months: ['October', 'November', 'December', 'January', 'February', 'March'], notes: 'Winter is ideal. Summers are extremely hot.' },
      safetyIndex: 8,
      isFeatured: true,
      seo: { title: 'Rajasthan Tour Packages - Jaipur, Udaipur, Jaisalmer', description: 'Royal Rajasthan tours.', keywords: ['rajasthan', 'jaipur', 'udaipur'] },
    },
    {
      _id: 'dest_005',
      name: 'Himachal Pradesh',
      slug: 'himachal-pradesh',
      type: 'state',
      description: 'Dev Bhoomi — snow-capped peaks, pine forests, trekking trails, and colonial hill stations.',
      shortDescription: 'Mountain escapes and adventure sports.',
      images: ['https://images.unsplash.com/photo-1626010448982-4d629b0f29e9'],
      coverImage: 'https://images.unsplash.com/photo-1626010448982-4d629b0f29e9',
      tags: ['mountain', 'trekking', 'skiing', 'paragliding', 'hill-station'],
      coordinates: { type: 'Point', coordinates: [77.1734, 31.1048] },
      bestTimeToVisit: { months: ['March', 'April', 'May', 'June', 'September', 'October', 'November'], notes: 'March-June for trekking. December-February for snow.' },
      safetyIndex: 8,
      isFeatured: true,
      seo: { title: 'Himachal Pradesh Tours - Manali, Shimla, Spiti', description: 'Himachal tours.', keywords: ['himachal', 'manali', 'shimla'] },
    },
  ]);
  console.log(`Seeded ${destinations.length} destinations`);
  return destinations;
};

const seedListings = async () => {
  const listings = await Listing.insertMany([
    {
      _id: 'listing_001',
      vendorId: 'vendor_001',
      guideIds: ['guide_001'],
      destinationId: 'dest_002',
      listingType: ListingType.TOUR,
      title: 'Leh Ladakh Bike Expedition - 7 Days',
      slug: 'leh-ladakh-bike-expedition-7-days',
      description: 'An epic 7-day motorcycle journey through the world\'s highest motorable passes. Ride through Khardung La, Nubra Valley, and the mesmerizing Pangong Lake. Includes accommodation, meals, backup vehicle, and experienced guide.',
      shortDescription: '7-day bike expedition through Khardung La, Nubra, and Pangong.',
      images: ['https://images.unsplash.com/photo-1548013146-72479768bada', 'https://images.unsplash.com/photo-1564507592333-c60657eea523'],
      coordinates: { type: 'Point', coordinates: [77.5770, 34.1526] },
      pricing: { basePrice: 35000, currency: 'INR', pricePerPerson: 35000, childPrice: 25000, taxRate: 0.05, serviceFee: 500, isNegotiable: false },
      inventory: { maxCapacity: 20, minGroupSize: 6, maxGroupSize: 20, availableDates: [], bookingCutoffHours: 72 },
      inclusions: ['Royal Enfield 350cc', 'Fuel', 'Accommodation (6 nights)', 'All meals', 'Backup vehicle', 'Mechanic support', 'Permits', 'Experienced guide', 'Medical kit', 'Oxygen cylinder'],
      exclusions: ['Flights to Leh', 'Personal expenses', 'Travel insurance', 'Tips'],
      amenities: ['Backup Vehicle', 'Mechanic', 'Oxygen', 'First Aid', 'Permits Included'],
      tags: ['bike', 'road-trip', 'adventure', 'high-altitude', 'group-tour', 'leh', 'ladakh'],
      languagesOffered: ['English', 'Hindi'],
      cancellationPolicy: CancellationPolicy.MODERATE,
      status: ListingStatus.PUBLISHED,
      rating: 4.8,
      reviewCount: 124,
      bookingCount: 450,
      viewCount: 8500,
      wishlistCount: 320,
      itinerary: [
        { day: 1, title: 'Arrival in Leh', description: 'Acclimatization day. Rest and explore Leh market. Evening briefing.', activities: ['Leh Palace', 'Shanti Stupa'], meals: { dinner: true } },
        { day: 2, title: 'Leh to Sham Valley', description: 'Warm-up ride through Magnetic Hill and confluence of Zanskar & Indus.', activities: ['Magnetic Hill', 'Gurudwara Pathar Sahib'], meals: { breakfast: true, lunch: true, dinner: true } },
        { day: 3, title: 'Leh to Nubra Valley via Khardung La', description: 'Cross Khardung La (18,380 ft). Descend to Hunder sand dunes.', activities: ['Khardung La', 'Hunder Sand Dunes', 'Bactrian Camel Ride'], meals: { breakfast: true, lunch: true, dinner: true } },
        { day: 4, title: 'Nubra to Pangong Lake', description: 'Ride through Shyok River route to the stunning Pangong Tso.', activities: ['Pangong Lake', '3 Idiots Point'], meals: { breakfast: true, lunch: true, dinner: true }, accommodation: 'Camps near Pangong' },
        { day: 5, title: 'Pangong to Leh', description: 'Return via Chang La pass. Evening celebration dinner.', activities: ['Chang La'], meals: { breakfast: true, lunch: true, dinner: true } },
        { day: 6, title: 'Leh Local Exploration', description: 'Visit monasteries and local markets. Free time for shopping.', activities: ['Thiksey Monastery', 'Hemis Monastery'], meals: { breakfast: true, dinner: true } },
        { day: 7, title: 'Departure', description: 'Airport drop. End of an unforgettable journey.', activities: [], meals: { breakfast: true } },
      ],
      durationDays: 7,
      durationHours: 168,
      difficulty: DifficultyLevel.MODERATE,
      minAge: 18,
      maxAge: 55,
      startTime: '09:00',
      meetingPoint: 'Leh Airport / Hotel in Leh',
      dropOffPoint: 'Leh Airport',
      isInstantBook: true,
      isVerified: true,
    },
    {
      _id: 'listing_002',
      vendorId: 'vendor_001',
      guideIds: ['guide_001'],
      destinationId: 'dest_003',
      listingType: ListingType.TOUR,
      title: 'Kerala Backwaters Houseboat Cruise - 3 Days',
      slug: 'kerala-backwaters-houseboat-cruise-3-days',
      description: 'Drift through the serene backwaters of Alleppey on a luxury houseboat. Experience village life, bird watching, and authentic Kerala cuisine prepared by onboard chefs.',
      shortDescription: 'Luxury houseboat cruise through Alleppey backwaters.',
      images: ['https://images.unsplash.com/photo-1609766857041-40366a20d93e'],
      coordinates: { type: 'Point', coordinates: [76.3388, 9.4981] },
      pricing: { basePrice: 18000, currency: 'INR', pricePerPerson: 18000, childPrice: 9000, taxRate: 0.05, serviceFee: 300, isNegotiable: true },
      inventory: { maxCapacity: 12, minGroupSize: 2, maxGroupSize: 12, availableDates: [], bookingCutoffHours: 48 },
      inclusions: ['Luxury houseboat', 'All meals', 'Airport transfer', 'Guided village walk', 'Fishing equipment', 'Sunset cruise'],
      exclusions: ['Alcoholic beverages', 'Personal expenses', 'Tips'],
      amenities: ['AC Rooms', 'Private Balcony', 'Onboard Chef', 'WiFi', 'Sun Deck'],
      tags: ['backwaters', 'houseboat', 'luxury', 'kerala', 'relaxation', 'romantic'],
      languagesOffered: ['English', 'Hindi', 'Malayalam'],
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      status: ListingStatus.PUBLISHED,
      rating: 4.9,
      reviewCount: 210,
      bookingCount: 680,
      viewCount: 12000,
      wishlistCount: 540,
      itinerary: [
        { day: 1, title: 'Arrival & Boarding', description: 'Pick up from Kochi airport. Transfer to Alleppey and board houseboat.', activities: ['Check-in', 'Lunch on board', 'Village walk'], meals: { lunch: true, dinner: true } },
        { day: 2, title: 'Backwaters Exploration', description: 'Cruise through narrow canals, paddy fields, and coconut groves. Visit local markets.', activities: ['Canal cruise', 'Bird watching', 'Cooking demo'], meals: { breakfast: true, lunch: true, dinner: true } },
        { day: 3, title: 'Departure', description: 'Morning cruise and breakfast. Disembark and transfer to airport.', activities: ['Sunrise cruise'], meals: { breakfast: true } },
      ],
      durationDays: 3,
      durationHours: 72,
      difficulty: DifficultyLevel.EASY,
      minAge: 0,
      maxAge: 80,
      isInstantBook: true,
      isVerified: true,
    },
    {
      _id: 'listing_003',
      vendorId: 'vendor_001',
      destinationId: 'dest_001',
      listingType: ListingType.ACTIVITY,
      title: 'Goa Scuba Diving at Grande Island',
      slug: 'goa-scuba-diving-grande-island',
      description: 'Explore the underwater world of Goa with PADI-certified instructors. Dive at Grande Island to see coral reefs, shipwrecks, and marine life.',
      shortDescription: 'PADI-certified scuba diving at Grande Island.',
      images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5'],
      coordinates: { type: 'Point', coordinates: [73.8567, 15.2993] },
      pricing: { basePrice: 4500, currency: 'INR', pricePerPerson: 4500, taxRate: 0.18, serviceFee: 200, isNegotiable: false },
      inventory: { maxCapacity: 30, minGroupSize: 1, maxGroupSize: 30, availableDates: [], bookingCutoffHours: 12 },
      inclusions: ['Boat transfer', 'Scuba gear', 'PADI instructor', 'Underwater photos', 'Video', 'Lunch', 'Soft drinks'],
      exclusions: ['Travel to jetty', 'Alcoholic beverages', 'Personal expenses'],
      amenities: ['PADI Certified', 'Underwater Camera', 'Safety Boat', 'Changing Rooms', 'Showers'],
      tags: ['scuba', 'diving', 'water-sports', 'goa', 'adventure', 'marine'],
      languagesOffered: ['English', 'Hindi'],
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      status: ListingStatus.PUBLISHED,
      rating: 4.7,
      reviewCount: 340,
      bookingCount: 1200,
      viewCount: 18000,
      wishlistCount: 210,
      activityCategory: 'Water Sports',
      safetyBriefing: 'Mandatory 30-minute safety briefing before dive. Medical questionnaire required.',
      equipmentProvided: ['Wetsuit', 'BCD', 'Regulator', 'Mask', 'Fins', 'Weights'],
      equipmentRequired: ['Swimwear', 'Towel', 'Sunscreen'],
      weatherDependency: true,
      durationHours: 6,
      minAge: 12,
      startTime: '08:00',
      meetingPoint: 'Sinquerim Jetty, North Goa',
      isInstantBook: true,
      isVerified: true,
    },
  ]);
  console.log(`Seeded ${listings.length} listings`);
  return listings;
};

const seedCoupons = async () => {
  const coupons = await Coupon.insertMany([
    {
      _id: 'coupon_001',
      code: 'WELCOME500',
      type: CouponType.GLOBAL,
      discountType: DiscountType.FLAT,
      discountValue: 500,
      minOrderValue: 2000,
      maxDiscount: 500,
      usageLimitTotal: 10000,
      usageLimitPerUser: 1,
      usedCount: 0,
      applicableListingTypes: Object.values(ListingType),
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      isFirstTimeOnly: true,
      createdBy: 'user_005',
    },
    {
      _id: 'coupon_002',
      code: 'ADVENTURE20',
      type: CouponType.GLOBAL,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minOrderValue: 5000,
      maxDiscount: 5000,
      usageLimitTotal: 5000,
      usageLimitPerUser: 3,
      usedCount: 0,
      applicableListingTypes: [ListingType.TOUR, ListingType.ACTIVITY],
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      isFirstTimeOnly: false,
      createdBy: 'user_005',
    },
  ]);
  console.log(`Seeded ${coupons.length} coupons`);
  return coupons;
};

const seedWallets = async () => {
  const wallets = await Wallet.insertMany([
    { _id: 'wallet_001', userId: 'user_001', balance: 2500, totalCredited: 5000, totalDebited: 2500 },
    { _id: 'wallet_002', userId: 'user_002', balance: 0, totalCredited: 0, totalDebited: 0 },
  ]);
  console.log(`Seeded ${wallets.length} wallets`);
  return wallets;
};

const seedCmsPages = async () => {
  const pages = await CmsPage.insertMany([
    {
      _id: 'cms_001',
      slug: 'about-us',
      title: 'About India Travel Marketplace',
      content: [{ type: 'paragraph', data: { text: 'India Travel Marketplace is the premier platform for discovering and booking extraordinary travel experiences across the Indian subcontinent.' } }],
      type: CmsType.PAGE,
      language: 'en',
      isPublished: true,
      publishedAt: new Date(),
      authorId: 'user_005',
      tags: ['about', 'company'],
    },
    {
      _id: 'cms_002',
      slug: 'top-10-destinations-2024',
      title: 'Top 10 Destinations to Visit in India in 2024',
      content: [{ type: 'heading', data: { level: 2, text: '1. Ladakh' } }, { type: 'paragraph', data: { text: 'The high-altitude desert offers unmatched landscapes.' } }],
      type: CmsType.BLOG,
      language: 'en',
      isPublished: true,
      publishedAt: new Date(),
      authorId: 'user_005',
      tags: ['blog', 'destinations', '2024'],
    },
  ]);
  console.log(`Seeded ${pages.length} CMS pages`);
  return pages;
};

const seedAll = async () => {
  try {
    await connectDatabase();
    await clearCollections();
    await seedUsers();
    await seedVendors();
    await seedGuides();
    await seedDestinations();
    await seedListings();
    await seedCoupons();
    await seedWallets();
    await seedCmsPages();
    console.log('\nSeed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seedAll();
