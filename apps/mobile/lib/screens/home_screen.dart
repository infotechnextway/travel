import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../config/theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/animated_counter.dart';
import '../widgets/price_tag.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _earthController;
  final ScrollController _scrollController = ScrollController();
  double _scrollOffset = 0;

  final List<Map<String, dynamic>> categories = [
    {'icon': Icons.beach_access, 'label': 'Beaches', 'color': Color(0xFF4FC3F7)},
    {'icon': Icons.terrain, 'label': 'Mountains', 'color': Color(0xFF81C784)},
    {'icon': Icons.account_balance, 'label': 'Heritage', 'color': Color(0xFFFFB74D)},
    {'icon': Icons.paragliding, 'label': 'Adventure', 'color': Color(0xFFE57373)},
    {'icon': Icons.temple_buddhist, 'label': 'Spiritual', 'color': Color(0xFFBA68C8)},
    {'icon': Icons.forest, 'label': 'Wildlife', 'color': Color(0xFF64B5F6)},
  ];

  final List<Map<String, dynamic>> featured = [
    {
      'title': 'Kerala Backwaters',
      'subtitle': 'Houseboat Cruise',
      'image': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600',
      'rating': 4.9,
      'price': 12500.0,
    },
    {
      'title': 'Ladakh Expedition',
      'subtitle': '7-Day Bike Tour',
      'image': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600',
      'rating': 4.8,
      'price': 45000.0,
    },
    {
      'title': 'Rajasthan Royal',
      'subtitle': 'Palace & Desert',
      'image': 'https://images.unsplash.com/photo-1595658650010-220c831d6b2e?w=600',
      'rating': 4.7,
      'price': 28000.0,
    },
  ];

  final List<Map<String, dynamic>> trending = [
    {
      'title': 'Goa Scuba Diving',
      'location': 'Grande Island, Goa',
      'image': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
      'rating': 4.8,
      'reviews': 234,
      'price': 4500.0,
      'duration': '4 hours',
    },
    {
      'title': 'Manali Trekking',
      'location': 'Hampta Pass, Himachal',
      'image': 'https://images.unsplash.com/photo-1506905926800-3e3c1c6c2e0e?w=600',
      'rating': 4.9,
      'reviews': 189,
      'price': 8200.0,
      'duration': '5 days',
    },
    {
      'title': 'Varanasi Spiritual',
      'location': 'Ganga Ghats, UP',
      'image': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600',
      'rating': 4.6,
      'reviews': 312,
      'price': 3800.0,
      'duration': '2 days',
    },
  ];

  @override
  void initState() {
    super.initState();
    _earthController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    )..repeat();
    _scrollController.addListener(() {
      setState(() => _scrollOffset = _scrollController.offset);
    });
  }

  @override
  void dispose() {
    _earthController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.midnight,
      extendBodyBehindAppBar: true,
      body: CustomScrollView(
        controller: _scrollController,
        physics: const BouncingScrollPhysics(),
        slivers: [
          _buildSliverAppBar(),
          SliverToBoxAdapter(child: _buildEarthHero()),
          SliverToBoxAdapter(child: _buildSearchBar()),
          SliverToBoxAdapter(child: _buildCategories()),
          SliverToBoxAdapter(child: _buildSectionTitle('Featured Destinations')),
          SliverToBoxAdapter(child: _buildFeaturedCarousel()),
          SliverToBoxAdapter(child: _buildSectionTitle('Trending Tours')),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildTrendingCard(trending[index]),
                childCount: trending.length,
              ),
            ),
          ),
          SliverToBoxAdapter(child: _buildStatsSection()),
          SliverToBoxAdapter(child: _buildTrustSection()),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar() {
    final opacity = (_scrollOffset / 200).clamp(0.0, 1.0);
    return SliverAppBar(
      expandedHeight: 0,
      floating: true,
      pinned: true,
      elevation: 0,
      backgroundColor: AppColors.midnight.withOpacity(opacity),
      systemOverlayStyle: SystemUiOverlayStyle.light,
      title: AnimatedOpacity(
        opacity: opacity,
        duration: const Duration(milliseconds: 200),
        child: const Text(
          'IndiaTravel',
          style: TextStyle(
            fontFamily: 'PlayfairDisplay',
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppColors.sand,
          ),
        ),
      ),
      leading: Padding(
        padding: const EdgeInsets.only(left: 16),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.location_on, color: AppColors.saffron, size: 18),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                'Delhi, India',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.cloud.withOpacity(0.9),
                  fontWeight: FontWeight.w500,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const Icon(Icons.keyboard_arrow_down, color: AppColors.cloud, size: 16),
          ],
        ),
      ),
      leadingWidth: 140,
      actions: [
        Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined, color: AppColors.cloud),
              onPressed: () {},
            ),
            Positioned(
              right: 10,
              top: 10,
              child: Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.saffron,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildEarthHero() {
    return Container(
      height: 320,
      margin: const EdgeInsets.only(top: 60),
      child: Stack(
        alignment: Alignment.center,
        children: [
          ...List.generate(30, (i) {
            final delay = i * 0.5;
            return AnimatedBuilder(
              animation: _earthController,
              builder: (context, child) {
                final progress = ((_earthController.value + delay / 20) % 1.0);
                return Positioned(
                  left: (i * 37) % MediaQuery.of(context).size.width,
                  top: 20 + (progress * 280),
                  child: Opacity(
                    opacity: 0.3 + (progress < 0.1 ? progress * 5 : 0.3),
                    child: Container(
                      width: 2 + (i % 3),
                      height: 2 + (i % 3),
                      decoration: BoxDecoration(
                        color: AppColors.cloud,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.cloud.withOpacity(0.3),
                            blurRadius: 4,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          }),
          AnimatedBuilder(
            animation: _earthController,
            builder: (context, child) {
              return Transform.rotate(
                angle: _earthController.value * 2 * 3.14159,
                child: Container(
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFF1E3A5F),
                        const Color(0xFF0F172A),
                        AppColors.midnight.withOpacity(0.8),
                      ],
                      stops: const [0.3, 0.7, 1.0],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.sand.withOpacity(0.15),
                        blurRadius: 60,
                        spreadRadius: 10,
                      ),
                    ],
                    border: Border.all(color: AppColors.glassBorder, width: 1),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.public,
                          size: 64,
                          color: AppColors.sand.withOpacity(0.6),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'INDIA',
                          style: TextStyle(
                            fontFamily: 'PlayfairDisplay',
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.sand.withOpacity(0.8),
                            letterSpacing: 4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
          Positioned(
            bottom: 20,
            child: Column(
              children: [
                Text(
                  'Discover Incredible India',
                  style: TextStyle(
                    fontFamily: 'PlayfairDisplay',
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.cloud,
                    shadows: [
                      Shadow(
                        color: AppColors.midnight.withOpacity(0.8),
                        blurRadius: 20,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '500+ Destinations • 50k+ Experiences',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.cloud.withOpacity(0.6),
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return GestureDetector(
      onTap: () {},
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.glassWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.glassBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(Icons.search, color: AppColors.cloud.withOpacity(0.5)),
            const SizedBox(width: 12),
            Text(
              'Where do you want to go?',
              style: TextStyle(
                color: AppColors.cloud.withOpacity(0.5),
                fontSize: 15,
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.sand.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.tune, color: AppColors.sand, size: 18),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategories() {
    return SizedBox(
      height: 100,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (context, index) {
          final cat = categories[index];
          return Column(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.glassWhite,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.glassBorder),
                  boxShadow: [
                    BoxShadow(
                      color: (cat['color'] as Color).withOpacity(0.15),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Icon(cat['icon'] as IconData, color: cat['color'] as Color, size: 28),
              ),
              const SizedBox(height: 8),
              Text(
                cat['label'] as String,
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.cloud.withOpacity(0.7),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 16),
      child: Row(
        children: [
          Text(
            title,
            style: const TextStyle(
              fontFamily: 'PlayfairDisplay',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.cloud,
            ),
          ),
          const Spacer(),
          TextButton(
            onPressed: () {},
            child: const Text('See All', style: TextStyle(color: AppColors.sand, fontSize: 13)),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedCarousel() {
    return SizedBox(
      height: 260,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: featured.length,
        separatorBuilder: (_, __) => const SizedBox(width: 16),
        itemBuilder: (context, index) {
          final item = featured[index];
          return Container(
            width: 220,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.glassBorder),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(item['image'] as String, fit: BoxFit.cover),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.transparent, AppColors.midnight.withOpacity(0.9)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        stops: const [0.4, 1.0],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['title'] as String,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.cloud),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          item['subtitle'] as String,
                          style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.6)),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.star, color: AppColors.sand, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '${item['rating']}',
                              style: const TextStyle(color: AppColors.cloud, fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                            const Spacer(),
                            PriceTag(amount: item['price'] as double, fontSize: 14),
                          ],
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

  Widget _buildTrendingCard(Map<String, dynamic> item) {
    return GlassCard(
      onTap: () {},
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Image.network(
                  item['image'] as String,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.midnight.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.glassBorder),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, color: AppColors.sand, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          '${item['rating']}',
                          style: const TextStyle(color: AppColors.cloud, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['title'] as String,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.cloud),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 14, color: AppColors.cloud.withOpacity(0.5)),
                      const SizedBox(width: 4),
                      Text(
                        item['location'] as String,
                        style: TextStyle(fontSize: 13, color: AppColors.cloud.withOpacity(0.5)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.sand.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          item['duration'] as String,
                          style: const TextStyle(color: AppColors.sand, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                      const Spacer(),
                      PriceTag(amount: item['price'] as double),
                      Text(
                        ' / person',
                        style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.5)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.midnightLight.withOpacity(0.8), AppColors.midnight.withOpacity(0.6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.glassBorder),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          AnimatedCounter(value: '1M+', label: 'Travelers'),
          SizedBox(width: 1, height: 40, child: DecoratedBox(decoration: BoxDecoration(color: AppColors.glassBorder))),
          AnimatedCounter(value: '500+', label: 'Destinations', delay: Duration(milliseconds: 150)),
          SizedBox(width: 1, height: 40, child: DecoratedBox(decoration: BoxDecoration(color: AppColors.glassBorder))),
          AnimatedCounter(value: '50k+', label: 'Tours', delay: Duration(milliseconds: 300)),
        ],
      ),
    );
  }

  Widget _buildTrustSection() {
    final reviews = [
      {'name': 'Priya S.', 'text': 'The Ladakh bike trip was life-changing! Our guide was amazing.', 'rating': 5},
      {'name': 'Rahul K.', 'text': 'Kerala backwaters houseboat was pure luxury. Highly recommended!', 'rating': 5},
      {'name': 'Anita M.', 'text': 'Seamless booking experience. The app made everything so easy.', 'rating': 5},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 8, 20, 16),
          child: Text(
            'What Travelers Say',
            style: TextStyle(fontFamily: 'PlayfairDisplay', fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.cloud),
          ),
        ),
        SizedBox(
          height: 160,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemCount: reviews.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final review = reviews[index];
              return GlassCard(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: 260,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: List.generate(
                          review['rating'] as int,
                          (_) => const Icon(Icons.star, color: AppColors.sand, size: 14),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        '"${review['text']}"',
                        style: TextStyle(fontSize: 13, color: AppColors.cloud.withOpacity(0.8), fontStyle: FontStyle.italic, height: 1.4),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const Spacer(),
                      Text(
                        '— ${review['name']}',
                        style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.5), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
