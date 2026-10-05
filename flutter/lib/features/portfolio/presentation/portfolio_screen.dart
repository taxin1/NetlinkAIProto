import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../core/widgets/app_toast.dart';
import '../../../core/widgets/app_modal_dialog.dart';
import '../../../core/localization/app_localizations.dart';
import '../services/portfolio_service.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/animated_glass_icon_button.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/services/supabase_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../models/portfolio_model.dart';
import '../providers/portfolio_provider.dart';

class PortfolioScreen extends ConsumerStatefulWidget {
  const PortfolioScreen({super.key});

  @override
  ConsumerState<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends ConsumerState<PortfolioScreen> {
  final TextEditingController _promptController = TextEditingController();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _subtitleController = TextEditingController();
  final TextEditingController _bioController = TextEditingController();
  final TextEditingController _slugController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _generatorKey = GlobalKey();
  final GlobalKey _infoKey = GlobalKey();
  final GlobalKey _settingsKey = GlobalKey();
  final GlobalKey _sectionsKey = GlobalKey();

  String _activeTab = 'Generator';
  bool _controllersInitialized = false;
  bool _isAutoScrolling = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _promptController.dispose();
    _titleController.dispose();
    _subtitleController.dispose();
    _bioController.dispose();
    _slugController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isAutoScrolling || !_scrollController.hasClients || !mounted) return;

    double getY(GlobalKey key) {
      if (key.currentContext == null) return double.infinity;
      final RenderBox? box = key.currentContext!.findRenderObject() as RenderBox?;
      if (box == null || !box.hasSize) return double.infinity;
      return box.localToGlobal(Offset.zero).dy;
    }

    final screenH = MediaQuery.of(context).size.height;
    final triggerLine = kToolbarHeight + MediaQuery.of(context).padding.top + 72 + 50;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentPixels = _scrollController.position.pixels;

    String newActive = _activeTab;

    if ((maxScroll > 0 && currentPixels >= maxScroll - 80) || getY(_sectionsKey) <= screenH * 0.65) {
      newActive = 'Sections';
    } else if (getY(_settingsKey) <= triggerLine) {
      newActive = 'Settings';
    } else if (getY(_infoKey) <= triggerLine) {
      newActive = 'Info';
    } else {
      newActive = 'Generator';
    }

