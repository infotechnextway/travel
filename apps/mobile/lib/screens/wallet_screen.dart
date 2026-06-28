import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/price_tag.dart';

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  final List<Map<String, dynamic>> transactions = const [
    {'type': 'credit', 'source': 'Refund', 'amount': 4500.0, 'date': '15 Jun 2024'},
    {'type': 'debit', 'source': 'Booking', 'amount': 12500.0, 'date': '10 Jun 2024'},
    {'type': 'credit', 'source': 'Cashback', 'amount': 500.0, 'date': '05 Jun 2024'},
    {'type': 'credit', 'source': 'Top-up', 'amount': 10000.0, 'date': '01 Jun 2024'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.midnight,
      appBar: AppBar(
        title: const Text('Wallet', style: TextStyle(fontFamily: 'PlayfairDisplay')),
      ),
      body: Column(
        children: [
          Container(
            margin: const EdgeInsets.all(20),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.sand.withOpacity(0.3),
                  AppColors.sand.withOpacity(0.1),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.sand.withOpacity(0.3)),
            ),
            child: Column(
              children: [
                Text('Available Balance', style: TextStyle(fontSize: 14, color: AppColors.cloud.withOpacity(0.6))),
                const SizedBox(height: 8),
                const PriceTag(amount: 2500, fontSize: 36),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Add Money'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.arrow_downward, size: 18),
                        label: const Text('Withdraw'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Text('Recent Transactions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.cloud)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: transactions.length,
              itemBuilder: (context, index) {
                final tx = transactions[index];
                final isCredit = tx['type'] == 'credit';
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.glassWhite,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.glassBorder),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: isCredit ? AppColors.success.withOpacity(0.15) : AppColors.error.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                          color: isCredit ? AppColors.success : AppColors.error,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tx['source'] as String,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.cloud),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tx['date'] as String,
                              style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.4)),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${isCredit ? '+' : '-'}₹${tx['amount']}',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isCredit ? AppColors.success : AppColors.error,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
