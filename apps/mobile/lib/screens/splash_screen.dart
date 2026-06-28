import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0, 0.5, curve: Curves.easeOut)),
    );
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.2, 0.7, curve: Curves.easeOutCubic)),
    );
    _controller.forward();
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) context.go('/login');
    });
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.midnight,
      body: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            AppColors.sand.withOpacity(0.3),
                            AppColors.midnight,
                          ],
                        ),
                        border: Border.all(color: AppColors.sand.withOpacity(0.4)),
                      ),
                      child: const Icon(
                        Icons.public,
                        size: 48,
                        color: AppColors.sand,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'IndiaTravel',
                      style: TextStyle(
                        fontFamily: 'PlayfairDisplay',
                        fontSize: 32,
                        fontWeight: FontWeight.w700,
                        color: AppColors.sand,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Discover Incredible India',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.cloud.withOpacity(0.5),
                        letterSpacing: 3,
                      ),
                    ),
                    const SizedBox(height: 48),
                    SizedBox(
                      width: 120,
                      child: LinearProgressIndicator(
                        value: _controller.value,
                        backgroundColor: AppColors.glassWhite,
                        valueColor: const AlwaysStoppedAnimation(AppColors.sand),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
