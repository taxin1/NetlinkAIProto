import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:app_links/app_links.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'core/router/app_router.dart';
import 'core/services/supabase_service.dart';
import 'core/localization/app_localizations.dart';
import 'core/localization/locale_provider.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/services/integration_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  usePathUrlStrategy();

  final results = await Future.wait([
    SupabaseService.initialize(),
    SharedPreferences.getInstance(),
  ]);
  final prefs = results[1] as SharedPreferences;

  // Handle incoming deep links (OAuth callbacks on mobile)
  _initDeepLinks();

  // Lock to portrait orientation
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const NetworkLinkApp(),
    ),
  );
}

/// Listens to incoming deep links:
/// - io.supabase.netlink://login-callback: passes to Supabase to exchange PKCE code for session
/// - io.supabase.netlink://connect-callback: notifies integration listeners (Gmail, Google Calendar)
void _initDeepLinks() {
  final appLinks = AppLinks();

  void handleIncomingUri(Uri uri) {
    if (uri.scheme == 'io.supabase.netlink' &&
        (uri.host == 'connect-callback' || uri.path.contains('connect-callback'))) {
      IntegrationEvents.dispatchConnectCallback(uri);
    } else {
      SupabaseService.auth.getSessionFromUrl(uri);
    }
  }

  // Handle link that launched the app from a cold start
  appLinks.getInitialLink().then((uri) {
    if (uri != null) {
      handleIncomingUri(uri);
    }
  }).catchError((_) {});

  // Handle links while app is already running (background / foreground)
  appLinks.uriLinkStream.listen((uri) {
    handleIncomingUri(uri);
  }, onError: (_) {});
}

class NetworkLinkApp extends ConsumerWidget {
  const NetworkLinkApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final currentLocale = ref.watch(localeProvider);
    final isDark = themeMode == ThemeMode.dark;

    // Update system UI overlay based on theme
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness:
            isDark ? Brightness.light : Brightness.dark,
        systemNavigationBarColor:
            isDark ? const Color(0xFF10131A) : const Color(0xFFF5F6FA),
        systemNavigationBarIconBrightness:
            isDark ? Brightness.light : Brightness.dark,
      ),
    );

    return MaterialApp.router(
      title: 'NetworkLink AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      locale: currentLocale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      scrollBehavior: const MaterialScrollBehavior().copyWith(
        scrollbars: false,
      ),
      routerConfig: router,
    );
  }
}
