import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/core/router/app_router.dart';
import 'package:networklink_ai/core/theme/theme_provider.dart';
import 'package:networklink_ai/core/widgets/app_shell.dart';
import 'package:networklink_ai/core/widgets/section_header.dart';
import 'package:networklink_ai/features/calendar/presentation/calendar_screen.dart';
import 'package:networklink_ai/features/calendar/providers/calendar_provider.dart';
import 'package:networklink_ai/features/settings/presentation/settings_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Calendar screen renders without overflow on 360x800 mobile screen', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: MaterialApp(
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: const Scaffold(
            body: CalendarScreen(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Verify there are no overflow errors
    expect(tester.takeException(), isNull);

    // Verify connection warning banner (slim alert)
    expect(
      find.text('Google Calendar is not connected. Go to Settings > Integrations to sync.'),
      findsOneWidget,
    );
    expect(find.text('Connect'), findsOneWidget);

    // Verify bulky status indicators are NOT present
    expect(find.text('Not Connected'), findsNothing);
    expect(
      find.textContaining('Connect in Settings > Integrations to seamlessly sync with Google Calendar'),
      findsNothing,
    );
  });

  testWidgets('Connect button redirects to Settings integrations section and updates AppShell', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final router = GoRouter(
      initialLocation: AppRoutes.calendar,
      routes: [
        ShellRoute(
          builder: (context, state, child) => AppShell(child: child),
          routes: [
            GoRoute(
              path: AppRoutes.calendar,
              builder: (_, __) => const CalendarScreen(),
            ),
            GoRoute(
              path: AppRoutes.settings,
              builder: (_, state) => SettingsScreen(
                initialSection: state.uri.queryParameters['section'] ?? (state.extra as String?),
              ),
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

    // Topbar displays Calendar
    expect(find.text('Calendar'), findsOneWidget);

    // Find and tap the "Connect" button in the status card
    final connectButton = find.text('Connect');
    expect(connectButton, findsOneWidget);
    await tester.tap(connectButton);
    await tester.pumpAndSettle();

    // After redirection:
    // 1. Top bar title should resolve to "Settings", NOT "Calendar" or fallback "Dashboard"
    expect(find.text('Settings'), findsWidgets);

    // 2. Settings screen should have "Integrations" selected/active
    expect(find.text('Integrations'), findsWidgets);

    // 3. Open drawer to ensure it does not stay at Calendar
    final menuButton = find.byTooltip('Menu');
    await tester.tap(menuButton);
    await tester.pumpAndSettle();

    // Verify there are no errors
    expect(tester.takeException(), isNull);
  });

  testWidgets('When Google Calendar is connected, shows no signs or indicators', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          calendarNotifierProvider.overrideWith((ref) => FakeConnectedCalendarNotifier(ref)),
        ],
        child: MaterialApp(
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: const Scaffold(
            body: CalendarScreen(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Verify no warning banner or connect link is shown
    expect(
      find.text('Google Calendar is not connected. Go to Settings > Integrations to sync.'),
      findsNothing,
    );
    expect(find.text('Connect'), findsNothing);
    expect(find.text('Connected'), findsNothing);
    expect(find.text('Not Connected'), findsNothing);

    // Verify SectionDivider is rendered on Calendar screen
    expect(find.byType(SectionDivider), findsOneWidget);
  });

  testWidgets('Add Event modal renders without overflow on 360x800 mobile screen', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: MaterialApp(
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: const Scaffold(
            body: CalendarScreen(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Tap the "Schedule Event" button to open the bottom sheet modal
    final scheduleBtn = find.text('Schedule Event');
    expect(scheduleBtn, findsOneWidget);
    await tester.tap(scheduleBtn);
    await tester.pumpAndSettle();

    // Verify modal is open and has Date and Time Range rendered without any overflow exception
    expect(find.text('Schedule New Event'), findsOneWidget);
    expect(find.text('Date'), findsOneWidget);
    expect(find.text('Time Range'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

class FakeConnectedCalendarNotifier extends CalendarNotifier {
  FakeConnectedCalendarNotifier(super.ref) {
    state = state.copyWith(
      isGoogleCalendarConnected: true,
      googleCalendarEmail: 'user@example.com',
    );
  }
}
