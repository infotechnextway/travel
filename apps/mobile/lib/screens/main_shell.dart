import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final _routes = ['/home', '/search', '/bookings', '/profile'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          Navigator(
            onGenerateRoute: (_) => MaterialPageRoute(
              builder: (_) => const _HomePlaceholder(),
            ),
          ),
          Navigator(
            onGenerateRoute: (_) => MaterialPageRoute(
              builder: (_) => const _SearchPlaceholder(),
            ),
          ),
          Navigator(
            onGenerateRoute: (_) => MaterialPageRoute(
              builder: (_) => const _BookingsPlaceholder(),
            ),
          ),
          Navigator(
            onGenerateRoute: (_) => MaterialPageRoute(
              builder: (_) => const _ProfilePlaceholder(),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.midnightLight,
          border: const Border(
            top: BorderSide(color: AppColors.glassBorder),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) {
              setState(() => _currentIndex = index);
              context.go(_routes[index]);
            },
            backgroundColor: Colors.transparent,
            elevation: 0,
            type: BottomNavigationBarType.fixed,
            selectedItemColor: AppColors.sand,
            unselectedItemColor: AppColors.cloudDim,
            selectedFontSize: 11,
            unselectedFontSize: 11,
            items: const [
              BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
              BottomNavigationBarItem(icon: Icon(Icons.search_outlined), activeIcon: Icon(Icons.search), label: 'Search'),
              BottomNavigationBarItem(icon: Icon(Icons.confirmation_number_outlined), activeIcon: Icon(Icons.confirmation_number), label: 'Bookings'),
              BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomePlaceholder extends StatelessWidget {
  const _HomePlaceholder();
  @override
  Widget build(BuildContext context) => const HomeScreenRoute();
}
class _SearchPlaceholder extends StatelessWidget {
  const _SearchPlaceholder();
  @override
  Widget build(BuildContext context) => const SearchScreenRoute();
}
class _BookingsPlaceholder extends StatelessWidget {
  const _BookingsPlaceholder();
  @override
  Widget build(BuildContext context) => const BookingsScreenRoute();
}
class _ProfilePlaceholder extends StatelessWidget {
  const _ProfilePlaceholder();
  @override
  Widget build(BuildContext context) => const ProfileScreenRoute();
}

// These will be replaced by actual imports when all screens are generated
class HomeScreenRoute extends StatelessWidget {
  const HomeScreenRoute({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Text('Home', style: TextStyle(color: AppColors.cloud)));
}
class SearchScreenRoute extends StatelessWidget {
  const SearchScreenRoute({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Text('Search', style: TextStyle(color: AppColors.cloud)));
}
class BookingsScreenRoute extends StatelessWidget {
  const BookingsScreenRoute({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Text('Bookings', style: TextStyle(color: AppColors.cloud)));
}
class ProfileScreenRoute extends StatelessWidget {
  const ProfileScreenRoute({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Text('Profile', style: TextStyle(color: AppColors.cloud)));
}
