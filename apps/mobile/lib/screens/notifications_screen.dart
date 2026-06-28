import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../widgets/glass_card.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  final List<Map<String, dynamic>> notifications = const [
    {
      'title': 'Booking Confirmed',
      'body': 'Your Leh Ladakh expedition has been confirmed. Check your email for details.',
      'topic': 'booking',
      'time': '2 min ago',
      'isRead': false,
    },
    {
      'title': 'Payment Successful',
      'body': '₹45,000 has been charged to your card ending in 4242.',
      'topic': 'payment',
      'time': '1 hour ago',
      'isRead': false,
    },
    {
      'title': 'Weekend Special',
      'body': 'Get 20% off on all Goa packages this weekend. Use code GOA20.',
      'topic': 'promo',
      'time': '3 hours ago',
      'isRead': true,
    },
    {
      'title': 'Trip Reminder',
      'body': 'Your Kerala backwaters trip starts in 2 days. Don\'t forget to pack!',
      'topic': 'trip',
      'time': '1 day ago',
      'isRead': true,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.midnight,
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(fontFamily: 'PlayfairDisplay')),
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text('Mark All Read', style: TextStyle(color: AppColors.sand, fontSize: 13)),
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: notifications.length,
        itemBuilder: (context, index) {
          final n = notifications[index];
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            child: GlassCard(
              padding: const EdgeInsets.all(16),
              border: n['isRead'] as bool ? null : Border.all(color: AppColors.sand.withOpacity(0.3), width: 1.5),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: _getTopicColor(n['topic'] as String).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _getTopicIcon(n['topic'] as String),
                      color: _getTopicColor(n['topic'] as String),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                n['title'] as String,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: (n['isRead'] as bool) ? FontWeight.w400 : FontWeight.w700,
                                  color: AppColors.cloud,
                                ),
                              ),
                            ),
                            if (!(n['isRead'] as bool))
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.saffron,
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          n['body'] as String,
                          style: TextStyle(fontSize: 13, color: AppColors.cloud.withOpacity(0.6), height: 1.4),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          n['time'] as String,
                          style: TextStyle(fontSize: 11, color: AppColors.cloud.withOpacity(0.4)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Color _getTopicColor(String topic) {
    switch (topic) {
      case 'booking': return AppColors.success;
      case 'payment': return AppColors.sand;
      case 'promo': return AppColors.saffron;
      case 'trip': return const Color(0xFF4FC3F7);
      default: return AppColors.cloudDim;
    }
  }

  IconData _getTopicIcon(String topic) {
    switch (topic) {
      case 'booking': return Icons.confirmation_number;
      case 'payment': return Icons.payment;
      case 'promo': return Icons.local_offer;
      case 'trip': return Icons.flight_takeoff;
      default: return Icons.notifications;
    }
  }
}
