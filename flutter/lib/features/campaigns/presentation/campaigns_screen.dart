import 'package:flutter/material.dart';
import '../../../core/widgets/app_toast.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/tour/tour_controller.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/animated_glass_icon_button.dart';
import '../../../core/widgets/app_filter_chip.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/campaign_model.dart';
import '../providers/campaigns_provider.dart';
import '../../../core/localization/app_localizations.dart';

class CampaignsScreen extends ConsumerStatefulWidget {
  const CampaignsScreen({super.key});

  @override
  ConsumerState<CampaignsScreen> createState() => _CampaignsScreenState();
}

class _CampaignsScreenState extends ConsumerState<CampaignsScreen> {
  final GlobalKey _createSectionKey = GlobalKey();
  final GlobalKey _campaignsSectionKey = GlobalKey();
  final ScrollController _scrollController = ScrollController();

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _purposeController = TextEditingController();
  final TextEditingController _subjectController = TextEditingController();
  final TextEditingController _contactSearchController = TextEditingController();
  final TextEditingController _campaignSearchController = TextEditingController();

  String _activeTab = 'Create';
  bool _isAutoScrolling = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  /// Updates the active navbar tab based on which section is most visible.
  void _onScroll() {
    if (_isAutoScrolling || !mounted || !_scrollController.hasClients) return;

    final createCtx = _createSectionKey.currentContext;
    final campaignsCtx = _campaignsSectionKey.currentContext;
    if (createCtx == null || campaignsCtx == null) return;

    final createBox = createCtx.findRenderObject() as RenderBox?;
    final campaignsBox = campaignsCtx.findRenderObject() as RenderBox?;
    if (createBox == null || campaignsBox == null) return;

    final screenH = MediaQuery.of(context).size.height;
    final campaignsY = campaignsBox.localToGlobal(Offset.zero).dy;

    // The section whose top is closest to (but not past) the middle of the screen wins
    final mid = screenH / 2;
    final newTab = (campaignsY <= mid) ? 'Campaigns' : 'Create';
    if (newTab != _activeTab) {
      setState(() => _activeTab = newTab);
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _nameController.dispose();
    _purposeController.dispose();
    _subjectController.dispose();
    _contactSearchController.dispose();
    _campaignSearchController.dispose();
    super.dispose();
  }

  void _scrollTo(GlobalKey key, String tabLabel) {
    setState(() => _activeTab = tabLabel);
    final context = key.currentContext;
    if (context != null) {
      _isAutoScrolling = true;
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      ).then((_) {
        Future.delayed(const Duration(milliseconds: 150), () {
          if (mounted) _isAutoScrolling = false;
        });
      });
    }
  }

