import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/localization/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../models/dashboard_models.dart';

/// Dashboard overview stats section:
/// - Left: Prominent graphical Network Growth card with 7-day trend chart.
/// - Right: The other 3 cards (Total Contacts, Emails Sent, Upcoming Events)
///   stretched vertically so that their total expansion equals the graph card's length.
/// - The 3 cards are static glass surfaces (no whole-card hover); their trailing arrows
///   are small interactive buttons with hover & click action.
/// - Responsively stacks on narrow mobile screens.
class DashboardStatsSection extends StatelessWidget {
  final DashboardData data;
  final VoidCallback onContactsTap;
  final VoidCallback onEmailsTap;
  final VoidCallback onEventsTap;
  final VoidCallback onGrowthTap;

  const DashboardStatsSection({
    super.key,
    required this.data,
    required this.onContactsTap,
    required this.onEmailsTap,
    required this.onEventsTap,
    required this.onGrowthTap,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 720;

        final growthCard = _NetworkGrowthGraphicalCard(
          growthCount: data.networkGrowth,
          growthPoints: data.weeklyGrowthPoints,
          onTap: onGrowthTap,
        );

        final contactsCard = _StatRowCard(
          label: context.l10n.totalContacts,
          value: '${data.totalContacts}',
          subtitle: '+${data.networkGrowth} ${context.tr('thisWeek')}',
          icon: Icons.group_outlined,
          onTap: onContactsTap,
        );

        final emailsCard = _StatRowCard(
          label: context.l10n.emailsSent,
          value: '${data.emailsSent}',
          subtitle: context.tr('allTime'),
          icon: Icons.mail_outlined,
          onTap: onEmailsTap,
        );

        final eventsCard = _StatRowCard(
          label: context.l10n.upcomingEvents,
          value: '${data.upcomingEvents}',
          subtitle: context.tr('scheduled'),
          icon: Icons.calendar_today_outlined,
          onTap: onEventsTap,
        );

        if (isWide) {
          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  flex: 5,
                  child: growthCard,
                ),
                const SizedBox(width: 14),
                Expanded(
                  flex: 4,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(child: contactsCard),
                      const SizedBox(height: 10),
                      Expanded(child: emailsCard),
                      const SizedBox(height: 10),
                      Expanded(child: eventsCard),
                    ],
                  ),
                ),
              ],
            ),
          );
        }

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            growthCard,
            const SizedBox(height: 12),
            contactsCard,
            const SizedBox(height: 10),
            emailsCard,
            const SizedBox(height: 10),
            eventsCard,
          ],
        );
      },
    );
  }
}

