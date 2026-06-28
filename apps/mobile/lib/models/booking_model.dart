class Booking {
  final String id;
  final String bookingCode;
  final String listingTitle;
  final String listingType;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final double finalAmount;
  final String currency;
  final int travelers;
  final String? qrCode;

  Booking({
    required this.id,
    required this.bookingCode,
    required this.listingTitle,
    required this.listingType,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.finalAmount,
    required this.currency,
    required this.travelers,
    this.qrCode,
  });

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
    id: json['_id'] ?? '',
    bookingCode: json['bookingCode'] ?? '',
    listingTitle: json['metadata']?['listingTitle'] ?? '',
    listingType: json['metadata']?['listingType'] ?? 'tour',
    status: json['status'] ?? 'PENDING',
    startDate: DateTime.parse(json['travelDates']?['startDate'] ?? DateTime.now().toIso8601String()),
    endDate: DateTime.parse(json['travelDates']?['endDate'] ?? DateTime.now().toIso8601String()),
    finalAmount: (json['finalAmount'] ?? 0).toDouble(),
    currency: json['currency'] ?? 'INR',
    travelers: (json['travelers'] as List?)?.length ?? 1,
    qrCode: json['qrCode'],
  );

  bool get isUpcoming => ['PENDING', 'CONFIRMED'].contains(status);
  bool get isPast => ['COMPLETED', 'REVIEWED'].contains(status);
  bool get isCancelled => status == 'CANCELLED';
}
