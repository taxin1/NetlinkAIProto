import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/core/services/business_card_scanner_service.dart';
import 'package:networklink_ai/core/theme/theme_provider.dart';
import 'package:networklink_ai/core/widgets/gradient_button.dart';
import 'package:networklink_ai/features/auth/models/auth_models.dart';
import 'package:networklink_ai/features/auth/providers/auth_provider.dart';
import 'package:networklink_ai/features/pricing/presentation/pricing_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _MockAuthNotifier extends AuthNotifier {
  _MockAuthNotifier() : super() {
    state = AuthState(user: AppUser.guest(), isLoading: false);
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('BusinessCardScannerService checkout resolution', () {
    test('webBaseUrl falls back to production domain when apiBaseUrl is localhost', () {
      BusinessCardScannerService.apiBaseUrl = 'http://localhost:3000';
      expect(BusinessCardScannerService.webBaseUrl, 'https://www.networklinkai.com');
      expect(
        BusinessCardScannerService.checkoutUri.toString(),
        'https://www.networklinkai.com/checkout?plan=professional',
      );
    });

    test('webBaseUrl respects custom production or staging URL', () {
      BusinessCardScannerService.apiBaseUrl = 'https://staging.networklinkai.com';
      expect(BusinessCardScannerService.webBaseUrl, 'https://staging.networklinkai.com');
      expect(
        BusinessCardScannerService.checkoutUri.toString(),
        'https://staging.networklinkai.com/checkout?plan=professional',
      );
      // Reset
      BusinessCardScannerService.apiBaseUrl = '';
    });
  });

  group('PricingScreen Upgrade Now button tests', () {
    Widget buildPricingApp(SharedPreferences prefs) {
      return ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          authProvider.overrideWith((ref) => _MockAuthNotifier()),
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
          home: PricingScreen(),
        ),
      );
    }

    testWidgets('PricingScreen renders Professional card and Upgrade Now button', (tester) async {
      final prefs = await SharedPreferences.getInstance();
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildPricingApp(prefs));
      await tester.pumpAndSettle();

      // Verify the Upgrade Now button exists
      final upgradeButtonFinder = find.widgetWithText(GradientButton, 'Upgrade Now');
      expect(upgradeButtonFinder, findsOneWidget);

      // Verify quotation screen text is NOT present
      expect(find.text('AI Quotation Builder'), findsNothing);
      expect(find.text('Scope & Requirements'), findsNothing);

      // Ensure visible and tap Upgrade Now button
      await tester.ensureVisible(upgradeButtonFinder);
      await tester.pumpAndSettle();
      await tester.tap(upgradeButtonFinder, warnIfMissed: false);
      await tester.pumpAndSettle();

      // Verify we are still on the pricing screen and quotation screen was NOT pushed
      expect(find.text('AI Quotation Builder'), findsNothing);
      expect(upgradeButtonFinder, findsOneWidget);
    });
  });
}
