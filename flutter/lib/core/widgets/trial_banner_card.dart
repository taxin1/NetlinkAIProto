import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../router/app_router.dart';
import 'glass_card.dart';

import '../localization/app_localizations.dart';

class TrialBannerCard extends StatelessWidget {
  final String? text;

  const TrialBannerCard({
    super.key,
    this.text,
  });

  @override
  Widget build(BuildContext context) {
    final bannerText = text ?? context.tr('freeTrialDesc');
    return GlassCard(
      borderRadius: BorderRadius.circular(16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      glowColor: context.colors.primary.withValues(alpha: 0.2),
      child: Row(
        children: [
          Icon(Icons.info_outline_rounded, color: context.colors.primary, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              bannerText,
              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
            ),
          ),
          GestureDetector(
            onTap: () => context.go(AppRoutes.createAccount),
            child: Text(
              context.tr('signUp'),
              style: AppTypography.bodySm.copyWith(
                color: context.colors.primary,
                fontWeight: FontWeight.w700,
                decoration: TextDecoration.underline,
                decorationColor: context.colors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
