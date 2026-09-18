import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import '../../../core/widgets/app_toast.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/app_filter_chip.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/widgets/ai_voice_wave_visualizer.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/utils/responsive.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/localization/app_localizations.dart';

class QuotationScreen extends ConsumerStatefulWidget {
  const QuotationScreen({super.key});

  @override
  ConsumerState<QuotationScreen> createState() => _QuotationScreenState();
}

class _QuotationScreenState extends ConsumerState<QuotationScreen> {
  final ScrollController _scrollController = ScrollController();

  final _projectNameController =
      TextEditingController(text: 'Enterprise AI Networking Suite');
  final _budgetController = TextEditingController(text: '\$8,000 - \$15,000');
  final _requirementsController = TextEditingController(
    text:
        'Cross-platform mobile application for executive event matchmaking, automated contact synchronization, and generative AI cold outreach.',
  );

  final GlobalKey _requirementsKey = GlobalKey();
  final GlobalKey _estimatesKey = GlobalKey();
  final GlobalKey _voiceKey = GlobalKey();

  String _activeTab = 'Requirements';

  // Interactive Scope Configuration
  String _selectedProjectType = 'Cross-Platform Suite';
  String _selectedTimeline = '1-2 Months (MVP)';
  final Set<String> _selectedFeatures = {
    'AI Workflow Automation',
    'Cross-Platform iOS & Android',
    'Authentication & Roles',
    'Real-time Cloud Sync',
  };

  int _selectedTierIndex = 1; // 0: Starter, 1: Pro Suite, 2: Enterprise

  bool _isAutoScrolling = false;

  String _getProjectTypeLabel(BuildContext context, String type) {
    switch (type) {
      case 'Cross-Platform Suite':
        return context.tr('typeCrossPlatformSuite');
      case 'Mobile App (iOS/Android)':
        return context.tr('typeMobileApp');
      case 'AI Agent System':
        return context.tr('typeAiAgentSystem');
      case 'Web Portal / SaaS':
        return context.tr('typeWebPortalSaas');
      case 'Enterprise Cloud Backend':
        return context.tr('typeEnterpriseCloudBackend');
      default:
        return type;
    }
  }

  String _getTimelineLabel(BuildContext context, String tl) {
    switch (tl) {
      case '2-4 Weeks (Sprint)':
        return context.tr('timelineSprint');
      case '1-2 Months (MVP)':
        return context.tr('timelineMvp');
      case '3-6 Months (Full Scale)':
        return context.tr('timelineFullScale');
      case 'Ongoing SLA':
        return context.tr('timelineOngoingSla');
      default:
        return tl;
    }
  }

