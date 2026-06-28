import 'package:intl/intl.dart';

class Formatters {
  static String currency(double amount, {String symbol = '₹'}) {
    return '$symbol${NumberFormat('#,##,###').format(amount)}';
  }

  static String date(DateTime date) {
    return DateFormat('dd MMM yyyy').format(date);
  }

  static String shortDate(DateTime date) {
    return DateFormat('dd MMM').format(date);
  }
}
