import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/theme/theme_provider.dart';
import 'package:networklink_ai/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: const NetworkLinkApp(),
      ),
    );

    // Let splash screen timers and landing page stagger timers complete
    await tester.pump(const Duration(seconds: 4));
    await tester.pump(const Duration(seconds: 2));
  });
}

