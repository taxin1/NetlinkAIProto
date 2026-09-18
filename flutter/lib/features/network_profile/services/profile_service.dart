import '../../../core/services/supabase_service.dart';

class ProfileService {
  ProfileService._();

  static Future<Map<String, dynamic>?> fetchProfile(String userId) async {
    try {
      final response = await SupabaseService.client
          .from('network_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      return response;
    } catch (_) {
      return null;
    }
  }

  static Stream<List<Map<String, dynamic>>> streamProfile(String userId) {
    try {
      return SupabaseService.client
          .from('network_profiles')
          .stream(primaryKey: ['id'])
          .eq('user_id', userId);
    } catch (_) {
      return const Stream.empty();
    }
  }

  static Future<bool> saveProfile({
    required String userId,
    required Map<String, dynamic> data,
  }) async {
    try {
      final payload = Map<String, dynamic>.from(data);
      payload['user_id'] = userId;
      payload['updated_at'] = DateTime.now().toIso8601String();

      await SupabaseService.client.from('network_profiles').upsert(
            payload,
            onConflict: 'user_id',
          );
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Fetches directory of network profiles
  static Future<List<Map<String, dynamic>>> fetchPublicProfiles() async {
    try {
      final response = await SupabaseService.client
          .from('network_profiles')
          .select('*')
          .order('created_at', ascending: false)
          .limit(30);

      final list = response as List<dynamic>;
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return [];
    }
  }
}
