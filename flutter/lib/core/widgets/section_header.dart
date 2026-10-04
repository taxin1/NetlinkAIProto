import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Standardized section header matching the application's clean design.
///
/// Features:
/// - Circular icon badge with clean neutral styling (no harsh colors)
/// - 18px font headline text with soft wrapping (no ellipsis truncation)
/// - Optional trailing action/badge widget
class SectionHeader extends StatelessWidget {
  final IconData? icon;
  final String label;
  final Color? color;
  final Widget? trailing;
  final EdgeInsetsGeometry? padding;

  const SectionHeader({
    super.key,
    this.icon,
    required this.label,
    this.color,
    this.trailing,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? EdgeInsets.zero,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: context.colors.onSurface.withValues(alpha: 0.08),
                shape: BoxShape.circle,
                border: Border.all(
                  color: context.colors.glassBorder,
                  width: 1,
                ),
              ),
              child: Icon(
                icon,
                color: context.colors.onSurface,
                size: 16,
              ),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Text(
              label,
              softWrap: true,
              style: AppTypography.headlineSm.copyWith(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: context.colors.onSurface,
              ),
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: 12),
            trailing!,
          ],
        ],
      ),
    );
  }
}

/// Standardized horizontal divider line placed at the end of content sections.
class SectionDivider extends StatelessWidget {
  final EdgeInsetsGeometry? margin;
  final Color? color;

  const SectionDivider({
    super.key,
    this.margin,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final dividerColor = color ?? context.colors.glassBorder;
    return Container(
      margin: margin ?? const EdgeInsets.symmetric(vertical: 32),
      height: 1,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            dividerColor.withValues(alpha: 0.0),
            dividerColor,
            dividerColor.withValues(alpha: 0.0),
          ],
        ),
      ),
    );
  }
}

