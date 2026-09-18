import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';
import 'package:networklink_ai/core/localization/locale_provider.dart';
import 'package:networklink_ai/core/theme/theme_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('AppLocalizations & LocaleProvider Tests', () {
    test('English translations match web translations', () {
      final loc = AppLocalizations(const Locale('en'));

      expect(loc.dashboard, 'Dashboard');
      expect(loc.contacts, 'Contacts');
      expect(loc.events, 'Events');
      expect(loc.emails, 'Emails');
      expect(loc.eventMatchmaking, 'AI Matchmaking');
      expect(loc.portfolio, 'Portfolio');
      expect(loc.settings, 'Settings');
      expect(loc.saveSettings, 'Save Settings');
      expect(loc.scanBusinessCard, 'Scan Business Card');
    });

    test('Japanese translations match web translations.ts lexicon', () {
      final loc = AppLocalizations(const Locale('ja'));

      expect(loc.dashboard, 'ダッシュボード');
      expect(loc.contacts, '連絡先');
      expect(loc.events, 'イベント');
      expect(loc.emails, 'メール');
      expect(loc.eventMatchmaking, 'AIマッチング');
      expect(loc.portfolio, 'ポートフォリオ');
      expect(loc.settings, '設定');
      expect(loc.saveSettings, '設定を保存');
      expect(loc.scanBusinessCard, '名刺をスキャン');
    });

    test('LocaleNotifier switches and persists language', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      final notifier = LocaleNotifier(prefs);
      expect(notifier.state.languageCode, 'en');

      await notifier.setLocale(const Locale('ja'));
      expect(notifier.state.languageCode, 'ja');
      expect(notifier.isJapanese, isTrue);
      expect(prefs.getString('app_locale_code'), 'ja');

      await notifier.toggleLanguage();
      expect(notifier.state.languageCode, 'en');
      expect(notifier.isJapanese, isFalse);
      expect(prefs.getString('app_locale_code'), 'en');
    });

    testWidgets('Landing and Settings language providers remain synchronized', (tester) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sharedPreferencesProvider.overrideWithValue(prefs),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: Consumer(
                builder: (context, ref, child) {
                  final currentLocale = ref.watch(localeProvider);
                  final isJp = currentLocale.languageCode == 'ja';
                  return Column(
                    children: [
                      Text(isJp ? 'Japanese Active' : 'English Active'),
                      ElevatedButton(
                        key: const Key('toggle_button'),
                        onPressed: () {
                          ref.read(localeProvider.notifier).toggleLanguage();
                        },
                        child: Text(isJp ? 'Switch to EN' : 'Switch to JA'),
                      ),
                      ElevatedButton(
                        key: const Key('set_ja_button'),
                        onPressed: () {
                          ref.read(localeProvider.notifier).setLocale(const Locale('ja'));
                        },
                        child: const Text('Set JA'),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      );

      // Initially English
      expect(find.text('English Active'), findsOneWidget);

      // Simulate tapping settings/landing language switch
      await tester.tap(find.byKey(const Key('set_ja_button')));
      await tester.pumpAndSettle();

      // Confirms synchronization
      expect(find.text('Japanese Active'), findsOneWidget);

      // Toggle back
      await tester.tap(find.byKey(const Key('toggle_button')));
      await tester.pumpAndSettle();

      expect(find.text('English Active'), findsOneWidget);
    });
  });
}
