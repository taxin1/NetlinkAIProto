import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTypography {
  AppTypography._();

  /// Japanese & CJK font fallback chain to ensure instant rendering without font fallback stutter
  static const List<String> fontFallbacks = [
    'Noto Sans JP',
    'Hiragino Sans',
    'Yu Gothic',
    'Meiryo',
    'sans-serif',
  ];

  static TextStyle _plusJakartaSans({
    required double fontSize,
    FontWeight? fontWeight,
    double? height,
    double? letterSpacing,
    Color? color,
  }) {
    return GoogleFonts.plusJakartaSans(
      fontSize: fontSize,
      fontWeight: fontWeight,
      height: height,
      letterSpacing: letterSpacing,
      color: color,
    ).copyWith(fontFamilyFallback: fontFallbacks);
  }

  static TextStyle _inter({
    required double fontSize,
    FontWeight? fontWeight,
    double? height,
    double? letterSpacing,
    Color? color,
  }) {
    return GoogleFonts.inter(
      fontSize: fontSize,
      fontWeight: fontWeight,
      height: height,
      letterSpacing: letterSpacing,
      color: color,
    ).copyWith(fontFamilyFallback: fontFallbacks);
  }

  // ── Display — Plus Jakarta Sans (medium weight, not heavy) ─────────────────

  /// 48 px
  static final TextStyle displayXl = _plusJakartaSans(
    fontSize: 48,
    fontWeight: FontWeight.w600,
    height: 1.05,
    letterSpacing: -1.2,
  );

  /// 36 px
  static final TextStyle displayLg = _plusJakartaSans(
    fontSize: 36,
    fontWeight: FontWeight.w600,
    height: 1.1,
    letterSpacing: -0.9,
  );

  /// 28 px
  static final TextStyle displayLgMobile = _plusJakartaSans(
    fontSize: 28,
    fontWeight: FontWeight.w600,
    height: 1.15,
    letterSpacing: -0.6,
  );

  /// 26 px - Section Headers
  static final TextStyle headlineMd = _plusJakartaSans(
    fontSize: 26,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: -0.4,
  );

  /// 18 px
  static final TextStyle headlineSm = _plusJakartaSans(
    fontSize: 18,
    fontWeight: FontWeight.w500,
    height: 1.35,
    letterSpacing: -0.1,
  );

  static final TextStyle statsNumber = _plusJakartaSans(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: -0.3,
  );

  // ── Body — Inter light ─────────────────────────────────────────────────────

  static final TextStyle bodyLg = _inter(
    fontSize: 16,
    fontWeight: FontWeight.w300,
    height: 1.65,
  );

  static final TextStyle bodyMd = _inter(
    fontSize: 15,
    fontWeight: FontWeight.w300,
    height: 1.6,
  );

  static final TextStyle bodySm = _inter(
    fontSize: 13,
    fontWeight: FontWeight.w300,
    height: 1.55,
  );

  static final TextStyle labelCaps = _inter(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    height: 1.3,
    letterSpacing: 0.8,
  );

  static final TextStyle labelSm = _inter(
    fontSize: 10,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.4,
  );

  static final TextStyle caption = _inter(
    fontSize: 12,
    fontWeight: FontWeight.w300,
    height: 1.4,
    letterSpacing: 0.1,
  );

  static TextTheme getTextTheme({
    required Color defaultColor,
    required Color variantColor,
  }) {
    return TextTheme(
      displayLarge: displayLg.copyWith(color: defaultColor),
      displayMedium: displayLgMobile.copyWith(color: defaultColor),
      headlineLarge: headlineMd.copyWith(color: defaultColor),
      headlineMedium: headlineSm.copyWith(color: defaultColor),
      titleLarge: _plusJakartaSans(
        fontSize: 17,
        fontWeight: FontWeight.w500,
        letterSpacing: -0.2,
        color: defaultColor,
      ),
      bodyLarge: bodyLg.copyWith(color: defaultColor),
      bodyMedium: bodyMd.copyWith(color: defaultColor),
      bodySmall: bodySm.copyWith(color: defaultColor),
      labelLarge: labelCaps.copyWith(color: variantColor),
      labelMedium: _inter(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: defaultColor,
      ),
      labelSmall: labelSm.copyWith(color: variantColor),
    );
  }

  static TextTheme get textTheme => TextTheme(
        displayLarge: displayLg,
        displayMedium: displayLgMobile,
        headlineLarge: headlineMd,
        headlineMedium: headlineSm,
        titleLarge: _plusJakartaSans(
          fontSize: 17,
          fontWeight: FontWeight.w500,
          letterSpacing: -0.2,
        ),
        bodyLarge: bodyLg,
        bodyMedium: bodyMd,
        bodySmall: bodySm,
        labelLarge: labelCaps,
        labelMedium: _inter(
          fontSize: 13,
          fontWeight: FontWeight.w400,
        ),
        labelSmall: labelSm,
      );
}