  String _getFeatureLabel(BuildContext context, String f) {
    switch (f) {
      case 'AI Workflow Automation':
        return context.tr('featAiWorkflow');
      case 'Cross-Platform iOS & Android':
        return context.tr('featCrossPlatform');
      case 'Authentication & Roles':
        return context.tr('featAuthRoles');
      case 'Real-time Cloud Sync':
        return context.tr('featRealtimeSync');
      case 'Payment Gateway Integration':
        return context.tr('featPaymentGateway');
      case 'Offline-First Local Storage':
        return context.tr('featOfflineStorage');
      case 'Admin Metrics Dashboard':
        return context.tr('featAdminDashboard');
      case 'Voice Assistant Capabilities':
        return context.tr('featVoiceAssistant');
      default:
        return f;
    }
  }

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _projectNameController.dispose();
    _budgetController.dispose();
    _requirementsController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isAutoScrolling || !mounted || !_scrollController.hasClients) return;

    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentPixels = _scrollController.position.pixels;

    final voiceCtx = _voiceKey.currentContext;
    final estimatesCtx = _estimatesKey.currentContext;

    double? voiceY;
    double? estimatesY;

    if (voiceCtx != null) {
      final box = voiceCtx.findRenderObject() as RenderBox?;
      if (box != null && box.hasSize) {
        voiceY = box.localToGlobal(Offset.zero).dy;
      }
    }

    if (estimatesCtx != null) {
      final box = estimatesCtx.findRenderObject() as RenderBox?;
      if (box != null && box.hasSize) {
        estimatesY = box.localToGlobal(Offset.zero).dy;
      }
    }

    final screenHeight = MediaQuery.of(context).size.height;
    final threshold = screenHeight * 0.45;

    String targetTab = 'Requirements';
    if ((maxScroll > 0 && currentPixels >= maxScroll - 80) ||
        (voiceY != null && voiceY <= screenHeight * 0.65)) {
      targetTab = 'Voice AI';
    } else if (estimatesY != null && estimatesY <= threshold) {
      targetTab = 'Estimates';
    } else {
      targetTab = 'Requirements';
    }

    if (targetTab != _activeTab) {
      setState(() => _activeTab = targetTab);
    }
  }

  void _scrollTo(GlobalKey key, String tabLabel) {
    setState(() => _activeTab = tabLabel);
    _isAutoScrolling = true;
    final targetContext = key.currentContext;
    if (targetContext != null) {
      Scrollable.ensureVisible(
        targetContext,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      ).then((_) {
        Future.delayed(const Duration(milliseconds: 100), () {
          if (mounted) _isAutoScrolling = false;
        });
      });
    } else {
      _isAutoScrolling = false;
    }
  }

  int get _calculatedBaseCost {
    switch (_selectedProjectType) {
      case 'Mobile App (iOS/Android)':
        return 4500;
      case 'AI Agent System':
        return 6000;
      case 'Web Portal / SaaS':
        return 4000;
      case 'Enterprise Cloud Backend':
        return 5000;
      default:
        return 7500; // Cross-Platform Suite
    }
  }

  int get _calculatedFeaturesCost {
    return _selectedFeatures.length * 1200;
  }

  int get _totalEstimatedMin => _calculatedBaseCost + _calculatedFeaturesCost;
  int get _totalEstimatedMax => (_totalEstimatedMin * 1.35).round();

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isGuest = authState.user?.isGuest ?? true;

    return Stack(
      children: [
        SingleChildScrollView(
          controller: _scrollController,
          padding: EdgeInsets.only(
            top: Responsive.topPadding(context),
            left: Responsive.pagePadding(context),
            right: Responsive.pagePadding(context),
            bottom: 120,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Page Heading (Standardized) ──
                  PopInItem(
                    index: 0,
                    child: Center(
                      child: Text(
                        context.tr('aiQuotationBuilder'),
                        style: AppTypography.headlineMd,
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Trial Banner (Shows when not signed in) ──
                  if (isGuest) ...[
                    const PopInItem(
                      index: 1,
                      child: TrialBannerCard(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Section 1: Project Scope & Requirements ──
                  SectionHeader(
                    icon: Icons.assignment_outlined,
                    label: context.tr('scopeAndRequirements'),
                    color: context.colors.primary,
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    key: _requirementsKey,
                    index: isGuest ? 2 : 1,
                    child: _buildRequirementsSection(context),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 2: Cost Breakdown & Tier Estimator ──
                  SectionHeader(
                    icon: Icons.calculate_outlined,
                    label: context.tr('costEstimatorTiers'),
                    color: const Color(0xFF10B981),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    key: _estimatesKey,
                    index: isGuest ? 3 : 2,
                    child: _buildCostEstimatorSection(context),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 3: Voice Requirements Assistant ──
                  SectionHeader(
                    icon: Icons.mic_rounded,
                    label: context.tr('voiceAssistant'),
                    color: const Color(0xFF8B5CF6),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    key: _voiceKey,
                    index: isGuest ? 4 : 3,
                    child: _buildVoiceAssistantSection(context),
                  ),
                ],
              ),
            ),
          ),
        ),

        // ── Floating Liquid Glass Bottom Navigation Bar ──
        FloatingLiquidGlassNavBar(
          activeTabLabel: _activeTab == 'Requirements'
              ? context.tr('requirements')
              : _activeTab == 'Estimates'
                  ? context.tr('estimates')
                  : context.tr('voiceAi'),
          items: [
            FloatingNavItem(
              label: context.tr('requirements'),
              icon: Icons.description_outlined,
              activeIcon: Icons.description_rounded,
              onTap: () => _scrollTo(_requirementsKey, 'Requirements'),
            ),
            FloatingNavItem(
              label: context.tr('estimates'),
              icon: Icons.payments_outlined,
              activeIcon: Icons.payments_rounded,
              onTap: () => _scrollTo(_estimatesKey, 'Estimates'),
            ),
            FloatingNavItem(
              label: context.tr('voiceAi'),
              icon: Icons.mic_none_outlined,
              activeIcon: Icons.mic_rounded,
              onTap: () => _scrollTo(_voiceKey, 'Voice AI'),
            ),
          ],
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: REQUIREMENTS & SCOPE BUILDER
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildRequirementsSection(BuildContext context) {
    const projectTypes = [
      'Cross-Platform Suite',
      'Mobile App (iOS/Android)',
      'AI Agent System',
      'Web Portal / SaaS',
      'Enterprise Cloud Backend',
    ];

    const timelineOptions = [
      '2-4 Weeks (Sprint)',
      '1-2 Months (MVP)',
      '3-6 Months (Full Scale)',
      'Ongoing SLA',
    ];

    const featureOptions = [
      'AI Workflow Automation',
      'Cross-Platform iOS & Android',
      'Authentication & Roles',
      'Real-time Cloud Sync',
      'Payment Gateway Integration',
      'Offline-First Local Storage',
      'Admin Metrics Dashboard',
      'Voice Assistant Capabilities',
    ];

    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('projectScopeSpecs'),
            style: AppTypography.headlineSm.copyWith(fontSize: 18),
          ),
          const SizedBox(height: 20),

          // Project Name
          _buildTextField(
            context,
            label: context.tr('projectName'),
            icon: Icons.description_outlined,
            isRequired: true,
            hint: context.tr('projectNameHint'),
            controller: _projectNameController,
          ),
          const SizedBox(height: 18),

          // Project Type Filter Chips
          Text(
            context.tr('projectArchType'),
            style: AppTypography.labelSm.copyWith(
              color: context.colors.onSurfaceVariant,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: projectTypes.map((type) {
              return AppFilterChip(
                label: _getProjectTypeLabel(context, type),
                selected: _selectedProjectType == type,
                onSelected: (_) => setState(() => _selectedProjectType = type),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),

          // Expected Timeline
          Text(
            context.tr('targetTimeline'),
            style: AppTypography.labelSm.copyWith(
              color: context.colors.onSurfaceVariant,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: timelineOptions.map((tl) {
              return AppFilterChip(
                label: _getTimelineLabel(context, tl),
                selected: _selectedTimeline == tl,
                onSelected: (_) => setState(() => _selectedTimeline = tl),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),

          // Capabilities & Features Toggles
          Text(
            context.tr('coreDeliverablesFeatures'),
            style: AppTypography.labelSm.copyWith(
              color: context.colors.onSurfaceVariant,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: featureOptions.map((feature) {
              final isSelected = _selectedFeatures.contains(feature);
              return AppFilterChip(
                label: _getFeatureLabel(context, feature),
                selected: isSelected,
                onSelected: (val) {
                  setState(() {
                    if (val) {
                      _selectedFeatures.add(feature);
                    } else {
                      _selectedFeatures.remove(feature);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 18),

          // Estimated Budget
          _buildTextField(
            context,
            label: context.tr('estimatedBudgetRange'),
            icon: Icons.payments_outlined,
            isRequired: false,
            hint: context.tr('estimatedBudgetHint'),
            controller: _budgetController,
          ),
          const SizedBox(height: 18),

          // Client Needs & Detailed Requirements
          _buildTextField(
            context,
            label: context.tr('detailedRequirementsGoals'),
            icon: Icons.psychology_outlined,
            isRequired: true,
            hint: context.tr('detailedRequirementsHint'),
            controller: _requirementsController,
            maxLines: 4,
          ),
          const SizedBox(height: 24),

          // Action Buttons (Same-sized capsule buttons)
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              GradientButton(
                label: context.tr('calculateLiveEstimate'),
                icon: Icons.auto_awesome_rounded,
                height: 44,
                maxWidth: 210,
                onPressed: () => _scrollTo(_estimatesKey, 'Estimates'),
              ),
              LiquidGlassButton(
                label: context.tr('voiceCapture'),
                icon: Icons.mic_rounded,
                height: 44,
                maxWidth: 160,
                onPressed: () => _scrollTo(_voiceKey, 'Voice AI'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(
    BuildContext context, {
    required String label,
    required IconData icon,
    required bool isRequired,
    required String hint,
    required TextEditingController controller,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 15, color: context.colors.primary),
            const SizedBox(width: 8),
            Text(
              label,
              style: AppTypography.labelSm.copyWith(
                color: context.colors.onSurface,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (isRequired)
              Text(' *',
                  style: AppTypography.labelSm.copyWith(
                    color: const Color(0xFFEF4444),
                    fontSize: 12,
                  )),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: context.colors.surface.withValues(alpha: 0.25),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.colors.glassBorder),
          ),
          child: TextField(
            controller: controller,
            maxLines: maxLines,
            style: AppTypography.bodyMd.copyWith(color: context.colors.onSurface),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: AppTypography.bodySm.copyWith(
                color: context.colors.onSurfaceVariant.withValues(alpha: 0.5),
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: COST ESTIMATOR & TIERED COMPARISON
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildCostEstimatorSection(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final isNarrow = constraints.maxWidth < 500;
              final titleWidget = Text(
                context.tr('dynamicCostBreakdown'),
                style: AppTypography.headlineSm.copyWith(fontSize: 18),
              );

              final priceBadge = Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      context.colors.primary.withValues(alpha: 0.2),
                      const Color(0xFF10B981).withValues(alpha: 0.2),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: context.colors.primary.withValues(alpha: 0.4)),
                ),
                child: Text(
                  '\$$_totalEstimatedMin - \$$_totalEstimatedMax',
                  style: AppTypography.headlineSm.copyWith(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              );

              if (isNarrow) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    titleWidget,
                    const SizedBox(height: 12),
                    priceBadge,
                  ],
                );
              }

              return Row(
                children: [
                  Expanded(child: titleWidget),
                  const SizedBox(width: 12),
                  priceBadge,
                ],
              );
            },
          ),
          const SizedBox(height: 20),

          // Live Cost Items
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: context.colors.surface.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: context.colors.glassBorder),
            ),
            child: Column(
              children: [
                _buildCostItemRow(context, '${context.tr('baseEngineering')} (${_getProjectTypeLabel(context, _selectedProjectType)})', '\$$_calculatedBaseCost'),
                const Divider(height: 16, thickness: 0.5),
                _buildCostItemRow(context, '${context.tr('selectedFeaturesLabel')} (${_selectedFeatures.length} ${context.tr('modulesLabel')})', '\$$_calculatedFeaturesCost'),
                const Divider(height: 16, thickness: 0.5),
                _buildCostItemRow(context, context.tr('archReviewAiOpt'), '\$1,500', isAccent: true),
                const Divider(height: 16, thickness: 0.5),
                _buildCostItemRow(context, context.tr('targetTimeline'), _getTimelineLabel(context, _selectedTimeline)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Three Tier Cards
          Text(
            context.tr('recommendedPackages'),
            style: AppTypography.labelSm.copyWith(
              color: context.colors.onSurfaceVariant,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),

          LayoutBuilder(
            builder: (context, constraints) {
              final isDesktop = constraints.maxWidth > 700;
              final width = isDesktop ? (constraints.maxWidth - 24) / 3 : constraints.maxWidth;

              final tiers = [
                _buildTierCard(
                  context,
                  width: width,
                  index: 0,
                  title: context.tr('tierStarterTitle'),
                  price: '\$${(_totalEstimatedMin * 0.75).round()}',
                  subtitle: context.tr('tierStarterSub'),
                  features: [
                    context.tr('tierStarterF1'),
                    context.tr('tierStarterF2'),
                    context.tr('tierStarterF3'),
                    context.tr('tierStarterF4'),
                  ],
                ),
                _buildTierCard(
                  context,
                  width: width,
                  index: 1,
                  title: context.tr('tierProTitle'),
                  price: '\$$_totalEstimatedMin',
                  subtitle: context.tr('tierProSub'),
                  isRecommended: true,
                  features: [
                    context.tr('tierProF1'),
                    context.tr('tierProF2'),
                    context.tr('tierProF3'),
                    context.tr('tierProF4'),
                  ],
                ),
                _buildTierCard(
                  context,
                  width: width,
                  index: 2,
                  title: context.tr('tierEnterpriseTitle'),
                  price: '\$${(_totalEstimatedMax * 1.4).round()}',
                  subtitle: context.tr('tierEnterpriseSub'),
                  features: [
                    context.tr('tierEntF1'),
                    context.tr('tierEntF2'),
                    context.tr('tierEntF3'),
                    context.tr('tierEntF4'),
                  ],
                ),
              ];

              return isDesktop
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        tiers[0],
                        const SizedBox(width: 12),
                        tiers[1],
                        const SizedBox(width: 12),
                        tiers[2],
                      ],
                    )
                  : Column(
                      children: [
                        tiers[0],
                        const SizedBox(height: 14),
                        tiers[1],
                        const SizedBox(height: 14),
                        tiers[2],
                      ],
                    );
            },
          ),
          const SizedBox(height: 24),

          // Primary Actions (Same-sized capsule buttons)
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              GradientButton(
                label: context.tr('generateOfficialQuotation'),
                icon: Icons.auto_awesome_rounded,
                height: 44,
                maxWidth: 230,
                onPressed: _showQuotationSummaryDialog,
              ),
              LiquidGlassButton(
                label: context.tr('shareSpecs'),
                icon: Icons.share_rounded,
                height: 44,
                maxWidth: 150,
                onPressed: () {
                  Clipboard.setData(ClipboardData(
                      text:
                          '${context.tr('quotationSummaryCopyHeader')} ${_projectNameController.text}:\n${context.tr('quotationTierLabel')}: ${_selectedTierIndex == 0 ? context.tr('tierStarterTitle') : _selectedTierIndex == 1 ? context.tr('tierProTitle') : context.tr('tierEnterpriseTitle')}\n${context.tr('quotationEstimateLabel')}: \$$_totalEstimatedMin - \$$_totalEstimatedMax\n${context.tr('quotationTimelineLabel')}: ${_getTimelineLabel(context, _selectedTimeline)}',
                  ));
                  AppToast.show(context, context.tr('quotationCopiedToast'));
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCostItemRow(BuildContext context, String title, String value, {bool isAccent = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: AppTypography.bodySm.copyWith(
            color: context.colors.onSurfaceVariant,
          ),
        ),
        Text(
          value,
          style: AppTypography.bodyMd.copyWith(
            color: isAccent ? context.colors.primary : context.colors.onSurface,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildTierCard(
    BuildContext context, {
    required double width,
    required int index,
    required String title,
    required String price,
    required String subtitle,
    required List<String> features,
    bool isRecommended = false,
  }) {
    final isSelected = _selectedTierIndex == index;

    return InkWell(
      onTap: () => setState(() => _selectedTierIndex = index),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: width,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? context.colors.primary.withValues(alpha: 0.12)
              : context.colors.surface.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? context.colors.primary
                : isRecommended
                    ? context.colors.primary.withValues(alpha: 0.5)
                    : context.colors.glassBorder,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isRecommended) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: context.colors.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  context.tr('mostPopular'),
                  style: AppTypography.labelSm.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 9,
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
            Text(
              title,
              style: AppTypography.headlineSm.copyWith(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              price,
              style: AppTypography.headlineMd.copyWith(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: isSelected ? context.colors.primary : context.colors.onSurface,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: AppTypography.bodySm.copyWith(
                color: context.colors.onSurfaceVariant.withValues(alpha: 0.8),
                fontSize: 11,
              ),
            ),
            const SizedBox(height: 12),
            ...features.map((f) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Icon(Icons.check_circle_rounded, size: 14, color: context.colors.primary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        f,
                        style: AppTypography.bodySm.copyWith(fontSize: 11),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: VOICE ASSISTANT REQUIREMENTS CAPTURE
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildVoiceAssistantSection(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              context.tr('aiVoiceRequirementsAssistant'),
              style: AppTypography.headlineSm.copyWith(fontSize: 18),
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              context.tr('voiceVisionDesc'),
              style: AppTypography.bodySm.copyWith(
                color: context.colors.onSurfaceVariant,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Interactive Voice Wave Card
          const AiVoiceWaveCard(height: 350),
          const SizedBox(height: 16),

          // Quick prompt auto-fill chips
          Text(
            context.tr('orTapPromptPrefill'),
            style: AppTypography.labelSm.copyWith(
              color: context.colors.onSurfaceVariant,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ActionChip(
                label: Text(context.tr('promptB2bCrm')),
                onPressed: () {
                  setState(() {
                    _projectNameController.text = context.tr('promptB2bCrm');
                    _selectedProjectType = 'Cross-Platform Suite';
                    _requirementsController.text = context.tr('promptB2bCrmDesc');
                  });
                },
              ),
              ActionChip(
                label: Text(context.tr('promptFintechPortal')),
                onPressed: () {
                  setState(() {
                    _projectNameController.text = context.tr('promptFintechPortal');
                    _selectedProjectType = 'Web Portal / SaaS';
                    _requirementsController.text = context.tr('promptFintechPortalDesc');
                  });
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODALS & DIALOGS: QUOTATION SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  void _showQuotationSummaryDialog() {
    final tierName = _selectedTierIndex == 0
        ? context.tr('tierStarterTitle')
        : _selectedTierIndex == 1
            ? context.tr('tierProTitle')
            : context.tr('tierEnterpriseTitle');

    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: context.colors.surfaceCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: context.colors.glassBorder),
        ),
        title: Text(
          context.tr('officialQuotationSummary'),
          style: AppTypography.headlineSm.copyWith(fontSize: 18),
        ),
        content: SizedBox(
          width: 500,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _projectNameController.text,
                  style: AppTypography.headlineSm.copyWith(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${context.tr('selectedPackagePrefix')} $tierName',
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: context.colors.surface.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: context.colors.glassBorder),
                  ),
                  child: Column(
                    children: [
                      _buildCostItemRow(dialogCtx, context.tr('architecture'), _getProjectTypeLabel(dialogCtx, _selectedProjectType)),
                      const SizedBox(height: 8),
                      _buildCostItemRow(dialogCtx, context.tr('targetTimeline'), _getTimelineLabel(dialogCtx, _selectedTimeline)),
                      const SizedBox(height: 8),
                      _buildCostItemRow(dialogCtx, context.tr('modulesIncluded'), '${_selectedFeatures.length} ${context.tr('deliverablesCount')}'),
                      const Divider(height: 16),
                      _buildCostItemRow(
                        dialogCtx,
                        context.tr('estimatedInvestment'),
                        '\$$_totalEstimatedMin - \$$_totalEstimatedMax',
                        isAccent: true,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  context.tr('requirementsOverview'),
                  style: AppTypography.labelSm.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  _requirementsController.text,
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: LiquidGlassButton(
                  label: context.tr('close'),
                  height: 44,
                  onPressed: () => Navigator.pop(dialogCtx),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GradientButton(
                  label: context.tr('submitToCognisor'),
                  icon: Icons.send_rounded,
                  height: 44,
                  onPressed: () async {
                    Navigator.pop(dialogCtx);
                    AppToast.show(context, context.tr('submittingQuotation'), type: ToastType.info);

                    final user = ref.read(authProvider).user;
                    final payload = {
                      'projectName': _projectNameController.text.trim(),
                      'projectBudget': '\$$_totalEstimatedMin - \$$_totalEstimatedMax',
                      'clientNeeds': _requirementsController.text.trim(),
                      'tier': tierName,
                      'timeline': _selectedTimeline,
                      'modules': _selectedFeatures.toList(),
                      'userEmail': user?.email ?? 'guest@netlink.ai',
                    };

                    try {
                      final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/quotation');
                      await http
                          .post(
                            uri,
                            headers: {'Content-Type': 'application/json'},
                            body: jsonEncode(payload),
                          )
                          .timeout(const Duration(seconds: 5));
                    } catch (_) {}

                    if (user != null && !user.isGuest) {
                      try {
                        await SupabaseService.client.from('quotation_requests').insert({
                          'user_id': user.id,
                          'project_name': _projectNameController.text.trim(),
                          'budget': '\$$_totalEstimatedMin - \$$_totalEstimatedMax',
                          'needs': _requirementsController.text.trim(),
                          'tier': tierName,
                        });
                      } catch (_) {}
                    }

                    if (!mounted) return;
                    AppToast.show(context, context.tr('quotationSentToast'), type: ToastType.success);
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
