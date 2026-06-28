import 'package:flutter/material.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../config/theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/price_tag.dart';

class ListingDetailScreen extends StatefulWidget {
  final String id;
  const ListingDetailScreen({super.key, required this.id});

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  int _currentImage = 0;
  int _selectedTab = 0;

  final List<String> images = [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    'https://images.unsplash.com/photo-1506905926800-3e3c1c6c2e0e?w=800',
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800',
  ];

  final List<Map<String, dynamic>> itinerary = [
    {'day': 1, 'title': 'Arrival in Leh', 'desc': 'Acclimatization day. Visit Leh Palace and Shanti Stupa.'},
    {'day': 2, 'title': 'Leh to Nubra Valley', 'desc': 'Cross Khardung La (18,380 ft). Diskit Monastery visit.'},
    {'day': 3, 'title': 'Nubra to Pangong', 'desc': 'Scenic drive via Shyok River. Lakeside camping.'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.midnight,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 320,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                children: [
                  CarouselSlider(
                    options: CarouselOptions(
                      height: 320,
                      viewportFraction: 1,
                      onPageChanged: (index, _) => setState(() => _currentImage = index),
                    ),
                    items: images.map((img) => Image.network(img, fit: BoxFit.cover, width: double.infinity)).toList(),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: AnimatedSmoothIndicator(
                        activeIndex: _currentImage,
                        count: images.length,
                        effect: ExpandingDotsEffect(
                          activeDotColor: AppColors.sand,
                          dotColor: AppColors.cloud.withOpacity(0.3),
                          dotHeight: 8,
                          dotWidth: 8,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.sand.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('Tour', style: TextStyle(color: AppColors.sand, fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                      const Spacer(),
                      const Icon(Icons.star, color: AppColors.sand, size: 18),
                      const SizedBox(width: 4),
                      const Text('4.9', style: TextStyle(color: AppColors.cloud, fontWeight: FontWeight.w700)),
                      Text(' (456 reviews)', style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.5))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Leh Ladakh Bike Expedition 7 Days',
                    style: TextStyle(fontFamily: 'PlayfairDisplay', fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.cloud),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 16, color: AppColors.cloud.withOpacity(0.5)),
                      const SizedBox(width: 4),
                      Text('Leh, Ladakh, India', style: TextStyle(color: AppColors.cloud.withOpacity(0.6))),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _buildTabBar(),
                  const SizedBox(height: 20),
                  _buildTabContent(),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.midnightLight,
          border: const Border(top: BorderSide(color: AppColors.glassBorder)),
        ),
        child: SafeArea(
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Total Price', style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.5))),
                  const PriceTag(amount: 45000, fontSize: 22),
                ],
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: () {},
                child: const Text('Book Now'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabBar() {
    final tabs = ['Overview', 'Itinerary', 'Reviews', 'Policies'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(tabs.length, (index) {
          final isActive = _selectedTab == index;
          return GestureDetector(
            onTap: () => setState(() => _selectedTab = index),
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isActive ? AppColors.sand.withOpacity(0.2) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isActive ? AppColors.sand : AppColors.glassBorder,
                ),
              ),
              child: Text(
                tabs[index],
                style: TextStyle(
                  color: isActive ? AppColors.sand : AppColors.cloud.withOpacity(0.6),
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                  fontSize: 13,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_selectedTab) {
      case 0:
        return _buildOverview();
      case 1:
        return _buildItinerary();
      case 2:
        return _buildReviews();
      default:
        return _buildPolicies();
    }
  }

  Widget _buildOverview() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Experience the breathtaking landscapes of Ladakh on this 7-day bike expedition. Ride through the world\'s highest motorable passes, visit ancient monasteries, and camp under the stars at Pangong Lake.',
          style: TextStyle(fontSize: 14, color: AppColors.cloud.withOpacity(0.8), height: 1.6),
        ),
        const SizedBox(height: 20),
        const Text('What\'s Included', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.cloud)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _InclusionChip(icon: Icons.check_circle, label: 'Royal Enfield 350cc'),
            _InclusionChip(icon: Icons.check_circle, label: 'Fuel & Mechanic'),
            _InclusionChip(icon: Icons.check_circle, label: 'Camping Gear'),
            _InclusionChip(icon: Icons.check_circle, label: 'All Permits'),
            _InclusionChip(icon: Icons.check_circle, label: 'Guide'),
            _InclusionChip(icon: Icons.check_circle, label: 'Meals'),
          ],
        ),
      ],
    );
  }

  Widget _buildItinerary() {
    return Column(
      children: itinerary.map((day) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.glassWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.glassBorder),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.sand.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  'D${day['day']}',
                  style: const TextStyle(color: AppColors.sand, fontWeight: FontWeight.w700, fontSize: 12),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    day['title'] as String,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.cloud),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    day['desc'] as String,
                    style: TextStyle(fontSize: 13, color: AppColors.cloud.withOpacity(0.6), height: 1.4),
                  ),
                ],
              ),
            ),
          ],
        ),
      )).toList(),
    );
  }

  Widget _buildReviews() {
    return Column(
      children: [
        GlassCard(
          child: Row(
            children: [
              const Text('4.9', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: AppColors.sand)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: List.generate(5, (i) => Icon(
                        Icons.star,
                        size: 16,
                        color: i < 5 ? AppColors.sand : AppColors.cloud.withOpacity(0.2),
                      )),
                    ),
                    const SizedBox(height: 4),
                    Text('Based on 456 reviews', style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.5))),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _ReviewCard(
          name: 'Priya Sharma',
          rating: 5,
          date: '2 weeks ago',
          text: 'Absolutely incredible experience! The guides were knowledgeable and the bikes were well maintained. Pangong Lake at sunset was magical.',
        ),
      ],
    );
  }

  Widget _buildPolicies() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _PolicyItem(title: 'Cancellation', desc: 'Full refund if cancelled 7+ days before. 50% refund 3-7 days. No refund within 3 days.'),
        const SizedBox(height: 12),
        _PolicyItem(title: 'Age Limit', desc: 'Minimum 18 years. Valid driving license required for bike tours.'),
        const SizedBox(height: 12),
        _PolicyItem(title: 'Health', desc: 'Not recommended for people with heart conditions or altitude sickness.'),
      ],
    );
  }
}

class _InclusionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InclusionChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.glassWhite,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.glassBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.success),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.8))),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final String name;
  final int rating;
  final String date;
  final String text;

  const _ReviewCard({required this.name, required this.rating, required this.date, required this.text});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.sand.withOpacity(0.2),
                child: Text(name[0], style: const TextStyle(color: AppColors.sand, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.cloud)),
                    Text(date, style: TextStyle(fontSize: 11, color: AppColors.cloud.withOpacity(0.4))),
                  ],
                ),
              ),
              Row(
                children: List.generate(rating, (_) => const Icon(Icons.star, size: 14, color: AppColors.sand)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(text, style: TextStyle(fontSize: 13, color: AppColors.cloud.withOpacity(0.7), height: 1.5)),
        ],
      ),
    );
  }
}

class _PolicyItem extends StatelessWidget {
  final String title;
  final String desc;
  const _PolicyItem({required this.title, required this.desc});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.glassWhite,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.glassBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.cloud)),
          const SizedBox(height: 4),
          Text(desc, style: TextStyle(fontSize: 13, color: AppColors.cloud.withOpacity(0.6), height: 1.5)),
        ],
      ),
    );
  }
}
