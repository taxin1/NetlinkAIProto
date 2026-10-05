// ignore: unnecessary_import
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/models/auth_models.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../services/supabase_service.dart';
import '../../features/auth/presentation/sign_in_screen.dart';
import '../../features/auth/presentation/create_account_screen.dart';
import '../../features/auth/presentation/auth_callback_screen.dart';
import '../../features/how_it_works/presentation/how_it_works_screen.dart';
import '../../features/onboarding/presentation/landing_screen.dart';
import '../../features/onboarding/presentation/splash_screen.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/network_profile/presentation/network_profile_screen.dart';
import '../../features/network_profile/presentation/global_directory_screen.dart';
import '../../features/portfolio/presentation/portfolio_screen.dart';
import '../../features/contacts/presentation/contacts_screen.dart';
import '../../features/emails/presentation/emails_screen.dart';
import '../../features/analytics/presentation/analytics_screen.dart';
import '../../features/ai_assistant/presentation/ai_assistant_screen.dart';
import '../../features/quotation/presentation/quotation_screen.dart';
import '../../features/pricing/presentation/pricing_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/resources/presentation/resources_screen.dart';
import '../../features/resources/presentation/getting_started_screen.dart';
import '../../features/resources/presentation/setup_guide_screen.dart';
import '../../features/resources/presentation/faq_screen.dart';
import '../../features/new_features/presentation/new_feature_screens.dart';
import '../../features/networking_mode/presentation/networking_mode_screen.dart';
import '../../features/calendar/presentation/calendar_screen.dart';
import '../../features/events/presentation/events_screen.dart';
import '../../features/campaigns/presentation/campaigns_screen.dart';
import '../widgets/app_shell.dart';

// ── Route constants ───────────────────────────────────────────────────────────
class AppRoutes {
  static const String splash            = '/splash';
  static const String landing           = '/';
  static const String howItWorks        = '/how-it-works';
  static const String signIn            = '/sign-in';
  static const String createAccount     = '/create-account';
  static const String onboarding        = '/onboarding';
  static const String authCallback      = '/auth/callback';

  // Main App
  static const String app               = '/app';
  static const String dashboard         = '/app/dashboard';
  static const String profile           = '/app/profile';
  static const String portfolio         = '/app/portfolio';
  static const String contacts          = '/app/contacts';
  static const String networkingMode    = '/app/networking';
  static const String calendar          = '/app/calendar';
  static const String events            = '/app/events';
  static const String eventMatchmaking  = '/app/event-matchmaking';
  static const String emails            = '/app/emails';
  static const String aiCampaigns       = '/app/campaigns';
  static const String analytics         = '/app/analytics';
  static const String aiAssistant       = '/app/ai-assistant';
  static const String voiceAgent        = '/app/voice-agent';
  static const String quotation         = '/app/quotation';
  static const String settings          = '/app/settings';
  static const String pricing           = '/app/pricing';
  static const String directory         = '/app/directory';

  // Resources
  static const String resources         = '/resources';
  static const String gettingStarted    = '/getting-started';
  static const String setupGuide        = '/setup-guide';
  static const String faq               = '/faq';
}

CustomTransitionPage<void> _buildSlideTransitionPage(Widget child) {
  return CustomTransitionPage<void>(
    child: child,
    transitionDuration: const Duration(milliseconds: 160),
    reverseTransitionDuration: const Duration(milliseconds: 120),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final fadeAnimation = CurvedAnimation(parent: animation, curve: Curves.easeOut);
      return FadeTransition(opacity: fadeAnimation, child: child);
    },
  );
}

class _RouterNotifier extends ChangeNotifier {
  _RouterNotifier(this._ref) {
    _ref.listen<AuthState>(authProvider, (previous, next) {
      if (previous?.isAuthenticated != next.isAuthenticated) {
        notifyListeners();
      }
    });
  }
  final Ref _ref;
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterNotifier(ref);

  // Routes that do not require authentication
  final openRoutes = {
    AppRoutes.splash,
    AppRoutes.landing,
    AppRoutes.howItWorks,
    AppRoutes.signIn,
    AppRoutes.createAccount,
    AppRoutes.authCallback,
    AppRoutes.directory,
    AppRoutes.pricing,
    AppRoutes.resources,
    AppRoutes.gettingStarted,
    AppRoutes.setupGuide,
    AppRoutes.faq,
  };

