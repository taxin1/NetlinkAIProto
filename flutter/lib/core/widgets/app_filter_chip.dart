import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Reusable filter chip button adhering to the Netlink AI design system
/// Displays a checkmark and translucent glowing pill background when selected.
class AppFilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final ValueChanged<bool>? onSelected;
  final bool showCheckmark;
  final Widget? avatar;
  final double fontSize;

  const AppFilterChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onSelected,
    this.showCheckmark = true,
    this.avatar,
    this.fontSize = 12,
  });

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      showCheckmark: showCheckmark,
      checkmarkColor: context.colors.primary,
      avatar: avatar,
      selectedColor: context.colors.primary.withValues(alpha: 0.25),
      backgroundColor: context.colors.surface.withValues(alpha: 0.25),
      side: BorderSide(
        color: selected
            ? context.colors.primary.withValues(alpha: 0.5)
            : context.colors.glassBorder,
        width: 1.0,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      labelStyle: AppTypography.bodySm.copyWith(
        color: selected
            ? context.colors.primary
            : context.colors.onSurfaceVariant,
        fontWeight: selected ? FontWeight.bold : FontWeight.normal,
        fontSize: fontSize,
      ),
      onSelected: onSelected,
    );
  }
}
