import 'package:flutter/material.dart';
import '../../../core/widgets/app_toast.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/router/app_router.dart';
import '../../../core/widgets/app_filter_chip.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/scrollable_list_window.dart';
import '../../../core/widgets/sub_page_top_bar.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/tour/tour_controller.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/email_models.dart';
import '../providers/emails_provider.dart';
import '../../../core/localization/app_localizations.dart';

class EmailsScreen extends ConsumerStatefulWidget {
  const EmailsScreen({super.key});

  @override
  ConsumerState<EmailsScreen> createState() => _EmailsScreenState();
}

class _EmailsScreenState extends ConsumerState<EmailsScreen> {
  static const _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  String _formatDate(DateTime dt) {
    final m = _months[dt.month - 1];
    final hr = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    final min = dt.minute.toString().padLeft(2, '0');
    return '$m ${dt.day}, ${dt.year} • $hr:$min $ampm';
  }

  final ScrollController _scrollController = ScrollController();
  final ScrollController _emailsListScrollController = ScrollController();
  final ScrollController _repliesListScrollController = ScrollController();
  String _emailStatusFilter = 'all'; // 'all', 'sent', 'draft'
  String _replyFilter = 'all'; // 'all', 'unread', 'read'

  @override
  void dispose() {
    _scrollController.dispose();
    _emailsListScrollController.dispose();
    _repliesListScrollController.dispose();
    super.dispose();
  }

  void _scrollToTop() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  String _getActiveTabLabel(BuildContext context, int tab) {
    switch (tab) {
      case 1:
        return context.l10n.replies;
      case 2:
        return context.l10n.highlights;
      default:
        return context.l10n.emails;
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isGuest = user == null || user.isGuest;

    // Listen to provider messages for snackbars
    ref.listen<EmailsState>(emailsProvider, (previous, next) {
      if (next.errorMessage != null && next.errorMessage != previous?.errorMessage) {
        AppToast.show(context, next.errorMessage!, type: ToastType.error);
      }
      if (next.successMessage != null && next.successMessage != previous?.successMessage) {
        AppToast.show(context, next.successMessage!, type: ToastType.success);
      }
    });

    final emailsState = ref.watch(emailsProvider);

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
            child: Container(
              constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
              width: double.infinity,
              child: _buildEmailsView(context, emailsState, isGuest),
            ),
          ),
        ),

        // ── Floating Liquid Glass Bottom Navigation Bar ──
        FloatingLiquidGlassNavBar(
          activeTabLabel: _getActiveTabLabel(context, emailsState.selectedTab),
          items: [
            FloatingNavItem(
              label: context.l10n.emails,
              icon: Icons.mail_outline_rounded,
              activeIcon: Icons.mail_rounded,
              onTap: () {
                ref.read(emailsProvider.notifier).setTab(0);
                _scrollToTop();
              },
            ),
            FloatingNavItem(
              label: context.l10n.replies,
              icon: Icons.chat_bubble_outline_rounded,
              activeIcon: Icons.chat_bubble_rounded,
              onTap: () {
                ref.read(emailsProvider.notifier).setTab(1);
                _scrollToTop();
              },
            ),
            FloatingNavItem(
              label: context.l10n.highlights,
              icon: Icons.auto_awesome_rounded,
              activeIcon: Icons.auto_awesome,
              onTap: () {
                ref.read(emailsProvider.notifier).setTab(2);
                _scrollToTop();
              },
            ),
          ],
        ),

