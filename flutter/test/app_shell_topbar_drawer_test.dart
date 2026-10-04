import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/core/router/app_router.dart';
import 'package:networklink_ai/core/theme/theme_provider.dart';
import 'package:networklink_ai/core/widgets/app_shell.dart';
import 'package:networklink_ai/core/widgets/netlink_logo.dart';
import 'package:networklink_ai/features/network_profile/presentation/network_profile_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Mobile view: topbar renders page title instead of logo; drawer has NetlinkLogo instead of Menu text', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final router = GoRouter(
      initialLocation: AppRoutes.dashboard,
      routes: [
        ShellRoute(
          builder: (context, state, child) => AppShell(child: child),
          routes: [
            GoRoute(
              path: AppRoutes.dashboard,
              builder: (_, __) => const Scaffold(body: Center(child: Text('Dashboard Content'))),
            ),
            GoRoute(
              path: AppRoutes.contacts,
              builder: (_, __) => const Scaffold(body: Center(child: Text('Contacts Content'))),
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: MaterialApp.router(
          routerConfig: router,
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
        ),
      ),
    );
    await tester.pumpAndSettle();

    // 1. In topbar: title "Dashboard" is present with exact headlineMd font size (26) and thickness (w600)
    expect(find.text('Dashboard'), findsOneWidget);
    final dashboardTextWidget = tester.widget<Text>(find.text('Dashboard'));
    expect(dashboardTextWidget.style?.fontSize, equals(26));
    expect(dashboardTextWidget.style?.fontWeight, equals(FontWeight.w600));

    // 2. In topbar: NetlinkLogo should NOT be present in topbar (0 widgets)
    expect(find.byType(NetlinkLogo), findsNothing);

    // 3. Open drawer by tapping the hamburger menu icon
    final menuButton = find.byTooltip('Menu');
    expect(menuButton, findsOneWidget);
    await tester.tap(menuButton);
    await tester.pumpAndSettle();

    // 4. In drawer: "Menu" header text should NOT be present (only drawer nav items or tooltip)
    // The previous header was Text('Menu', style: headlineSm). Now drawer header has NetlinkLogo!
    expect(find.byType(NetlinkLogo), findsOneWidget);

    // Close the drawer
    final closeButton = find.byTooltip('Close');
    expect(closeButton, findsOneWidget);
    await tester.tap(closeButton);
    await tester.pumpAndSettle();

    // 5. Navigate to Contacts and verify topbar updates to "Contacts"
    router.go(AppRoutes.contacts);
    await tester.pumpAndSettle();

    expect(find.text('Contacts'), findsOneWidget);
    expect(find.text('Dashboard'), findsNothing);
  });

  testWidgets('No double heading on mobile: NetworkProfileScreen inside AppShell has only 1 heading in topbar', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final router = GoRouter(
      initialLocation: AppRoutes.profile,
      routes: [
        ShellRoute(
          builder: (context, state, child) => AppShell(child: child),
          routes: [
            GoRoute(
              path: AppRoutes.profile,
              builder: (_, __) => const NetworkProfileScreen(),
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: MaterialApp.router(
          routerConfig: router,
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Verify exactly ONE "Network Profile" text appears (in the topbar), and no second heading below
    expect(find.text('Network Profile'), findsOneWidget);
    final profileTextWidget = tester.widget<Text>(find.text('Network Profile'));
    expect(profileTextWidget.style?.fontSize, equals(26));
    expect(profileTextWidget.style?.fontWeight, equals(FontWeight.w600));
  });
}
