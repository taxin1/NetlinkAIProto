import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/theme_provider.dart';

const String _kLocaleKey = 'app_locale_code';

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return LocaleNotifier(prefs);
});

class LocaleNotifier extends StateNotifier<Locale> {
  final SharedPreferences _prefs;

  LocaleNotifier(this._prefs) : super(_loadInitialLocale(_prefs));

  static Locale _loadInitialLocale(SharedPreferences prefs) {
    final code = prefs.getString(_kLocaleKey);
    if (code == 'ja') {
      return const Locale('ja');
    }
    return const Locale('en');
  }

  Future<void> setLocale(Locale locale) async {
    if (state == locale) return;
    state = locale;
    await _prefs.setString(_kLocaleKey, locale.languageCode);
  }

  Future<void> toggleLanguage() async {
    if (state.languageCode == 'en') {
      await setLocale(const Locale('ja'));
    } else {
      await setLocale(const Locale('en'));
    }
  }

  bool get isJapanese => state.languageCode == 'ja';
}
