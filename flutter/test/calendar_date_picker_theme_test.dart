import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/theme/app_theme.dart';

void main() {
  testWidgets('AppTheme dark and light datePickerTheme todayForegroundColor resolves properly when selected', (tester) async {
    final darkTheme = AppTheme.dark;
    final darkDatePicker = darkTheme.datePickerTheme;
    final darkColor = darkDatePicker.todayForegroundColor?.resolve({WidgetState.selected});
    expect(darkColor, equals(darkTheme.colorScheme.onPrimary));

    final lightTheme = AppTheme.light;
    final lightDatePicker = lightTheme.datePickerTheme;
    final lightColor = lightDatePicker.todayForegroundColor?.resolve({WidgetState.selected});
    expect(lightColor, equals(lightTheme.colorScheme.onPrimary));
  });
}

