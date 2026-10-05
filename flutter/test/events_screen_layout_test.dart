import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/core/theme/theme_provider.dart';
import 'package:networklink_ai/core/widgets/section_header.dart';
import 'package:networklink_ai/features/events/presentation/events_screen.dart';
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

  testWidgets('EventsScreen renders without overflow on 360x800 mobile screen', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_buildTestApp(const EventsScreen(), prefs));
    await tester.pumpAndSettle();

    // Verify creator form and elements render without any RenderFlex overflow
    expect(tester.takeException(), isNull);
    expect(find.text('Smart Event Creator'), findsOneWidget);
    expect(find.text('Date'), findsOneWidget);
    expect(find.text('Time Range'), findsOneWidget);
    expect(find.text('Send notification reminder'), findsOneWidget);
    expect(find.text('Sync with Google Calendar'), findsOneWidget);
    expect(find.byType(SectionDivider), findsWidgets);
  });

  testWidgets('EventsScreen renders without overflow on ultra-narrow 320x640 screen', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_buildTestApp(const EventsScreen(), prefs));
    await tester.pumpAndSettle();

    // Verify no overflow on compact/stacked date & time mode
    expect(tester.takeException(), isNull);
    expect(find.text('Smart Event Creator'), findsOneWidget);
    expect(find.text('Date'), findsOneWidget);
    expect(find.text('Time Range'), findsOneWidget);
  });
}

