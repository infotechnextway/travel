class User {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String? avatar;
  final String role;
  final bool isVerified;
  final String tier;
  final int points;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    this.avatar,
    required this.role,
    required this.isVerified,
    this.tier = 'bronze',
    this.points = 0,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['_id'] ?? '',
    name: json['profile']?['name'] ?? '',
    email: json['email'] ?? '',
    phone: json['phone'] ?? '',
    avatar: json['profile']?['avatar'],
    role: json['role'] ?? 'customer',
    isVerified: json['isVerified'] ?? false,
    tier: json['tier'] ?? 'bronze',
    points: json['points'] ?? 0,
  );
}
