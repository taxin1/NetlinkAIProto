import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/core/theme/theme_provider.dart';
import 'package:networklink_ai/core/widgets/section_header.dart';
import 'package:networklink_ai/features/events/presentation/events_screen.dart';
import 'package:networklink_ai/features/campaigns/presentation/campaigns_screen.dart';
import 'package:networklink_ai/features/quotation/presentation/quotation_screen.dart';
import 'package:networklink_ai/features/matchmaking/presentation/event_matchmaking_screen.dart';
import 'package:networklink_ai/features/networking_mode/presentation/networking_mode_screen.dart';
import 'package:networklink_ai/features/pricing/presentation/pricing_screen.dart';
import 'package:networklink_ai/features/portfolio/presentation/portfolio_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

Widget _buildTestApp(Widget child, SharedPreferences prefs) {
  return ProviderScope(
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
      home: Scaffold(
        body: child,
      ),
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('EventsScreen renders SectionDivider between creator and your events', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(800, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_buildTestApp(const EventsScreen(), prefs));
    await tester.pumpAndSettle();

    expect(find.byType(SectionDivider), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('CampaignsScreen renders SectionDivider between campaign sections', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(800, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_buildTestApp(const CampaignsScreen(), prefs));
    await tester.pumpAndSettle();

    expect(find.byType(SectionDivider), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('QuotationScreen renders SectionDividers between major sections', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(800, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_buildTestApp(const QuotationScreen(), prefs));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(SectionDivider), findsNWidgets(2));
    expect(tester.takeException(), isNull);
  });

  testWidgets('EventMatchmakingScreen renders SectionDividers between major sections', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(800, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_buildTestApp(const EventMatchmakingScreen(), prefs));
    await tester.pumpAndSettle();

    expect(find.byType(SectionDivider), findsNWidgets(2));
    expect(tester.takeException(), isNull);
  });

  testWidgets('NetworkingModeScreen renders SectionDividers between major sections', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(800, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_buildTestApp(const NetworkingModeScreen(), prefs));
    await tester.pumpAndSettle();

    expect(find.byType(SectionDivider), findsNWidgets(3));
    expect(tester.takeException(), isNull);
  });

  testWidgets('PricingScreen renders SectionDividers between major sections', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(800, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_buildTestApp(const PricingScreen(), prefs));
    await tester.pumpAndSettle();

    expect(find.byType(SectionDivider), findsNWidgets(3));
    expect(tester.takeException(), isNull);
  });

  testWidgets('PortfolioScreen renders SectionDividers between major sections', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(800, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_buildTestApp(const PortfolioScreen(), prefs));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(SectionDivider), findsNWidgets(3));
    expect(tester.takeException(), isNull);
  });
}
