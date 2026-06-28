class AppNotification {
  final String id;
  final String title;
  final String body;
  final String topic;
  final bool isRead;
  final DateTime createdAt;
  final String? actionUrl;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.topic,
    required this.isRead,
    required this.createdAt,
    this.actionUrl,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
    id: json['_id'] ?? '',
    title: json['title'] ?? '',
    body: json['body'] ?? '',
    topic: json['topic'] ?? 'system',
    isRead: json['isRead'] ?? false,
    createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    actionUrl: json['actionUrl'],
  );
}
