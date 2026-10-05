import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/sub_page_top_bar.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/utils/responsive.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/localization/app_localizations.dart';


class PricingScreen extends StatefulWidget {
  const PricingScreen({super.key});

  @override
  State<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends State<PricingScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // ── Ambient glow top-right (blue) ────────────────────────────────
          Positioned(
            top: -80,
            right: -80,
            child: Container(
              width: 340,
              height: 340,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Color(0x260055FF), // blue/15%
                    Color(0x000B0E14),
                  ],
                ),
              ),
            ),
          ),
          // ── Ambient glow bottom-left (purple) ────────────────────────────
          Positioned(
            bottom: -80,
            left: -120,
            child: Container(
              width: 340,
              height: 340,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Color(0x1FB655FF), // purple/12%
                    Color(0x000B0E14),
                  ],
                ),
              ),
            ),
          ),

          // ── Scrollable content ──────────────────────────────────────────
          SingleChildScrollView(
            padding: EdgeInsets.only(
              top: kToolbarHeight + MediaQuery.of(context).padding.top + 20,
              left: Responsive.pagePadding(context),
              right: Responsive.pagePadding(context),
              bottom: 32,
            ),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: 16),

                Text(
                  context.tr('choosePerfectPlan'),
                  style: AppTypography.displayLgMobile.copyWith(height: 1.1),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

                Consumer(
                  builder: (context, ref, _) {
                    final authState = ref.watch(authProvider);
                    final isGuest = authState.user?.isGuest ?? true;
                    if (!isGuest) return const SizedBox.shrink();
                    return const Padding(
                      padding: EdgeInsets.only(bottom: 24),
                      child: TrialBannerCard(),
                    );
                  },
                ),

                const SizedBox(height: 8),

                // ── Pricing Cards ─────────────────────────────────────────────────
                SectionHeader(
                  icon: Icons.workspace_premium_rounded,
                  label: context.tr('subscriptionPlans'),
                  color: context.colors.primary,
                ),
                const SizedBox(height: 16),
                _FreePlanCard(),
                const SizedBox(height: 24),
                _ProPlanCard(),
                const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

                // ── Feature Comparison Table ───────────────────────────────────────
                const _ComparisonTable(),
                const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

                // ── FAQ ───────────────────────────────────────────────────────────
                const _FaqSection(),
                const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

                // ── Footer CTA ────────────────────────────────────────────────────
                const _FooterCta(),
                const SizedBox(height: 64),
              ],
            ),
            ),
          ),
          ),

          // ── Fixed Top Bar ───────────────────────────────────────────────
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SubPageTopBar(
              onBack: () {
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go(AppRoutes.landing);
                }
              },
            ),
          ),
        ],
      ),
    );
  }

}

// ---------------------------------------------------------------------------
// Pricing Cards
// ---------------------------------------------------------------------------

class _FreePlanCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      padding: EdgeInsets.zero,
      glowColor: context.colors.primary.withValues(alpha: 0.15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.blue.withValues(alpha: 0.25),
                        Colors.blue.withValues(alpha: 0.08),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
                  ),
                  child: const Center(
                    child: Icon(Icons.rocket_launch, color: Colors.blue),
                  ),
                ),
                const SizedBox(height: 24),
                Text(context.tr('freePlanTitle'),
                    style: AppTypography.headlineMd
                        .copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(context.tr('freePlanDesc'),
                    style: AppTypography.bodySm
                        .copyWith(color: context.colors.onSurfaceVariant)),
                const SizedBox(height: 24),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text('\$0',
                        style: AppTypography.displayLg
                            .copyWith(fontWeight: FontWeight.bold)),
                    Text(context.tr('pricePerMo'),
                        style: AppTypography.bodyLg
                            .copyWith(color: context.colors.onSurfaceVariant)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(context.tr('noCreditCardRequired'),
                    style: AppTypography.labelSm
                        .copyWith(color: context.colors.onSurfaceVariant)),
                const SizedBox(height: 32),

                // Zentra-style feature list container
                _ZentraFeatureList(
                  items: [
                    _FeatureItemData(context.tr('dailyEmails'), '500'),
                    _FeatureItemData(context.tr('contactsMax'), context.tr('max100')),
                    _FeatureItemData(context.tr('cloudStorage'), '500 MB'),
                    _FeatureItemData(context.tr('aiMessages'), '20/day'),
                    _FeatureItemData(context.tr('cardScans'), '500/month'),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(32).copyWith(top: 0),
            child: LiquidGlassButton(
              label: context.tr('currentPlan'),
              height: 56,
              onPressed: () {},
            ),
          ),
        ],
      ),
    );
  }
}

