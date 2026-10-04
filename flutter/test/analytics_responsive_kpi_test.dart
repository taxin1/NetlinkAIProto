import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/features/analytics/presentation/analytics_screen.dart';
import 'package:networklink_ai/features/analytics/providers/analytics_provider.dart';
import 'package:networklink_ai/features/analytics/services/analytics_service.dart';
import 'package:networklink_ai/features/auth/models/auth_models.dart';
import 'package:networklink_ai/features/auth/providers/auth_provider.dart';

class _FakeAuthNotifier extends AuthNotifier {
  final AppUser? mockUser;
  _FakeAuthNotifier({this.mockUser}) : super() {
    state = AuthState(user: mockUser, isLoading: false);
  }
}

class _FakeAnalyticsNotifier extends StateNotifier<AnalyticsState> implements AnalyticsNotifier {
  _FakeAnalyticsNotifier(AnalyticsData data)
      : super(AnalyticsState(data: data, isLoading: false));

  @override
  Future<void> loadAnalytics() async {}

  @override
  Future<void> setTimeframe(String timeframe) async {
    state = state.copyWith(timeframe: timeframe);
  }
}

void main() {
  testWidgets('AnalyticsScreen KPI overview cards and pills fit properly on narrow 360x800 mobile screen',
      (tester) async {
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final mockData = AnalyticsData.mockPreview(timeframe: '30d');

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((ref) => _FakeAuthNotifier(mockUser: AppUser.guest())),
          analyticsProvider.overrideWith((ref) => _FakeAnalyticsNotifier(mockData)),
        ],
        child: const MaterialApp(
          locale: Locale('en'),
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: Scaffold(
            body: AnalyticsScreen(),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verify KPI overview cards render
    expect(find.text('Profile Impressions'), findsOneWidget);
    expect(find.text('Active Connections'), findsOneWidget);
    expect(find.text('Cold Outreach Response'), findsOneWidget);
    expect(find.text('Meetings Scheduled'), findsOneWidget);

    // Verify dynamic pills are rendered with concise formatted values
    expect(find.text('+18.4%'), findsOneWidget);
    expect(find.text('+24 new'), findsOneWidget);
    expect(find.text('+4.2%'), findsOneWidget);
    expect(find.text('+6 booked'), findsOneWidget);

    // Verify zero render overflows occurred
    expect(tester.takeException(), isNull);
  });

  testWidgets('AnalyticsScreen empty state does not render fake pills for real users',
      (tester) async {
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final emptyData = AnalyticsData.empty();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((ref) => _FakeAuthNotifier(
                mockUser: const AppUser(
                  id: 'real_user_empty',
                  email: 'test@example.com',
                  name: 'Empty User',
                ),
              )),
          analyticsProvider.overrideWith((ref) => _FakeAnalyticsNotifier(emptyData)),
        ],
        child: const MaterialApp(
          locale: Locale('en'),
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: Scaffold(
            body: AnalyticsScreen(),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Fake slogans should NOT exist
    expect(find.text('2.6x Industry Avg'), findsNothing);
    expect(find.text('82% Conversion'), findsNothing);
    expect(find.text('+18.4%'), findsNothing);
    expect(find.text('+24 new'), findsNothing);

    // Zero-state values should render cleanly
    expect(find.text('0'), findsWidgets);
    expect(tester.takeException(), isNull);
  });
}
