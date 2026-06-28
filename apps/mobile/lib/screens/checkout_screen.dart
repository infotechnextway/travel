import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/price_tag.dart';

class CheckoutScreen extends StatefulWidget {
  final String bookingId;
  const CheckoutScreen({super.key, required this.bookingId});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  int _currentStep = 0;
  final List<String> _steps = ['Travelers', 'Add-ons', 'Payment'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.midnight,
      appBar: AppBar(
        title: const Text('Checkout', style: TextStyle(fontFamily: 'PlayfairDisplay')),
      ),
      body: Column(
        children: [
          _buildStepIndicator(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: _buildStepContent(),
            ),
          ),
          _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildStepIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: List.generate(_steps.length, (index) {
          final isActive = index <= _currentStep;
          final isCurrent = index == _currentStep;
          return Expanded(
            child: Row(
              children: [
                if (index > 0)
                  Expanded(
                    child: Container(
                      height: 2,
                      color: isActive ? AppColors.sand : AppColors.glassBorder,
                    ),
                  ),
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isActive ? AppColors.sand : AppColors.glassWhite,
                    border: Border.all(
                      color: isCurrent ? AppColors.sand : AppColors.glassBorder,
                      width: isCurrent ? 2 : 1,
                    ),
                  ),
                  child: Center(
                    child: isActive && index < _currentStep
                        ? const Icon(Icons.check, size: 16, color: AppColors.midnight)
                        : Text(
                            '${index + 1}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isActive ? AppColors.midnight : AppColors.cloud.withOpacity(0.5),
                            ),
                          ),
                  ),
                ),
                if (index < _steps.length - 1) const Spacer(),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildTravelersStep();
      case 1:
        return _buildAddonsStep();
      case 2:
        return _buildPaymentStep();
      default:
        return const SizedBox();
    }
  }

  Widget _buildTravelersStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Primary Traveler', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.cloud)),
        const SizedBox(height: 12),
        _buildTextField('Full Name', Icons.person),
        const SizedBox(height: 12),
        _buildTextField('Email', Icons.email),
        const SizedBox(height: 12),
        _buildTextField('Phone', Icons.phone),
        const SizedBox(height: 12),
        _buildTextField('Aadhaar / Passport (Optional)', Icons.badge),
        const SizedBox(height: 24),
        Row(
          children: [
            const Text('Travelers', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.cloud)),
            const Spacer(),
            Container(
              decoration: BoxDecoration(
                color: AppColors.glassWhite,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.glassBorder),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove, color: AppColors.cloud, size: 18),
                    onPressed: () {},
                  ),
                  const Text('2', style: TextStyle(color: AppColors.cloud, fontWeight: FontWeight.w700)),
                  IconButton(
                    icon: const Icon(Icons.add, color: AppColors.cloud, size: 18),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAddonsStep() {
    final addons = [
      {'name': 'Travel Insurance', 'desc': 'Covers medical emergencies & trip cancellation', 'price': 1200.0},
      {'name': 'Airport Transfer', 'desc': 'Private cab from airport to hotel', 'price': 2500.0},
      {'name': 'Photography Package', 'desc': 'Professional photoshoot during tour', 'price': 5000.0},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Enhance Your Trip', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.cloud)),
        const SizedBox(height: 12),
        ...addons.map((addon) => Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.glassWhite,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Row(
            children: [
              Checkbox(
                value: false,
                onChanged: (_) {},
                fillColor: MaterialStateProperty.resolveWith((states) =>
                  states.contains(MaterialState.selected) ? AppColors.sand : AppColors.glassWhite),
                checkColor: AppColors.midnight,
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(addon['name'] as String, style: const TextStyle(color: AppColors.cloud, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(addon['desc'] as String, style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.5))),
                  ],
                ),
              ),
              PriceTag(amount: addon['price'] as double),
            ],
          ),
        )).toList(),
      ],
    );
  }

  Widget _buildPaymentStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Payment Method', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.cloud)),
        const SizedBox(height: 12),
        _PaymentMethodCard(icon: Icons.credit_card, label: 'Credit / Debit Card', selected: true),
        const SizedBox(height: 8),
        _PaymentMethodCard(icon: Icons.account_balance, label: 'UPI / Net Banking', selected: false),
        const SizedBox(height: 8),
        _PaymentMethodCard(icon: Icons.account_balance_wallet, label: 'Wallet (₹2,500)', selected: false),
        const SizedBox(height: 24),
        const Text('Apply Coupon', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.cloud)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                style: const TextStyle(color: AppColors.cloud),
                decoration: InputDecoration(
                  hintText: 'Enter coupon code',
                  suffixIcon: TextButton(
                    onPressed: () {},
                    child: const Text('Apply', style: TextStyle(color: AppColors.sand)),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        GlassCard(
          child: Column(
            children: [
              _buildPriceRow('Subtotal', 45000),
              _buildPriceRow('Taxes (18% GST)', 8100),
              _buildPriceRow('Platform Fee', 900),
              const Divider(color: AppColors.glassBorder, height: 24),
              _buildPriceRow('Total', 54000, isTotal: true),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(String hint, IconData icon) {
    return TextField(
      style: const TextStyle(color: AppColors.cloud),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: AppColors.cloudDim, size: 20),
      ),
    );
  }

  Widget _buildPriceRow(String label, double amount, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.w700 : FontWeight.w400,
              color: AppColors.cloud.withOpacity(isTotal ? 1 : 0.7),
            ),
          ),
          const Spacer(),
          PriceTag(amount: amount, fontSize: isTotal ? 18 : 14),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.midnightLight,
        border: const Border(top: BorderSide(color: AppColors.glassBorder)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            if (_currentStep > 0)
              OutlinedButton(
                onPressed: () => setState(() => _currentStep--),
                child: const Text('Back'),
              ),
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                if (_currentStep < _steps.length - 1) {
                  setState(() => _currentStep++);
                } else {
                  // Confirm booking
                }
              },
              child: Text(_currentStep == _steps.length - 1 ? 'Pay ₹54,000' : 'Continue'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentMethodCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;

  const _PaymentMethodCard({required this.icon, required this.label, required this.selected});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: selected ? AppColors.sand.withOpacity(0.1) : AppColors.glassWhite,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: selected ? AppColors.sand : AppColors.glassBorder),
      ),
      child: Row(
        children: [
          Icon(icon, color: selected ? AppColors.sand : AppColors.cloudDim),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: AppColors.cloud.withOpacity(selected ? 1 : 0.7),
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ),
          if (selected)
            const Icon(Icons.check_circle, color: AppColors.sand, size: 20),
        ],
      ),
    );
  }
}
