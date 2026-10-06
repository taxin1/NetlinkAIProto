import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/core/widgets/app_modal_dialog.dart';

void main() {
  testWidgets('AppModalDialog dismissal does not pop nested ShellRoute Navigator screen', (tester) async {
    bool onPrimaryCalled = false;

    // Simulate nested Navigator (like ShellRoute / StatefulShellRoute)
    await tester.pumpWidget(
      MaterialApp(
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: Scaffold(
          body: Navigator(
            onGenerateRoute: (settings) {
              return MaterialPageRoute(
                builder: (nestedContext) {
                  return Scaffold(
                    body: Builder(
                      builder: (screenContext) {
                        return Center(
                          child: ElevatedButton(
                            onPressed: () {
                              AppModalDialog.show(
                                context: screenContext,
                                title: 'Disconnect Google Calendar',
                                message: 'Are you sure you want to disconnect?',
                                primaryLabel: 'Disconnect',
                                secondaryLabel: 'Cancel',
                                onPrimary: () {
                                  Navigator.of(screenContext, rootNavigator: true).pop();
                                  onPrimaryCalled = true;
                                },
                              );
                            },
                            child: const Text('Open Modal'),
                          ),
                        );
                      },
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );

    // Initial state: screen is present
    expect(find.text('Open Modal'), findsOneWidget);

    // Open modal
    await tester.tap(find.text('Open Modal'));
    await tester.pumpAndSettle();

    expect(find.text('Disconnect Google Calendar'), findsOneWidget);
    expect(find.text('Disconnect'), findsWidgets);

    // Tap primary button ('Disconnect')
    final disconnectBtn = find.widgetWithText(ModalPrimaryButton, 'Disconnect');
    expect(disconnectBtn, findsOneWidget);
    await tester.tap(disconnectBtn);
    await tester.pumpAndSettle();

    // The primary action was executed
    expect(onPrimaryCalled, isTrue);

    // The modal is closed
    expect(find.text('Disconnect Google Calendar'), findsNothing);

    // Crucially: The nested screen is STILL MOUNTED and visible (did not become black screen)
    expect(find.text('Open Modal'), findsOneWidget);
  });

  testWidgets('AppModalDialog secondary cancel does not pop nested ShellRoute Navigator screen', (tester) async {
    // Simulate nested Navigator
    await tester.pumpWidget(
      MaterialApp(
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: Scaffold(
          body: Navigator(
            onGenerateRoute: (settings) {
              return MaterialPageRoute(
                builder: (nestedContext) {
                  return Scaffold(
                    body: Builder(
                      builder: (screenContext) {
                        return Center(
                          child: ElevatedButton(
                            onPressed: () {
                              AppModalDialog.show(
                                context: screenContext,
                                title: 'Disconnect Google Calendar',
                                message: 'Are you sure you want to disconnect?',
                                primaryLabel: 'Disconnect',
                                secondaryLabel: 'Cancel',
                                onSecondary: () => Navigator.of(screenContext, rootNavigator: true).pop(),
                              );
                            },
                            child: const Text('Open Modal'),
                          ),
                        );
                      },
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );

    await tester.tap(find.text('Open Modal'));
    await tester.pumpAndSettle();

    expect(find.text('Disconnect Google Calendar'), findsOneWidget);

    // Tap secondary Cancel button
    final cancelBtn = find.widgetWithText(ModalSecondaryButton, 'Cancel');
    expect(cancelBtn, findsOneWidget);
    await tester.tap(cancelBtn);
    await tester.pumpAndSettle();

    // The modal is closed
    expect(find.text('Disconnect Google Calendar'), findsNothing);

    // The nested screen is STILL MOUNTED
    expect(find.text('Open Modal'), findsOneWidget);
  });
}

