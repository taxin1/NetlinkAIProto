import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';
import 'app_typography.dart';

class AppTheme {
  AppTheme._();

  static final ThemeData dark = _buildDarkTheme();

  static ThemeData _buildDarkTheme() => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.dark(
          brightness: Brightness.dark,
          primary: AppColors.primary,
          onPrimary: AppColors.onPrimary,
          primaryContainer: AppColors.primaryContainer,
          onPrimaryContainer: AppColors.onPrimaryContainer,
          secondary: AppColors.secondary,
          onSecondary: AppColors.onSecondary,
          secondaryContainer: AppColors.secondaryContainer,
          onSecondaryContainer: AppColors.onSecondaryContainer,
          tertiary: AppColors.tertiary,
          onTertiary: AppColors.onTertiary,
          tertiaryContainer: AppColors.tertiaryContainer,
          onTertiaryContainer: AppColors.onTertiaryContainer,
          error: AppColors.error,
          onError: AppColors.onError,
          errorContainer: AppColors.errorContainer,
          onErrorContainer: AppColors.onErrorContainer,
          surface: AppColors.surface,
          onSurface: AppColors.onSurface,
          onSurfaceVariant: AppColors.onSurfaceVariant,
          outline: AppColors.outline,
          outlineVariant: AppColors.outlineVariant,
          inverseSurface: AppColors.inverseSurface,
          onInverseSurface: AppColors.inverseOnSurface,
          inversePrimary: AppColors.inversePrimary,
          surfaceTint: AppColors.surfaceTint,
        ),
        scaffoldBackgroundColor: AppColors.background,
        textTheme: AppTypography.getTextTheme(
          defaultColor: AppColors.onSurface,
          variantColor: AppColors.onSurfaceVariant,
        ),
        fontFamily: GoogleFonts.inter().fontFamily,
        fontFamilyFallback: AppTypography.fontFallbacks,

