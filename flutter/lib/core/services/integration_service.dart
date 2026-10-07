import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'business_card_scanner_service.dart';

/// Global event stream for third-party OAuth connect callbacks (e.g. Gmail, Google Calendar)
class IntegrationEvents {
  IntegrationEvents._();

  static final StreamController<Uri> _connectController =
      StreamController<Uri>.broadcast();

  /// Google OAuth Client ID (configurable at compile time via --dart-define=GOOGLE_CLIENT_ID=...)
  static const String googleClientId = String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue:
        '783966653046-n6quk2616a8t1rk61r2mn0rtcurnt9q9.apps.googleusercontent.com',
  );

  /// Stream of incoming deep link URIs with host `connect-callback`
  static Stream<Uri> get onConnectCallback => _connectController.stream;

  /// Dispatch an incoming URI from deep links
  static void dispatchConnectCallback(Uri uri) {
    _connectController.add(uri);
  }

  /// Builds a secure URL-safe base64 state parameter for Google OAuth
  static String buildOAuthState({
    required String userId,
    required String provider,
    String? returnUrl,
  }) {
    final payload = {
      'userId': userId,
      'provider': provider,
      'returnUrl': returnUrl ??
          (kIsWeb
              ? '${Uri.base.origin}/dashboard/settings'
              : 'io.supabase.netlink://connect-callback'),
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
    return base64UrlEncode(utf8.encode(jsonEncode(payload)));
  }

  /// Constructs Google OAuth URL for Gmail integration with deep link return
  static String buildGmailOAuthUrl({
    required String userId,
    String? customRedirectUri,
  }) {
    final state = buildOAuthState(userId: userId, provider: 'gmail');
    final redirectUri = customRedirectUri ??
        '${BusinessCardScannerService.webBaseUrl}/api/gmail/callback';

    return 'https://accounts.google.com/o/oauth2/v2/auth'
        '?access_type=offline'
        '&scope=${Uri.encodeComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify')}'
        '&prompt=consent'
        '&response_type=code'
        '&state=$state'
        '&client_id=$googleClientId'
        '&redirect_uri=${Uri.encodeComponent(redirectUri)}';
  }

  /// Constructs Google OAuth URL for Google Calendar integration with deep link return
  static String buildGoogleCalendarOAuthUrl({
    required String userId,
    String? customRedirectUri,
  }) {
    final state = buildOAuthState(userId: userId, provider: 'google-calendar');
    final redirectUri = customRedirectUri ??
        '${BusinessCardScannerService.webBaseUrl}/api/google-calendar/callback';

    return 'https://accounts.google.com/o/oauth2/v2/auth'
        '?access_type=offline'
        '&scope=${Uri.encodeComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')}'
        '&prompt=consent'
        '&response_type=code'
        '&state=$state'
        '&client_id=$googleClientId'
        '&redirect_uri=${Uri.encodeComponent(redirectUri)}';
  }
}
