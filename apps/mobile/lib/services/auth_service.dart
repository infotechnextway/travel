import 'api_service.dart';

class AuthService {
  final _api = ApiService();

  Future<Map<String, dynamic>> login(String phone, String password) async {
    final res = await _api.post('/auth/login', data: {'phone': phone, 'password': password});
    return res.data['data'];
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final res = await _api.post('/auth/register', data: data);
    return res.data['data'];
  }

  Future<Map<String, dynamic>> sendOtp(String phone) async {
    final res = await _api.post('/auth/otp/send', data: {'phone': phone});
    return res.data['data'];
  }

  Future<Map<String, dynamic>> verifyOtp(String phone, String otp) async {
    final res = await _api.post('/auth/otp/verify', data: {'phone': phone, 'otp': otp});
    return res.data['data'];
  }
}
