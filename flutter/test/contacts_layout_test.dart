import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/theme/theme_provider.dart';
import 'package:networklink_ai/features/contacts/presentation/contacts_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('Test ContactsScreen rendering', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: const MaterialApp(
          home: Scaffold(
            body: ContactsScreen(),
          ),
        ),
      ),
    );

    // Let any initial frame and stagger timers complete
    await tester.pump(const Duration(milliseconds: 500));
  });
}