/// Horizontal stat card for the vertical stack on the right.
/// Card itself is static (no whole-card hover button effect);
/// the trailing arrow is a dedicated small circular button.
class _StatRowCard extends StatelessWidget {
  final String label;
  final String value;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  const _StatRowCard({
    required this.label,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(16),
      tintColor: null, // Neutral glass: no colored gradient tint
      glowColor: null,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      onTap: null, // Not a full button: no whole-card hover/press
      child: Center(
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: context.colors.surfaceContainerHighest.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: context.colors.glassBorder,
                  width: 0.8,
                ),
              ),
              child: Icon(
                icon,
                size: 18,
                color: context.colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    label,
                    style: AppTypography.bodySm.copyWith(
                      fontWeight: FontWeight.w600,
                      color: context.colors.onSurface,
                      fontSize: 13,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppTypography.labelCaps.copyWith(
                      color: context.colors.onSurfaceVariant,
                      fontSize: 11,
                      letterSpacing: 0.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              value,
              style: AppTypography.statsNumber.copyWith(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: context.colors.onSurface,
              ),
            ),
            const SizedBox(width: 8),
            // Small button for the arrow, matching the refresh button in summary section
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: context.colors.surfaceContainerHighest.withValues(alpha: 0.35),
                shape: BoxShape.circle,
                border: Border.all(
                  color: context.colors.glassBorder,
                  width: 0.8,
                ),
              ),
              child: IconButton(
                onPressed: onTap,
                icon: Icon(
                  Icons.arrow_forward_rounded,
                  size: 15,
                  color: context.colors.onSurfaceVariant,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                splashRadius: 16,
                tooltip: label,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Graphical Network Growth card with an interactive 7-day sparkline / area chart
class _NetworkGrowthGraphicalCard extends StatefulWidget {
  final int growthCount;
  final List<double> growthPoints;
  final VoidCallback onTap;

  const _NetworkGrowthGraphicalCard({
    required this.growthCount,
    required this.growthPoints,
    required this.onTap,
  });

  @override
  State<_NetworkGrowthGraphicalCard> createState() => _NetworkGrowthGraphicalCardState();
}

class _NetworkGrowthGraphicalCardState extends State<_NetworkGrowthGraphicalCard> {
  int? _hoveredIndex;

  List<DateTime> _getSevenDays() {
    final now = DateTime.now();
    return List.generate(7, (i) => now.subtract(Duration(days: 6 - i)));
  }

  String _formatDayLabel(DateTime date, BuildContext context) {
    try {
      final locale = Localizations.localeOf(context).languageCode;
      return DateFormat.E(locale).format(date);
    } catch (_) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days[(date.weekday - 1) % 7];
    }
  }

  @override
  Widget build(BuildContext context) {
    final days = _getSevenDays();
    final points = widget.growthPoints.length == 7
        ? widget.growthPoints
        : List.generate(7, (i) => 0.0);

    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      tintColor: null, // Neutral glass: no colored gradient tint
      glowColor: null,
      padding: const EdgeInsets.all(20),
      onTap: null, // Card itself is static: chart interacts with hover and Analytics badge is the button
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header Row
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: context.colors.surfaceContainerHighest.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: context.colors.glassBorder,
                    width: 0.8,
                  ),
                ),
                child: Icon(
                  Icons.insights_rounded,
                  size: 18,
                  color: context.colors.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      context.l10n.networkGrowth,
                      style: AppTypography.bodySm.copyWith(
                        fontWeight: FontWeight.w600,
                        color: context.colors.onSurface,
                        fontSize: 14,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      context.tr('last7Days'),
                      style: AppTypography.labelCaps.copyWith(
                        color: context.colors.onSurfaceVariant,
                        fontSize: 10,
                        letterSpacing: 0.3,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(20),
                  onTap: widget.onTap,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: context.colors.surfaceContainerHighest.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: context.colors.glassBorder,
                        width: 0.8,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          context.tr('analytics'),
                          style: AppTypography.labelCaps.copyWith(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: context.colors.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.arrow_outward_rounded,
                          size: 12,
                          color: context.colors.onSurfaceVariant,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Stat Value Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '+${widget.growthCount}',
                style: AppTypography.statsNumber.copyWith(
                  fontSize: 32,
                  fontWeight: FontWeight.w700,
                  color: context.colors.onSurface,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _hoveredIndex != null
                      ? '+${points[_hoveredIndex!].toInt()} on ${_formatDayLabel(days[_hoveredIndex!], context)}'
                      : context.tr('thisWeek'),
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Graphical Chart & Day Labels
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                height: 95,
                child: LayoutBuilder(
                  builder: (context, chartConstraints) {
                    final width = chartConstraints.maxWidth;
                    return GestureDetector(
                      onPanUpdate: (details) {
                        _updateHoverFromOffset(details.localPosition.dx, width);
                      },
                      onPanEnd: (_) => setState(() => _hoveredIndex = null),
                      child: MouseRegion(
                        onHover: (event) {
                          _updateHoverFromOffset(event.localPosition.dx, width);
                        },
                        onExit: (_) => setState(() => _hoveredIndex = null),
                        child: CustomPaint(
                          size: Size(width, 95),
                          painter: _GrowthSparklinePainter(
                            points: points,
                            hoveredIndex: _hoveredIndex,
                            lineColor: context.colors.onSurface.withValues(alpha: 0.85),
                            gridColor: context.colors.glassBorder.withValues(alpha: 0.25),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(7, (i) {
                  final isToday = i == 6;
                  final isHovered = _hoveredIndex == i;
                  return Expanded(
                    child: Center(
                      child: Text(
                        _formatDayLabel(days[i], context),
                        style: AppTypography.labelCaps.copyWith(
                          fontSize: 9.5,
                          fontWeight: isToday || isHovered ? FontWeight.w700 : FontWeight.w500,
                          color: isToday || isHovered
                              ? context.colors.onSurface
                              : context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _updateHoverFromOffset(double dx, double width) {
    if (width <= 0) return;
    final fraction = (dx / width).clamp(0.0, 1.0);
    final idx = (fraction * 6).round().clamp(0, 6);
    if (idx != _hoveredIndex) {
      setState(() => _hoveredIndex = idx);
    }
  }
}

/// Custom painter for smooth Bezier growth sparkline
class _GrowthSparklinePainter extends CustomPainter {
  final List<double> points;
  final int? hoveredIndex;
  final Color lineColor;
  final Color gridColor;

  _GrowthSparklinePainter({
    required this.points,
    required this.hoveredIndex,
    required this.lineColor,
    required this.gridColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty || size.width <= 0 || size.height <= 0) return;

    final maxVal = points.reduce(math.max);
    final effectiveMax = maxVal > 0 ? maxVal : 4.0;
    const verticalPadding = 8.0;
    final usableHeight = size.height - verticalPadding * 2;

    // Draw subtle grid reference lines
    final gridPaint = Paint()
      ..color = gridColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;

    // Horizontal guidelines at 35% and 75% height
    final y1 = verticalPadding + usableHeight * 0.35;
    final y2 = verticalPadding + usableHeight * 0.75;
    _drawDashedLine(canvas, Offset(0, y1), Offset(size.width, y1), gridPaint);
    _drawDashedLine(canvas, Offset(0, y2), Offset(size.width, y2), gridPaint);

    // Compute coordinate points
    final count = points.length;
    final dx = count > 1 ? size.width / (count - 1) : size.width;
    final coords = <Offset>[];

    for (int i = 0; i < count; i++) {
      final x = i * dx;
      final val = points[i];
      final normalized = (val / effectiveMax).clamp(0.0, 1.0);
      final y = size.height - verticalPadding - (normalized * usableHeight);
      coords.add(Offset(x, y));
    }

    // Build smooth cubic Bezier path
    final path = Path();
    path.moveTo(coords[0].dx, coords[0].dy);

    for (int i = 0; i < coords.length - 1; i++) {
      final p0 = coords[i];
      final p1 = coords[i + 1];
      final midX = (p0.dx + p1.dx) / 2;
      path.cubicTo(midX, p0.dy, midX, p1.dy, p1.dx, p1.dy);
    }

    // Fill underneath the curve (monochrome soft gradient fade)
    final fillPath = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    final fillPaint = Paint()
      ..style = PaintingStyle.fill
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Colors.white.withValues(alpha: 0.12),
          Colors.white.withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    canvas.drawPath(fillPath, fillPaint);

    // Stroke the Bezier line
    final linePaint = Paint()
      ..color = lineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(path, linePaint);

    // Draw data points
    final dotPaint = Paint()..style = PaintingStyle.fill;
    final ringPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    for (int i = 0; i < coords.length; i++) {
      final pt = coords[i];
      final isHovered = hoveredIndex == i;
      final isToday = i == count - 1;

      if (isHovered) {
        // Vertical indicator line
        final vertPaint = Paint()
          ..color = lineColor.withValues(alpha: 0.4)
          ..strokeWidth = 1.0
          ..style = PaintingStyle.stroke;
        _drawDashedLine(canvas, Offset(pt.dx, 0), Offset(pt.dx, size.height), vertPaint);

        // Highlight ring & dot
        ringPaint.color = lineColor;
        canvas.drawCircle(pt, 6, ringPaint);
        dotPaint.color = Colors.white;
        canvas.drawCircle(pt, 3.5, dotPaint);
      } else if (isToday) {
        // Today point indicator
        ringPaint.color = lineColor.withValues(alpha: 0.6);
        canvas.drawCircle(pt, 4.5, ringPaint);
        dotPaint.color = lineColor;
        canvas.drawCircle(pt, 2.5, dotPaint);
      } else {
        // Subtle regular point
        dotPaint.color = lineColor.withValues(alpha: 0.55);
        canvas.drawCircle(pt, 2.0, dotPaint);
      }
    }
  }

  void _drawDashedLine(Canvas canvas, Offset p1, Offset p2, Paint paint) {
    const dashWidth = 4.0;
    const dashSpace = 4.0;
    final dx = p2.dx - p1.dx;
    final dy = p2.dy - p1.dy;
    final distance = math.sqrt(dx * dx + dy * dy);
    if (distance <= 0) return;

    final unitX = dx / distance;
    final unitY = dy / distance;
    double current = 0;

    while (current < distance) {
      final segLen = math.min(dashWidth, distance - current);
      final start = Offset(p1.dx + unitX * current, p1.dy + unitY * current);
      final end = Offset(p1.dx + unitX * (current + segLen), p1.dy + unitY * (current + segLen));
      canvas.drawLine(start, end, paint);
      current += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant _GrowthSparklinePainter oldDelegate) {
    return oldDelegate.points != points ||
        oldDelegate.hoveredIndex != hoveredIndex ||
        oldDelegate.lineColor != lineColor ||
        oldDelegate.gridColor != gridColor;
  }
}
