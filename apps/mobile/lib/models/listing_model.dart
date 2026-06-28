class Listing {
  final String id;
  final String title;
  final String slug;
  final String description;
  final String listingType;
  final List<String> images;
  final double rating;
  final int reviewCount;
  final double price;
  final String currency;
  final String duration;
  final String destinationName;
  final List<String> amenities;
  final Map<String, dynamic>? itinerary;

  Listing({
    required this.id,
    required this.title,
    required this.slug,
    required this.description,
    required this.listingType,
    required this.images,
    required this.rating,
    required this.reviewCount,
    required this.price,
    required this.currency,
    required this.duration,
    required this.destinationName,
    required this.amenities,
    this.itinerary,
  });

  factory Listing.fromJson(Map<String, dynamic> json) => Listing(
    id: json['_id'] ?? '',
    title: json['title'] ?? '',
    slug: json['slug'] ?? '',
    description: json['description'] ?? '',
    listingType: json['listingType'] ?? 'tour',
    images: List<String>.from(json['images'] ?? []),
    rating: (json['rating'] ?? 0).toDouble(),
    reviewCount: json['reviewCount'] ?? 0,
    price: (json['pricing']?['basePrice'] ?? 0).toDouble(),
    currency: json['pricing']?['currency'] ?? 'INR',
    duration: json['duration'] ?? '',
    destinationName: json['destinationName'] ?? '',
    amenities: List<String>.from(json['amenities'] ?? []),
    itinerary: json['itinerary'],
  );
}