  return GoRouter(
    initialLocation: AppRoutes.splash,
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final hasSession = SupabaseService.currentSession != null;
      final isAuthenticated = authState.isAuthenticated || hasSession;
      final location = state.matchedLocation;
      final isOpenRoute = openRoutes.contains(location);
      final isGuest = authState.user?.isGuest ?? false;

      // Unauthenticated users cannot access /app routes
      if (!isAuthenticated && !isOpenRoute) {
        return AppRoutes.landing;
      }

      // Authenticated real users on entry/auth pages → dashboard
      const preAuthOnlyRoutes = {
        AppRoutes.landing,
        AppRoutes.signIn,
        AppRoutes.createAccount,
      };

      if (isAuthenticated &&
          !isGuest &&
          preAuthOnlyRoutes.contains(location)) {
        return AppRoutes.dashboard;
      }

      return null;
    },
    routes: [
      // ── Public / Pre-auth ──────────────────────────────────────────────────
      GoRoute(path: AppRoutes.splash,         name: 'splash',         pageBuilder: (_, s) => _buildSlideTransitionPage(const SplashScreen())),
      GoRoute(path: AppRoutes.landing,        name: 'landing',        pageBuilder: (_, s) => _buildSlideTransitionPage(const LandingScreen())),
      GoRoute(path: AppRoutes.howItWorks,     name: 'howItWorks',     pageBuilder: (_, s) => _buildSlideTransitionPage(const HowItWorksScreen())),
      GoRoute(path: AppRoutes.directory,      name: 'directory',      pageBuilder: (_, s) => _buildSlideTransitionPage(const GlobalDirectoryScreen())),
      GoRoute(path: AppRoutes.pricing,        name: 'pricing',        pageBuilder: (_, s) => _buildSlideTransitionPage(const PricingScreen())),
      GoRoute(path: AppRoutes.resources,      name: 'resources',      pageBuilder: (_, s) => _buildSlideTransitionPage(const ResourcesScreen())),
      GoRoute(path: AppRoutes.gettingStarted, name: 'gettingStarted', pageBuilder: (_, s) => _buildSlideTransitionPage(const GettingStartedScreen())),
      GoRoute(path: AppRoutes.setupGuide,     name: 'setupGuide',     pageBuilder: (_, s) => _buildSlideTransitionPage(const SetupGuideScreen())),
      GoRoute(path: AppRoutes.faq,            name: 'faq',            pageBuilder: (_, s) => _buildSlideTransitionPage(const FaqScreen())),

      // ── Auth ───────────────────────────────────────────────────────────────
      GoRoute(path: AppRoutes.signIn,         name: 'signIn',         pageBuilder: (_, s) => _buildSlideTransitionPage(const SignInScreen())),
      GoRoute(path: AppRoutes.createAccount,  name: 'createAccount',  pageBuilder: (_, s) => _buildSlideTransitionPage(const CreateAccountScreen())),
      GoRoute(path: AppRoutes.onboarding,     name: 'onboarding',     redirect: (_, __) => AppRoutes.dashboard),
      GoRoute(path: AppRoutes.authCallback,   name: 'authCallback',   pageBuilder: (_, s) => _buildSlideTransitionPage(const AuthCallbackScreen())),

      // ── Authenticated App (Shell) ──────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: AppRoutes.dashboard,        name: 'dashboard',        pageBuilder: (_, s) => _buildSlideTransitionPage(const DashboardScreen())),
          GoRoute(path: AppRoutes.profile,          name: 'profile',          pageBuilder: (_, s) => _buildSlideTransitionPage(const NetworkProfileScreen())),
          GoRoute(path: AppRoutes.portfolio,        name: 'portfolio',        pageBuilder: (_, s) => _buildSlideTransitionPage(const PortfolioScreen())),
          GoRoute(path: AppRoutes.contacts,         name: 'contacts',         pageBuilder: (_, s) => _buildSlideTransitionPage(const ContactsScreen())),
          GoRoute(path: AppRoutes.networkingMode,   name: 'networkingMode',   pageBuilder: (_, s) => _buildSlideTransitionPage(const NetworkingModeScreen())),
          GoRoute(path: AppRoutes.calendar,         name: 'calendar',         pageBuilder: (_, s) => _buildSlideTransitionPage(const CalendarScreen())),
          GoRoute(path: AppRoutes.events,           name: 'events',           pageBuilder: (_, s) => _buildSlideTransitionPage(const EventsScreen())),
          GoRoute(path: AppRoutes.eventMatchmaking, name: 'eventMatchmaking', pageBuilder: (_, s) => _buildSlideTransitionPage(const EventMatchmakingScreen())),
          GoRoute(path: AppRoutes.emails,           name: 'emails',           pageBuilder: (_, s) => _buildSlideTransitionPage(const EmailsScreen())),
          GoRoute(path: AppRoutes.aiCampaigns,      name: 'aiCampaigns',      pageBuilder: (_, s) => _buildSlideTransitionPage(const CampaignsScreen())),
          GoRoute(path: AppRoutes.analytics,        name: 'analytics',        pageBuilder: (_, s) => _buildSlideTransitionPage(const AnalyticsScreen())),
          GoRoute(path: AppRoutes.aiAssistant,      name: 'aiAssistant',      pageBuilder: (_, s) => _buildSlideTransitionPage(const AiAssistantScreen())),
          GoRoute(path: AppRoutes.voiceAgent,       name: 'voiceAgent',       redirect: (_, __) => AppRoutes.aiAssistant),
          GoRoute(path: AppRoutes.quotation,        name: 'quotation',        pageBuilder: (_, s) => _buildSlideTransitionPage(const QuotationScreen())),
          GoRoute(
            path: AppRoutes.settings,
            name: 'settings',
            pageBuilder: (_, s) {
              final section = s.uri.queryParameters['section'] ??
                  (s.extra is Map ? (s.extra as Map)['section'] as String? : null) ??
                  (s.extra is String ? s.extra as String : null);
              return _buildSlideTransitionPage(SettingsScreen(initialSection: section));
            },
          ),
        ],
      ),
    ],
  );
});
