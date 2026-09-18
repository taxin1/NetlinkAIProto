import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
// DARK palette (unchanged originals)
// ─────────────────────────────────────────────────────────────────────────────
class AppColors {
  AppColors._();

  // === BACKGROUNDS & SURFACES ===
  static const Color background = Color(0xFF04091A);  // deeper midnight navy
  static const Color surface = Color(0xFF04091A);
  static const Color surfaceDim = Color(0xFF070E20);
  static const Color surfaceCard = Color(0xFF0D1730);
  static const Color surfaceContainerLowest = Color(0xFF030712);
  static const Color surfaceContainerLow = Color(0xFF0B1528);
  static const Color surfaceContainer = Color(0xFF0F1C35);
  static const Color surfaceContainerHigh = Color(0xFF152240);
  static const Color surfaceContainerHighest = Color(0xFF1C2B4E);
  static const Color surfaceVariant = Color(0xFF1A2848);
  static const Color surfaceBright = Color(0xFF1E3058);
  static const Color inverseOnSurface = Color(0xFF1A2848);
  static const Color inverseSurface = Color(0xFFE1E5FF);

  // === ON SURFACE COLORS ===
  static const Color onBackground = Color(0xFFEEF1FF);
  static const Color onSurface = Color(0xFFEEF1FF);
  static const Color onSurfaceVariant = Color(0xFFB4BFDD);
  static const Color outline = Color(0xFF6B7799);
  static const Color outlineVariant = Color(0xFF2A3660);

  // === PRIMARY (Blue) ===
  static const Color primary = Color(0xFF7EB0FF);       // soft sky blue for dark text-on-glass
  static const Color onPrimary = Color(0xFF001848);
  static const Color primaryContainer = Color(0xFF2B5EFF); // vivid CTA blue
  static const Color onPrimaryContainer = Color(0xFFD8E8FF);
  static const Color primaryFixed = Color(0xFFD8E2FF);
  static const Color primaryFixedDim = Color(0xFF7EB0FF);
  static const Color inversePrimary = Color(0xFF2B5EFF);
  static const Color surfaceTint = Color(0xFF7EB0FF);

  // === SECONDARY (Purple) ===
  static const Color secondary = Color(0xFFCFAEFF);
  static const Color onSecondary = Color(0xFF3A006A);
  static const Color secondaryContainer = Color(0xFF6C22D6);
  static const Color onSecondaryContainer = Color(0xFFEFDCFF);
  static const Color secondaryFixed = Color(0xFFEFDBFF);
  static const Color secondaryFixedDim = Color(0xFFCFAEFF);

  // === TERTIARY (Teal accent) ===
  static const Color tertiary = Color(0xFF70EFDE);
  static const Color onTertiary = Color(0xFF003731);
  static const Color tertiaryContainer = Color(0xFF00B4D8);
  static const Color onTertiaryContainer = Color(0xFF002B28);

  // === FUNCTIONAL COLORS ===
  static const Color successGlow = Color(0xFF00FFC2);
  static const Color warningAmber = Color(0xFFFFB800);
  static const Color errorRuby = Color(0xFFFF3B30);
  static const Color error = Color(0xFFFFB4AB);
  static const Color onError = Color(0xFF690005);
  static const Color errorContainer = Color(0xFF93000A);
  static const Color onErrorContainer = Color(0xFFFFDAD6);

  // === GLASS & OVERLAY ===
  static const Color glassBorder = Color(0x2EFFFFFF);   // rgba(255,255,255,0.18)
  static const Color glassSheen  = Color(0x14FFFFFF);   // top-edge sheen rgba(255,255,255,0.08)
  static const Color glassCardBg = Color(0xA60A143C);   // rgba(10,20,60,0.65) navy-tinted
  static const Color overlayDark = Color(0x99000000);

