import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/price_tag.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final upcoming = [
    {
      'code': 'ITM-240615-A3X9K',
      'title': 'Leh Ladakh Bike Expedition',
      'date': '15 Jun 2024',
      'status': 'CONFIRMED',
      'price': 45000.0,
      'travelers': 2,
    },
    {
      'code': 'ITM-240720-B7M2P',
      'title': 'Kerala Backwaters',
      'date': '20 Jul 2024',
      'status': 'PENDING',
      'price': 12500.0,
      'travelers': 4,
    },
  ];

  final past = [
    {
      'code': 'ITM-240310-X9K2L',
      'title': 'Goa Scuba Diving',
      'date': '10 Mar 2024',
      'status': 'COMPLETED',
      'price': 4500.0,
      'travelers': 2,
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.midnight,
      appBar: AppBar(
        title: const Text('My Bookings', style: TextStyle(fontFamily: 'PlayfairDisplay')),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.sand,
          labelColor: AppColors.sand,
          unselectedLabelColor: AppColors.cloudDim,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
            Tab(text: 'Cancelled'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildBookingList(upcoming),
          _buildBookingList(past),
          _buildEmptyState('No cancelled bookings', Icons.cancel_outlined),
        ],
      ),
    );
  }

  Widget _buildBookingList(List<Map<String, dynamic>> bookings) {
    if (bookings.isEmpty) return _buildEmptyState('No bookings yet', Icons.confirmation_number_outlined);
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: bookings.length,
      itemBuilder: (context, index) => _buildBookingCard(bookings[index]),
    );
  }

  Widget _buildBookingCard(Map<String, dynamic> booking) {
    final statusColor = {
      'CONFIRMED': AppColors.success,
      'PENDING': AppColors.saffron,
      'COMPLETED': AppColors.sand,
      'CANCELLED': AppColors.error,
    }[booking['status'] as String] ?? AppColors.cloudDim;

    return GlassCard(
      onTap: () {},
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  booking['status'] as String,
                  style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w700),
                ),
              ),
              const Spacer(),
              Text(
                booking['code'] as String,
                style: TextStyle(fontSize: 11, color: AppColors.cloud.withOpacity(0.4), fontFamily: 'monospace'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            booking['title'] as String,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.cloud),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.calendar_today, size: 14, color: AppColors.cloud.withOpacity(0.5)),
              const SizedBox(width: 6),
              Text(
                booking['date'] as String,
                style: TextStyle(fontSize: 13, color: AppColors.cloud.withOpacity(0.6)),
              ),
              const SizedBox(width: 16),
              Icon(Icons.people, size: 14, color: AppColors.cloud.withOpacity(0.5)),
              const SizedBox(width: 6),
              Text(
                '${booking['travelers']} travelers',
                style: TextStyle(fontSize: 13, color: AppColors.cloud.withOpacity(0.6)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: AppColors.glassBorder),
          const SizedBox(height: 8),
          Row(
            children: [
              PriceTag(amount: booking['price'] as double),
              const Spacer(),
              if (booking['status'] == 'CONFIRMED')
                OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    minimumSize: Size.zero,
                  ),
                  child: const Text('View QR', style: TextStyle(fontSize: 12)),
                ),
              if (booking['status'] == 'COMPLETED')
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    minimumSize: Size.zero,
                  ),
                  child: const Text('Review', style: TextStyle(fontSize: 12)),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: AppColors.cloud.withOpacity(0.2)),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(color: AppColors.cloud.withOpacity(0.4), fontSize: 16),
          ),
        ],
      ),
    );
  }
}
