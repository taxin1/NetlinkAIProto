import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'glass_card.dart';

/// Dashboard stat card — liquid glass with icon, number and trend
class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color iconColor;
  final Color? iconBgColor;
  final String? trendLabel;
  final Color? trendColor;
  final IconData? trendIcon;

  final EdgeInsetsGeometry? padding;
  final double? valueFontSize;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    required this.iconColor,
    this.iconBgColor,
    this.trendLabel,
    this.trendColor,
    this.trendIcon,
    this.padding,
    this.valueFontSize,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(16),
      tintColor: iconColor,
      padding: padding ?? const EdgeInsets.fromLTRB(14, 12, 12, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 6),
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      iconColor.withValues(alpha: 0.25),
                      iconColor.withValues(alpha: 0.10),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: iconColor.withValues(alpha: 0.3),
                    width: 0.8,
                  ),
                ),
                child: Icon(icon, color: iconColor, size: 16),
              ),
            ],
          ),
          const Spacer(),
          Text(
            value,
            style: AppTypography.statsNumber.copyWith(
              fontSize: valueFontSize ?? 22,
            ),
          ),
          if (trendLabel != null) ...[
            const SizedBox(height: 2),
            Row(
              children: [
                if (trendIcon != null)
                  Icon(trendIcon, color: trendColor ?? context.colors.successGlow, size: 12),
                const SizedBox(width: 3),
                Flexible(
                  child: Text(
                    trendLabel!,
                    style: AppTypography.labelCaps.copyWith(
                      color: trendColor ?? context.colors.successGlow,
                      fontSize: 10,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