        // ── Top Bar (mobile only — wide screens use the AppShell sidebar) ──
        if (!Responsive.isWide(context))
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SubPageTopBar(
              onBack: () => context.go(AppRoutes.dashboard),
            ),
          ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN EMAILS VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildEmailsView(BuildContext context, EmailsState state, bool isGuest) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Page Heading (Standardized)
        if (!Responsive.hasShellTopBar(context)) ...[
          PopInItem(
            index: 0,
            child: Center(
              child: Text(
                context.l10n.emails,
                style: AppTypography.headlineMd,
                textAlign: TextAlign.center,
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],

        // Trial Banner (shows when not signed in)
        if (isGuest) ...[
          const PopInItem(
            index: 1,
            child: TrialBannerCard(),
          ),
          const SizedBox(height: 16),
        ],

        // Tab selector — shown on wide screens only (mobile uses the floating bottom navbar)
        if (Responsive.isWide(context)) ...[
          PopInItem(
            index: isGuest ? 2 : 1,
            child: Center(
              child: Wrap(
                spacing: 10,
                children: [
                  AppFilterChip(
                    label: context.l10n.emails,
                    selected: state.selectedTab == 0,
                    showCheckmark: false,
                    avatar: Icon(
                      state.selectedTab == 0
                          ? Icons.mail_rounded
                          : Icons.mail_outline_rounded,
                      size: 14,
                      color: state.selectedTab == 0
                          ? context.colors.primary
                          : context.colors.onSurfaceVariant,
                    ),
                    onSelected: (_) {
                      ref.read(emailsProvider.notifier).setTab(0);
                      _scrollToTop();
                    },
                  ),
                  AppFilterChip(
                    label: context.l10n.replies,
                    selected: state.selectedTab == 1,
                    showCheckmark: false,
                    avatar: Icon(
                      state.selectedTab == 1
                          ? Icons.chat_bubble_rounded
                          : Icons.chat_bubble_outline_rounded,
                      size: 14,
                      color: state.selectedTab == 1
                          ? context.colors.primary
                          : context.colors.onSurfaceVariant,
                    ),
                    onSelected: (_) {
                      ref.read(emailsProvider.notifier).setTab(1);
                      _scrollToTop();
                    },
                  ),
                  AppFilterChip(
                    label: context.l10n.highlights,
                    selected: state.selectedTab == 2,
                    showCheckmark: false,
                    avatar: Icon(
                      state.selectedTab == 2
                          ? Icons.auto_awesome
                          : Icons.auto_awesome_rounded,
                      size: 14,
                      color: state.selectedTab == 2
                          ? context.colors.primary
                          : context.colors.onSurfaceVariant,
                    ),
                    onSelected: (_) {
                      ref.read(emailsProvider.notifier).setTab(2);
                      _scrollToTop();
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],

        // Active Tab Content
        PopInItem(
          index: isGuest ? 3 : 2,
          child: GlassCard(
            key: TourTargetKeys.emailsFeature,
            borderRadius: BorderRadius.circular(20),
            padding: const EdgeInsets.all(24),
            child: state.isLoading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 48),
                      child: CircularProgressIndicator(),
                    ),
                  )
                : _buildTabContent(context, state),
          ),
        ),
      ],
    );
  }



  Widget _buildTabContent(BuildContext context, EmailsState state) {
    switch (state.selectedTab) {
      case 0:
        return _buildIndividualEmailsTab(context, state);
      case 1:
        return _buildRepliesTab(context, state);
      case 2:
        return _buildHighlightsTab(context, state);
      default:
        return const SizedBox.shrink();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 0: INDIVIDUAL EMAILS
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildIndividualEmailsTab(BuildContext context, EmailsState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Sub-header with SectionHeader style
        LayoutBuilder(
          builder: (context, constraints) {
            final isNarrow = constraints.maxWidth < 460;
            final composeBtn = GradientButton(
              label: context.l10n.composeEmail,
              icon: Icons.auto_awesome_rounded,
              height: 40,
              maxWidth: isNarrow ? double.infinity : 160,
              onPressed: () => _openContactSelectorDialog(context, state),
            );

            if (isNarrow) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SectionHeader(
                    icon: Icons.mail_rounded,
                    label: context.l10n.individualEmails,
                    color: context.colors.primary,
                  ),
                  const SizedBox(height: 12),
                  composeBtn,
                ],
              );
            }
            return SectionHeader(
              icon: Icons.mail_rounded,
              label: context.l10n.individualEmails,
              color: context.colors.primary,
              trailing: composeBtn,
            );
          },
        ),
        const SizedBox(height: 16),

        // Filter Chips Row
        () {
          final sentCount = state.emails.where((e) => e.status == 'sent').length;
          final draftCount = state.emails.where((e) => e.status == 'draft').length;

          return Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              AppFilterChip(
                label: '${context.l10n.filterAll} (${state.emails.length})',
                selected: _emailStatusFilter == 'all',
                onSelected: (_) => setState(() => _emailStatusFilter = 'all'),
              ),
              AppFilterChip(
                label: '${context.l10n.sent} ($sentCount)',
                selected: _emailStatusFilter == 'sent',
                onSelected: (_) => setState(() => _emailStatusFilter = 'sent'),
              ),
              AppFilterChip(
                label: '${context.l10n.drafts} ($draftCount)',
                selected: _emailStatusFilter == 'draft',
                onSelected: (_) => setState(() => _emailStatusFilter = 'draft'),
              ),
            ],
          );
        }(),
        const SizedBox(height: 16),

        () {
          final filteredEmails = state.emails.where((e) {
            if (_emailStatusFilter == 'sent') return e.status == 'sent';
            if (_emailStatusFilter == 'draft') return e.status == 'draft';
            return true;
          }).toList();

          if (filteredEmails.isEmpty) {
            return _buildEmptyEmailsCard(context, state);
          }

          return ScrollableListWindow(
            controller: _emailsListScrollController,
            showScrollbar: filteredEmails.length > 2,
            maxHeight: MediaQuery.of(context).size.width > 700 ? 480 : 350,
            child: ListView.separated(
              controller: _emailsListScrollController,
              shrinkWrap: true,
              physics: const ClampingScrollPhysics(),
              padding: EdgeInsets.zero,
              itemCount: filteredEmails.length,
              separatorBuilder: (_, __) => const SizedBox(height: 14),
              itemBuilder: (ctx, idx) {
                final email = filteredEmails[idx];
                return _buildEmailCard(context, email);
              },
            ),
          );
        }(),
      ],
    );
  }

  Widget _buildEmptyEmailsCard(BuildContext context, EmailsState state) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      decoration: BoxDecoration(
        color: context.colors.surface.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.glassBorder),
      ),
      child: Column(
        children: [
          Icon(
            Icons.mail_outline_rounded,
            size: 48,
            color: context.colors.onSurfaceVariant.withValues(alpha: 0.4),
          ),
          const SizedBox(height: 16),
          Text(
            context.l10n.noEmailsMatching,
            style: AppTypography.bodyMd.copyWith(
              color: context.colors.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          GradientButton(
            label: context.l10n.composeYourFirstEmail,
            icon: Icons.auto_awesome_rounded,
            height: 44,
            maxWidth: 240,
            onPressed: () => _openContactSelectorDialog(context, state),
          ),
        ],
      ),
    );
  }

  Widget _buildEmailCard(BuildContext context, EmailItem email) {
    final isDraft = email.status == 'draft';
    final isSent = email.status == 'sent';

    Color statusBg;
    Color statusColor;
    if (isSent) {
      statusBg = const Color(0xFF10B981).withValues(alpha: 0.15);
      statusColor = const Color(0xFF34D399);
    } else if (isDraft) {
      statusBg = const Color(0xFFF59E0B).withValues(alpha: 0.15);
      statusColor = const Color(0xFFFBBF24);
    } else {
      statusBg = const Color(0xFFEF4444).withValues(alpha: 0.15);
      statusColor = const Color(0xFFF87171);
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: context.colors.surface.withValues(alpha: 0.25),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.glassBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  email.subject.isEmpty ? context.tr('noSubject') : email.subject,
                  style: AppTypography.headlineSm.copyWith(
                    color: context.colors.onSurface,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                ),
                child: Text(
                  email.status.toLowerCase() == 'sent'
                      ? context.tr('sent')
                      : (email.status.toLowerCase() == 'draft'
                          ? context.tr('draft')
                          : email.status.toUpperCase()),
                  style: AppTypography.labelSm.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (email.contactName != null || email.contactEmail != null)
            Text(
              '${context.tr('toRecipient')} ${email.contactName ?? context.tr('contacts')}'
              '${email.contactEmail != null ? ' (${email.contactEmail})' : ''}'
              '${email.contactCompany != null ? ' • ${email.contactCompany}' : ''}',
              style: AppTypography.bodySm.copyWith(
                color: context.colors.primary,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          const SizedBox(height: 10),
          Text(
            email.body,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.bodySm.copyWith(
              color: context.colors.onSurfaceVariant,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Text(
                  _formatDate(email.sentAt ?? email.createdAt),
                  style: AppTypography.labelSm.copyWith(
                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                    fontSize: 11,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              if (isDraft) ...[
                IconButton(
                  icon: Icon(
                    Icons.edit_outlined,
                    size: 18,
                    color: context.colors.onSurfaceVariant,
                  ),
                  tooltip: context.tr('editDraftTooltip'),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => _openEditDraftDialog(context, email),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(
                    Icons.delete_outline_rounded,
                    size: 18,
                    color: Color(0xFFEF4444),
                  ),
                  tooltip: context.tr('deleteDraftTooltip'),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => _confirmDeleteEmail(context, email.id),
                ),
                const SizedBox(width: 8),
                GradientButton(
                  label: context.tr('sendNow'),
                  icon: Icons.send_rounded,
                  height: 34,
                  maxWidth: 110,
                  fontSize: 12,
                  onPressed: () => ref.read(emailsProvider.notifier).sendEmailItem(email: email),
                ),
              ] else ...[
                LiquidGlassButton(
                  label: context.tr('view'),
                  icon: Icons.visibility_outlined,
                  height: 34,
                  maxWidth: 90,
                  fontSize: 12,
                  onPressed: () => _openViewEmailDialog(context, email),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1: REPLIES
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildRepliesTab(BuildContext context, EmailsState state) {
    if (!state.isGmailConnected) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
        decoration: BoxDecoration(
          color: context.colors.surface.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.colors.glassBorder),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.colors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.mark_email_unread_outlined,
                size: 36,
                color: context.colors.primary,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              context.tr('gmailReplies'),
              style: AppTypography.headlineSm.copyWith(
                color: context.colors.onSurface,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Text(
                context.tr('gmailRepliesDesc'),
                style: AppTypography.bodySm.copyWith(
                  color: context.colors.onSurfaceVariant,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            GradientButton(
              label: context.tr('connectGmail'),
              icon: Icons.mail_rounded,
              height: 44,
              onPressed: () => ref.read(emailsProvider.notifier).connectGmail(),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          icon: Icons.chat_bubble_rounded,
          label: context.tr('gmailReplies'),
          color: const Color(0xFF06B6D4),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (state.unreadRepliesCount > 0) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF06B6D4),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${state.unreadRepliesCount} new',
                    style: AppTypography.labelSm.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
              ],
              IconButton(
                icon: state.isSyncing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(Icons.refresh_rounded, color: context.colors.primary),
                tooltip: context.tr('syncReplies'),
                onPressed: state.isSyncing
                    ? null
                    : () => ref.read(emailsProvider.notifier).syncReplies(),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Filter Chips Row for Replies
        () {
          final unreadCount = state.unreadRepliesCount;
          final readCount = state.replies.where((r) => r.isRead).length;

          return Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              AppFilterChip(
                label: '${context.tr('allRepliesFilter')} (${state.replies.length})',
                selected: _replyFilter == 'all',
                onSelected: (_) => setState(() => _replyFilter = 'all'),
              ),
              AppFilterChip(
                label: '${context.tr('unreadFilter')} ($unreadCount)',
                selected: _replyFilter == 'unread',
                onSelected: (_) => setState(() => _replyFilter = 'unread'),
              ),
              AppFilterChip(
                label: '${context.tr('readFilter')} ($readCount)',
                selected: _replyFilter == 'read',
                onSelected: (_) => setState(() => _replyFilter = 'read'),
              ),
            ],
          );
        }(),
        const SizedBox(height: 16),

        () {
          final filteredReplies = state.replies.where((r) {
            if (_replyFilter == 'unread') return !r.isRead;
            if (_replyFilter == 'read') return r.isRead;
            return true;
          }).toList();

          if (filteredReplies.isEmpty) {
            return Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
              decoration: BoxDecoration(
                color: context.colors.surface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.colors.glassBorder),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.inbox_outlined,
                    size: 40,
                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'No replies matching this filter',
                    style: AppTypography.bodyLg.copyWith(
                      color: context.colors.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Click the sync button above to check for new incoming replies.',
                    style: AppTypography.bodySm.copyWith(
                      color: context.colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            );
          }

          return ScrollableListWindow(
            controller: _repliesListScrollController,
            showScrollbar: filteredReplies.length > 2,
            maxHeight: MediaQuery.of(context).size.width > 700 ? 460 : 330,
            child: ListView.separated(
              controller: _repliesListScrollController,
              shrinkWrap: true,
              physics: const ClampingScrollPhysics(),
              padding: EdgeInsets.zero,
              itemCount: filteredReplies.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (ctx, idx) {
                final reply = filteredReplies[idx];
                return _buildReplyCard(context, reply);
              },
            ),
          );
        }(),
      ],
    );
  }

  Widget _buildReplyCard(BuildContext context, EmailReplyItem reply) {
    return InkWell(
      onTap: () => _openViewReplyDialog(context, reply),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.colors.surface.withValues(alpha: reply.isRead ? 0.2 : 0.35),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: reply.isRead
                ? context.colors.glassBorder
                : context.colors.primary.withValues(alpha: 0.4),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (!reply.isRead) ...[
                  Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: const BoxDecoration(
                      color: Color(0xFF06B6D4),
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
                Expanded(
                  child: Text(
                    reply.fromName.isNotEmpty ? reply.fromName : reply.fromEmail,
                    style: AppTypography.bodyMd.copyWith(
                      color: context.colors.onSurface,
                      fontWeight: reply.isRead ? FontWeight.normal : FontWeight.bold,
                    ),
                  ),
                ),
                Text(
                  _formatDate(reply.receivedAt),
                  style: AppTypography.labelSm.copyWith(
                    color: context.colors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              reply.subject,
              style: AppTypography.bodyLg.copyWith(
                color: context.colors.onSurface,
                fontWeight: reply.isRead ? FontWeight.w500 : FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              reply.snippet.isNotEmpty ? reply.snippet : reply.body,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.bodySm.copyWith(
                color: context.colors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2: HIGHLIGHTS
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildHighlightsTab(BuildContext context, EmailsState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          icon: Icons.auto_awesome_rounded,
          label: context.tr('emailCalendarHighlights'),
          color: const Color(0xFF8B5CF6),
          trailing: IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF8B5CF6)),
            tooltip: context.tr('refresh'),
            onPressed: () => ref.read(emailsProvider.notifier).loadAll(),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          context.tr('emailHighlightsDesc'),
          style: AppTypography.bodySm.copyWith(
            color: context.colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 20),

        if (state.highlights.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text(
              context.tr('noHighlightsYet'),
              style: AppTypography.bodySm.copyWith(
                color: context.colors.onSurfaceVariant,
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: state.highlights.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (ctx, idx) {
              final section = state.highlights[idx];
              return _buildHighlightSectionCard(context, section);
            },
          ),
      ],
    );
  }

  Widget _buildHighlightSectionCard(BuildContext context, EmailHighlightSection section) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: context.colors.surface.withValues(alpha: 0.25),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.glassBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: context.colors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: context.colors.primary.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.checklist_rounded,
                      size: 14,
                      color: context.colors.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      section.title,
                      style: AppTypography.labelSm.copyWith(
                        color: context.colors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...section.items.map((item) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 6, right: 10),
                    width: 5,
                    height: 5,
                    decoration: BoxDecoration(
                      color: context.colors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      item,
                      style: AppTypography.bodySm.copyWith(
                        color: context.colors.onSurface,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODALS & DIALOGS
  // ═══════════════════════════════════════════════════════════════════════════

  void _openContactSelectorDialog(BuildContext context, EmailsState state) {
    if (state.contacts.isEmpty) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: context.colors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: context.colors.glassBorder),
          ),
          title: Text(
            context.tr('noContactsFound'),
            style: AppTypography.headlineSm.copyWith(color: context.colors.onSurface),
          ),
          content: Text(
            context.tr('noContactsDesc'),
            style: AppTypography.bodyMd.copyWith(color: context.colors.onSurfaceVariant),
          ),
          actionsAlignment: MainAxisAlignment.center,
          actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          actions: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LiquidGlassButton(
                  label: context.tr('contacts'),
                  icon: Icons.person_add_rounded,
                  height: 44,
                  width: double.infinity,
                  maxWidth: double.infinity,
                  onPressed: () {
                    Navigator.pop(ctx);
                    context.go(AppRoutes.contacts);
                  },
                ),
                const SizedBox(height: 10),
                GradientButton(
                  label: context.tr('confirm'),
                  height: 44,
                  width: double.infinity,
                  maxWidth: double.infinity,
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
          ],
        ),
      );
      return;
    }

    String searchQuery = '';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dialogCtx, setDialogState) {
          final filtered = state.contacts.where((c) {
            final q = searchQuery.toLowerCase();
            return c.name.toLowerCase().contains(q) ||
                c.email.toLowerCase().contains(q) ||
                (c.company?.toLowerCase().contains(q) ?? false);
          }).toList();

          return AlertDialog(
            backgroundColor: context.colors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: context.colors.glassBorder),
            ),
            title: Text(
              context.tr('contacts'),
              style: AppTypography.headlineSm.copyWith(
                color: context.colors.onSurface,
                fontWeight: FontWeight.bold,
              ),
            ),
            content: SizedBox(
              width: 480,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    onChanged: (val) => setDialogState(() => searchQuery = val),
                    decoration: InputDecoration(
                      hintText: context.tr('searchContacts'),
                      prefixIcon: Icon(Icons.search_rounded, color: context.colors.onSurfaceVariant),
                      filled: true,
                      fillColor: context.colors.surface.withValues(alpha: 0.3),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: context.colors.glassBorder),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: context.colors.glassBorder),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 340),
                    child: filtered.isEmpty
                        ? Padding(
                            padding: const EdgeInsets.symmetric(vertical: 24),
                            child: Text(
                              context.tr('noContactsMatching'),
                              style: AppTypography.bodyMd.copyWith(
                                color: context.colors.onSurfaceVariant,
                              ),
                            ),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (_, i) {
                              final contact = filtered[i];
                              return InkWell(
                                onTap: () {
                                  Navigator.pop(ctx);
                                  _openComposeEmailDialog(context, contact);
                                },
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: context.colors.surface.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: context.colors.glassBorder),
                                  ),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 18,
                                        backgroundColor: context.colors.primary.withValues(alpha: 0.15),
                                        child: Text(
                                          contact.name.isNotEmpty ? contact.name[0].toUpperCase() : '?',
                                          style: AppTypography.bodyLg.copyWith(
                                            color: context.colors.primary,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              contact.name,
                                              style: AppTypography.bodyMd.copyWith(
                                                color: context.colors.onSurface,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            Text(
                                              '${contact.email}${contact.company != null ? ' • ${contact.company}' : ''}',
                                              style: AppTypography.bodySm.copyWith(
                                                color: context.colors.onSurfaceVariant,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Icon(
                                        Icons.add_circle_outline_rounded,
                                        size: 20,
                                        color: context.colors.primary,
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
            actions: [
              LiquidGlassButton(
                label: context.tr('cancel'),
                height: 40,
                width: 95,
                onPressed: () => Navigator.pop(ctx),
              ),
            ],
          );
        },
      ),
    );
  }

  void _openComposeEmailDialog(BuildContext context, EmailContactOption contact) {
    final purposeController = TextEditingController();
    final subjectController = TextEditingController();
    final bodyController = TextEditingController();
    bool isGenerating = false;
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dialogCtx, setDialogState) {
          final screenHeight = MediaQuery.of(ctx).size.height;
          final dialogHeight = screenHeight > 800 ? 740.0 : screenHeight * 0.88;
          final isLight = Theme.of(context).brightness == Brightness.light;
          final fieldFill = isLight ? const Color(0xFFF8FAFC) : context.colors.surface.withValues(alpha: 0.3);
          final fieldBorder = isLight ? const Color(0xFFCBD5E1) : context.colors.glassBorder;

          return Dialog(
            backgroundColor: Colors.transparent,
            insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            child: Container(
              width: 540,
              constraints: BoxConstraints(maxHeight: dialogHeight),
              decoration: BoxDecoration(
                color: isLight ? Colors.white : const Color(0xFF0D101C),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: context.colors.glassBorder),
                boxShadow: [
                  BoxShadow(
                    color: isLight
                        ? Colors.black.withValues(alpha: 0.08)
                        : Colors.black.withValues(alpha: 0.6),
                    blurRadius: isLight ? 20 : 32,
                    spreadRadius: isLight ? 0 : 4,
                    offset: isLight ? const Offset(0, 8) : Offset.zero,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header with Title, Subtitle, and Close X button
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 20, 16, 14),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                context.tr('composeEmailTitle'),
                                style: AppTypography.headlineSm.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: context.colors.onSurface,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                context.tr('generateAiEmail'),
                                style: AppTypography.bodySm.copyWith(
                                  color: context.colors.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 20),
                          color: context.colors.onSurfaceVariant,
                          onPressed: () => Navigator.pop(ctx),
                          splashRadius: 20,
                        ),
                      ],
                    ),
                  ),
                  Divider(height: 1, color: context.colors.glassBorder),

                  // Scrollable Form Fields
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Recipient Header Chip
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: context.colors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: context.colors.primary.withValues(alpha: 0.25)),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.person_outline_rounded, size: 18, color: context.colors.primary),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '${context.tr('toRecipient')} ${contact.name} (${contact.email})'
                                    '${contact.company != null ? ' • ${contact.company}' : ''}',
                                    style: AppTypography.bodySm.copyWith(
                                      color: context.colors.primary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 18),

                          // AI Prompt / Purpose
                          Text(
                            context.tr('eventContextPrompt'),
                            style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: purposeController,
                            minLines: 2,
                            maxLines: 4,
                            style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                            decoration: InputDecoration(
                              hintText: context.tr('aiPromptHint'),
                              hintStyle: AppTypography.bodySm.copyWith(
                                color: context.colors.onSurfaceVariant.withValues(alpha: 0.55),
                              ),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              filled: true,
                              fillColor: fieldFill,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: fieldBorder),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: fieldBorder),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: context.colors.primary),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Align(
                            alignment: Alignment.centerRight,
                            child: GradientButton(
                              label: isGenerating
                                  ? context.tr('generatingAiEmail')
                                  : context.tr('generateAiEmail'),
                              icon: isGenerating
                                  ? Icons.hourglass_top_rounded
                                  : Icons.auto_awesome_rounded,
                              height: 38,
                              fontSize: 12,
                              iconSize: 15,
                              expand: false,
                              isLoading: isGenerating,
                              onPressed: isGenerating
                                  ? null
                                  : () async {
                                      if (purposeController.text.trim().isEmpty) return;
                                      setDialogState(() => isGenerating = true);
                                      final user = ref.read(authProvider).user;
                                      final result = await ref
                                          .read(emailsProvider.notifier)
                                          .generateAiEmail(
                                            contact: contact,
                                            purpose: purposeController.text.trim(),
                                            userName: user?.name,
                                          );
                                      setDialogState(() {
                                        isGenerating = false;
                                        subjectController.text = result['subject'] ?? '';
                                        bodyController.text = result['body'] ?? '';
                                      });
                                    },
                            ),
                          ),
                          const SizedBox(height: 18),

                          // Subject Field
                          Text(
                            '${context.tr('subject')}:',
                            style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: subjectController,
                            style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                            decoration: InputDecoration(
                              hintText: '${context.tr('subject')}...',
                              hintStyle: AppTypography.bodySm.copyWith(
                                color: context.colors.onSurfaceVariant.withValues(alpha: 0.55),
                              ),
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              filled: true,
                              fillColor: fieldFill,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: fieldBorder),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: fieldBorder),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: context.colors.primary),
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),

                          // Body Field
                          Text(
                            '${context.tr('body')}:',
                            style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: bodyController,
                            minLines: 6,
                            maxLines: 12,
                            style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                            decoration: InputDecoration(
                              hintText: '${context.tr('body')}...',
                              hintStyle: AppTypography.bodySm.copyWith(
                                color: context.colors.onSurfaceVariant.withValues(alpha: 0.55),
                              ),
                              contentPadding: const EdgeInsets.all(14),
                              filled: true,
                              fillColor: fieldFill,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: fieldBorder),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: fieldBorder),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: context.colors.primary),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Divider(height: 1, color: context.colors.glassBorder),

                  // Action Buttons with responsive layout
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final isNarrow = constraints.maxWidth < 440;
                        if (isNarrow) {
                          return Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: LiquidGlassButton(
                                      label: isSaving ? context.tr('saving') : context.tr('saveDraft'),
                                      icon: Icons.save_outlined,
                                      height: 44,
                                      fontSize: 13,
                                      iconSize: 16,
                                      minWidth: 0,
                                      onPressed: isSaving
                                          ? null
                                          : () async {
                                              if (subjectController.text.trim().isEmpty || bodyController.text.trim().isEmpty) {
                                                AppToast.show(context, context.tr('subjectAndBodyRequired'));
                                                return;
                                              }
                                              setDialogState(() => isSaving = true);
                                              final success = await ref.read(emailsProvider.notifier).saveDraft(
                                                    contact: contact,
                                                    subject: subjectController.text.trim(),
                                                    body: bodyController.text.trim(),
                                                  );
                                              if (success && ctx.mounted) {
                                                Navigator.pop(ctx);
                                              } else {
                                                setDialogState(() => isSaving = false);
                                              }
                                            },
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: GradientButton(
                                      label: context.tr('sendNow'),
                                      icon: Icons.send_rounded,
                                      height: 44,
                                      fontSize: 13,
                                      iconSize: 16,
                                      minWidth: 0,
                                      onPressed: () async {
                                        if (subjectController.text.trim().isEmpty || bodyController.text.trim().isEmpty) {
                                          AppToast.show(context, context.tr('subjectAndBodyRequired'));
                                          return;
                                        }
                                        final user = ref.read(authProvider).user;
                                        final tempEmail = EmailItem(
                                          id: '',
                                          userId: user?.id ?? '',
                                          contactId: contact.id,
                                          contactName: contact.name,
                                          contactEmail: contact.email,
                                          contactCompany: contact.company,
                                          subject: subjectController.text.trim(),
                                          body: bodyController.text.trim(),
                                          status: 'sent',
                                          sentAt: DateTime.now(),
                                          createdAt: DateTime.now(),
                                        );
                                        final success = await ref.read(emailsProvider.notifier).sendEmailItem(email: tempEmail);
                                        if (success && ctx.mounted) {
                                          Navigator.pop(ctx);
                                        }
                                      },
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              SizedBox(
                                width: double.infinity,
                                child: TextButton(
                                  onPressed: () => Navigator.pop(ctx),
                                  style: TextButton.styleFrom(
                                    visualDensity: VisualDensity.compact,
                                    padding: const EdgeInsets.symmetric(vertical: 4),
                                  ),
                                  child: Text(
                                    context.tr('cancel'),
                                    style: AppTypography.bodySm.copyWith(
                                      color: context.colors.onSurfaceVariant.withValues(alpha: 0.8),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          );
                        }
                        return Row(
                          children: [
                            Expanded(
                              child: LiquidGlassButton(
                                label: context.tr('cancel'),
                                height: 44,
                                fontSize: 13,
                                minWidth: 0,
                                onPressed: () => Navigator.pop(ctx),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: LiquidGlassButton(
                                label: isSaving ? context.tr('saving') : context.tr('saveDraft'),
                                icon: Icons.save_outlined,
                                height: 44,
                                fontSize: 13,
                                iconSize: 16,
                                minWidth: 0,
                                onPressed: isSaving
                                    ? null
                                    : () async {
                                        if (subjectController.text.trim().isEmpty || bodyController.text.trim().isEmpty) {
                                          AppToast.show(context, context.tr('subjectAndBodyRequired'));
                                          return;
                                        }
                                        setDialogState(() => isSaving = true);
                                        final success = await ref.read(emailsProvider.notifier).saveDraft(
                                              contact: contact,
                                              subject: subjectController.text.trim(),
                                              body: bodyController.text.trim(),
                                            );
                                        if (success && ctx.mounted) {
                                          Navigator.pop(ctx);
                                        } else {
                                          setDialogState(() => isSaving = false);
                                        }
                                      },
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: GradientButton(
                                label: context.tr('sendNow'),
                                icon: Icons.send_rounded,
                                height: 44,
                                fontSize: 13,
                                iconSize: 16,
                                minWidth: 0,
                                onPressed: () async {
                                  if (subjectController.text.trim().isEmpty || bodyController.text.trim().isEmpty) {
                                    AppToast.show(context, context.tr('subjectAndBodyRequired'));
                                    return;
                                  }
                                  final user = ref.read(authProvider).user;
                                  final tempEmail = EmailItem(
                                    id: '',
                                    userId: user?.id ?? '',
                                    contactId: contact.id,
                                    contactName: contact.name,
                                    contactEmail: contact.email,
                                    contactCompany: contact.company,
                                    subject: subjectController.text.trim(),
                                    body: bodyController.text.trim(),
                                    status: 'sent',
                                    sentAt: DateTime.now(),
                                    createdAt: DateTime.now(),
                                  );
                                  final success = await ref.read(emailsProvider.notifier).sendEmailItem(email: tempEmail);
                                  if (success && ctx.mounted) {
                                    Navigator.pop(ctx);
                                  }
                                },
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _openEditDraftDialog(BuildContext context, EmailItem email) {
    final subjectController = TextEditingController(text: email.subject);
    final bodyController = TextEditingController(text: email.body);
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dialogCtx, setDialogState) {
          final screenHeight = MediaQuery.of(ctx).size.height;
          final dialogHeight = screenHeight > 800 ? 700.0 : screenHeight * 0.85;
          final isLight = Theme.of(context).brightness == Brightness.light;
          final fieldFill = isLight ? const Color(0xFFF8FAFC) : context.colors.surface.withValues(alpha: 0.3);
          final fieldBorder = isLight ? const Color(0xFFCBD5E1) : context.colors.glassBorder;

          return Dialog(
            backgroundColor: Colors.transparent,
            insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            child: Container(
              width: 540,
              constraints: BoxConstraints(maxHeight: dialogHeight),
              decoration: BoxDecoration(
                color: isLight ? Colors.white : const Color(0xFF0D101C),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: context.colors.glassBorder),
                boxShadow: [
                  BoxShadow(
                    color: isLight
                        ? Colors.black.withValues(alpha: 0.08)
                        : Colors.black.withValues(alpha: 0.6),
                    blurRadius: isLight ? 20 : 32,
                    spreadRadius: isLight ? 0 : 4,
                    offset: isLight ? const Offset(0, 8) : Offset.zero,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 20, 16, 14),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                context.tr('editDraft'),
                                style: AppTypography.headlineSm.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: context.colors.onSurface,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                context.tr('editDraftSubtitle'),
                                style: AppTypography.bodySm.copyWith(
                                  color: context.colors.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 20),
                          color: context.colors.onSurfaceVariant,
                          onPressed: () => Navigator.pop(ctx),
                          splashRadius: 20,
                        ),
                      ],
                    ),
                  ),
                  Divider(height: 1, color: context.colors.glassBorder),

                  // Content
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (email.contactName != null || email.contactEmail != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: context.colors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: context.colors.primary.withValues(alpha: 0.25)),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.person_outline_rounded, size: 18, color: context.colors.primary),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      '${context.tr('toRecipient')} ${email.contactName ?? email.contactEmail}'
                                      '${email.contactCompany != null ? ' (${email.contactCompany})' : ''}',
                                      style: AppTypography.bodySm.copyWith(
                                        color: context.colors.primary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],
                          Text(
                            '${context.tr('subject')}:',
                            style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: subjectController,
                            style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                            decoration: InputDecoration(
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              filled: true,
                              fillColor: fieldFill,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: fieldBorder),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: fieldBorder),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: context.colors.primary),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            '${context.tr('body')}:',
                            style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: bodyController,
                            minLines: 6,
                            maxLines: 12,
                            style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                            decoration: InputDecoration(
                              contentPadding: const EdgeInsets.all(14),
                              filled: true,
                              fillColor: fieldFill,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: fieldBorder),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: fieldBorder),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: context.colors.primary),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Divider(height: 1, color: context.colors.glassBorder),

                  // Actions with responsive layout
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final isNarrow = constraints.maxWidth < 440;
                        if (isNarrow) {
                          return Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: LiquidGlassButton(
                                      label: isSaving ? context.tr('saving') : context.tr('updateDraft'),
                                      icon: Icons.save_outlined,
                                      height: 44,
                                      fontSize: 13,
                                      iconSize: 16,
                                      minWidth: 0,
                                      onPressed: isSaving
                                          ? null
                                          : () async {
                                              setDialogState(() => isSaving = true);
                                              final success = await ref.read(emailsProvider.notifier).updateDraft(
                                                    emailId: email.id,
                                                    subject: subjectController.text.trim(),
                                                    body: bodyController.text.trim(),
                                                  );
                                              if (success && ctx.mounted) {
                                                Navigator.pop(ctx);
                                              } else {
                                                setDialogState(() => isSaving = false);
                                              }
                                            },
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: GradientButton(
                                      label: context.tr('sendNow'),
                                      icon: Icons.send_rounded,
                                      height: 44,
                                      fontSize: 13,
                                      iconSize: 16,
                                      minWidth: 0,
                                      onPressed: () async {
                                        final updated = email.copyWith(
                                          subject: subjectController.text.trim(),
                                          body: bodyController.text.trim(),
                                        );
                                        final success = await ref.read(emailsProvider.notifier).sendEmailItem(email: updated);
                                        if (success && ctx.mounted) {
                                          Navigator.pop(ctx);
                                        }
                                      },
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              SizedBox(
                                width: double.infinity,
                                child: TextButton(
                                  onPressed: () => Navigator.pop(ctx),
                                  style: TextButton.styleFrom(
                                    visualDensity: VisualDensity.compact,
                                    padding: const EdgeInsets.symmetric(vertical: 4),
                                  ),
                                  child: Text(
                                    context.tr('cancel'),
                                    style: AppTypography.bodySm.copyWith(
                                      color: context.colors.onSurfaceVariant.withValues(alpha: 0.8),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          );
                        }
                        return Row(
                          children: [
                            Expanded(
                              child: LiquidGlassButton(
                                label: context.tr('cancel'),
                                height: 44,
                                fontSize: 13,
                                minWidth: 0,
                                onPressed: () => Navigator.pop(ctx),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: LiquidGlassButton(
                                label: isSaving ? context.tr('saving') : context.tr('updateDraft'),
                                icon: Icons.save_outlined,
                                height: 44,
                                fontSize: 13,
                                iconSize: 16,
                                minWidth: 0,
                                onPressed: isSaving
                                    ? null
                                    : () async {
                                        setDialogState(() => isSaving = true);
                                        final success = await ref.read(emailsProvider.notifier).updateDraft(
                                              emailId: email.id,
                                              subject: subjectController.text.trim(),
                                              body: bodyController.text.trim(),
                                            );
                                        if (success && ctx.mounted) {
                                          Navigator.pop(ctx);
                                        } else {
                                          setDialogState(() => isSaving = false);
                                        }
                                      },
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: GradientButton(
                                label: context.tr('sendNow'),
                                icon: Icons.send_rounded,
                                height: 44,
                                fontSize: 13,
                                iconSize: 16,
                                minWidth: 0,
                                onPressed: () async {
                                  final updated = email.copyWith(
                                    subject: subjectController.text.trim(),
                                    body: bodyController.text.trim(),
                                  );
                                  final success = await ref.read(emailsProvider.notifier).sendEmailItem(email: updated);
                                  if (success && ctx.mounted) {
                                    Navigator.pop(ctx);
                                  }
                                },
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _openViewEmailDialog(BuildContext context, EmailItem email) {
    final isLight = Theme.of(context).brightness == Brightness.light;

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Container(
          width: 540,
          constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.8),
          decoration: BoxDecoration(
            color: isLight ? Colors.white : const Color(0xFF0D101C),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.colors.glassBorder),
            boxShadow: [
              BoxShadow(
                color: isLight
                    ? Colors.black.withValues(alpha: 0.08)
                    : Colors.black.withValues(alpha: 0.6),
                blurRadius: isLight ? 20 : 32,
                spreadRadius: isLight ? 0 : 4,
                offset: isLight ? const Offset(0, 8) : Offset.zero,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 16, 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            email.subject,
                            style: AppTypography.headlineSm.copyWith(
                              fontWeight: FontWeight.bold,
                              color: context.colors.onSurface,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${context.tr('sent')}: ${_formatDate(email.sentAt ?? email.createdAt)}',
                            style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      color: context.colors.onSurfaceVariant,
                      onPressed: () => Navigator.pop(ctx),
                      splashRadius: 20,
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: context.colors.glassBorder),

              // Content
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (email.contactName != null || email.contactEmail != null) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: context.colors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: context.colors.primary.withValues(alpha: 0.25)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.person_outline_rounded, size: 18, color: context.colors.primary),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '${context.tr('toRecipient')} ${email.contactName ?? email.contactEmail}'
                                  '${email.contactEmail != null ? ' (${email.contactEmail})' : ''}',
                                  style: AppTypography.bodySm.copyWith(
                                    color: context.colors.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isLight ? const Color(0xFFF8FAFC) : context.colors.surface.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isLight ? const Color(0xFFCBD5E1) : context.colors.glassBorder),
                        ),
                        child: Text(
                          email.body,
                          style: AppTypography.bodyMd.copyWith(
                            color: context.colors.onSurface,
                            height: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Divider(height: 1, color: context.colors.glassBorder),

              // Actions
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    GradientButton(
                      label: context.tr('close'),
                      height: 44,
                      maxWidth: 110,
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openViewReplyDialog(BuildContext context, EmailReplyItem reply) {
    if (!reply.isRead) {
      ref.read(emailsProvider.notifier).markReplyAsRead(reply.id);
    }

    final isLight = Theme.of(context).brightness == Brightness.light;

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Container(
          width: 540,
          constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.8),
          decoration: BoxDecoration(
            color: isLight ? Colors.white : const Color(0xFF0D101C),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.colors.glassBorder),
            boxShadow: [
              BoxShadow(
                color: isLight
                    ? Colors.black.withValues(alpha: 0.08)
                    : Colors.black.withValues(alpha: 0.6),
                blurRadius: isLight ? 20 : 32,
                spreadRadius: isLight ? 0 : 4,
                offset: isLight ? const Offset(0, 8) : Offset.zero,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 16, 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            reply.subject,
                            style: AppTypography.headlineSm.copyWith(
                              fontWeight: FontWeight.bold,
                              color: context.colors.onSurface,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${context.tr('received')}: ${_formatDate(reply.receivedAt)}',
                            style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      color: context.colors.onSurfaceVariant,
                      onPressed: () => Navigator.pop(ctx),
                      splashRadius: 20,
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: context.colors.glassBorder),

              // Content
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: context.colors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: context.colors.primary.withValues(alpha: 0.25)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.person_outline_rounded, size: 18, color: context.colors.primary),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '${context.tr('from')}: ${reply.fromName} (${reply.fromEmail})',
                                style: AppTypography.bodySm.copyWith(
                                  color: context.colors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isLight ? const Color(0xFFF8FAFC) : context.colors.surface.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isLight ? const Color(0xFFCBD5E1) : context.colors.glassBorder),
                        ),
                        child: Text(
                          reply.body.isNotEmpty ? reply.body : reply.snippet,
                          style: AppTypography.bodyMd.copyWith(
                            color: context.colors.onSurface,
                            height: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Divider(height: 1, color: context.colors.glassBorder),

              // Actions
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    GradientButton(
                      label: context.tr('close'),
                      height: 44,
                      maxWidth: 110,
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _confirmDeleteEmail(BuildContext context, String emailId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0D101C),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: context.colors.glassBorder),
        ),
        title: Text(
          context.tr('deleteEmailTitle'),
          style: AppTypography.headlineSm.copyWith(
            color: context.colors.onSurface,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Text(
          context.tr('deleteEmailConfirm'),
          style: AppTypography.bodyMd.copyWith(color: context.colors.onSurfaceVariant),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        actions: [
          Row(
            children: [
              Expanded(
                child: LiquidGlassButton(
                  label: context.tr('cancel'),
                  height: 44,
                  onPressed: () => Navigator.pop(ctx),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GradientButton(
                  label: context.tr('delete'),
                  icon: Icons.delete_outline_rounded,
                  height: 44,
                  onPressed: () {
                    Navigator.pop(ctx);
                    ref.read(emailsProvider.notifier).deleteEmail(emailId);
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
