import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:networklink_ai/core/router/app_router.dart';
import 'package:networklink_ai/features/auth/models/auth_models.dart';
import 'package:networklink_ai/features/auth/providers/auth_provider.dart';
import 'package:networklink_ai/features/onboarding/presentation/splash_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Splash and Auth Transition Tests', () {
    test('AuthNotifier restores guest user mode synchronously from SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({
        'is_guest_mode': true,
      });
      final prefs = await SharedPreferences.getInstance();
      final notifier = AuthNotifier(prefs);

      expect(notifier.state.isAuthenticated, isTrue);
      expect(notifier.state.user?.isGuest, isTrue);
      expect(notifier.state.user?.id, 'guest');
    });

    test('AuthNotifier clears guest mode from SharedPreferences on signOut', () async {
      SharedPreferences.setMockInitialValues({
        'is_guest_mode': true,
      });
      final prefs = await SharedPreferences.getInstance();
      final notifier = AuthNotifier(prefs);
      expect(notifier.state.isAuthenticated, isTrue);

      await notifier.signOut();
      expect(notifier.state.isAuthenticated, isFalse);
      expect(prefs.getBool('is_guest_mode'), isNull);
    });

    testWidgets('SplashScreen navigates directly to dashboard when authenticated (no landing glimpse)', (tester) async {
      SharedPreferences.setMockInitialValues({});
      String? navigatedRoute;

      final testRouter = GoRouter(
        initialLocation: AppRoutes.splash,
        routes: [
          GoRoute(
            path: AppRoutes.splash,
            builder: (_, __) => const SplashScreen(),
          ),
          GoRoute(
            path: AppRoutes.landing,
            builder: (_, __) {
              navigatedRoute = AppRoutes.landing;
              return const Scaffold(body: Text('Landing'));
            },
          ),
          GoRoute(
            path: AppRoutes.dashboard,
            builder: (_, __) {
              navigatedRoute = AppRoutes.dashboard;
              return const Scaffold(body: Text('Dashboard'));
            },
          ),
        ],
      );

      final container = ProviderContainer();
      // Set authenticated user
      container.read(authProvider.notifier).state = const AuthState(
        user: AppUser(
          id: 'user-789',
          name: 'Demo User',
          email: 'user@example.com',
          hasCompletedProfile: true,
        ),
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            routerConfig: testRouter,
          ),
        ),
      );

      // Advance time past the 2700ms reveal timer
      await tester.pump(const Duration(milliseconds: 2800));
      await tester.pumpAndSettle();

      expect(navigatedRoute, equals(AppRoutes.dashboard),
          reason: 'Authenticated user should go directly to dashboard without glimpsing landing page');
    });

    testWidgets('SplashScreen navigates to landing when unauthenticated', (tester) async {
      SharedPreferences.setMockInitialValues({});
      String? navigatedRoute;

      final testRouter = GoRouter(
        initialLocation: AppRoutes.splash,
        routes: [
          GoRoute(
            path: AppRoutes.splash,
            builder: (_, __) => const SplashScreen(),
          ),
          GoRoute(
            path: AppRoutes.landing,
            builder: (_, __) {
              navigatedRoute = AppRoutes.landing;
              return const Scaffold(body: Text('Landing'));
            },
          ),
          GoRoute(
            path: AppRoutes.dashboard,
            builder: (_, __) {
              navigatedRoute = AppRoutes.dashboard;
              return const Scaffold(body: Text('Dashboard'));
            },
          ),
        ],
      );

      final container = ProviderContainer();
      // Ensure unauthenticated state
      container.read(authProvider.notifier).state = const AuthState();

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            routerConfig: testRouter,
          ),
        ),
      );

      // Advance time past the 2700ms reveal timer
      await tester.pump(const Duration(milliseconds: 2800));
      await tester.pumpAndSettle();

      expect(navigatedRoute, equals(AppRoutes.landing),
          reason: 'Unauthenticated user should navigate to landing page');
    });
  });
}
