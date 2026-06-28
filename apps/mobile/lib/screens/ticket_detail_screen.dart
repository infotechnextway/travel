import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../widgets/glass_card.dart';

class TicketDetailScreen extends StatelessWidget {
  final String ticketId;
  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.midnight,
      appBar: AppBar(
        title: const Text('Support Ticket', style: TextStyle(fontFamily: 'PlayfairDisplay')),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.saffron.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('OPEN', style: TextStyle(color: AppColors.saffron, fontSize: 11, fontWeight: FontWeight.w700)),
                          ),
                          const Spacer(),
                          Text('TKT-2024-06-A3X9K', style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.4), fontFamily: 'monospace')),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Booking modification request',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.cloud),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'I need to change my travel dates for the Leh Ladakh trip from June 15 to June 20.',
                        style: TextStyle(fontSize: 13, color: AppColors.cloud.withOpacity(0.7), height: 1.5),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                _MessageBubble(
                  isMe: true,
                  text: 'I need to change my travel dates for the Leh Ladakh trip from June 15 to June 20.',
                  time: '2 hours ago',
                ),
                const SizedBox(height: 12),
                _MessageBubble(
                  isMe: false,
                  text: 'Hi Arjun, we have received your request. We are checking availability for June 20. Will update you shortly.',
                  time: '1 hour ago',
                  senderName: 'Support Team',
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.midnightLight,
              border: const Border(top: BorderSide(color: AppColors.glassBorder)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      style: const TextStyle(color: AppColors.cloud),
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.send, color: AppColors.sand),
                          onPressed: () {},
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final bool isMe;
  final String text;
  final String time;
  final String? senderName;

  const _MessageBubble({required this.isMe, required this.text, required this.time, this.senderName});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isMe ? AppColors.sand.withOpacity(0.2) : AppColors.glassWhite,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
          border: Border.all(color: isMe ? AppColors.sand.withOpacity(0.3) : AppColors.glassBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (senderName != null)
              Text(
                senderName!,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.sand),
              ),
            if (senderName != null) const SizedBox(height: 4),
            Text(text, style: TextStyle(fontSize: 14, color: AppColors.cloud.withOpacity(0.9), height: 1.5)),
            const SizedBox(height: 6),
            Text(time, style: TextStyle(fontSize: 10, color: AppColors.cloud.withOpacity(0.4))),
          ],
        ),
      ),
    );
  }
}
