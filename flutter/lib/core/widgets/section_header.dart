import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Standardized section header matching the Analytics page design.
///
/// Features:
/// - Circular icon badge with clean neutral styling (no harsh colors)
/// - 18px font headline text
/// - Smooth horizontal fading gradient divider line
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
          Text(
            label,
            style: AppTypography.headlineSm.copyWith(
              fontSize: 18,
              color: context.colors.onSurface,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Container(
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    context.colors.glassBorder,
                    context.colors.glassBorder.withValues(alpha: 0.0),
                  ],
                ),
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