    if (newActive != _activeTab) {
      setState(() => _activeTab = newActive);
    }
  }

  void _scrollTo(GlobalKey key, [String? targetTab]) {
    if (targetTab != null && _activeTab != targetTab) {
      setState(() => _activeTab = targetTab);
    }
    if (key.currentContext == null) return;
    final RenderBox? box = key.currentContext!.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) return;
    final position = box.localToGlobal(Offset.zero, ancestor: context.findRenderObject());

    final target = _scrollController.offset +
        position.dy -
        Responsive.topPadding(context);

    _isAutoScrolling = true;
    _scrollController.animateTo(
      target.clamp(0.0, _scrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
    ).then((_) {
      Future.delayed(const Duration(milliseconds: 100), () {
        if (mounted) _isAutoScrolling = false;
      });
    });
  }

  void _syncControllers(Portfolio portfolio) {
    if (!_controllersInitialized || _titleController.text != portfolio.title) {
      _titleController.text = portfolio.title;
      _subtitleController.text = portfolio.subtitle ?? '';
      _bioController.text = portfolio.bio ?? '';
      _slugController.text = portfolio.slug;
      _controllersInitialized = true;
    }
  }

  void _showLivePreview(BuildContext context, Portfolio portfolio) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PortfolioPreviewModal(portfolio: portfolio),
    );
  }

  void _copyPortfolioLink(String slug) {
    final url = 'https://www.networklinkai.com/portfolio/$slug';
    Clipboard.setData(ClipboardData(text: url));
    AppToast.show(context, '${context.tr('linkCopied')} ($url)', type: ToastType.success);
  }

  Future<void> _handleSyncGoogle() async {
    final notifier = ref.read(portfolioProvider.notifier);
    final authState = ref.read(authProvider);

    // If real authenticated user, try automatic sync first
    if (authState.user != null && !authState.user!.isGuest) {
      final success = await notifier.syncGoogleAvatar();
      if (success) return;
    }

    // If demo mode or no avatar automatically found, open the Google sync modal
    if (mounted) {
      _showGoogleSyncDialog();
    }
  }

  void _showGoogleSyncDialog() {
    final emailCtrl = TextEditingController();
    final authState = ref.read(authProvider);
    final userEmail = authState.user?.email ?? '';
    if (userEmail.isNotEmpty && !authState.user!.isGuest) {
      emailCtrl.text = userEmail;
    }

    AppModalDialog.show(
      context: context,
      title: context.tr('syncGoogleModalTitle'),
      message: context.tr('syncGoogleModalDesc'),
      icon: Icons.sync_rounded,
      iconColor: context.colors.primary,
      showCloseButton: true,
      customBody: StatefulBuilder(
        builder: (ctx, setDialogState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              // Option 1: Connect with Google OAuth
              LiquidGlassButton(
                label: context.tr('signInGoogleOauth'),
                icon: Icons.g_mobiledata_rounded,
                height: 44,
                onPressed: () {
                  Navigator.of(ctx).pop();
                  PortfolioService.triggerGoogleOAuth();
                },
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: Divider(color: context.colors.glassBorder)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      context.tr('orFetchByGmail'),
                      style: AppTypography.labelCaps.copyWith(
                        color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                        fontSize: 10,
                      ),
                    ),
                  ),
                  Expanded(child: Divider(color: context.colors.glassBorder)),
                ],
              ),
              const SizedBox(height: 14),
              TextField(
                controller: emailCtrl,
                keyboardType: TextInputType.emailAddress,
                style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                decoration: InputDecoration(
                  hintText: context.tr('emailHint'),
                  hintStyle: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                  ),
                  prefixIcon: Icon(Icons.email_outlined, size: 18, color: context.colors.primary),
                  filled: true,
                  fillColor: context.colors.surface.withValues(alpha: 0.35),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: LiquidGlassButton(
                      label: context.tr('fetchPhoto'),
                      icon: Icons.check_circle_outline,
                      height: 40,
                      onPressed: () {
                        final email = emailCtrl.text.trim();
                        if (email.isNotEmpty) {
                          Navigator.of(ctx).pop();
                          ref.read(portfolioProvider.notifier).syncGoogleAvatar(email: email);
                        } else {
                          AppToast.show(context, context.tr('enterValidGmail'));
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  LiquidGlassButton(
                    label: context.tr('samplePhoto'),
                    icon: Icons.auto_awesome_rounded,
                    height: 40,
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      ref.read(portfolioProvider.notifier).setProfileImage(
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
                      );
                    },
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAvatarImage(String? imageUrl) {
    if (imageUrl == null || imageUrl.trim().isEmpty) {
      return Center(
        child: Icon(Icons.person_rounded, size: 40, color: context.colors.primary),
      );
    }

    final trimmed = imageUrl.trim();

    if (trimmed.startsWith('data:image')) {
      try {
        final commaIdx = trimmed.indexOf(',');
        if (commaIdx != -1) {
          final bytes = base64Decode(trimmed.substring(commaIdx + 1));
          return Image.memory(
            bytes,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Center(
              child: Icon(Icons.person_rounded, size: 40, color: context.colors.primary),
            ),
          );
        }
      } catch (_) {}
    }

    return Image.network(
      trimmed,
      fit: BoxFit.cover,
      errorBuilder: (ctx, error, stackTrace) => Center(
        child: Icon(Icons.person_rounded, size: 40, color: context.colors.primary),
      ),
      loadingBuilder: (ctx, child, progress) {
        if (progress == null) return child;
        return const Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        );
      },
    );
  }

  void _openAddSectionSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _AddSectionModal(
        onAdd: (type, title, content) {
          ref.read(portfolioProvider.notifier).addSection(
                type: type,
                title: title,
                content: content,
              );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(portfolioProvider);
    final user = SupabaseService.isInitialized ? SupabaseService.client.auth.currentUser : null;
    final authState = ref.watch(authProvider);
    final isGuest = authState.user?.isGuest ?? (user == null);

    // Listen for notification messages
    ref.listen<PortfolioState>(portfolioProvider, (prev, next) {
      if (next.errorMessage != null && next.errorMessage != prev?.errorMessage) {
        AppToast.show(context, next.errorMessage!, type: ToastType.error);
        ref.read(portfolioProvider.notifier).clearMessages();
      }
      if (next.successMessage != null && next.successMessage != prev?.successMessage) {
        AppToast.show(context, next.successMessage!, type: ToastType.success);
        ref.read(portfolioProvider.notifier).clearMessages();
      }
    });

    if (state.isLoading) {
      return const Center(
        child: CircularProgressIndicator(strokeWidth: 2),
      );
    }

    final portfolio = state.portfolio ?? Portfolio.empty(user?.id ?? 'guest');
    _syncControllers(portfolio);

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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Page Heading (Standardized)
              if (!Responsive.hasShellTopBar(context)) ...[
                PopInItem(
                  index: 0,
                  child: Center(
                    child: Text(
                      context.tr('portfolioBuilder'),
                      style: AppTypography.headlineMd,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Trial Banner (Shows when not signed in)
              if (isGuest) ...[
                const PopInItem(
                  index: 1,
                  child: TrialBannerCard(),
                ),
                const SizedBox(height: 24),
              ],

              // 1. AI Portfolio Generator Card
              SectionHeader(
                key: _generatorKey,
                icon: Icons.auto_awesome_rounded,
                label: context.tr('aiPortfolioGenerator'),
                color: context.colors.primary,
              ),
              const SizedBox(height: 16),
              PopInItem(
                index: isGuest ? 2 : 1,
                child: GlassCard(
                  padding: const EdgeInsets.all(24),
                  borderRadius: BorderRadius.circular(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  context.tr('aiPortfolioGenerator'),
                                  style: AppTypography.headlineSm.copyWith(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: context.colors.onSurface,
                                  ),
                                ),
                                Text(
                                  context.tr('generatePortfolioSubtitle'),
                                  style: AppTypography.bodySm.copyWith(
                                    color: context.colors.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          AnimatedGlassIconButton(
                            icon: Icons.visibility_outlined,
                            tooltip: context.tr('preview'),
                            iconColor: context.colors.primary,
                            onPressed: () => _showLivePreview(context, portfolio),
                          ),
                          const SizedBox(width: 8),
                          AnimatedGlassIconButton(
                            icon: Icons.share_rounded,
                            tooltip: context.tr('sharePortfolio'),
                            iconColor: context.colors.primary,
                            onPressed: () => _copyPortfolioLink(portfolio.slug),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // CV Upload & Google Sync Quick Actions
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          // CV Picker Action
                          InkWell(
                            onTap: state.isExtractingCV
                                ? null
                                : () => ref.read(portfolioProvider.notifier).pickAndExtractCV(),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: context.colors.surface.withValues(alpha: 0.4),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: state.cvFileName != null
                                      ? const Color(0xFF00C853)
                                      : context.colors.glassBorder,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (state.isExtractingCV)
                                    const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    )
                                  else
                                    Icon(
                                      state.cvFileName != null
                                          ? Icons.description_rounded
                                          : Icons.upload_file_rounded,
                                      size: 18,
                                      color: state.cvFileName != null
                                          ? const Color(0xFF00C853)
                                          : context.colors.primary,
                                    ),
                                  const SizedBox(width: 8),
                                  Text(
                                    state.cvFileName ?? context.tr('uploadCvResume'),
                                    style: AppTypography.bodySm.copyWith(
                                      color: state.cvFileName != null
                                          ? const Color(0xFF00C853)
                                          : context.colors.onSurface,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  if (state.cvFileName != null) ...[
                                    const SizedBox(width: 6),
                                    GestureDetector(
                                      onTap: () => ref.read(portfolioProvider.notifier).removeCVFile(),
                                      child: const Icon(Icons.close, size: 16, color: Colors.white70),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),

                          // Google Avatar Sync Action
                          InkWell(
                            onTap: state.isSyncingGoogle
                                ? null
                                : () => _handleSyncGoogle(),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: context.colors.surface.withValues(alpha: 0.4),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: context.colors.glassBorder),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (state.isSyncingGoogle) ...[
                                    SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: context.colors.primary,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                  ] else ...[
                                    Icon(Icons.sync_rounded, size: 18, color: context.colors.primary),
                                    const SizedBox(width: 8),
                                  ],
                                  Text(
                                    state.isSyncingGoogle ? context.tr('loading') : context.tr('syncGooglePhoto'),
                                    style: AppTypography.bodySm.copyWith(
                                      color: context.colors.onSurface,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Optional Guidance Prompt
                      TextField(
                        controller: _promptController,
                        maxLines: 2,
                        decoration: InputDecoration(
                          hintText: context.tr('customInstructionsHint'),
                          hintStyle: AppTypography.bodySm.copyWith(
                            color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                          ),
                          filled: true,
                          fillColor: context.colors.surface.withValues(alpha: 0.25),
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
                          contentPadding: const EdgeInsets.all(12),
                        ),
                        style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                      ),
                      const SizedBox(height: 16),

                      Align(
                        alignment: Alignment.centerRight,
                        child: GradientButton(
                          label: context.tr('generatePortfolioAi'),
                          icon: Icons.auto_awesome_rounded,
                          isLoading: state.isGenerating,
                          height: 44,
                          maxWidth: 240,
                          onPressed: () => ref.read(portfolioProvider.notifier).generatePortfolio(
                                additionalInfo: _promptController.text.trim(),
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

              // 2. Basic Information Card
              SectionHeader(
                key: _infoKey,
                icon: Icons.person_rounded,
                label: context.tr('basicInformation'),
                color: const Color(0xFF38BDF8),
              ),
              const SizedBox(height: 16),
              PopInItem(
                index: 2,
                child: GlassCard(
                  padding: const EdgeInsets.all(24),
                  borderRadius: BorderRadius.circular(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('basicInformation'),
                        style: AppTypography.headlineSm.copyWith(fontWeight: FontWeight.bold, fontSize: 16).copyWith(
                          fontWeight: FontWeight.bold,
                          color: context.colors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Profile Picture Row
                      Row(
                        children: [
                          Stack(
                            children: [
                              ClipOval(
                                child: Container(
                                  width: 72,
                                  height: 72,
                                  color: context.colors.primary.withValues(alpha: 0.15),
                                  child: state.isSyncingGoogle
                                      ? const Center(
                                          child: SizedBox(
                                            width: 24,
                                            height: 24,
                                            child: CircularProgressIndicator(strokeWidth: 2),
                                          ),
                                        )
                                      : _buildAvatarImage(portfolio.profileImageUrl),
                                ),
                              ),
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: InkWell(
                                  onTap: state.isUploadingImage
                                      ? null
                                      : () => ref
                                          .read(portfolioProvider.notifier)
                                          .pickAndUploadImage(),
                                  child: Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: context.colors.primary,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.camera_alt, size: 14, color: Colors.white),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  context.tr('profilePhoto'),
                                  style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600).copyWith(
                                    color: context.colors.onSurface,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  context.tr('profilePhotoSubtitle'),
                                  style: AppTypography.bodySm.copyWith(
                                    color: context.colors.onSurfaceVariant,
                                    fontSize: 11,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    AnimatedGlassIconButton(
                                      label: context.tr('uploadNew'),
                                      icon: Icons.upload_rounded,
                                      size: 32,
                                      iconSize: 15,
                                      fontSize: 12,
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                      iconColor: context.colors.primary,
                                      isLoading: state.isUploadingImage,
                                      onPressed: state.isUploadingImage
                                          ? null
                                          : () => ref
                                              .read(portfolioProvider.notifier)
                                              .pickAndUploadImage(),
                                    ),
                                    AnimatedGlassIconButton(
                                      label: context.tr('syncGoogle'),
                                      icon: Icons.sync_rounded,
                                      size: 32,
                                      iconSize: 15,
                                      fontSize: 12,
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                      iconColor: context.colors.primary,
                                      isLoading: state.isSyncingGoogle,
                                      onPressed: state.isSyncingGoogle
                                          ? null
                                          : () => _handleSyncGoogle(),
                                    ),
                                    AnimatedGlassIconButton(
                                      label: context.tr('removePhoto'),
                                      icon: Icons.delete_outline_rounded,
                                      size: 32,
                                      iconSize: 15,
                                      fontSize: 12,
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                      iconColor: const Color(0xFFEF4444),
                                      onPressed: (portfolio.profileImageUrl?.isNotEmpty == true &&
                                              !state.isUploadingImage &&
                                              !state.isSyncingGoogle)
                                          ? () => ref
                                              .read(portfolioProvider.notifier)
                                              .removeProfileImage()
                                          : null,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      _buildTextField(
                        label: context.tr('fullNameDisplayTitle'),
                        controller: _titleController,
                        onChanged: (val) =>
                            ref.read(portfolioProvider.notifier).updateBasicInfo(title: val),
                      ),
                      const SizedBox(height: 14),

                      _buildTextField(
                        label: context.tr('professionalHeadline'),
                        controller: _subtitleController,
                        onChanged: (val) =>
                            ref.read(portfolioProvider.notifier).updateBasicInfo(subtitle: val),
                      ),
                      const SizedBox(height: 14),

                      _buildTextField(
                        label: context.tr('shortBio'),
                        controller: _bioController,
                        maxLines: 3,
                        onChanged: (val) =>
                            ref.read(portfolioProvider.notifier).updateBasicInfo(bio: val),
                      ),
                    ],
                  ),
                ),
              ),
              const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

              // 3. Settings & Theme Selector Card
              SectionHeader(
                key: _settingsKey,
                icon: Icons.tune_rounded,
                label: context.tr('portfolioSettings'),
                color: const Color(0xFF8B5CF6),
              ),
              const SizedBox(height: 16),
              PopInItem(
                index: 3,
                child: GlassCard(
                  padding: const EdgeInsets.all(24),
                  borderRadius: BorderRadius.circular(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('portfolioSettings'),
                        style: AppTypography.headlineSm.copyWith(fontWeight: FontWeight.bold, fontSize: 16).copyWith(
                          fontWeight: FontWeight.bold,
                          color: context.colors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Toggles
                      _buildSwitchRow(
                        title: context.tr('publicPortfolio'),
                        subtitle: context.tr('publicPortfolioDesc'),
                        value: portfolio.isPublic,
                        onChanged: (val) => ref
                            .read(portfolioProvider.notifier)
                            .updateSettings(isPublic: val),
                      ),
                      const Divider(height: 20, color: Colors.white12),

                      _buildSwitchRow(
                        title: context.tr('showContactInfo'),
                        subtitle: context.tr('showContactInfoDesc'),
                        value: portfolio.showContactInfo,
                        onChanged: (val) => ref
                            .read(portfolioProvider.notifier)
                            .updateSettings(showContactInfo: val),
                      ),
                      const Divider(height: 20, color: Colors.white12),

                      _buildSwitchRow(
                        title: context.tr('showSocialLinks'),
                        subtitle: context.tr('showSocialLinksDesc'),
                        value: portfolio.showSocialLinks,
                        onChanged: (val) => ref
                            .read(portfolioProvider.notifier)
                            .updateSettings(showSocialLinks: val),
                      ),
                      const Divider(height: 24, color: Colors.white12),

                      // Theme Selector
                      Text(
                        context.tr('themeStyle'),
                        style: AppTypography.labelSm.copyWith(
                          color: context.colors.onSurfaceVariant,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          _buildThemeChip('modern', context.tr('themeModern'), portfolio.theme),
                          _buildThemeChip('minimal', context.tr('themeMinimal'), portfolio.theme),
                          _buildThemeChip('creative', context.tr('themeCreative'), portfolio.theme),
                          _buildThemeChip('professional', context.tr('themeProfessional'), portfolio.theme),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Slug Customizer
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            context.tr('customPortfolioSlug'),
                            style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            '${_slugController.text.length}/48',
                            style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final isNarrow = constraints.maxWidth < 430;
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: context.colors.surface.withValues(alpha: 0.25),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: context.colors.glassBorder),
                            ),
                            child: isNarrow
                                ? Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'networklinkai.com/portfolio/',
                                        style: AppTypography.bodySm.copyWith(
                                          color: context.colors.onSurfaceVariant.withValues(alpha: 0.65),
                                          fontSize: 12,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: TextFormField(
                                              controller: _slugController,
                                              maxLength: 48,
                                              style: AppTypography.bodySm.copyWith(
                                                color: context.colors.primary,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14,
                                              ),
                                              decoration: const InputDecoration(
                                                counterText: '',
                                                border: InputBorder.none,
                                                focusedBorder: InputBorder.none,
                                                enabledBorder: InputBorder.none,
                                                errorBorder: InputBorder.none,
                                                disabledBorder: InputBorder.none,
                                                isDense: true,
                                                contentPadding: EdgeInsets.symmetric(vertical: 4),
                                              ),
                                              onChanged: (val) {
                                                setState(() {});
                                                ref.read(portfolioProvider.notifier).updateSettings(slug: val);
                                              },
                                            ),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.copy_rounded, size: 18),
                                            color: context.colors.primary,
                                            tooltip: context.tr('copyLink'),
                                            visualDensity: VisualDensity.compact,
                                            onPressed: () => _copyPortfolioLink(_slugController.text),
                                          ),
                                        ],
                                      ),
                                    ],
                                  )
                                : Row(
                                    children: [
                                      Text(
                                        'networklinkai.com/portfolio/',
                                        style: AppTypography.bodySm.copyWith(
                                          color: context.colors.onSurfaceVariant.withValues(alpha: 0.65),
                                          fontSize: 12,
                                        ),
                                      ),
                                      Expanded(
                                        child: TextFormField(
                                          controller: _slugController,
                                          maxLength: 48,
                                          style: AppTypography.bodySm.copyWith(
                                            color: context.colors.primary,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                          decoration: const InputDecoration(
                                            counterText: '',
                                            border: InputBorder.none,
                                            focusedBorder: InputBorder.none,
                                            enabledBorder: InputBorder.none,
                                            errorBorder: InputBorder.none,
                                            disabledBorder: InputBorder.none,
                                            isDense: true,
                                            contentPadding: EdgeInsets.symmetric(vertical: 6),
                                          ),
                                          onChanged: (val) {
                                            setState(() {});
                                            ref.read(portfolioProvider.notifier).updateSettings(slug: val);
                                          },
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.copy_rounded, size: 18),
                                        color: context.colors.primary,
                                        tooltip: context.tr('copyLink'),
                                        visualDensity: VisualDensity.compact,
                                        onPressed: () => _copyPortfolioLink(_slugController.text),
                                      ),
                                    ],
                                  ),
                          );
                        },
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Full link: https://www.networklinkai.com/portfolio/${_slugController.text}',
                        style: AppTypography.bodySm.copyWith(
                          color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                          fontSize: 11,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
              const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

              // 4. Portfolio Sections Manager Card
              SectionHeader(
                key: _sectionsKey,
                icon: Icons.view_quilt_rounded,
                label: context.tr('portfolioSections'),
                color: const Color(0xFF10B981),
              ),
              const SizedBox(height: 16),
              PopInItem(
                index: 4,
                child: GlassCard(
                  padding: const EdgeInsets.all(24),
                  borderRadius: BorderRadius.circular(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${context.tr('portfolioSections')} (${portfolio.sections.length})',
                            style: AppTypography.headlineSm.copyWith(fontWeight: FontWeight.bold, fontSize: 16).copyWith(
                              fontWeight: FontWeight.bold,
                              color: context.colors.onSurface,
                            ),
                          ),
                          AnimatedGlassIconButton(
                            label: context.tr('addSection'),
                            icon: Icons.add_rounded,
                            size: 32,
                            iconSize: 15,
                            fontSize: 12,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            iconColor: context.colors.primary,
                            onPressed: () => _openAddSectionSheet(context),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      if (portfolio.sections.isEmpty) ...[
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 24),
                            child: Column(
                              children: [
                                Icon(Icons.layers_clear_outlined,
                                    size: 40, color: context.colors.onSurfaceVariant.withValues(alpha: 0.5)),
                                const SizedBox(height: 10),
                                Text(
                                  context.tr('noSectionsYet'),
                                  style: AppTypography.bodySm.copyWith(
                                    color: context.colors.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ] else ...[
                        ...portfolio.sections.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final section = entry.value;
                          return _buildSectionItem(context, section, idx, portfolio.sections.length);
                        }),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // 5. Save & Publish Action Bar
              PopInItem(
                index: 5,
                child: Center(
                  child: GradientButton(
                    label: context.tr('savePublishPortfolio'),
                    icon: Icons.cloud_upload_rounded,
                    isLoading: state.isSaving,
                    height: 52,
                    maxWidth: 320,
                    onPressed: () => ref.read(portfolioProvider.notifier).savePortfolio(),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ),

    // ── Floating Liquid Glass Bottom Navigation Bar (Mobile / Phone Mode) ──
    FloatingLiquidGlassNavBar(
      activeTabLabel: _activeTab,
      items: [
        FloatingNavItem(
          id: 'Generator',
          label: context.tr('navGenerator'),
          icon: Icons.auto_awesome_outlined,
          activeIcon: Icons.auto_awesome_rounded,
          onTap: () => _scrollTo(_generatorKey, 'Generator'),
        ),
        FloatingNavItem(
          id: 'Info',
          label: context.tr('navInfo'),
          icon: Icons.person_outline_rounded,
          activeIcon: Icons.person_rounded,
          onTap: () => _scrollTo(_infoKey, 'Info'),
        ),
        FloatingNavItem(
          id: 'Settings',
          label: context.tr('navSettings'),
          icon: Icons.tune_rounded,
          activeIcon: Icons.tune_rounded,
          onTap: () => _scrollTo(_settingsKey, 'Settings'),
        ),
        FloatingNavItem(
          id: 'Sections',
          label: context.tr('navSections'),
          icon: Icons.view_quilt_outlined,
          activeIcon: Icons.view_quilt_rounded,
          onTap: () => _scrollTo(_sectionsKey, 'Sections'),
        ),
      ],
    ),
  ],
);
}

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    int maxLines = 1,
    required ValueChanged<String> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTypography.labelSm.copyWith(
            color: context.colors.onSurfaceVariant,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          maxLines: maxLines,
          onChanged: onChanged,
          decoration: InputDecoration(
            filled: true,
            fillColor: context.colors.surface.withValues(alpha: 0.25),
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
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
          style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
        ),
      ],
    );
  }

  Widget _buildSwitchRow({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTypography.bodyMd.copyWith(
                  fontWeight: FontWeight.w600,
                  color: context.colors.onSurface,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: AppTypography.bodySm.copyWith(
                  color: context.colors.onSurfaceVariant,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        Switch(
          value: value,
          activeThumbColor: context.colors.primary,
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildThemeChip(String value, String label, String currentTheme) {
    final isSelected = currentTheme == value;
    return GestureDetector(
      onTap: () => ref.read(portfolioProvider.notifier).updateSettings(theme: value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? context.colors.primary.withValues(alpha: 0.2)
              : context.colors.surface.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? context.colors.primary : context.colors.glassBorder,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Text(
          label,
          style: AppTypography.bodySm.copyWith(
            color: isSelected ? context.colors.primary : context.colors.onSurface,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildSectionItem(
    BuildContext context,
    PortfolioSection section,
    int index,
    int totalCount,
  ) {
    IconData iconData = Icons.layers_rounded;
    switch (section.type) {
      case 'about':
        iconData = Icons.person_outline_rounded;
        break;
      case 'experience':
        iconData = Icons.work_outline_rounded;
        break;
      case 'skills':
        iconData = Icons.psychology_outlined;
        break;
      case 'projects':
        iconData = Icons.rocket_launch_outlined;
        break;
      case 'education':
        iconData = Icons.school_outlined;
        break;
      case 'contact':
        iconData = Icons.mail_outline_rounded;
        break;
      case 'testimonials':
        iconData = Icons.format_quote_rounded;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.colors.surface.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.glassBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: context.colors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(iconData, size: 14, color: context.colors.primary),
                    const SizedBox(width: 5),
                    Text(
                      section.type.toUpperCase(),
                      style: AppTypography.labelSm.copyWith(
                        color: context.colors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              // Move Up
              IconButton(
                icon: const Icon(Icons.arrow_upward_rounded, size: 18),
                onPressed: index > 0
                    ? () => ref.read(portfolioProvider.notifier).moveSection(index, -1)
                    : null,
                visualDensity: VisualDensity.compact,
              ),
              // Move Down
              IconButton(
                icon: const Icon(Icons.arrow_downward_rounded, size: 18),
                onPressed: index < totalCount - 1
                    ? () => ref.read(portfolioProvider.notifier).moveSection(index, 1)
                    : null,
                visualDensity: VisualDensity.compact,
              ),
              // Delete
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.redAccent),
                onPressed: () => ref.read(portfolioProvider.notifier).deleteSection(section.id),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Title field
          Text(
            context.tr('sectionTitle'),
            style: AppTypography.labelSm.copyWith(
              color: context.colors.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            initialValue: section.title,
            decoration: InputDecoration(
              filled: true,
              fillColor: context.colors.surface.withValues(alpha: 0.25),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
            ),
            style: AppTypography.bodySm.copyWith(
              color: context.colors.onSurface,
              fontWeight: FontWeight.w600,
            ),
            onChanged: (val) => ref
                .read(portfolioProvider.notifier)
                .updateSection(section.id, title: val),
          ),
          const SizedBox(height: 14),

          // Content textarea
          Text(
            context.tr('contentHighlights'),
            style: AppTypography.labelSm.copyWith(
              color: context.colors.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            initialValue: section.content,
            maxLines: 5,
            minLines: 3,
            decoration: InputDecoration(
              filled: true,
              fillColor: context.colors.surface.withValues(alpha: 0.25),
              contentPadding: const EdgeInsets.all(14),
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
            ),
            style: AppTypography.bodySm.copyWith(
              color: context.colors.onSurface,
              height: 1.5,
            ),
            onChanged: (val) => ref
                .read(portfolioProvider.notifier)
                .updateSection(section.id, content: val),
          ),
        ],
      ),
    );
  }
}

/// Modal Sheet to choose section type and add to portfolio
class _AddSectionModal extends StatelessWidget {
  final Function(String type, String title, String content) onAdd;

  const _AddSectionModal({required this.onAdd});

  @override
  Widget build(BuildContext context) {
    final types = [
      {
        'type': 'about',
        'title': context.tr('aboutMe'),
        'desc': context.tr('aboutMeDesc'),
        'icon': Icons.person_outline_rounded,
        'template': context.tr('templateAbout'),
      },
      {
        'type': 'experience',
        'title': context.tr('experience'),
        'desc': context.tr('experienceDesc'),
        'icon': Icons.work_outline_rounded,
        'template': context.tr('templateExperience'),
      },
      {
        'type': 'projects',
        'title': context.tr('projects'),
        'desc': context.tr('projectsDesc'),
        'icon': Icons.rocket_launch_outlined,
        'template': context.tr('templateProjects'),
      },
      {
        'type': 'skills',
        'title': context.tr('skills'),
        'desc': context.tr('skillsDesc'),
        'icon': Icons.psychology_outlined,
        'template': context.tr('templateSkills'),
      },
      {
        'type': 'education',
        'title': context.tr('education'),
        'desc': context.tr('educationDesc'),
        'icon': Icons.school_outlined,
        'template': context.tr('templateEducation'),
      },
      {
        'type': 'testimonials',
        'title': context.tr('recommendationsQuotes'),
        'desc': context.tr('recommendationsQuotesDesc'),
        'icon': Icons.format_quote_rounded,
        'template': context.tr('templateTestimonials'),
      },
      {
        'type': 'contact',
        'title': context.tr('getInTouch'),
        'desc': context.tr('getInTouchDesc'),
        'icon': Icons.mail_outline_rounded,
        'template': context.tr('templateContact'),
      },
      {
        'type': 'custom',
        'title': context.tr('customSection'),
        'desc': context.tr('customSectionDesc'),
        'icon': Icons.layers_outlined,
        'template': context.tr('templateCustom'),
      },
    ];

    final isLight = Theme.of(context).brightness == Brightness.light;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isLight ? Colors.white : const Color(0xFF141724),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: context.colors.glassBorder),
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                context.tr('addPortfolioSection'),
                style: AppTypography.headlineSm.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: context.colors.onSurface,
                ),
              ),
              IconButton(
                icon: Icon(Icons.close, color: context.colors.onSurfaceVariant),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Expanded(
            child: ListView.separated(
              itemCount: types.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (ctx, i) {
                final item = types[i];
                return InkWell(
                  onTap: () {
                    onAdd(
                      item['type'] as String,
                      item['title'] as String,
                      item['template'] as String,
                    );
                    Navigator.pop(context);
                  },
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isLight
                          ? const Color(0xFFF1F5F9)
                          : Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isLight
                            ? const Color(0xFFCBD5E1)
                            : Colors.white12,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(item['icon'] as IconData,
                              size: 20, color: Theme.of(context).colorScheme.primary),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['title'] as String,
                                style: AppTypography.bodyMd.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: context.colors.onSurface,
                                ),
                              ),
                              Text(
                                item['desc'] as String,
                                style: AppTypography.bodySm.copyWith(
                                  color: context.colors.onSurfaceVariant,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.add_circle_outline_rounded,
                          color: context.colors.primary,
                          size: 20,
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
    );
  }
}

/// In-App Fullscreen Liquid-Glass Live Preview Modal
class _PortfolioPreviewModal extends StatelessWidget {
  final Portfolio portfolio;

  const _PortfolioPreviewModal({required this.portfolio});

  @override
  Widget build(BuildContext context) {
    // Theme palette selection
    Color accentColor = const Color(0xFF00E5FF);
    Color cardBg = const Color(0xFF141728).withValues(alpha: 0.85);

    if (portfolio.theme == 'minimal') {
      accentColor = Colors.white;
      cardBg = const Color(0xFF18181B).withValues(alpha: 0.9);
    } else if (portfolio.theme == 'creative') {
      accentColor = const Color(0xFFFF4081);
      cardBg = const Color(0xFF20132B).withValues(alpha: 0.85);
    } else if (portfolio.theme == 'professional') {
      accentColor = const Color(0xFF3B82F6);
      cardBg = const Color(0xFF0F172A).withValues(alpha: 0.9);
    }

    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: BoxDecoration(
        color: const Color(0xFF0B0D17),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        children: [
          // Preview modal header bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.white12)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFF00C853),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${context.tr('livePortfolioPreview')} (${portfolio.theme.toUpperCase()})',
                      style: AppTypography.labelSm.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Rendered Portfolio Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 680),
                  child: Column(
                    children: [
                      // Banner Card
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(28),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: accentColor.withValues(alpha: 0.25)),
                          boxShadow: [
                            BoxShadow(
                              color: accentColor.withValues(alpha: 0.1),
                              blurRadius: 24,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            ClipOval(
                              child: Container(
                                width: 88,
                                height: 88,
                                color: accentColor.withValues(alpha: 0.15),
                                child: (portfolio.profileImageUrl != null &&
                                        portfolio.profileImageUrl!.trim().isNotEmpty)
                                    ? Image.network(
                                        portfolio.profileImageUrl!.trim(),
                                        fit: BoxFit.cover,
                                        errorBuilder: (ctx, err, stack) => Center(
                                          child: Icon(Icons.person_rounded, size: 48, color: accentColor),
                                        ),
                                        loadingBuilder: (ctx, child, progress) {
                                          if (progress == null) return child;
                                          return const Center(
                                            child: SizedBox(
                                              width: 20,
                                              height: 20,
                                              child: CircularProgressIndicator(strokeWidth: 2),
                                            ),
                                          );
                                        },
                                      )
                                    : Center(
                                        child: Icon(Icons.person_rounded, size: 48, color: accentColor),
                                      ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              portfolio.title,
                              style: AppTypography.headlineSm.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            if (portfolio.subtitle?.isNotEmpty == true) ...[
                              const SizedBox(height: 6),
                              Text(
                                portfolio.subtitle!,
                                style: AppTypography.bodyMd.copyWith(
                                  color: accentColor,
                                  fontWeight: FontWeight.w600,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                            if (portfolio.bio?.isNotEmpty == true) ...[
                              const SizedBox(height: 12),
                              Text(
                                portfolio.bio!,
                                style: AppTypography.bodySm.copyWith(
                                  color: Colors.white70,
                                  height: 1.5,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Render Sections
                      ...portfolio.sections.map((section) {
                        return Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(22),
                          decoration: BoxDecoration(
                            color: cardBg,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                section.title,
                                style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600).copyWith(
                                  color: accentColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                section.content,
                                style: AppTypography.bodySm.copyWith(
                                  color: Colors.white.withValues(alpha: 0.85),
                                  height: 1.6,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
