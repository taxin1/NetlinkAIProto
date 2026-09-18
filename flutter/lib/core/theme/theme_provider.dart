import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ── Shared Preferences Provider ──────────────────────────────────────────────
final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError();
});

// ── Theme mode provider ────────────────────────────────────────────────────
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>(
  (ref) {
    final prefs = ref.watch(sharedPreferencesProvider);
    return ThemeModeNotifier(prefs);
  },
);

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final SharedPreferences _prefs;
  static const _themeKey = 'theme_mode';

  ThemeModeNotifier(this._prefs) : super(_loadThemeMode(_prefs));

  static ThemeMode _loadThemeMode(SharedPreferences prefs) {
    final savedMode = prefs.getString(_themeKey);
    if (savedMode == 'light') return ThemeMode.light;
    return ThemeMode.dark; // Default to dark
  }

  void toggle() {
    state = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    _prefs.setString(_themeKey, state == ThemeMode.dark ? 'dark' : 'light');
  }

  bool get isDark => state == ThemeMode.dark;
}
