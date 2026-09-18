import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../localization/app_localizations.dart';

/// Reusable modal window component matching the Netlink AI glassmorphic design theme.
///
/// Features:
/// - Frosted glass backdrop blur and subtle glowing border
/// - Consistent pill-shaped, evenly-sized action buttons
/// - Configurable status icon badge (Amber for reminders, Primary for info, etc.)
/// - Optional secondary/footnote text and custom body widget
/// - Convenient static [show] method
class AppModalDialog extends StatelessWidget {
  final String title;
  final String message;
  final String? secondaryMessage;
  final Widget? customBody;
  final IconData? icon;
  final Color? iconColor;
  final Color? iconBackgroundColor;
  final String? primaryLabel;
  final VoidCallback? onPrimary;
  final IconData? primaryIcon;
  final List<Color>? primaryGradient;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;
  final bool showCloseButton;
  final double maxWidth;

  const AppModalDialog({
    super.key,
    required this.title,
    required this.message,
    this.secondaryMessage,
    this.customBody,
    this.icon,
    this.iconColor,
    this.iconBackgroundColor,
    this.primaryLabel,
    this.onPrimary,
    this.primaryIcon,
    this.primaryGradient,
    this.secondaryLabel,
    this.onSecondary,
    this.showCloseButton = false,
    this.maxWidth = 460,
  });

