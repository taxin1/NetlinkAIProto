import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/features/dashboard/models/dashboard_models.dart';
import 'package:networklink_ai/features/dashboard/presentation/widgets/dashboard_stats_section.dart';

void main() {
  Widget buildTestWidget({
    required DashboardData data,
    VoidCallback? onContactsTap,
    VoidCallback? onEmailsTap,
    VoidCallback? onEventsTap,
    VoidCallback? onGrowthTap,
    Locale locale = const Locale('en'),
  }) {
    return MaterialApp(
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: Scaffold(
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: DashboardStatsSection(
              data: data,
              onContactsTap: onContactsTap ?? () {},
              onEmailsTap: onEmailsTap ?? () {},
              onEventsTap: onEventsTap ?? () {},
              onGrowthTap: onGrowthTap ?? () {},
            ),
          ),
        ),
      ),
    );
  }

  testWidgets('DashboardStatsSection renders graphical network growth card and 3 stat cards on desktop', (tester) async {
    tester.view.physicalSize = const Size(1200, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    bool contactsTapped = false;
    bool emailsTapped = false;
    bool eventsTapped = false;
    bool growthTapped = false;

    const testData = DashboardData(
      totalContacts: 142,
      emailsSent: 35,
      upcomingEvents: 4,
      networkGrowth: 12,
      weeklyGrowthPoints: [1, 0, 2, 3, 1, 2, 3],
    );

    await tester.pumpWidget(buildTestWidget(
      data: testData,
      onContactsTap: () => contactsTapped = true,
      onEmailsTap: () => emailsTapped = true,
      onEventsTap: () => eventsTapped = true,
      onGrowthTap: () => growthTapped = true,
    ));
    await tester.pumpAndSettle();

    // Verify Network Growth card
    expect(find.text('Network Growth'), findsOneWidget);
    expect(find.text('+12'), findsOneWidget);
    expect(find.text('Last 7 days'), findsOneWidget);

    // Verify 3 side cards stacked top to bottom
    expect(find.text('Total Contacts'), findsOneWidget);
    expect(find.text('142'), findsOneWidget);

    expect(find.text('Emails Sent'), findsOneWidget);
    expect(find.text('35'), findsOneWidget);

    expect(find.text('Upcoming Events'), findsOneWidget);
    expect(find.text('4'), findsOneWidget);

    // Tap arrow buttons and analytics button and verify callbacks
    await tester.tap(find.byTooltip('Total Contacts'));
    expect(contactsTapped, isTrue);

    await tester.tap(find.byTooltip('Emails Sent'));
    expect(emailsTapped, isTrue);

    await tester.tap(find.byTooltip('Upcoming Events'));
    expect(eventsTapped, isTrue);

    await tester.tap(find.text('Analytics'));
    expect(growthTapped, isTrue);
  });

  testWidgets('DashboardStatsSection renders on mobile without overflow', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    const testData = DashboardData(
      totalContacts: 0,
      emailsSent: 0,
      upcomingEvents: 0,
      networkGrowth: 0,
      weeklyGrowthPoints: [0, 0, 0, 0, 0, 0, 0],
    );

    await tester.pumpWidget(buildTestWidget(data: testData));
    await tester.pumpAndSettle();

    expect(find.text('Network Growth'), findsOneWidget);
    expect(find.text('+0'), findsOneWidget);
    expect(find.text('Total Contacts'), findsOneWidget);
    expect(find.text('Emails Sent'), findsOneWidget);
    expect(find.text('Upcoming Events'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('DashboardStatsSection renders in Japanese locale without errors', (tester) async {
    tester.view.physicalSize = const Size(414, 896);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    const testData = DashboardData(
      totalContacts: 10,
      emailsSent: 5,
      upcomingEvents: 2,
      networkGrowth: 3,
      weeklyGrowthPoints: [0, 1, 0, 1, 0, 0, 1],
    );

    await tester.pumpWidget(buildTestWidget(
      data: testData,
      locale: const Locale('ja'),
    ));
    await tester.pumpAndSettle();

    expect(find.text('+3'), findsOneWidget);
    expect(find.text('10'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Network growth chart shows day-wise data immediately on click/tap', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    const testData = DashboardData(
      totalContacts: 10,
      emailsSent: 5,
      upcomingEvents: 2,
      networkGrowth: 15,
      weeklyGrowthPoints: [1, 2, 3, 4, 5, 6, 7],
    );

    await tester.pumpWidget(buildTestWidget(data: testData));
    await tester.pumpAndSettle();

    // Default subtitle is "this week"
    expect(find.text('this week'), findsOneWidget);

    // Find chart GestureDetector by key
    final chartFinder = find.byKey(const ValueKey('network_growth_chart_gesture'));
    expect(chartFinder, findsOneWidget);

    // Tap on the left side of the chart (around day 0)
    final chartRect = tester.getRect(chartFinder);
    await tester.tapAt(Offset(chartRect.left + 5, chartRect.center.dy));
    await tester.pumpAndSettle();

    // Day-wise data appears immediately without dragging!
    expect(find.text('this week'), findsNothing);
    expect(find.textContaining(' on '), findsOneWidget);

    // Tap again to toggle back to "this week"
    await tester.tapAt(Offset(chartRect.left + 5, chartRect.center.dy));
    await tester.pumpAndSettle();
    expect(find.text('this week'), findsOneWidget);
  });

  testWidgets('Tapping day labels at the bottom selects and displays day data', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    const testData = DashboardData(
      totalContacts: 10,
      emailsSent: 5,
      upcomingEvents: 2,
      networkGrowth: 15,
      weeklyGrowthPoints: [10, 20, 30, 40, 50, 60, 70],
    );

    await tester.pumpWidget(buildTestWidget(data: testData));
    await tester.pumpAndSettle();

    expect(find.text('this week'), findsOneWidget);

    // Day label for first of 7 days
    final now = DateTime.now();
    final firstDay = now.subtract(const Duration(days: 6));
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final firstDayLabel = days[(firstDay.weekday - 1) % 7];

    await tester.tap(find.text(firstDayLabel).first);
    await tester.pumpAndSettle();

    expect(find.text('this week'), findsNothing);
    expect(find.text('+10 on $firstDayLabel'), findsOneWidget);

    // Tap the same day label to toggle off
    await tester.tap(find.text(firstDayLabel).first);
    await tester.pumpAndSettle();
    expect(find.text('this week'), findsOneWidget);
  });

  testWidgets('Dragging across chart updates day-wise data continuously', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    const testData = DashboardData(
      totalContacts: 10,
      emailsSent: 5,
      upcomingEvents: 2,
      networkGrowth: 15,
      weeklyGrowthPoints: [10, 20, 30, 40, 50, 60, 70],
    );

    await tester.pumpWidget(buildTestWidget(data: testData));
    await tester.pumpAndSettle();

    final chartFinder = find.byKey(const ValueKey('network_growth_chart_gesture'));
    final chartRect = tester.getRect(chartFinder);

    // Pan from left (day 0) to right (day 6)
    final gesture = await tester.startGesture(Offset(chartRect.left + 5, chartRect.center.dy));
    await tester.pumpAndSettle();

    // Day 0 data shows on start
    expect(find.textContaining(' on '), findsOneWidget);

    // Drag to center
    await gesture.moveTo(Offset(chartRect.center.dx, chartRect.center.dy));
    await tester.pumpAndSettle();
    expect(find.textContaining(' on '), findsOneWidget);

    // Release at center
    await gesture.up();
    await tester.pumpAndSettle();

    // Data remains visible after drag release
    expect(find.textContaining(' on '), findsOneWidget);
  });
}
