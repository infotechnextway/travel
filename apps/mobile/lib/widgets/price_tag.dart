import 'package:flutter/material.dart';
import '../config/theme.dart';

class PriceTag extends StatelessWidget {
  final double amount;
  final String currency;
  final double? fontSize;

  const PriceTag({
    super.key,
    required this.amount,
    this.currency = '₹',
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '$currency${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => ',')}',
          style: TextStyle(
            fontSize: fontSize ?? 16,
            fontWeight: FontWeight.w800,
            color: AppColors.sand,
          ),
        ),
      ],
    );
  }
}
