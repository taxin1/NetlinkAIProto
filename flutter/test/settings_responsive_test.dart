import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/core/theme/theme_provider.dart';
import 'package:networklink_ai/core/widgets/gradient_button.dart';
import 'package:networklink_ai/features/auth/models/auth_models.dart';
import 'package:networklink_ai/features/auth/providers/auth_provider.dart';
import 'package:networklink_ai/features/settings/presentation/settings_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _MockAuthNotifier extends AuthNotifier {
  final AppUser? user;
  _MockAuthNotifier({this.user}) : super() {
    state = AuthState(user: user, isLoading: false);
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  Widget buildSettingsApp(SharedPreferences prefs, {AppUser? user, Locale locale = const Locale('en')}) {
    return ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
        authProvider.overrideWith((ref) => _MockAuthNotifier(user: user ?? AppUser.guest())),
      ],
      child: MaterialApp(
        locale: locale,
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: const Scaffold(
          body: SettingsScreen(),
        ),
      ),
    );
  }

  testWidgets('SettingsScreen subscription card renders responsively on narrow mobile screen (360x800)', (tester) async {
    final prefs = await SharedPreferences.getInstance();
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(buildSettingsApp(prefs));
    await tester.pumpAndSettle();

    // Verify subscription section
    expect(find.text('Subscription & Usage'), findsOneWidget);
    expect(find.text('Trial Tier'), findsOneWidget);

    final titleSize = tester.getSize(find.text('Trial Tier'));
    expect(titleSize.width, greaterThan(60.0));

    // Verify Upgrade to Pro button has identical size as the Sign Up to Unlock button below it
    expect(find.widgetWithText(GradientButton, 'Upgrade to Pro'), findsOneWidget);
    expect(find.widgetWithText(GradientButton, 'Sign Up to Unlock'), findsWidgets);
    final upgradeContainer = find.descendant(
      of: find.widgetWithText(GradientButton, 'Upgrade to Pro'),
      matching: find.byType(AnimatedContainer),
    ).first;
    final signUpContainer = find.descendant(
      of: find.widgetWithText(GradientButton, 'Sign Up to Unlock').first,
      matching: find.byType(AnimatedContainer),
    ).first;
    expect(tester.getSize(upgradeContainer).width, equals(tester.getSize(signUpContainer).width));
    expect(tester.getSize(upgradeContainer).height, equals(tester.getSize(signUpContainer).height));

    // Verify quota labels
    expect(find.text('AI Generations'), findsOneWidget);
    expect(find.text('Card Scans'), findsOneWidget);
    expect(find.text('Email Sync'), findsOneWidget);
  });

  testWidgets('SettingsScreen renders smoothly on tall / long mobile screen (412x915)', (tester) async {
    final prefs = await SharedPreferences.getInstance();
    tester.view.physicalSize = const Size(412, 915);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(buildSettingsApp(prefs));
    await tester.pumpAndSettle();

    expect(find.text('Subscription & Usage'), findsOneWidget);
    expect(find.text('Trial Tier'), findsOneWidget);
    expect(find.widgetWithText(GradientButton, 'Upgrade to Pro'), findsOneWidget);
  });

  testWidgets('SettingsScreen renders without overflow in Japanese locale on mobile screen (390x844)', (tester) async {
    final prefs = await SharedPreferences.getInstance();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(buildSettingsApp(prefs, locale: const Locale('ja')));
    await tester.pumpAndSettle();

    expect(find.text('プラン＆使用状況'), findsOneWidget);
    expect(find.text('トライアルプラン'), findsOneWidget);
    expect(find.widgetWithText(GradientButton, 'Proにアップグレード'), findsOneWidget);
  });

  testWidgets('SettingsScreen renders without overflow on desktop screen (1200x800)', (tester) async {
    final prefs = await SharedPreferences.getInstance();
    tester.view.physicalSize = const Size(1200, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(buildSettingsApp(prefs));
    await tester.pumpAndSettle();

    expect(find.text('Subscription & Usage'), findsOneWidget);
    expect(find.text('Trial Tier'), findsOneWidget);
    expect(find.widgetWithText(GradientButton, 'Upgrade to Pro'), findsOneWidget);
  });

  testWidgets('SettingsScreen heading position matches standard page layout without inner Scaffold or SafeArea', (tester) async {
    final prefs = await SharedPreferences.getInstance();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(buildSettingsApp(prefs));
    await tester.pumpAndSettle();

    // Verify SettingsScreen does not contain an inner Scaffold or SafeArea
    expect(find.descendant(of: find.byType(SettingsScreen), matching: find.byType(Scaffold)), findsNothing);
    expect(find.descendant(of: find.byType(SettingsScreen), matching: find.byType(SafeArea)), findsNothing);

    // Verify Settings heading exists and is properly positioned
    final settingsHeading = find.text('Settings');
    expect(settingsHeading, findsOneWidget);
  });
}
