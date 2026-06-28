import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../screens/splash_screen.dart';
import '../screens/login_screen.dart';
import '../screens/main_shell.dart';
import '../screens/home_screen.dart';
import '../screens/search_screen.dart';
import '../screens/listing_detail_screen.dart';
import '../screens/checkout_screen.dart';
import '../screens/bookings_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/ticket_detail_screen.dart';
import '../screens/wallet_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(
      path: '/',
      builder: (_, __) => const MainShell(),
      routes: [
        GoRoute(path: 'home', builder: (_, __) => const HomeScreen()),
        GoRoute(path: 'search', builder: (_, __) => const SearchScreen()),
        GoRoute(path: 'bookings', builder: (_, __) => const BookingsScreen()),
        GoRoute(path: 'profile', builder: (_, __) => const ProfileScreen()),
        GoRoute(path: 'notifications', builder: (_, __) => const NotificationsScreen()),
        GoRoute(path: 'wallet', builder: (_, __) => const WalletScreen()),
        GoRoute(path: 'listing/:id', builder: (ctx, state) => ListingDetailScreen(id: state.pathParameters['id']!)),
        GoRoute(path: 'checkout/:bookingId', builder: (ctx, state) => CheckoutScreen(bookingId: state.pathParameters['bookingId']!)),
        GoRoute(path: 'ticket/:id', builder: (ctx, state) => TicketDetailScreen(ticketId: state.pathParameters['id']!)),
      ],
    ),
  ],
);
