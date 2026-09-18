import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  SupabaseService._();

  static const String supabaseUrl = 'https://kaqptbreyakggqybftjc.supabase.co';
  static const String supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcXB0YnJleWFrZ2dxeWJmdGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzA2OTYsImV4cCI6MjA3NTI0NjY5Nn0.oiq1JbOcmxFs9qIZ7fBqWRyCRBUnACAqpUVj6CoWNto';

  static bool _initialized = false;

  static Future<void> initialize() async {
    if (_initialized) return;
    await Supabase.initialize(
      url: supabaseUrl,
      // ignore: deprecated_member_use
      anonKey: supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
    _initialized = true;
  }

  static bool get isInitialized => _initialized;
  static SupabaseClient get client => Supabase.instance.client;
  static GoTrueClient get auth => Supabase.instance.client.auth;

  static Session? get currentSession {
    if (!_initialized) return null;
    try {
      return auth.currentSession;
    } catch (_) {
      return null;
    }
  }

  /// Checks if the user has completed their profile in network_profiles
  /// (Mirrors the exact logic of Netlink-Cogni web app app/onboarding/page.tsx)
  static Future<bool> hasCompletedProfile(String userId) async {
    try {
      final response = await client
          .from('network_profiles')
          .select('id, name, title, company, linkedin, website')
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) return false;

      final name = response['name'] as String?;
      final title = response['title'] as String?;
      final company = response['company'] as String?;
      final linkedin = response['linkedin'] as String?;
      final website = response['website'] as String?;

      return (name != null && name.isNotEmpty) ||
          (title != null && title.isNotEmpty) ||
          (company != null && company.isNotEmpty) ||
          (linkedin != null && linkedin.isNotEmpty) ||
          (website != null && website.isNotEmpty);
    } catch (_) {
      return false;
    }
  }

  /// Checks if any record exists for this user in network_profiles
  static Future<bool> userProfileExists(String userId) async {
    try {
      final response = await client
          .from('network_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
      return response != null;
    } catch (_) {
      return false;
    }
  }

  /// Saves or updates the user profile during onboarding
  static Future<bool> saveOnboardingProfile({
    required String userId,
    String? name,
    String? title,
    String? company,
    String? email,
    String? linkedin,
    String? website,
    bool isPublicProfile = true,
  }) async {
    try {
      await client.from('network_profiles').upsert(
        {
          'user_id': userId,
          'name': (name != null && name.trim().isNotEmpty) ? name.trim() : null,
          'title': (title != null && title.trim().isNotEmpty) ? title.trim() : null,
          'company': (company != null && company.trim().isNotEmpty) ? company.trim() : null,
          'email': (email != null && email.trim().isNotEmpty) ? email.trim() : null,
          'linkedin': (linkedin != null && linkedin.trim().isNotEmpty) ? linkedin.trim() : null,
          'website': (website != null && website.trim().isNotEmpty) ? website.trim() : null,
          'is_public_profile': isPublicProfile,
        },
        onConflict: 'user_id',
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Checks whether user has an active Pro or Enterprise subscription
  static Future<bool> isUserPro(String userId) async {
    try {
      final response = await client
          .from('subscriptions')
          .select('plan_name, status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

      if (response == null) return false;
      final plan = response['plan_name'] as String?;
      return plan == 'professional' || plan == 'enterprise';
    } catch (_) {
      return false;
    }
  }
}