        // AppBar
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.surfaceDim.withValues(alpha: 0.8),
          foregroundColor: AppColors.onSurface,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: true,
          systemOverlayStyle: SystemUiOverlayStyle.light,
          titleTextStyle: AppTypography.headlineSm.copyWith(
            color: AppColors.onSurface,
          ),
        ),

        // Navigation Drawer
        drawerTheme: const DrawerThemeData(
          backgroundColor: AppColors.surfaceContainerLow,
          elevation: 8,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.only(
              topRight: Radius.circular(16),
              bottomRight: Radius.circular(16),
            ),
          ),
        ),

        // Bottom Navigation Bar
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: AppColors.surfaceContainer.withValues(alpha: 0.9),
          indicatorColor: AppColors.primary.withValues(alpha: 0.2),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppTypography.labelCaps.copyWith(color: AppColors.primary);
            }
            return AppTypography.labelCaps;
          }),
          iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return IconThemeData(color: AppColors.primary);
            }
            return IconThemeData(color: AppColors.onSurfaceVariant);
          }),
        ),

        // Cards
        cardTheme: CardThemeData(
          color: AppColors.glassCardBg,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(color: AppColors.glassBorder),
          ),
        ),

        // Input Decoration
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.surfaceDim,
          contentPadding: EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: AppColors.outlineVariant),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: AppColors.outlineVariant),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: AppColors.primary, width: 1.5),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: AppColors.errorRuby),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: AppColors.errorRuby, width: 1.5),
          ),
          hintStyle: AppTypography.bodyMd.copyWith(color: AppColors.outline),
          labelStyle:
              AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
        ),


        // Elevated Button
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primaryContainer,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(99)),
            textStyle: AppTypography.bodyMd.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // Text Button
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: AppColors.primary,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(99)),
            textStyle: AppTypography.bodyMd.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // Divider
        dividerTheme: const DividerThemeData(
          color: AppColors.glassBorder,
          thickness: 1,
        ),

        // Icon
        iconTheme: IconThemeData(
          color: AppColors.onSurfaceVariant,
          size: 24,
        ),

        // List Tile
        listTileTheme: ListTileThemeData(
          textColor: AppColors.onSurface,
          iconColor: AppColors.onSurfaceVariant,
          contentPadding: EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 4,
          ),
        ),

        // Chip
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.surfaceVariant,
          selectedColor: AppColors.primary.withValues(alpha: 0.2),
          labelStyle: AppTypography.labelCaps.copyWith(
            color: AppColors.onSurfaceVariant,
          ),
          side: BorderSide(color: AppColors.outlineVariant),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(99),
          ),
        ),

        // Bottom Sheet
        bottomSheetTheme: const BottomSheetThemeData(
          backgroundColor: AppColors.surfaceContainerLow,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
        ),

        // Date Picker
        datePickerTheme: DatePickerThemeData(
          backgroundColor: const Color(0xFF0F121E),
          headerBackgroundColor: const Color(0xFF141724),
          headerForegroundColor: Colors.white,
          surfaceTintColor: Colors.transparent,
          dayForegroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) return Colors.white;
            return Colors.white;
          }),
          dayBackgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) return AppColors.primary;
            return Colors.transparent;
          }),
          todayForegroundColor: WidgetStateProperty.all(AppColors.primary),
        ),
      );

  // ── Light theme ────────────────────────────────────────────────────────────
  static final ThemeData light = _buildLightTheme();

  static ThemeData _buildLightTheme() => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        colorScheme: ColorScheme.light(
          brightness: Brightness.light,
          primary: AppColorsLight.primary,
          onPrimary: AppColorsLight.onPrimary,
          primaryContainer: AppColorsLight.primaryContainer,
          onPrimaryContainer: AppColorsLight.onPrimaryContainer,
          secondary: AppColorsLight.secondary,
          onSecondary: AppColorsLight.onSecondary,
          secondaryContainer: AppColorsLight.secondaryContainer,
          onSecondaryContainer: AppColorsLight.onSecondaryContainer,
          tertiary: AppColorsLight.tertiary,
          onTertiary: AppColorsLight.onTertiary,
          tertiaryContainer: AppColorsLight.tertiaryContainer,
          onTertiaryContainer: AppColorsLight.onTertiaryContainer,
          error: AppColorsLight.error,
          onError: AppColorsLight.onError,
          errorContainer: AppColorsLight.errorContainer,
          onErrorContainer: AppColorsLight.onErrorContainer,
          surface: AppColorsLight.surface,
          onSurface: AppColorsLight.onSurface,
          onSurfaceVariant: AppColorsLight.onSurfaceVariant,
          outline: AppColorsLight.outline,
          outlineVariant: AppColorsLight.outlineVariant,
          inverseSurface: AppColorsLight.inverseSurface,
          onInverseSurface: AppColorsLight.inverseOnSurface,
          inversePrimary: AppColorsLight.inversePrimary,
          surfaceTint: AppColorsLight.surfaceTint,
        ),
        scaffoldBackgroundColor: AppColorsLight.background,
        textTheme: AppTypography.getTextTheme(
          defaultColor: AppColorsLight.onSurface,
          variantColor: AppColorsLight.onSurfaceVariant,
        ),
        fontFamily: GoogleFonts.inter().fontFamily,
        fontFamilyFallback: AppTypography.fontFallbacks,

        // AppBar
        appBarTheme: AppBarTheme(
          backgroundColor: AppColorsLight.surfaceCard,
          foregroundColor: AppColorsLight.onSurface,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: true,
          systemOverlayStyle: SystemUiOverlayStyle.dark,
          titleTextStyle: AppTypography.headlineSm.copyWith(
            color: AppColorsLight.onSurface,
          ),
        ),

        // Navigation Drawer
        drawerTheme: DrawerThemeData(
          backgroundColor: AppColorsLight.surfaceContainerLow,
          elevation: 8,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.only(
              topRight: Radius.circular(16),
              bottomRight: Radius.circular(16),
            ),
          ),
        ),

        // Bottom Navigation Bar
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: AppColorsLight.surfaceCard,
          indicatorColor: AppColorsLight.primary.withValues(alpha: 0.15),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppTypography.labelCaps
                  .copyWith(color: AppColorsLight.primary);
            }
            return AppTypography.labelCaps;
          }),
          iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return IconThemeData(color: AppColorsLight.primary);
            }
            return IconThemeData(color: AppColorsLight.onSurfaceVariant);
          }),
        ),

        // Cards
        cardTheme: CardThemeData(
          color: AppColorsLight.glassCardBg,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(color: AppColorsLight.glassBorder),
          ),
        ),

        // Input Decoration
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColorsLight.surfaceContainerLow,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: AppColorsLight.outlineVariant),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: AppColorsLight.outlineVariant),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide:
                BorderSide(color: AppColorsLight.primary, width: 1.5),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: AppColorsLight.errorRuby),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide:
                BorderSide(color: AppColorsLight.errorRuby, width: 1.5),
          ),
          hintStyle: AppTypography.bodyMd
              .copyWith(color: AppColorsLight.outline),
          labelStyle: AppTypography.bodyMd
              .copyWith(color: AppColorsLight.onSurfaceVariant),
        ),


        // Elevated Button
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColorsLight.primaryContainer,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(99)),
            textStyle: AppTypography.bodyMd.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // Text Button
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: AppColorsLight.primary,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(99)),
            textStyle: AppTypography.bodyMd.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // Divider
        dividerTheme: DividerThemeData(
          color: AppColorsLight.glassBorder,
          thickness: 1,
        ),

        // Icon
        iconTheme: IconThemeData(
          color: AppColorsLight.onSurfaceVariant,
          size: 24,
        ),

        // List Tile
        listTileTheme: ListTileThemeData(
          textColor: AppColorsLight.onSurface,
          iconColor: AppColorsLight.onSurfaceVariant,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 4,
          ),
        ),

        // Chip
        chipTheme: ChipThemeData(
          backgroundColor: AppColorsLight.surfaceVariant,
          selectedColor: AppColorsLight.primary.withValues(alpha: 0.15),
          labelStyle: AppTypography.labelCaps.copyWith(
            color: AppColorsLight.onSurfaceVariant,
          ),
          side: BorderSide(color: AppColorsLight.outlineVariant),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(99),
          ),
        ),

        // Bottom Sheet
        bottomSheetTheme: BottomSheetThemeData(
          backgroundColor: AppColorsLight.surfaceContainerLow,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
        ),

        // Date Picker
        datePickerTheme: DatePickerThemeData(
          backgroundColor: Colors.white,
          headerBackgroundColor: const Color(0xFFF1F5F9),
          headerForegroundColor: const Color(0xFF0F172A),
          surfaceTintColor: Colors.transparent,
          dayForegroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) return Colors.white;
            return const Color(0xFF0F172A);
          }),
          dayBackgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) return AppColorsLight.primary;
            return Colors.transparent;
          }),
          todayForegroundColor: WidgetStateProperty.all(AppColorsLight.primary),
        ),
      );
}
