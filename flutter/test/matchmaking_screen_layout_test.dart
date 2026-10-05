import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/core/theme/theme_provider.dart';
import 'package:networklink_ai/features/matchmaking/presentation/event_matchmaking_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('EventMatchmakingScreen renders without overflow on 360x800 mobile screen', (tester) async {
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
        child: const MaterialApp(
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: Scaffold(
            body: EventMatchmakingScreen(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);

    // Verify analytics-style typography for match percentage
    expect(find.text('98%'), findsWidgets);

    // Scroll until the first Details button is visible
    final detailsButtons = find.text('Details');
    await tester.scrollUntilVisible(
      detailsButtons.first,
      200.0,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();

    FlutterErrorDetails? errorDetails;
    final origOnError = FlutterError.onError;
    FlutterError.onError = (details) {
      errorDetails = details;
    };
    try {
      await tester.tap(detailsButtons.first);
      await tester.pumpAndSettle();
    } finally {
      FlutterError.onError = origOnError;
    }
    expect(errorDetails, isNull);
    expect(find.text('WHY NETLINK AI MATCHED YOU'), findsOneWidget);
    expect(find.text('SEEKING'), findsOneWidget);
    expect(find.text('OFFERING'), findsOneWidget);

    // Close the dialog
    final closeButton = find.byIcon(Icons.close_rounded);
    expect(closeButton, findsOneWidget);
    await tester.tap(closeButton);
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
  });

  testWidgets('Scheduled meetups section renders without overflow on 360x800 screen', (tester) async {
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
        child: const MaterialApp(
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: Scaffold(
            body: EventMatchmakingScreen(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Scroll to the Scheduled meetups section
    final scheduledHeader = find.text('Your Scheduled Event Meetups');
    await tester.scrollUntilVisible(
      scheduledHeader,
      300.0,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(scheduledHeader, findsOneWidget);
    expect(find.text('Active'), findsWidgets);
  });
}
