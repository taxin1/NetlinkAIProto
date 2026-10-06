import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/core/theme/theme_provider.dart';
import 'package:networklink_ai/core/tour/tour_controller.dart';
import 'package:networklink_ai/features/calendar/presentation/calendar_screen.dart';
import 'package:networklink_ai/features/portfolio/presentation/portfolio_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

Widget _buildTestApp(Widget child, SharedPreferences prefs) {
  return ProviderScope(
    overrides: [
      sharedPreferencesProvider.overrideWithValue(prefs),
    ],
    child: MaterialApp(
      locale: const Locale('en'),
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: Scaffold(
        body: child,
      ),
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('CalendarScreen mounts TourTargetKeys.calendarFeature on monthly schedule card',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_buildTestApp(const CalendarScreen(), prefs));
    await tester.pumpAndSettle();

    expect(find.byKey(TourTargetKeys.calendarFeature), findsOneWidget);
    expect(TourTargetKeys.calendarFeature.currentContext, isNotNull);
    expect(tester.takeException(), isNull);
  });

  testWidgets('PortfolioScreen mounts TourTargetKeys.portfolioFeature on AI generator card',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_buildTestApp(const PortfolioScreen(), prefs));
    await tester.pumpAndSettle();

    expect(find.byKey(TourTargetKeys.portfolioFeature), findsOneWidget);
    expect(TourTargetKeys.portfolioFeature.currentContext, isNotNull);
    expect(tester.takeException(), isNull);
  });
}

