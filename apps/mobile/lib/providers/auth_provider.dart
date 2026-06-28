import 'package:flutter/material.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  String? _token;
  bool _isLoading = false;

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null && _user != null;

  Future<void> login(String phone, String password) async {
    _isLoading = true;
    notifyListeners();
    // TODO: Integrate with AuthService
    await Future.delayed(const Duration(seconds: 1));
    _user = User(
      id: 'user_123',
      name: 'Arjun Sharma',
      email: 'arjun@example.com',
      phone: phone,
      role: 'customer',
      isVerified: true,
      tier: 'gold',
      points: 12500,
    );
    _token = 'mock_token';
    _isLoading = false;
    notifyListeners();
  }

  void logout() {
    _user = null;
    _token = null;
    notifyListeners();
  }
}