  /// Displays the modal dialog over the current screen
  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    required String message,
    String? secondaryMessage,
    Widget? customBody,
    IconData? icon,
    Color? iconColor,
    Color? iconBackgroundColor,
    String? primaryLabel,
    VoidCallback? onPrimary,
    IconData? primaryIcon,
    List<Color>? primaryGradient,
    String? secondaryLabel,
    VoidCallback? onSecondary,
    bool showCloseButton = false,
    bool barrierDismissible = false,
    double maxWidth = 460,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      barrierColor: Colors.black.withValues(alpha: 0.70),
      builder: (ctx) => AppModalDialog(
        title: title,
        message: message,
        secondaryMessage: secondaryMessage,
        customBody: customBody,
        icon: icon,
        iconColor: iconColor,
        iconBackgroundColor: iconBackgroundColor,
        primaryLabel: primaryLabel,
        onPrimary: onPrimary ?? () => Navigator.of(ctx).pop(),
        primaryIcon: primaryIcon,
        primaryGradient: primaryGradient,
        secondaryLabel: secondaryLabel,
        onSecondary: onSecondary ?? () => Navigator.of(ctx).pop(),
        showCloseButton: showCloseButton,
        maxWidth: maxWidth,
      ),
    );
  }

  /// Displays a standardized confirmation dialog before signing out
  static Future<bool> showSignOutConfirmation(
    BuildContext context, {
    VoidCallback? onConfirm,
  }) async {
    final confirmed = await show<bool>(
      context: context,
      title: context.tr('confirmSignOutTitle'),
      message: context.tr('confirmSignOutMessage'),
      icon: Icons.logout_rounded,
      iconColor: context.colors.errorRuby,
      iconBackgroundColor: context.colors.errorRuby.withValues(alpha: 0.15),
      secondaryLabel: context.tr('cancel'),
      onSecondary: () => Navigator.of(context).pop(false),
      primaryLabel: context.tr('signOut'),
      primaryIcon: Icons.logout_rounded,
      primaryGradient: const [
        Color(0xFFEF4444),
        Color(0xFFDC2626),
      ],
      onPrimary: () {
        Navigator.of(context).pop(true);
        onConfirm?.call();
      },
      barrierDismissible: true,
      maxWidth: 420,
    );
    return confirmed ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final effectiveIconColor = iconColor ?? colors.primary;
    final effectiveIconBg = iconBackgroundColor ??
        effectiveIconColor.withValues(alpha: 0.15);

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: isDark
                    ? colors.surfaceCard.withValues(alpha: 0.90)
                    : colors.surfaceCard.withValues(alpha: 0.96),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: colors.glassBorder,
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: effectiveIconColor.withValues(alpha: 0.12),
                    blurRadius: 40,
                    spreadRadius: 2,
                    offset: const Offset(0, 8),
                  ),
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.45 : 0.12),
                    blurRadius: 28,
                    offset: const Offset(0, 14),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header (Icon Badge + Title + Optional Close)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      if (icon != null) ...[
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: effectiveIconBg,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: effectiveIconColor.withValues(alpha: 0.45),
                              width: 1.5,
                            ),
                          ),
                          child: Icon(
                            icon,
                            color: effectiveIconColor,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 14),
                      ],
                      Expanded(
                        child: Text(
                          title,
                          style: AppTypography.headlineSm.copyWith(
                            color: colors.onSurface,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      if (showCloseButton)
                        IconButton(
                          icon: Icon(
                            Icons.close_rounded,
                            color: colors.onSurfaceVariant,
                            size: 20,
                          ),
                          onPressed: () => Navigator.of(context).pop(),
                          tooltip: context.tr('close'),
                        ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Main Body Message
                  Text(
                    message,
                    style: AppTypography.bodyMd.copyWith(
                      color: colors.onSurfaceVariant,
                      height: 1.55,
                    ),
                  ),

                  // Optional Secondary / Footnote Note
                  if (secondaryMessage != null) ...[
                    const SizedBox(height: 10),
                    Text(
                      secondaryMessage!,
                      style: AppTypography.bodySm.copyWith(
                        color: colors.onSurfaceVariant.withValues(alpha: 0.65),
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],

                  // Custom Child Content (if any)
                  if (customBody != null) ...[
                    const SizedBox(height: 16),
                    customBody!,
                  ],

                  const SizedBox(height: 26),

                  // Evenly Sized Action Buttons
                  if (primaryLabel != null || secondaryLabel != null)
                    Row(
                      children: [
                        if (secondaryLabel != null)
                          Expanded(
                            child: ModalSecondaryButton(
                              label: secondaryLabel!,
                              onPressed: onSecondary,
                            ),
                          ),
                        if (secondaryLabel != null && primaryLabel != null)
                          const SizedBox(width: 12),
                        if (primaryLabel != null)
                          Expanded(
                            child: ModalPrimaryButton(
                              label: primaryLabel!,
                              icon: primaryIcon,
                              gradient: primaryGradient,
                              onPressed: onPrimary,
                            ),
                          ),
                      ],
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class ModalPrimaryButton extends StatefulWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final double height;
  final double? fontSize;
  final List<Color>? gradient;

  const ModalPrimaryButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.height = 46,
    this.fontSize,
    this.gradient,
  });

  @override
  State<ModalPrimaryButton> createState() => _ModalPrimaryButtonState();
}

class _ModalPrimaryButtonState extends State<ModalPrimaryButton> {
  bool _isHovered = false;
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTapDown: (_) => setState(() => _isPressed = true),
        onTapUp: (_) {
          setState(() => _isPressed = false);
          widget.onPressed?.call();
        },
        onTapCancel: () => setState(() => _isPressed = false),
        child: AnimatedScale(
          scale: _isPressed ? 0.96 : (_isHovered ? 1.02 : 1.0),
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOutCubic,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 140),
            height: widget.height,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: widget.gradient ?? colors.primaryButtonGradient,
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(99),
              border: Border.all(
                color: _isHovered
                    ? Colors.white.withValues(alpha: 0.60)
                    : Colors.white.withValues(alpha: 0.30),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: (widget.gradient?.first ?? colors.primary).withValues(alpha: _isHovered ? 0.45 : 0.32),
                  blurRadius: _isHovered ? 18 : 12,
                  spreadRadius: _isHovered ? 1 : 0,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    widget.label,
                    style: AppTypography.bodyMd.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: widget.fontSize ?? 14,
                      height: 1.2,
                    ),
                  ),
                  if (widget.icon != null) ...[
                    const SizedBox(width: 4),
                    Icon(
                      widget.icon,
                      color: Colors.white,
                      size: (widget.fontSize ?? 14) + 1,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class ModalSecondaryButton extends StatefulWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final double height;
  final double? fontSize;

  const ModalSecondaryButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.height = 46,
    this.fontSize,
  });

  @override
  State<ModalSecondaryButton> createState() => _ModalSecondaryButtonState();
}

class _ModalSecondaryButtonState extends State<ModalSecondaryButton> {
  bool _isHovered = false;
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTapDown: (_) => setState(() => _isPressed = true),
        onTapUp: (_) {
          setState(() => _isPressed = false);
          widget.onPressed?.call();
        },
        onTapCancel: () => setState(() => _isPressed = false),
        child: AnimatedScale(
          scale: _isPressed ? 0.96 : (_isHovered ? 1.02 : 1.0),
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOutCubic,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 140),
            height: widget.height,
            decoration: BoxDecoration(
              color: _isHovered
                  ? colors.onSurface.withValues(alpha: 0.10)
                  : colors.onSurface.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(99),
              border: Border.all(
                color: _isHovered
                    ? colors.primary.withValues(alpha: 0.40)
                    : colors.glassBorder,
                width: 1.2,
              ),
            ),
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (widget.icon != null) ...[
                    Icon(
                      widget.icon,
                      color: _isHovered ? colors.onSurface : colors.onSurfaceVariant,
                      size: (widget.fontSize ?? 14) + 1,
                    ),
                    const SizedBox(width: 4),
                  ],
                  Text(
                    widget.label,
                    style: AppTypography.bodyMd.copyWith(
                      color: _isHovered ? colors.onSurface : colors.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                      fontSize: widget.fontSize ?? 14,
                      height: 1.2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