class _ProPlanCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      padding: EdgeInsets.zero,
      glowColor: context.colors.secondary.withValues(alpha: 0.3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: context.colors.secondary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Icon(Icons.workspace_premium,
                            color: context.colors.secondary),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFD946EF), Color(0xFF8B5CF6)],
                        ),
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Text(context.tr('limitedTimeOffer'),
                          style: AppTypography.labelCaps
                              .copyWith(color: Colors.white)),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Text(context.tr('professionalPlanTitle'),
                    style: AppTypography.headlineMd
                        .copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(
                    context.tr('professionalPlanDesc'),
                    style: AppTypography.bodySm
                        .copyWith(color: context.colors.onSurfaceVariant)),
                const SizedBox(height: 24),
                Text('\$15',
                    style: AppTypography.headlineSm.copyWith(
                        color: context.colors.onSurfaceVariant,
                        decoration: TextDecoration.lineThrough)),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text('\$6',
                        style: AppTypography.displayLg
                            .copyWith(fontWeight: FontWeight.bold)),
                    Text(context.tr('pricePerMo'),
                        style: AppTypography.bodyLg
                            .copyWith(color: context.colors.onSurfaceVariant)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(context.tr('day14FreeTrial'),
                    style: AppTypography.labelSm
                        .copyWith(color: context.colors.onSurfaceVariant)),
                const SizedBox(height: 32),

                // Zentra-style feature list container
                _ZentraFeatureList(
                  activeColor: context.colors.secondary,
                  items: [
                    _FeatureItemData(context.tr('dailyEmails'), '2,000'),
                    _FeatureItemData(context.tr('contactsMax'), context.tr('unlimitedVal')),
                    _FeatureItemData(context.tr('cloudStorage'), '8 GB'),
                    _FeatureItemData(context.tr('aiMessages'), context.tr('unlimitedVal')),
                    _FeatureItemData(context.tr('cardScans'), context.tr('unlimitedVal')),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(32).copyWith(top: 0),
            child: GradientButton(
              label: context.tr('upgradeNow'),
              height: 56,
              onPressed: () async {
                final checkoutUri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/checkout?plan=professional');
                try {
                  if (await canLaunchUrl(checkoutUri)) {
                    await launchUrl(checkoutUri, mode: LaunchMode.externalApplication);
                    return;
                  }
                } catch (_) {}
                if (context.mounted) {
                  context.push(AppRoutes.quotation);
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureItemData {
  final String label;
  final String value;
  const _FeatureItemData(this.label, this.value);
}

class _ZentraFeatureList extends StatelessWidget {
  final List<_FeatureItemData> items;
  final Color activeColor;

  const _ZentraFeatureList({
    required this.items,
    this.activeColor = const Color(0xFF10B981),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.colors.surfaceContainer.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.glassBorder),
      ),
      child: Column(
        children: [
          for (int i = 0; i < items.length; i++) ...[
            if (i > 0)
              Divider(
                height: 1,
                thickness: 1,
                color: context.colors.glassBorder.withValues(alpha: 0.5),
              ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          items[i].label,
                          style: AppTypography.bodySm.copyWith(
                            fontWeight: FontWeight.bold,
                            color: context.colors.onSurface,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          items[i].value,
                          style: AppTypography.bodySm.copyWith(
                            color: context.colors.onSurfaceVariant,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.check_circle_rounded,
                    color: activeColor,
                    size: 20,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}



// ---------------------------------------------------------------------------
// Comparison Table
// ---------------------------------------------------------------------------

class _ComparisonTable extends StatelessWidget {
  const _ComparisonTable();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          icon: Icons.table_chart_rounded,
          label: context.tr('detailedFeatureBreakdown'),
          color: const Color(0xFF8B5CF6),
        ),
        const SizedBox(height: 24),
        Container(
          decoration: BoxDecoration(
            color: context.colors.surfaceCard.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.colors.glassBorder),
            boxShadow: [
              BoxShadow(
                color: context.colors.onSurface.withValues(alpha: 0.04),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                decoration: BoxDecoration(
                  border:
                      Border(bottom: BorderSide(color: context.colors.glassBorder)),
                ),
                child: Row(
                  children: [
                    Expanded(
                        flex: 2,
                        child: Text(context.tr('featureCol'),
                            style: AppTypography.labelCaps
                                .copyWith(color: context.colors.onSurfaceVariant))),
                    Expanded(
                        flex: 1,
                        child: Text(context.tr('freeCol'),
                            textAlign: TextAlign.center,
                            style: AppTypography.labelCaps
                                .copyWith(color: context.colors.primary))),
                    Expanded(
                        flex: 1,
                        child: Text(context.tr('proCol'),
                            textAlign: TextAlign.center,
                            style: AppTypography.labelCaps
                                .copyWith(color: context.colors.secondary))),
                  ],
                ),
              ),
              // Rows
              _TableRow(context.tr('dailyConnections'), '10/mo', context.tr('unlimitedVal')),
              _TableRow(context.tr('aiMatchScore'), context.tr('basicVal'), context.tr('fullDetailsVal')),
              _TableRow(context.tr('bioRewritesAi'), '1/mo', context.tr('unlimitedVal')),
              _TableRow(context.tr('profileHighlights'), context.tr('noVal'), '${context.tr('yesVal')} (1/mo)'),
              _TableRow(context.tr('portfolioProjects'), '1', '10'),
              _TableRow(context.tr('globalDirectory'), context.tr('yesVal'), context.tr('yesVal')),
              _TableRow(context.tr('smartIntroDrafting'), context.tr('noVal'), context.tr('yesVal')),
              _TableRow(context.tr('crmSync'), context.tr('noVal'), context.tr('yesVal')),
              _TableRow(context.tr('dedicatedSupport'), context.tr('noVal'), context.tr('yesVal'), isLast: true),
            ],
          ),
        ),
      ],
    );
  }
}

class _TableRow extends StatelessWidget {
  final String feature;
  final String freeVal;
  final String proVal;
  final bool isLast;

  const _TableRow(this.feature, this.freeVal, this.proVal,
      {this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : Border(bottom: BorderSide(color: context.colors.glassBorder)),
      ),
      child: Row(
        children: [
          Expanded(
              flex: 2,
              child: Text(feature,
                  style: AppTypography.bodySm
                      .copyWith(fontWeight: FontWeight.w500))),
          Expanded(
            flex: 1,
            child: _TableCellValue(freeVal, false),
          ),
          Expanded(
            flex: 1,
            child: _TableCellValue(proVal, true),
          ),
        ],
      ),
    );
  }
}

class _TableCellValue extends StatelessWidget {
  final String value;
  final bool isPro;
  const _TableCellValue(this.value, this.isPro);

  @override
  Widget build(BuildContext context) {
    if (value == 'No' || value == context.tr('noVal')) {
      return Center(
        child: Icon(Icons.close,
            color: context.colors.onSurfaceVariant.withValues(alpha: 0.5), size: 16),
      );
    }
    if (value == 'Yes' || value.startsWith('Yes') || value == context.tr('yesVal') || value.startsWith(context.tr('yesVal'))) {
      return Center(
        child: Text(
          value,
          textAlign: TextAlign.center,
          style: AppTypography.bodySm.copyWith(
            color: const Color(0xFF10B981),
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }
    return Text(
      value,
      textAlign: TextAlign.center,
      style: AppTypography.bodySm.copyWith(
        color: isPro ? context.colors.secondary : context.colors.onSurfaceVariant,
        fontWeight: isPro ? FontWeight.w600 : FontWeight.normal,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// FAQ Section
// ---------------------------------------------------------------------------

class _FaqSection extends StatelessWidget {
  const _FaqSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          icon: Icons.help_outline_rounded,
          label: context.tr('faqHeading'),
          color: const Color(0xFF10B981),
        ),
        const SizedBox(height: 24),
        _FaqItem(
          question: context.tr('faq1Q'),
          answer: context.tr('faq1A'),
        ),
        _FaqItem(
          question: context.tr('faq2Q'),
          answer: context.tr('faq2A'),
        ),
        _FaqItem(
          question: context.tr('faq3Q'),
          answer: context.tr('faq3A'),
        ),
        _FaqItem(
          question: context.tr('faq4Q'),
          answer: context.tr('faq4A'),
        ),
        _FaqItem(
          question: context.tr('faq5Q'),
          answer: context.tr('faq5A'),
          isLast: true,
        ),
      ],
    );
  }
}

class _FaqItem extends StatefulWidget {
  final String question;
  final String answer;
  final bool isLast;

  const _FaqItem(
      {required this.question, required this.answer, this.isLast = false});

  @override
  State<_FaqItem> createState() => _FaqItemState();
}

class _FaqItemState extends State<_FaqItem> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: widget.isLast
            ? null
            : Border(bottom: BorderSide(color: context.colors.glassBorder)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(vertical: 8),
          iconColor: context.colors.primary,
          collapsedIconColor: context.colors.onSurfaceVariant,
          onExpansionChanged: (val) => setState(() => _isExpanded = val),
          title: Text(
            widget.question,
            style: AppTypography.bodyMd.copyWith(
              fontWeight: FontWeight.w600,
              color: _isExpanded ? context.colors.primary : context.colors.onSurface,

            ),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 24, right: 16),
              child: Text(
                widget.answer,
                style: AppTypography.bodyMd
                    .copyWith(color: context.colors.onSurfaceVariant, height: 1.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Footer CTA
// ---------------------------------------------------------------------------

class _FooterCta extends StatelessWidget {
  const _FooterCta();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: context.colors.surfaceCard,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: context.colors.glassBorder),
        boxShadow: [
          BoxShadow(
            color: context.colors.primary.withValues(alpha: 0.1),
            blurRadius: 40,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            context.tr('readyToGetStarted'),
            style:
                AppTypography.headlineMd.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            context.tr('readyToGetStartedDesc'),
            style: AppTypography.bodySm
                .copyWith(color: context.colors.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          GradientButton(
            label: context.tr('createAccountBtn'),
            height: 56,
            onPressed: () => context.push(AppRoutes.createAccount),
          ),
        ],
      ),
    );
  }
}
