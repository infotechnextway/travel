import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../widgets/theme_toggle.dart';
import '../widgets/glass_card.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.midnight,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 280,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.midnightLight,
                      AppColors.midnight,
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          Container(
                            width: 90,
                            height: 90,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [AppColors.sand.withOpacity(0.3), AppColors.midnightLight],
                              ),
                              border: Border.all(color: AppColors.sand.withOpacity(0.4), width: 2),
                            ),
                            child: const Center(
                              child: Text(
                                'AS',
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.sand,
                                ),
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppColors.gold,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.midnight, width: 2),
                            ),
                            child: const Icon(Icons.edit, size: 14, color: AppColors.midnight),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Arjun Sharma',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppColors.cloud,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'arjun.sharma@email.com',
                        style: TextStyle(fontSize: 13, color: AppColors.cloud.withOpacity(0.5)),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [AppColors.sand.withOpacity(0.3), AppColors.sand.withOpacity(0.1)],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.sand.withOpacity(0.4)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.workspace_premium, size: 16, color: AppColors.sand),
                            const SizedBox(width: 6),
                            const Text(
                              'Gold Member',
                              style: TextStyle(color: AppColors.sand, fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '• 12,500 pts',
                              style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.6)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  _buildStatsRow(),
                  const SizedBox(height: 24),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Appearance',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700,
                            color: context.brand.textPrimary)),
                  ),
                  const SizedBox(height: 12),
                  const ThemeModeSelector(),
                  const SizedBox(height: 24),
                  _buildMenuSection(context),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        Expanded(
          child: GlassCard(
            child: Column(
              children: [
                const Text('12', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.sand)),
                const SizedBox(height: 4),
                Text('Trips', style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.5))),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: GlassCard(
            child: Column(
              children: [
                const Text('₹1.2L', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.sand)),
                const SizedBox(height: 4),
                Text('Spent', style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.5))),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: GlassCard(
            child: Column(
              children: [
                const Text('8', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.sand)),
                const SizedBox(height: 4),
                Text('Reviews', style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.5))),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMenuSection(BuildContext context) {
    final items = [
      {'icon': Icons.account_balance_wallet, 'label': 'Wallet', 'route': '/wallet'},
      {'icon': Icons.confirmation_number, 'label': 'My Bookings', 'route': '/bookings'},
      {'icon': Icons.favorite_border, 'label': 'Wishlist', 'route': ''},
      {'icon': Icons.card_giftcard, 'label': 'Coupons', 'route': ''},
      {'icon': Icons.people_outline, 'label': 'Family Members', 'route': ''},
      {'icon': Icons.support_agent, 'label': 'Support Tickets', 'route': '/ticket/123'},
      {'icon': Icons.settings, 'label': 'Settings', 'route': ''},
      {'icon': Icons.logout, 'label': 'Logout', 'route': ''},
    ];

    return Column(
      children: items.map((item) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: AppColors.glassWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.glassBorder),
        ),
        child: ListTile(
          leading: Icon(item['icon'] as IconData, color: AppColors.cloud.withOpacity(0.7)),
          title: Text(
            item['label'] as String,
            style: TextStyle(color: AppColors.cloud.withOpacity(0.9)),
          ),
          trailing: const Icon(Icons.chevron_right, color: AppColors.cloudDim),
          onTap: () {
            final route = item['route'] as String;
            if (route.isNotEmpty) context.go(route);
          },
        ),
      )).toList(),
    );
  }
}