  InputDecoration _inputDecoration(BuildContext context, String hint, {Widget? suffixIcon}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: AppTypography.bodySm.copyWith(
        color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
      ),
      filled: true,
      fillColor: context.colors.surface.withValues(alpha: 0.25),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      suffixIcon: suffixIcon,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: context.colors.glassBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: context.colors.glassBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: context.colors.primary),
      ),
    );
  }

  Future<void> _handleGenerateAll() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      AppToast.show(context, context.tr('enterCampaignNameFirst'));
      return;
    }
    final content = await ref.read(campaignsProvider.notifier).generateAll(name);
    if (content != null) {
      setState(() {
        if (content['purpose'] != null) _purposeController.text = content['purpose']!;
        if (content['subject'] != null) _subjectController.text = content['subject']!;
      });
    }
  }

  Future<void> _handleGeneratePurpose() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      AppToast.show(context, context.tr('enterCampaignNameFirst'));
      return;
    }
    final purpose = await ref.read(campaignsProvider.notifier).generatePurpose(name);
    if (purpose != null) {
      setState(() => _purposeController.text = purpose);
    }
  }

  Future<void> _handleGenerateSubject() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      AppToast.show(context, context.tr('enterCampaignNameFirst'));
      return;
    }
    final subject = await ref.read(campaignsProvider.notifier).generateSubject(
          name,
          _purposeController.text.trim(),
        );
    if (subject != null) {
      setState(() => _subjectController.text = subject);
    }
  }

  Future<void> _handleCreateCampaign() async {
    final success = await ref.read(campaignsProvider.notifier).createCampaign(
          name: _nameController.text.trim(),
          purpose: _purposeController.text.trim(),
          subject: _subjectController.text.trim(),
        );

    if (success && mounted) {
      _nameController.clear();
      _purposeController.clear();
      _subjectController.clear();
      _scrollTo(_campaignsSectionKey, 'Campaigns');
    }
  }

  String _localizeCampaignMessage(BuildContext context, String msg) {
    if (!context.isJapanese) return msg;
    if (msg == 'Please fill in all campaign fields') return context.tr('pleaseFillAllCampaignFields');
    if (msg == 'Please select at least one recipient contact') return context.tr('pleaseSelectRecipient');
    if (msg == 'Campaign deleted.') return context.tr('campaignDeleted');
    if (msg.startsWith('Campaign "') && msg.endsWith('" created successfully!')) {
      final name = msg.substring(10, msg.length - 23);
      return 'キャンペーン「$name」が正常に作成されました！';
    }
    if (msg.startsWith('Campaign "') && msg.endsWith('" finished sending successfully!')) {
      final name = msg.substring(10, msg.length - 32);
      return 'キャンペーン「$name」の送信が完了しました！';
    }
    if (msg.startsWith('Failed to create campaign')) return 'キャンペーンの作成に失敗しました';
    if (msg.startsWith('Failed to delete campaign')) return 'キャンペーンの削除に失敗しました';
    if (msg.startsWith('Error running campaign')) return 'キャンペーンの実行中にエラーが発生しました';
    return msg;
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(campaignsProvider);
    final isGuest = ref.watch(authProvider).user?.isGuest ?? true;

    // Listen for error or success snackbars
    ref.listen<CampaignsState>(campaignsProvider, (prev, next) {
      if (next.errorMessage != null && next.errorMessage != prev?.errorMessage) {
        AppToast.show(context, _localizeCampaignMessage(context, next.errorMessage!), type: ToastType.error);
        ref.read(campaignsProvider.notifier).clearMessages();
      }
      if (next.successMessage != null && next.successMessage != prev?.successMessage) {
        AppToast.show(context, _localizeCampaignMessage(context, next.successMessage!), type: ToastType.success);
        ref.read(campaignsProvider.notifier).clearMessages();
      }
    });

    final targetContacts = state.filteredContacts(_contactSearchController.text);

    return Stack(
      children: [
        SingleChildScrollView(
          controller: _scrollController,
          padding: EdgeInsets.only(
            top: Responsive.topPadding(context),
            left: Responsive.pagePadding(context),
            right: Responsive.pagePadding(context),
            bottom: 100, // Space for floating bottom nav
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── Page Heading (Standardized, Center-Aligned, No Extra Subtitle) ──
                  PopInItem(
                    index: 0,
                    child: Center(
                      child: Text(
                        context.l10n.campaigns,
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

                  // ── Section 1: Create Email Campaign ──
                  Container(
                    key: _createSectionKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SectionHeader(
                          icon: Icons.bolt_rounded,
                          label: context.tr('createCampaign'),
                          color: context.colors.primary,
                        ),
                        const SizedBox(height: 16),
                        PopInItem(
                          index: isGuest ? 2 : 1,
                          child: GlassCard(
                        key: TourTargetKeys.campaignsFeature,
                        borderRadius: BorderRadius.circular(20),
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Header Row (Responsive for desktop & narrow screens)
                            LayoutBuilder(
                              builder: (context, constraints) {
                                final isNarrow = constraints.maxWidth < 490;
                                final titleWidget = Text(
                                  context.tr('createEmailCampaign'),
                                  style: AppTypography.headlineSm.copyWith(fontSize: 17),
                                );

                                final generateBtn = GradientButton(
                                  label: state.isGeneratingAll ? context.tr('generating') : context.tr('generateAllAi'),
                                  icon: Icons.auto_awesome_rounded,
                                  height: 40,
                                  maxWidth: 200,
                                  isLoading: state.isGeneratingAll,
                                  onPressed: state.isGeneratingAll ? null : _handleGenerateAll,
                                );

                                if (isNarrow) {
                                  return Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      titleWidget,
                                      const SizedBox(height: 14),
                                      generateBtn,
                                    ],
                                  );
                                }

                                return Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    titleWidget,
                                    generateBtn,
                                  ],
                                );
                              },
                            ),
                            const SizedBox(height: 20),

                            // Campaign Name
                            Text(context.tr('campaignName'), style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _nameController,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: _inputDecoration(
                                context,
                                context.tr('campaignNameHint'),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Email Purpose
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(context.tr('emailPurpose'),
                                      style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w600)),
                                ),
                                const SizedBox(width: 8),
                                AnimatedGlassIconButton(
                                  label: state.isGeneratingPurpose ? context.tr('generating') : context.tr('aiGenerate'),
                                  icon: Icons.auto_awesome_rounded,
                                  size: 30,
                                  iconSize: 14,
                                  fontSize: 12,
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  iconColor: context.colors.primary,
                                  isLoading: state.isGeneratingPurpose,
                                  onPressed: state.isGeneratingPurpose ? null : _handleGeneratePurpose,
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _purposeController,
                              maxLines: 3,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: _inputDecoration(
                                context,
                                context.tr('emailPurposeHint'),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Email Subject
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(context.tr('emailSubjectLine'),
                                      style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w600)),
                                ),
                                const SizedBox(width: 8),
                                AnimatedGlassIconButton(
                                  label: state.isGeneratingSubject ? context.tr('generating') : context.tr('aiGenerate'),
                                  icon: Icons.auto_awesome_rounded,
                                  size: 30,
                                  iconSize: 14,
                                  fontSize: 12,
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  iconColor: context.colors.primary,
                                  isLoading: state.isGeneratingSubject,
                                  onPressed: state.isGeneratingSubject ? null : _handleGenerateSubject,
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _subjectController,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: _inputDecoration(
                                context,
                                context.tr('emailSubjectHint'),
                              ),
                            ),
                            const SizedBox(height: 22),

                            // ── Recipient Contacts Picker ──
                            Wrap(
                              spacing: 10,
                              runSpacing: 8,
                              alignment: WrapAlignment.spaceBetween,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                Text(
                                  '${context.tr('selectRecipients')} (${state.selectedContactIds.length} ${context.tr('selectedCount')})',
                                  style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w600),
                                ),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    AnimatedGlassIconButton(
                                      label: context.tr('selectAll'),
                                      icon: Icons.done_all_rounded,
                                      size: 28,
                                      iconSize: 13,
                                      fontSize: 11,
                                      padding: const EdgeInsets.symmetric(horizontal: 10),
                                      iconColor: context.colors.primary,
                                      onPressed: () => ref.read(campaignsProvider.notifier).selectAllContacts(),
                                    ),
                                    if (state.selectedContactIds.isNotEmpty) ...[
                                      const SizedBox(width: 6),
                                      AnimatedGlassIconButton(
                                        label: context.tr('deselect'),
                                        icon: Icons.clear_rounded,
                                        size: 28,
                                        iconSize: 13,
                                        fontSize: 11,
                                        padding: const EdgeInsets.symmetric(horizontal: 10),
                                        iconColor: context.colors.onSurfaceVariant,
                                        onPressed: () => ref.read(campaignsProvider.notifier).clearContactSelection(),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Contact Search Input
                            TextField(
                              controller: _contactSearchController,
                              onChanged: (_) => setState(() {}),
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: _inputDecoration(
                                context,
                                context.tr('searchContactsByHint'),
                                suffixIcon: Icon(Icons.search_rounded, size: 18, color: context.colors.onSurfaceVariant),
                              ),
                            ),
                            const SizedBox(height: 10),

                            // Contacts Scrollable List
                            Container(
                              constraints: const BoxConstraints(maxHeight: 220),
                              decoration: BoxDecoration(
                                color: context.colors.surface.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: context.colors.glassBorder),
                              ),
                              child: targetContacts.isEmpty
                                  ? Center(
                                      child: Padding(
                                        padding: const EdgeInsets.all(20),
                                        child: Text(
                                          context.tr('noContactsFound'),
                                          style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
                                        ),
                                      ),
                                    )
                                  : ListView.separated(
                                      shrinkWrap: true,
                                      padding: const EdgeInsets.symmetric(vertical: 6),
                                      itemCount: targetContacts.length,
                                      separatorBuilder: (_, __) => Divider(
                                        height: 1,
                                        thickness: 0.6,
                                        color: context.colors.glassBorder.withValues(alpha: 0.4),
                                      ),
                                      itemBuilder: (context, index) {
                                        final contact = targetContacts[index];
                                        final isSelected = state.selectedContactIds.contains(contact.id);

                                        return InkWell(
                                          onTap: () => ref.read(campaignsProvider.notifier).toggleContact(contact.id),
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                            child: Row(
                                              children: [
                                                Checkbox(
                                                  value: isSelected,
                                                  activeColor: context.colors.primary,
                                                  checkColor: Colors.white,
                                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                                  onChanged: (_) => ref.read(campaignsProvider.notifier).toggleContact(contact.id),
                                                ),
                                                const SizedBox(width: 6),
                                                CircleAvatar(
                                                  radius: 15,
                                                  backgroundColor: context.colors.primary.withValues(alpha: 0.2),
                                                  child: Text(
                                                    contact.name.isNotEmpty ? contact.name[0].toUpperCase() : '?',
                                                    style: AppTypography.labelSm.copyWith(
                                                      color: context.colors.primary,
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 12,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 10),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(
                                                        contact.name,
                                                        style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w600),
                                                      ),
                                                      Text(
                                                        '${contact.company ?? context.tr('individual')} • ${contact.email ?? context.tr('noEmail')}',
                                                        style: AppTypography.bodySm.copyWith(
                                                          fontSize: 11,
                                                          color: context.colors.onSurfaceVariant,
                                                        ),
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                            ),
                            const SizedBox(height: 24),

                            // Submit Button
                            Align(
                              alignment: Alignment.centerRight,
                              child: GradientButton(
                                label: state.isCreating ? context.tr('creatingCampaign') : context.tr('launchCampaign'),
                                icon: Icons.rocket_launch_rounded,
                                height: 44,
                                maxWidth: 200,
                                isLoading: state.isCreating,
                                onPressed: state.isCreating ? null : _handleCreateCampaign,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

                  // ── Inter-Section Spacing ──
                  const SizedBox(height: 60),

                  // ── Section 2: Your Campaigns ──
                  Container(
                    key: _campaignsSectionKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SectionHeader(
                          icon: Icons.campaign_rounded,
                          label: context.tr('yourCampaigns'),
                          color: const Color(0xFF8B5CF6),
                        ),
                        const SizedBox(height: 20),

                        // Filter Tabs & Search Bar Row
                        GlassCard(
                          borderRadius: BorderRadius.circular(16),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _campaignSearchController,
                                      onChanged: (val) => ref.read(campaignsProvider.notifier).setSearchQuery(val),
                                      style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                                      decoration: InputDecoration(
                                        hintText: context.tr('searchCampaignsHint'),
                                        hintStyle: AppTypography.bodySm.copyWith(
                                          color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                                        ),
                                        prefixIcon: Icon(Icons.search_rounded, size: 18, color: context.colors.onSurfaceVariant),
                                        border: InputBorder.none,
                                        isDense: true,
                                        contentPadding: const EdgeInsets.symmetric(vertical: 10),
                                      ),
                                    ),
                                  ),
                                  if (_campaignSearchController.text.isNotEmpty)
                                    IconButton(
                                      icon: const Icon(Icons.clear, size: 16),
                                      onPressed: () {
                                        _campaignSearchController.clear();
                                        ref.read(campaignsProvider.notifier).setSearchQuery('');
                                      },
                                    ),
                                ],
                              ),
                              const Divider(height: 12),
                              SingleChildScrollView(
                                scrollDirection: Axis.horizontal,
                                child: Row(
                                  children: [
                                    _buildFilterChip(context.tr('filterAll'), 'all', state.statusFilter),
                                    const SizedBox(width: 8),
                                    _buildFilterChip(context.tr('filterRunning'), 'running', state.statusFilter),
                                    const SizedBox(width: 8),
                                    _buildFilterChip(context.tr('filterCompleted'), 'completed', state.statusFilter),
                                    const SizedBox(width: 8),
                                    _buildFilterChip(context.tr('filterDraft'), 'draft', state.statusFilter),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Active Campaign Running Live Card (if any campaign is currently executing)
                        if (state.isRunningAny) ...[
                          _buildRunningCampaignCard(context, state),
                          const SizedBox(height: 20),
                        ],

                        // Campaigns List
                        if (state.isLoading)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(40),
                              child: CircularProgressIndicator(),
                            ),
                          )
                        else if (state.filteredCampaigns.isEmpty)
                          _buildEmptyState(context)
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: state.filteredCampaigns.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 16),
                            itemBuilder: (context, index) {
                              final campaign = state.filteredCampaigns[index];
                              return _buildCampaignCard(context, campaign, state);
                            },
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // ── Floating Liquid Glass Bottom Navigation Bar ──
        FloatingLiquidGlassNavBar(
          activeTabLabel: _activeTab,
          items: [
            FloatingNavItem(
              id: 'Create',
              label: context.tr('create'),
              icon: Icons.add_circle_outline,
              activeIcon: Icons.add_circle_rounded,
              onTap: () => _scrollTo(_createSectionKey, 'Create'),
            ),
            FloatingNavItem(
              id: 'Campaigns',
              label: context.l10n.campaigns,
              icon: Icons.campaign_outlined,
              activeIcon: Icons.campaign_rounded,
              onTap: () => _scrollTo(_campaignsSectionKey, 'Campaigns'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label, String value, String currentFilter) {
    return AppFilterChip(
      label: label,
      selected: currentFilter == value,
      onSelected: (_) => ref.read(campaignsProvider.notifier).setStatusFilter(value),
    );
  }

  Widget _buildRunningCampaignCard(BuildContext context, CampaignsState state) {
    return GlassCard(
      borderRadius: BorderRadius.circular(18),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2.2,
                  color: context.colors.glowBlue,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                context.tr('campaignInProgress'),
                style: AppTypography.bodyMd.copyWith(
                  fontWeight: FontWeight.bold,
                  color: context.colors.glowBlue,
                ),
              ),
              const Spacer(),
              Text(
                '${(state.runningProgress * 100).toInt()}%',
                style: AppTypography.bodySm.copyWith(
                  fontWeight: FontWeight.bold,
                  color: context.colors.glowBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: state.runningProgress,
              minHeight: 6,
              backgroundColor: context.colors.surface.withValues(alpha: 0.3),
              valueColor: AlwaysStoppedAnimation(context.colors.primary),
            ),
          ),
          if (state.currentRecipientName != null) ...[
            const SizedBox(height: 8),
            Text(
              '${context.tr('sendingToRecipient')} ${state.currentRecipientName}...',
              style: AppTypography.bodySm.copyWith(
                fontSize: 11,
                color: context.colors.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(BuildContext context, DateTime? dt) {
    if (dt == null) return context.tr('recently');
    final isJa = Localizations.localeOf(context).languageCode == 'ja';
    if (isJa) {
      return '${dt.year}年${dt.month}月${dt.day}日';
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final m = months[(dt.month - 1).clamp(0, 11)];
    return '$m ${dt.day}, ${dt.year}';
  }

  String _getCampaignStatusLabel(BuildContext context, String status) {
    switch (status.toLowerCase()) {
      case 'running':
        return context.tr('runningStatus');
      case 'completed':
        return context.tr('filterCompleted');
      case 'paused':
        return context.tr('pausedStatus');
      case 'draft':
      default:
        return context.tr('filterDraft');
    }
  }

  Widget _buildCampaignCard(BuildContext context, EmailCampaign campaign, CampaignsState state) {
    final dateStr = _formatDate(context, campaign.createdAt);
    final statusLabel = _getCampaignStatusLabel(context, campaign.status);

    final isCurrentlyRunning = state.runningCampaignId == campaign.id;

    return GlassCard(
      borderRadius: BorderRadius.circular(18),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Title, Date, Status Badge
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      campaign.name,
                      style: AppTypography.headlineSm.copyWith(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${context.tr('createdDatePrefix')} $dateStr',
                      style: AppTypography.bodySm.copyWith(fontSize: 11, color: context.colors.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: campaign.statusBadgeColor(context).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: campaign.statusBadgeColor(context).withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: campaign.statusBadgeColor(context),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      statusLabel,
                      style: AppTypography.labelSm.copyWith(
                        color: campaign.statusBadgeColor(context),
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Subject Line Preview
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.mail_outline_rounded, size: 14, color: context.colors.primary),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  campaign.subject,
                  style: AppTypography.bodySm.copyWith(
                    fontWeight: FontWeight.w600,
                    color: context.colors.onSurface,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),

          // Purpose Quote
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: context.colors.surface.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: context.colors.glassBorder),
            ),
            child: Text(
              campaign.purpose,
              style: AppTypography.bodySm.copyWith(
                fontSize: 12,
                color: context.colors.onSurfaceVariant,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(height: 14),

          // Progress & Recipients indicator
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.people_outline_rounded, size: 14, color: context.colors.onSurfaceVariant),
                  const SizedBox(width: 5),
                  Text(
                    '${campaign.sentCount} / ${campaign.totalCount > 0 ? campaign.totalCount : campaign.contacts.length} ${context.tr('sentCountSuffix')}',
                    style: AppTypography.bodySm.copyWith(
                      fontSize: 12,
                      color: context.colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              // Action Buttons
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Color(0xFFEF4444)),
                    tooltip: context.tr('deleteCampaign'),
                    onPressed: () => ref.read(campaignsProvider.notifier).deleteCampaign(campaign.id),
                  ),
                  const SizedBox(width: 6),
                  if (campaign.isCompleted)
                    LiquidGlassButton(
                      label: context.tr('rerunAll'),
                      icon: Icons.replay_rounded,
                      height: 32,
                      maxWidth: 110,
                      onPressed: isCurrentlyRunning ? null : () => ref.read(campaignsProvider.notifier).rerunCampaign(campaign),
                    )
                  else
                    GradientButton(
                      label: isCurrentlyRunning ? context.tr('runningStatus') : context.tr('runCampaign'),
                      icon: Icons.play_arrow_rounded,
                      height: 32,
                      maxWidth: 130,
                      isLoading: isCurrentlyRunning,
                      onPressed: isCurrentlyRunning ? null : () => ref.read(campaignsProvider.notifier).runCampaign(campaign),
                    ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(18),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      child: Column(
        children: [
          Icon(Icons.campaign_outlined, size: 48, color: context.colors.onSurfaceVariant),
          const SizedBox(height: 16),
          Text(
            context.tr('noCampaignsFound'),
            style: AppTypography.headlineSm.copyWith(fontSize: 16),
          ),
          const SizedBox(height: 6),
          Text(
            context.tr('noCampaignsDesc'),
            style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
