import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/core/widgets/app_modal_dialog.dart';

void main() {
  Widget buildTestApp({
    Locale locale = const Locale('en'),
    required VoidCallback onConfirm,
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
        body: Builder(
          builder: (context) => ElevatedButton(
            onPressed: () {
              AppModalDialog.showSignOutConfirmation(
                context,
                onConfirm: onConfirm,
              );
            },
            child: const Text('Open Sign Out'),
          ),
        ),
      ),
    );
  }

  testWidgets('Sign out dialog shows confirmation and calls onConfirm when confirmed', (tester) async {
    bool confirmed = false;

    await tester.pumpWidget(buildTestApp(onConfirm: () => confirmed = true));

    // Tap button to open confirmation dialog
    await tester.tap(find.text('Open Sign Out'));
    await tester.pumpAndSettle();

    // Verify dialog contents
    expect(find.text('Sign Out'), findsWidgets);
    expect(find.text('Are you sure you want to sign out?'), findsOneWidget);
    expect(find.text('Cancel'), findsOneWidget);

    // Tap Sign out button inside dialog
    // Find the ModalPrimaryButton containing 'Sign out'
    final primaryButton = find.widgetWithText(ModalPrimaryButton, 'Sign out');
    expect(primaryButton, findsOneWidget);
    await tester.tap(primaryButton);
    await tester.pumpAndSettle();

    // Dialog closed and onConfirm called
    expect(confirmed, isTrue);
    expect(find.text('Are you sure you want to sign out?'), findsNothing);
  });

  testWidgets('Sign out dialog cancels and does not call onConfirm when Cancel tapped', (tester) async {
    bool confirmed = false;

    await tester.pumpWidget(buildTestApp(onConfirm: () => confirmed = true));

    await tester.tap(find.text('Open Sign Out'));
    await tester.pumpAndSettle();

    expect(find.text('Are you sure you want to sign out?'), findsOneWidget);

    // Tap Cancel
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();

    expect(confirmed, isFalse);
    expect(find.text('Are you sure you want to sign out?'), findsNothing);
  });

  testWidgets('Sign out dialog translates into Japanese', (tester) async {
    await tester.pumpWidget(
      buildTestApp(
        locale: const Locale('ja'),
        onConfirm: () {},
      ),
    );

    await tester.tap(find.text('Open Sign Out'));
    await tester.pumpAndSettle();

    expect(find.text('サインアウト'), findsWidgets);
    expect(find.text('サインアウトしてもよろしいですか？'), findsOneWidget);
    expect(find.text('キャンセル'), findsOneWidget);
  });
}