  // === GRADIENTS ===
  static const List<Color> primaryButtonGradient = [
    Color(0xFF2B5EFF), // vivid iOS blue
    Color(0xFF0EA5FF), // bright sky
  ];
  static const List<Color> neonGradient = [
    Color(0xFF2B5EFF),
    Color(0xFF6C22D6), // purple
  ];
  static const List<Color> midnightGradient = [
    Color(0xFF04091A),
    Color(0xFF0A1430),
  ];

  // === GLOW COLORS ===
  static const Color glowPrimary   = Color(0x662B5EFF); // vivid blue/40%
  static const Color glowBlue      = Color(0x402B5EFF); // button outer glow
  static const Color glowSecondary = Color(0x336C22D6);
  static const Color glowSuccess   = Color(0x3300FFC2);
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT palette — Material 3 counterpart to the dark palette above
// ─────────────────────────────────────────────────────────────────────────────
class AppColorsLight {
  AppColorsLight._();

  // === BACKGROUNDS & SURFACES ===
  static const Color background = Color(0xFFF5F6FA);
  static const Color surface = Color(0xFFF5F6FA);
  static const Color surfaceDim = Color(0xFFE8EAF0);
  static const Color surfaceCard = Color(0xFFFFFFFF);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF0F2F8);
  static const Color surfaceContainer = Color(0xFFEAECF4);
  static const Color surfaceContainerHigh = Color(0xFFE0E3EE);
  static const Color surfaceContainerHighest = Color(0xFFD5D8E8);
  static const Color surfaceVariant = Color(0xFFDFE2EE);
  static const Color surfaceBright = Color(0xFFFFFFFF);
  static const Color inverseOnSurface = Color(0xFFEEEFF8);
  static const Color inverseSurface = Color(0xFF2E3037);

  // === ON SURFACE COLORS ===
  static const Color onBackground = Color(0xFF050505);
  static const Color onSurface = Color(0xFF000000);
  static const Color onSurfaceVariant = Color(0xFF1A1C24);
  static const Color outline = Color(0xFF55596D);
  static const Color outlineVariant = Color(0xFFB0B4C8);

  // === PRIMARY (Blue) ===
  static const Color primary = Color(0xFF005BC0);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFFD8E2FF);
  static const Color onPrimaryContainer = Color(0xFF001A41);
  static const Color primaryFixed = Color(0xFFD8E2FF);
  static const Color primaryFixedDim = Color(0xFFADC7FF);
  static const Color inversePrimary = Color(0xFFADC7FF);
  static const Color surfaceTint = Color(0xFF005BC0);

  // === SECONDARY (Purple) ===
  static const Color secondary = Color(0xFF6700B5);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color secondaryContainer = Color(0xFFEFDBFF);
  static const Color onSecondaryContainer = Color(0xFF2C0051);
  static const Color secondaryFixed = Color(0xFFEFDBFF);
  static const Color secondaryFixedDim = Color(0xFFDCB8FF);

  // === TERTIARY (Orange) ===
  static const Color tertiary = Color(0xFF7C2E00);
  static const Color onTertiary = Color(0xFFFFFFFF);
  static const Color tertiaryContainer = Color(0xFFFFDBCC);
  static const Color onTertiaryContainer = Color(0xFF351000);

  // === FUNCTIONAL COLORS ===
  static const Color successGlow = Color(0xFF00A878);
  static const Color warningAmber = Color(0xFFB37800);
  static const Color errorRuby = Color(0xFFBA1A1A);
  static const Color error = Color(0xFFBA1A1A);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onErrorContainer = Color(0xFF410002);

  // === GLASS & OVERLAY ===
  static const Color glassBorder = Color(0x1A000000);
  static const Color glassSheen  = Color(0x0AFFFFFF); // light-mode top sheen
  static const Color glassCardBg = Color(0xF5FFFFFF);
  static const Color overlayDark = Color(0x40000000);

  // === GRADIENTS ===
  static const List<Color> primaryButtonGradient = [
    Color(0xFF2B5EFF), // vivid iOS blue
    Color(0xFF0EA5FF),
  ];
  static const List<Color> neonGradient = [
    Color(0xFF005BC0),
    Color(0xFF6700B5),
  ];
  static const List<Color> midnightGradient = [
    Color(0xFFF0F2F8),
    Color(0xFFF5F6FA),
  ];

  // === GLOW COLORS ===
  static const Color glowPrimary   = Color(0x332B5EFF);
  static const Color glowBlue      = Color(0x262B5EFF);
  static const Color glowSecondary = Color(0x1F6700B5);
  static const Color glowSuccess   = Color(0x3300A878);
}

