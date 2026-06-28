import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isOtpMode = false;
  bool _isOtpSent = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.2, 1, curve: Curves.easeOut)),
    );
    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.3, 1, curve: Curves.easeOutCubic)),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.midnight,
      body: Stack(
        children: [
          // Background gradient orbs
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [AppColors.sand.withOpacity(0.15), Colors.transparent],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -80,
            right: -80,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [AppColors.saffron.withOpacity(0.1), Colors.transparent],
                ),
              ),
            ),
          ),
          // Content
          SafeArea(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return FadeTransition(
                  opacity: _fadeAnimation,
                  child: SlideTransition(
                    position: _slideAnimation,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 28),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 60),
                          const Icon(Icons.public, size: 56, color: AppColors.sand),
                          const SizedBox(height: 24),
                          const Text(
                            'Welcome Back',
                            style: TextStyle(
                              fontFamily: 'PlayfairDisplay',
                              fontSize: 32,
                              fontWeight: FontWeight.w700,
                              color: AppColors.cloud,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Sign in to discover incredible experiences across India',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppColors.cloud.withOpacity(0.5),
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 40),
                          _buildPhoneField(),
                          const SizedBox(height: 16),
                          if (!_isOtpMode) _buildPasswordField(),
                          if (_isOtpMode && _isOtpSent) _buildOtpField(),
                          const SizedBox(height: 8),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () => setState(() {
                                _isOtpMode = !_isOtpMode;
                                _isOtpSent = false;
                              }),
                              child: Text(
                                _isOtpMode ? 'Use Password' : 'Use OTP',
                                style: const TextStyle(color: AppColors.sand, fontSize: 13),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: auth.isLoading
                                  ? null
                                  : () async {
                                      if (_isOtpMode && !_isOtpSent) {
                                        setState(() => _isOtpSent = true);
                                        return;
                                      }
                                      await auth.login(
                                        _phoneController.text,
                                        _passwordController.text,
                                      );
                                      if (auth.isAuthenticated && mounted) {
                                        context.go('/');
                                      }
                                    },
                              child: auth.isLoading
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: AppColors.midnight,
                                      ),
                                    )
                                  : Text(_isOtpMode && !_isOtpSent ? 'Send OTP' : 'Sign In'),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              Expanded(child: Divider(color: AppColors.glassBorder)),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                child: Text(
                                  'or continue with',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.cloud.withOpacity(0.4),
                                  ),
                                ),
                              ),
                              Expanded(child: Divider(color: AppColors.glassBorder)),
                            ],
                          ),
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              Expanded(
                                child: _SocialButton(
                                  icon: Icons.g_mobiledata,
                                  label: 'Google',
                                  onTap: () {},
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _SocialButton(
                                  icon: Icons.apple,
                                  label: 'Apple',
                                  onTap: () {},
                                ),
                              ),
                            ],
                          ),
                          const Spacer(),
                          Center(
                            child: TextButton(
                              onPressed: () {},
                              child: RichText(
                                text: TextSpan(
                                  text: "Don't have an account? ",
                                  style: TextStyle(
                                    color: AppColors.cloud.withOpacity(0.5),
                                    fontSize: 13,
                                  ),
                                  children: const [
                                    TextSpan(
                                      text: 'Sign Up',
                                      style: TextStyle(
                                        color: AppColors.sand,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhoneField() {
    return TextField(
      controller: _phoneController,
      keyboardType: TextInputType.phone,
      style: const TextStyle(color: AppColors.cloud),
      decoration: InputDecoration(
        hintText: 'Phone number (+91)',
        prefixIcon: const Icon(Icons.phone, color: AppColors.cloudDim),
      ),
    );
  }

  Widget _buildPasswordField() {
    return TextField(
      controller: _passwordController,
      obscureText: true,
      style: const TextStyle(color: AppColors.cloud),
      decoration: InputDecoration(
        hintText: 'Password',
        prefixIcon: const Icon(Icons.lock, color: AppColors.cloudDim),
      ),
    );
  }

  Widget _buildOtpField() {
    return TextField(
      keyboardType: TextInputType.number,
      maxLength: 6,
      style: const TextStyle(color: AppColors.cloud, fontSize: 20, letterSpacing: 8),
      textAlign: TextAlign.center,
      decoration: const InputDecoration(
        hintText: 'Enter OTP',
        counterText: '',
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _SocialButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.glassWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.glassBorder),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.cloud, size: 20),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(color: AppColors.cloud, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}
