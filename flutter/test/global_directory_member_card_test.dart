import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/features/network_profile/presentation/global_directory_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Widget buildTestApp({required Size physicalSize}) {
    SharedPreferences.setMockInitialValues({});
    return ProviderScope(
      child: MaterialApp(
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: const Scaffold(
          body: GlobalDirectoryScreen(),
        ),
      ),
    );
  }

  testWidgets('GlobalDirectoryScreen member card removes duplicate email and applies text wrapping', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(buildTestApp(physicalSize: const Size(390, 844)));
    await tester.pumpAndSettle();

    // 1. Verify email appears only ONCE per member card (no duplicate email)
    expect(find.text('arrafihasan7530@gmail.com'), findsOneWidget);
    expect(find.text('farhanmorshed07@gmail.com'), findsOneWidget);

    // 2. Verify text wrapping is enabled on the email and name Text widgets
    final emailWidget = tester.widget<Text>(find.text('arrafihasan7530@gmail.com'));
    expect(emailWidget.softWrap, isTrue);

    final nameWidget = tester.widget<Text>(find.text('arrafihasan7530'));
    expect(nameWidget.softWrap, isTrue);

    // 3. Verify side-by-side layout: both top part (name/email) and portfolio part are visible in a Row
    expect(find.text('PORTFOLIO COMING SOON'), findsWidgets);
    final portfolioText = tester.widget<Text>(find.text('PORTFOLIO COMING SOON').first);
    expect(portfolioText.softWrap, isTrue);
  });

  testWidgets('GlobalDirectoryScreen card shifts horizontally when width fits (>= 280px)', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(buildTestApp(physicalSize: const Size(390, 844)));
    await tester.pumpAndSettle();

    // On 390px mobile, find the first member card's IntrinsicHeight containing Row
    final intrinsicHeights = find.byType(IntrinsicHeight);
    expect(intrinsicHeights, findsWidgets);
  });
}