// ─────────────────────────────────────────────────────────────────────────────
// Context-resolved token accessor
// ─────────────────────────────────────────────────────────────────────────────
class AppColorTokens {
  const AppColorTokens(this._isDark);

  final bool _isDark;

  Color get background =>
      _isDark ? AppColors.background : AppColorsLight.background;
  Color get surface => _isDark ? AppColors.surface : AppColorsLight.surface;
  Color get surfaceDim =>
      _isDark ? AppColors.surfaceDim : AppColorsLight.surfaceDim;
  Color get surfaceCard =>
      _isDark ? AppColors.surfaceCard : AppColorsLight.surfaceCard;
  Color get surfaceContainerLowest => _isDark
      ? AppColors.surfaceContainerLowest
      : AppColorsLight.surfaceContainerLowest;
  Color get surfaceContainerLow => _isDark
      ? AppColors.surfaceContainerLow
      : AppColorsLight.surfaceContainerLow;
  Color get surfaceContainer =>
      _isDark ? AppColors.surfaceContainer : AppColorsLight.surfaceContainer;
  Color get surfaceContainerHigh => _isDark
      ? AppColors.surfaceContainerHigh
      : AppColorsLight.surfaceContainerHigh;
  Color get surfaceContainerHighest => _isDark
      ? AppColors.surfaceContainerHighest
      : AppColorsLight.surfaceContainerHighest;
  Color get surfaceVariant =>
      _isDark ? AppColors.surfaceVariant : AppColorsLight.surfaceVariant;
  Color get surfaceBright =>
      _isDark ? AppColors.surfaceBright : AppColorsLight.surfaceBright;
  Color get inverseOnSurface =>
      _isDark ? AppColors.inverseOnSurface : AppColorsLight.inverseOnSurface;
  Color get inverseSurface =>
      _isDark ? AppColors.inverseSurface : AppColorsLight.inverseSurface;
  Color get onBackground =>
      _isDark ? AppColors.onBackground : AppColorsLight.onBackground;
  Color get onSurface =>
      _isDark ? AppColors.onSurface : AppColorsLight.onSurface;
  Color get onSurfaceVariant =>
      _isDark ? AppColors.onSurfaceVariant : AppColorsLight.onSurfaceVariant;
  Color get outline => _isDark ? AppColors.outline : AppColorsLight.outline;
  Color get outlineVariant =>
      _isDark ? AppColors.outlineVariant : AppColorsLight.outlineVariant;
  Color get primary => _isDark ? AppColors.primary : AppColorsLight.primary;
  Color get onPrimary =>
      _isDark ? AppColors.onPrimary : AppColorsLight.onPrimary;
  Color get primaryContainer =>
      _isDark ? AppColors.primaryContainer : AppColorsLight.primaryContainer;
  Color get onPrimaryContainer => _isDark
      ? AppColors.onPrimaryContainer
      : AppColorsLight.onPrimaryContainer;
  Color get primaryFixed =>
      _isDark ? AppColors.primaryFixed : AppColorsLight.primaryFixed;
  Color get primaryFixedDim =>
      _isDark ? AppColors.primaryFixedDim : AppColorsLight.primaryFixedDim;
  Color get inversePrimary =>
      _isDark ? AppColors.inversePrimary : AppColorsLight.inversePrimary;
  Color get surfaceTint =>
      _isDark ? AppColors.surfaceTint : AppColorsLight.surfaceTint;
  Color get secondary =>
      _isDark ? AppColors.secondary : AppColorsLight.secondary;
  Color get onSecondary =>
      _isDark ? AppColors.onSecondary : AppColorsLight.onSecondary;
  Color get secondaryContainer => _isDark
      ? AppColors.secondaryContainer
      : AppColorsLight.secondaryContainer;
  Color get onSecondaryContainer => _isDark
      ? AppColors.onSecondaryContainer
      : AppColorsLight.onSecondaryContainer;
  Color get secondaryFixed =>
      _isDark ? AppColors.secondaryFixed : AppColorsLight.secondaryFixed;
  Color get secondaryFixedDim =>
      _isDark ? AppColors.secondaryFixedDim : AppColorsLight.secondaryFixedDim;
  Color get tertiary =>
      _isDark ? AppColors.tertiary : AppColorsLight.tertiary;
  Color get onTertiary =>
      _isDark ? AppColors.onTertiary : AppColorsLight.onTertiary;
  Color get tertiaryContainer => _isDark
      ? AppColors.tertiaryContainer
      : AppColorsLight.tertiaryContainer;
  Color get onTertiaryContainer => _isDark
      ? AppColors.onTertiaryContainer
      : AppColorsLight.onTertiaryContainer;
  Color get successGlow =>
      _isDark ? AppColors.successGlow : AppColorsLight.successGlow;
  Color get warningAmber =>
      _isDark ? AppColors.warningAmber : AppColorsLight.warningAmber;
  Color get errorRuby =>
      _isDark ? AppColors.errorRuby : AppColorsLight.errorRuby;
  Color get error => _isDark ? AppColors.error : AppColorsLight.error;
  Color get onError => _isDark ? AppColors.onError : AppColorsLight.onError;
  Color get errorContainer =>
      _isDark ? AppColors.errorContainer : AppColorsLight.errorContainer;
  Color get onErrorContainer => _isDark
      ? AppColors.onErrorContainer
      : AppColorsLight.onErrorContainer;
  Color get glassBorder =>
      _isDark ? AppColors.glassBorder : AppColorsLight.glassBorder;
  Color get glassSheen =>
      _isDark ? AppColors.glassSheen : AppColorsLight.glassSheen;
  Color get glassCardBg =>
      _isDark ? AppColors.glassCardBg : AppColorsLight.glassCardBg;
  Color get overlayDark =>
      _isDark ? AppColors.overlayDark : AppColorsLight.overlayDark;
  List<Color> get primaryButtonGradient => _isDark
      ? AppColors.primaryButtonGradient
      : AppColorsLight.primaryButtonGradient;
  List<Color> get neonGradient =>
      _isDark ? AppColors.neonGradient : AppColorsLight.neonGradient;
  List<Color> get midnightGradient =>
      _isDark ? AppColors.midnightGradient : AppColorsLight.midnightGradient;
  Color get glowPrimary =>
      _isDark ? AppColors.glowPrimary : AppColorsLight.glowPrimary;
  Color get glowBlue =>
      _isDark ? AppColors.glowBlue : AppColorsLight.glowBlue;
  Color get glowSecondary =>
      _isDark ? AppColors.glowSecondary : AppColorsLight.glowSecondary;
  Color get glowSuccess =>
      _isDark ? AppColors.glowSuccess : AppColorsLight.glowSuccess;
}

// ─────────────────────────────────────────────────────────────────────────────
// BuildContext extension — reads theme brightness to resolve colors
// ─────────────────────────────────────────────────────────────────────────────
extension AppColorsBuildContext on BuildContext {
  AppColorTokens get colors {
    final brightness = Theme.of(this).brightness;
    return AppColorTokens(brightness == Brightness.dark);
  }
}
