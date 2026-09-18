import 'package:flutter/material.dart';
import '../../../core/widgets/app_toast.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/router/app_router.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/profile_provider.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/tour/tour_controller.dart';

class NetworkProfileScreen extends ConsumerStatefulWidget {
  const NetworkProfileScreen({super.key});

  @override
  ConsumerState<NetworkProfileScreen> createState() =>
      _NetworkProfileScreenState();
}

class _NetworkProfileScreenState extends ConsumerState<NetworkProfileScreen> {
  final ScrollController _scrollController = ScrollController();
  final PageController _qrPageController = PageController();
  final GlobalKey _profileInfoKey = TourTargetKeys.profileFeature;
  final GlobalKey _profileQrKey = GlobalKey();

  late final TextEditingController _nameController;
  late final TextEditingController _titleController;
  late final TextEditingController _companyController;
  late final TextEditingController _phoneController;
  late final TextEditingController _linkedinController;
  late final TextEditingController _twitterController;
  late final TextEditingController _githubController;
  late final TextEditingController _instagramController;
  late final TextEditingController _websiteController;

  bool _isPublic = true;
  bool _initializedControllers = false;
  String _activeTab = 'Profile Info';
  int _currentQrIndex = 0;
  bool _isAutoScrolling = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _titleController = TextEditingController();
    _companyController = TextEditingController();
    _phoneController = TextEditingController();
    _linkedinController = TextEditingController();
    _twitterController = TextEditingController();
    _githubController = TextEditingController();
    _instagramController = TextEditingController();
    _websiteController = TextEditingController();

    _nameController.addListener(_onFieldChanged);
    _linkedinController.addListener(_onFieldChanged);
    _twitterController.addListener(_onFieldChanged);
    _githubController.addListener(_onFieldChanged);
    _instagramController.addListener(_onFieldChanged);
    _websiteController.addListener(_onFieldChanged);

    _scrollController.addListener(_onScroll);
  }

  void _onFieldChanged() {
    if (mounted) setState(() {});
  }

  void _syncControllers(UserProfileData profile) {
    if (!_initializedControllers && !profile.isLoading) {
      _nameController.text = profile.name;
      _titleController.text = profile.title;
      _companyController.text = profile.company;
      _phoneController.text = profile.phone;
      _linkedinController.text = profile.linkedin;
      _twitterController.text = profile.twitter;
      _githubController.text = profile.github;
      _instagramController.text = profile.instagram;
      _websiteController.text = profile.website;
      _isPublic = profile.isPublic;
      _initializedControllers = true;
    }
  }

  String _normalizeLinkedInUrl(String raw) {
    raw = raw.trim();
    if (raw.isEmpty) return '';
    if (raw.startsWith('@')) raw = raw.substring(1).trim();
    if (raw.startsWith('http://')) raw = 'https://${raw.substring(7)}';
    if (raw.startsWith('https://')) return raw;
    if (raw.startsWith('www.linkedin.com')) return 'https://$raw';
    if (raw.startsWith('linkedin.com')) return 'https://www.$raw';
    if (raw.startsWith('in/')) return 'https://www.linkedin.com/$raw';
    return 'https://www.linkedin.com/in/$raw';
  }

  String _normalizeTwitterUrl(String raw) {
    raw = raw.trim();
    if (raw.isEmpty) return '';
    if (raw.startsWith('@')) raw = raw.substring(1).trim();
    if (raw.startsWith('http://')) raw = 'https://${raw.substring(7)}';
    if (raw.startsWith('https://')) return raw;
    if (raw.startsWith('www.x.com') || raw.startsWith('www.twitter.com')) {
      return 'https://$raw';
    }
    if (raw.startsWith('x.com') || raw.startsWith('twitter.com')) {
      return 'https://$raw';
    }
    return 'https://x.com/$raw';
  }

  String _normalizeGithubUrl(String raw) {
    raw = raw.trim();
    if (raw.isEmpty) return '';
    if (raw.startsWith('@')) raw = raw.substring(1).trim();
    if (raw.startsWith('http://')) raw = 'https://${raw.substring(7)}';
    if (raw.startsWith('https://')) return raw;
    if (raw.startsWith('www.github.com') || raw.startsWith('github.com')) {
      return 'https://$raw';
    }
    return 'https://github.com/$raw';
  }

  String _normalizeInstagramUrl(String raw) {
    raw = raw.trim();
    if (raw.isEmpty) return '';
    if (raw.startsWith('@')) raw = raw.substring(1).trim();
    if (raw.startsWith('http://')) raw = 'https://${raw.substring(7)}';
    if (raw.startsWith('https://')) return raw;
    if (raw.startsWith('www.instagram.com') || raw.startsWith('instagram.com')) {
      return 'https://$raw';
    }
    return 'https://instagram.com/$raw';
  }

  String _normalizeWebsiteUrl(String raw) {
    raw = raw.trim();
    if (raw.isEmpty) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return 'https://$raw';
  }

  List<_SocialQrPlatform> _getSocialPlatforms(BuildContext context) {
    return [
      _SocialQrPlatform(
        id: 'linkedin',
        label: 'LinkedIn',
        shortPrefix: 'in',
        color: const Color(0xFF0A66C2),
        highlightColor: const Color(0xFF0A66C2),
        eyeColor: const Color(0xFF0A66C2),
        controller: _linkedinController,
        normalizer: _normalizeLinkedInUrl,
      ),
      _SocialQrPlatform(
        id: 'twitter',
        label: 'Twitter / 𝕏',
        shortPrefix: '𝕏',
        color: const Color(0xFF14171A),
        highlightColor: const Color(0xFFE5E7EB), // Bright light grey/silver
        eyeColor: const Color(0xFF14171A),
        controller: _twitterController,
        normalizer: _normalizeTwitterUrl,
      ),
      _SocialQrPlatform(
        id: 'github',
        label: 'GitHub',
        shortPrefix: 'GH',
        color: const Color(0xFF24292E),
        highlightColor: const Color(0xFF9CA3AF), // Refined medium-light grey
        eyeColor: const Color(0xFF24292E),
        controller: _githubController,
        normalizer: _normalizeGithubUrl,
      ),
      _SocialQrPlatform(
        id: 'instagram',
        label: 'Instagram',
        shortPrefix: 'IG',
        color: const Color(0xFFE1306C),
        highlightColor: const Color(0xFFE1306C),
        eyeColor: const Color(0xFFE1306C),
        gradient: const LinearGradient(
          begin: Alignment.bottomLeft,
          end: Alignment.topRight,
          colors: [
            Color(0xFFF9CE34),
            Color(0xFFEE2A7B),
            Color(0xFF6228D7),
          ],
        ),
        controller: _instagramController,
        normalizer: _normalizeInstagramUrl,
      ),
      _SocialQrPlatform(
        id: 'website',
        label: 'Website',
        shortPrefix: '🌐',
        color: context.colors.primary,
        highlightColor: context.colors.primary,
        eyeColor: context.colors.primary,
        controller: _websiteController,
        normalizer: _normalizeWebsiteUrl,
      ),
    ];
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _qrPageController.dispose();
    _nameController.removeListener(_onFieldChanged);
    _linkedinController.removeListener(_onFieldChanged);
    _twitterController.removeListener(_onFieldChanged);
    _githubController.removeListener(_onFieldChanged);
    _instagramController.removeListener(_onFieldChanged);
    _websiteController.removeListener(_onFieldChanged);
    _nameController.dispose();
    _titleController.dispose();
    _companyController.dispose();
    _phoneController.dispose();
    _linkedinController.dispose();
    _twitterController.dispose();
    _githubController.dispose();
    _instagramController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isAutoScrolling || !mounted || !_scrollController.hasClients) return;

    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;

    String newActive = _activeTab;
    if (maxScroll > 0 && currentScroll >= maxScroll - 60) {
      newActive = 'Profile QR';
    } else if (currentScroll > 180) {
      newActive = 'Profile QR';
    } else {
      newActive = 'Profile Info';
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
    _isAutoScrolling = true;
    final RenderBox box = key.currentContext!.findRenderObject() as RenderBox;
    final position =
        box.localToGlobal(Offset.zero, ancestor: context.findRenderObject());

    final target = _scrollController.offset +
        position.dy -
        (kToolbarHeight + MediaQuery.of(context).padding.top + 20);

    _scrollController
        .animateTo(
      target.clamp(0.0, _scrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
    )
        .then((_) {
      Future.delayed(const Duration(milliseconds: 150), () {
        if (mounted) _isAutoScrolling = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final profile = ref.watch(profileProvider);
    _syncControllers(profile);

    final isGuest = authState.user?.isGuest ?? false;
    final platforms = _getSocialPlatforms(context);

    return Stack(
      children: [
        // ── Scrollable content ──
        SingleChildScrollView(
          controller: _scrollController,
          padding: EdgeInsets.only(
            top: Responsive.topPadding(context),
            left: Responsive.pagePadding(context),
            right: Responsive.pagePadding(context),
            bottom: (Responsive.isWide(context) ? 24 : 84) +
                MediaQuery.of(context).padding.bottom,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints:
                  const BoxConstraints(maxWidth: Responsive.maxContentWidth),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Page Heading (Standardized) ──
                  PopInItem(
                    index: 0,
                    child: Center(
                      child: Text(
                        context.tr('networkProfile'),
                        style: AppTypography.headlineMd,
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Trial Banner ──
                  if (isGuest) ...[
                    const PopInItem(
                      index: 1,
                      child: TrialBannerCard(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Section 1: Profile Information ──
                  Column(
                    children: [
                      PopInItem(
                        index: isGuest ? 2 : 1,
                        child: SectionHeader(
                          icon: Icons.badge_rounded,
                          label: context.tr('profileInformation'),
                          color: context.colors.primary,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Profile Card Container
                      PopInItem(
                        index: isGuest ? 3 : 2,
                        child: GlassCard(
                          borderRadius: BorderRadius.circular(20),
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Form Fields (Highlighted till Phone Number)
                              Container(
                                key: _profileInfoKey,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _buildTextField(
                                      context,
                                      label: context.tr('fullName'),
                                      controller: _nameController,
                                      hint: context.tr('hintFullName'),
                                    ),
                                    const SizedBox(height: 16),
                                    _buildTextField(
                                      context,
                                      label: context.tr('position'),
                                      controller: _titleController,
                                      hint: context.tr('hintJobTitle'),
                                    ),
                                    const SizedBox(height: 16),
                                    _buildTextField(
                                      context,
                                      label: context.tr('company'),
                                      controller: _companyController,
                                      hint: context.tr('hintCompany'),
                                    ),
                                    const SizedBox(height: 16),
                                    _buildTextField(
                                      context,
                                      label: context.tr('phone'),
                                      controller: _phoneController,
                                      hint: '+1 234 567 8900',
                                      keyboardType: TextInputType.phone,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),

                                // Social Links
                                const Divider(color: Color(0x1FFFFFFF)),
                                const SizedBox(height: 24),
                                Text(
                                  context.tr('socialLinks'),
                                  style: AppTypography.bodyMd.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 20),
                                _buildSocialField(
                                  context,
                                  prefix: 'LinkedIn',
                                  customIcon: const BrandLogoWidget(
                                    id: 'linkedin',
                                    size: 20,
                                    color: Colors.white,
                                  ),
                                  bgColor: const Color(0xFF0A66C2),
                                  controller: _linkedinController,
                                  hint: 'linkedin.com/in/you',
                                ),
                                const SizedBox(height: 12),
                                _buildSocialField(
                                  context,
                                  prefix: 'Twitter / 𝕏',
                                  customIcon: const BrandLogoWidget(
                                    id: 'twitter',
                                    size: 18,
                                    color: Colors.white,
                                  ),
                                  bgColor: const Color(0xFF14171A),
                                  controller: _twitterController,
                                  hint: '@yourhandle',
                                ),
                                const SizedBox(height: 12),
                                _buildSocialField(
                                  context,
                                  prefix: 'GitHub',
                                  customIcon: const BrandLogoWidget(
                                    id: 'github',
                                    size: 20,
                                    color: Colors.white,
                                  ),
                                  bgColor: const Color(0xFF24292E),
                                  controller: _githubController,
                                  hint: 'github.com/you',
                                ),
                                const SizedBox(height: 12),
                                _buildSocialField(
                                  context,
                                  prefix: 'Instagram',
                                  customIcon: const BrandLogoWidget(
                                    id: 'instagram',
                                    size: 20,
                                    color: Colors.white,
                                  ),
                                  bgGradient: const LinearGradient(
                                    begin: Alignment.bottomLeft,
                                    end: Alignment.topRight,
                                    colors: [
                                      Color(0xFFF9CE34),
                                      Color(0xFFEE2A7B),
                                      Color(0xFF6228D7),
                                    ],
                                  ),
                                  controller: _instagramController,
                                  hint: '@yourhandle',
                                ),
                                const SizedBox(height: 12),
                                _buildSocialField(
                                  context,
                                  prefix: 'Website',
                                  customIcon: BrandLogoWidget(
                                    id: 'website',
                                    size: 20,
                                    color: Colors.white,
                                  ),
                                  bgColor: context.colors.primary,
                                  controller: _websiteController,
                                  hint: 'https://yourwebsite.com',
                                ),
                                const SizedBox(height: 24),

                                const Divider(color: Color(0x1FFFFFFF)),
                                const SizedBox(height: 16),

                                // Public Profile Visibility
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            context.tr('publicProfile'),
                                            style: AppTypography.bodyMd
                                                .copyWith(
                                              fontWeight: FontWeight.w600,
                                              color: context.colors.onSurface,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            context.tr('publicProfileSubtitle'),
                                            style: AppTypography.bodySm
                                                .copyWith(
                                              color: context
                                                  .colors.onSurfaceVariant
                                                  .withValues(alpha: 0.7),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Switch(
                                      value: _isPublic,
                                      activeThumbColor: context.colors.primary,
                                      onChanged: (val) {
                                        setState(() => _isPublic = val);
                                        ref
                                            .read(profileProvider.notifier)
                                            .togglePublicProfile(val);
                                      },
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 14),

                                // View Public Directory
                                OutlinedButton.icon(
                                  onPressed: () =>
                                      context.push(AppRoutes.directory),
                                  icon: Icon(
                                    Icons.public_rounded,
                                    size: 18,
                                    color: context.colors.primary,
                                  ),
                                  label: Text(
                                    context.tr('viewPublicDirectory'),
                                    style: AppTypography.bodyMd.copyWith(
                                      color: context.colors.onSurface,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    minimumSize:
                                        const Size(double.infinity, 44),
                                    side: BorderSide(
                                        color: context.colors.glassBorder),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    backgroundColor: context
                                        .colors.surfaceContainerLow
                                        .withValues(alpha: 0.35),
                                  ),
                                ),
                                const SizedBox(height: 20),

                                const Divider(color: Color(0x1FFFFFFF)),
                                const SizedBox(height: 16),
                                GradientButton(
                                  label: profile.isSaving
                                      ? context.tr('saving')
                                      : context.tr('saveProfile'),
                                  icon: Icons.save,
                                  height: 44,
                                  isLoading: profile.isSaving,
                                  onPressed: () async {
                                    final success = await ref
                                        .read(profileProvider.notifier)
                                        .saveProfile(
                                          name: _nameController.text,
                                          title: _titleController.text,
                                          company: _companyController.text,
                                          phone: _phoneController.text,
                                          email: profile.email,
                                          linkedin: _linkedinController.text,
                                          website: _websiteController.text,
                                          twitter: _twitterController.text,
                                          github: _githubController.text,
                                          instagram: _instagramController.text,
                                          isPublic: _isPublic,
                                        );

                                    if (context.mounted) {
                                      AppToast.show(
                                        context,
                                        success
                                            ? context.tr('saveProfileSuccess')
                                            : context.tr('saveProfileError'),
                                        type: success ? ToastType.success : ToastType.error,
                                      );
                                    }
                                  },
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  const SizedBox(height: 60),

                  // ── Section 2: Profile QR Carousel ──
                  PopInItem(
                    index: 3,
                    child: Container(
                      key: _profileQrKey,
                      child: Column(
                        children: [
                          SectionHeader(
                            icon: Icons.qr_code_2_rounded,
                            label: context.tr('profileQr'),
                            color: const Color(0xFF8B5CF6),
                          ),
                          const SizedBox(height: 20),
                          GlassCard(
                            borderRadius: BorderRadius.circular(20),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 24,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                // Top Carousel Navigation: Spaced Brand Logos with Highlighted Active Border
                                Center(
                                  child: SingleChildScrollView(
                                    scrollDirection: Axis.horizontal,
                                    physics: const BouncingScrollPhysics(),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 4),
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: List.generate(
                                            platforms.length, (i) {
                                          final p = platforms[i];
                                          final isActive =
                                              _currentQrIndex == i;
                                          final brandColor = p.color ??
                                              context.colors.primary;
                                          final highlightColor =
                                              p.highlightColor ?? brandColor;

                                          return Padding(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 9),
                                            child: InkWell(
                                              onTap: () {
                                                _qrPageController.animateToPage(
                                                  i,
                                                  duration: const Duration(
                                                      milliseconds: 320),
                                                  curve: Curves.easeOutCubic,
                                                );
                                              },
                                              borderRadius:
                                                  BorderRadius.circular(15),
                                              child: AnimatedContainer(
                                                duration: const Duration(
                                                    milliseconds: 220),
                                                width: 50,
                                                height: 50,
                                                decoration: BoxDecoration(
                                                  color: isActive
                                                      ? highlightColor.withValues(
                                                          alpha: 0.18)
                                                      : context
                                                          .colors
                                                          .surfaceContainerLow
                                                          .withValues(
                                                              alpha: 0.5),
                                                  borderRadius:
                                                      BorderRadius.circular(15),
                                                  border: Border.all(
                                                    color: isActive
                                                        ? highlightColor
                                                        : context
                                                            .colors
                                                            .glassBorder,
                                                    width: isActive ? 2.5 : 1.2,
                                                  ),
                                                  boxShadow: isActive
                                                      ? [
                                                          BoxShadow(
                                                            color: highlightColor
                                                                .withValues(
                                                                    alpha: 0.45),
                                                            blurRadius: 16,
                                                            spreadRadius: 1,
                                                          ),
                                                        ]
                                                      : [
                                                          BoxShadow(
                                                            color: Colors.black
                                                                .withValues(
                                                                    alpha: 0.08),
                                                            blurRadius: 6,
                                                            offset:
                                                                const Offset(
                                                                    0, 2),
                                                          ),
                                                        ],
                                                ),
                                                alignment: Alignment.center,
                                                child: BrandLogoWidget(
                                                  id: p.id,
                                                  size: 22,
                                                  color: isActive
                                                      ? Colors.white
                                                      : context
                                                          .colors
                                                          .onSurfaceVariant
                                                          .withValues(alpha: 0.8),
                                                ),
                                              ),
                                            ),
                                          );
                                        }),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 18),

                                // Swipeable PageView for Social QRs
                                SizedBox(
                                  height: 410,
                                  child: PageView.builder(
                                    controller: _qrPageController,
                                    itemCount: platforms.length,
                                    physics: const BouncingScrollPhysics(),
                                    onPageChanged: (index) {
                                      setState(() => _currentQrIndex = index);
                                    },
                                    itemBuilder: (context, index) {
                                      final p = platforms[index];
                                      final qrData =
                                          p.normalizer(p.controller.text);
                                      final hasData = qrData.isNotEmpty;
                                      final brandColor = p.color ??
                                          context.colors.primary;
                                      final highlightColor =
                                          p.highlightColor ?? brandColor;

                                      return Column(
                                        mainAxisSize: MainAxisSize.min,
                                        crossAxisAlignment:
                                            CrossAxisAlignment.center,
                                        children: [
                                          const SizedBox(height: 8),
                                          // Platform Icon Badge & Name
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Container(
                                                width: 42,
                                                height: 42,
                                                decoration: BoxDecoration(
                                                  color: p.color ??
                                                      context.colors.primary,
                                                  gradient: p.gradient,
                                                  borderRadius:
                                                      BorderRadius.circular(12),
                                                  border: p.highlightColor !=
                                                          null
                                                      ? Border.all(
                                                          color: p
                                                              .highlightColor!
                                                              .withValues(
                                                                  alpha: 0.35),
                                                          width: 1.2,
                                                        )
                                                      : null,
                                                  boxShadow: [
                                                    BoxShadow(
                                                      color: highlightColor
                                                          .withValues(
                                                              alpha: 0.35),
                                                      blurRadius: 12,
                                                      offset:
                                                          const Offset(0, 2),
                                                    ),
                                                  ],
                                                ),
                                                alignment: Alignment.center,
                                                child: BrandLogoWidget(
                                                  id: p.id,
                                                  size: 22,
                                                  color: Colors.white,
                                                ),
                                              ),
                                              const SizedBox(width: 10),
                                              Text(
                                                '${p.label} QR',
                                                style: AppTypography.headlineSm
                                                    .copyWith(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold,
                                                  color:
                                                      context.colors.onSurface,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 18),

                                          // QR Image or Empty State Placeholder
                                          if (hasData)
                                            Container(
                                              width: 200,
                                              height: 200,
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                color: Colors.white,
                                                borderRadius:
                                                    BorderRadius.circular(16),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: highlightColor
                                                        .withValues(
                                                            alpha: 0.22),
                                                    blurRadius: 20,
                                                    offset:
                                                        const Offset(0, 4),
                                                  ),
                                                ],
                                              ),
                                              child: Center(
                                                child: QrImageView(
                                                  data: qrData,
                                                  version: QrVersions.auto,
                                                  size: 176,
                                                  backgroundColor: Colors.white,
                                                  eyeStyle: QrEyeStyle(
                                                    eyeShape: QrEyeShape.square,
                                                    color: p.eyeColor ??
                                                        brandColor,
                                                  ),
                                                  dataModuleStyle:
                                                      const QrDataModuleStyle(
                                                    dataModuleShape:
                                                        QrDataModuleShape
                                                            .square,
                                                    color: Color(0xFF111827),
                                                  ),
                                                ),
                                              ),
                                            )
                                          else
                                            Container(
                                              width: 192,
                                              height: 192,
                                              decoration: BoxDecoration(
                                                color: context
                                                    .colors
                                                    .surfaceContainerLow
                                                    .withValues(alpha: 0.3),
                                                borderRadius:
                                                    BorderRadius.circular(16),
                                                border: Border.all(
                                                  color: context
                                                      .colors.glassBorder,
                                                  width: 1.5,
                                                ),
                                              ),
                                              child: Center(
                                                child: Column(
                                                  mainAxisAlignment:
                                                      MainAxisAlignment.center,
                                                  children: [
                                                    Icon(
                                                      Icons.qr_code_2_rounded,
                                                      size: 72,
                                                      color: context
                                                          .colors
                                                          .onSurfaceVariant
                                                          .withValues(
                                                              alpha: 0.35),
                                                    ),
                                                    const SizedBox(height: 8),
                                                    Text(
                                                      '${p.label} URL',
                                                      style: AppTypography
                                                          .bodySm
                                                          .copyWith(
                                                        fontWeight:
                                                            FontWeight.w600,
                                                        color: context
                                                            .colors
                                                            .onSurfaceVariant
                                                            .withValues(
                                                                alpha: 0.7),
                                                      ),
                                                    ),
                                                    const SizedBox(height: 4),
                                                    Text(
                                                      context.tr('enterUrlPrompt'),
                                                      style: AppTypography
                                                          .bodySm
                                                          .copyWith(
                                                        fontSize: 11,
                                                        color: context
                                                            .colors
                                                            .onSurfaceVariant
                                                            .withValues(
                                                                alpha: 0.4),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          const SizedBox(height: 18),

                                          // Action Buttons
                                          if (hasData) ...[
                                            Wrap(
                                              spacing: 8,
                                              runSpacing: 8,
                                              alignment: WrapAlignment.center,
                                              children: [
                                                _buildQrActionButton(
                                                  context,
                                                  icon: Icons.copy_rounded,
                                                  label: context.tr('copyLink'),
                                                  onTap: () {
                                                    Clipboard.setData(
                                                      ClipboardData(
                                                          text: qrData),
                                                    );
                                                    AppToast.show(context, '${p.label}: ${context.tr('copiedToClipboard')}');
                                                  },
                                                ),
                                                _buildQrActionButton(
                                                  context,
                                                  icon: Icons
                                                      .open_in_new_rounded,
                                                  label: context.tr('open'),
                                                  onTap: () async {
                                                    final uri =
                                                        Uri.tryParse(qrData);
                                                    if (uri != null) {
                                                      try {
                                                        await launchUrl(uri,
                                                            mode: LaunchMode
                                                                .externalApplication);
                                                      } catch (_) {}
                                                    }
                                                  },
                                                ),
                                                _buildQrActionButton(
                                                  context,
                                                  icon: Icons.share_rounded,
                                                  label: context.tr('share'),
                                                  onTap: () {
                                                    final name =
                                                        _nameController.text
                                                            .trim();
                                                    final shareText = context.isJapanese
                                                        ? (name.isNotEmpty
                                                            ? '$name様と${p.label}でつながる: $qrData'
                                                            : '${p.label}で私とつながる: $qrData')
                                                        : (name.isNotEmpty
                                                            ? 'Connect with $name on ${p.label}: $qrData'
                                                            : 'Connect with me on ${p.label}: $qrData');
                                                    Clipboard.setData(
                                                      ClipboardData(
                                                          text: shareText),
                                                    );
                                                    AppToast.show(context, context.tr('shareTextCopied'));
                                                  },
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 14),
                                          ] else ...[
                                            _buildQrActionButton(
                                              context,
                                              icon: Icons.edit_note_rounded,
                                              label: '${context.tr('add')} ${p.label}',
                                              onTap: () =>
                                                  _scrollTo(_profileInfoKey),
                                            ),
                                            const SizedBox(height: 14),
                                          ],

                                          // Footnote / Caption
                                          Padding(
                                            padding:
                                                const EdgeInsets.symmetric(
                                                    horizontal: 16),
                                            child: Text(
                                              hasData
                                                  ? '${context.tr('scanToConnect')} ${p.label}'
                                                  : '${p.label}: ${context.tr('enterUrlPrompt')}',
                                              textAlign: TextAlign.center,
                                              style: AppTypography.bodySm
                                                  .copyWith(
                                                color: context
                                                    .colors.onSurfaceVariant
                                                    .withValues(alpha: 0.7),
                                              ),
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
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // ── Sticky Bottom Navbar — Floating Liquid Glass ──
        FloatingLiquidGlassNavBar(
          activeTabLabel: _activeTab,
          items: [
            FloatingNavItem(
              id: 'Profile Info',
              label: context.tr('profileInfo'),
              icon: Icons.person_outline,
              activeIcon: Icons.person_rounded,
              onTap: () => _scrollTo(_profileInfoKey, 'Profile Info'),
            ),
            FloatingNavItem(
              id: 'Profile QR',
              label: context.tr('profileQr'),
              icon: Icons.qr_code_outlined,
              activeIcon: Icons.qr_code_rounded,
              onTap: () => _scrollTo(_profileQrKey, 'Profile QR'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTextField(
    BuildContext context, {
    required String label,
    required TextEditingController controller,
    String? hint,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            label.toUpperCase(),
            style: AppTypography.labelCaps.copyWith(
              fontSize: 11,
              color: context.colors.onSurfaceVariant,
            ),
          ),
        ),
        Container(
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: context.colors.surfaceContainerLow.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.colors.glassBorder),
            boxShadow: [
              BoxShadow(
                color: context.colors.onSurface.withValues(alpha: 0.04),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            style:
                AppTypography.bodyMd.copyWith(color: context.colors.onSurface),
            decoration: InputDecoration(
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              fillColor: Colors.transparent,
              isDense: true,
              hintText: hint,
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSocialField(
    BuildContext context, {
    required String prefix,
    Color? bgColor,
    Gradient? bgGradient,
    required TextEditingController controller,
    String? hint,
    Color textColor = Colors.white,
    IconData? icon,
    Widget? customIcon,
  }) {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: context.colors.surfaceContainerLow.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.glassBorder),
        boxShadow: [
          BoxShadow(
            color: context.colors.onSurface.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            margin: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: bgColor,
              gradient: bgGradient,
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: customIcon ??
                (icon != null
                    ? Icon(icon, color: textColor, size: 20)
                    : Text(
                        prefix,
                        style: AppTypography.bodyMd.copyWith(
                          color: textColor,
                          fontWeight: FontWeight.bold,
                        ),
                      )),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: TextField(
                controller: controller,
                style: AppTypography.bodyMd
                    .copyWith(color: context.colors.onSurface),
                decoration: InputDecoration(
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  fillColor: Colors.transparent,
                  isDense: true,
                  hintText: hint ?? '$prefix URL',
                  hintStyle: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant
                        .withValues(alpha: 0.3),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQrActionButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: context.colors.surfaceContainerLow.withValues(alpha: 0.5),
          border: Border.all(color: context.colors.glassBorder),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: context.colors.primary),
            const SizedBox(width: 6),
            Text(
              label,
              style: AppTypography.bodySm.copyWith(
                color: context.colors.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

}

class _SocialQrPlatform {
  final String id;
  final String label;
  final String shortPrefix;
  final Color? color;
  final Color? highlightColor;
  final Color? eyeColor;
  final Gradient? gradient;
  final TextEditingController controller;
  final String Function(String raw) normalizer;

  const _SocialQrPlatform({
    required this.id,
    required this.label,
    required this.shortPrefix,
    this.color,
    this.highlightColor,
    this.eyeColor,
    this.gradient,
    required this.controller,
    required this.normalizer,
  });
}

class BrandLogoWidget extends StatelessWidget {
  final String id;
  final double size;
  final Color color;

  const BrandLogoWidget({
    super.key,
    required this.id,
    this.size = 20,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final hex =
        '#${color.toARGB32().toRadixString(16).padLeft(8, '0').substring(2)}';
    String svg;
    switch (id) {
      case 'linkedin':
        svg =
            '<svg viewBox="0 0 24 24" width="$size" height="$size"><path fill="$hex" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>';
        break;
      case 'twitter':
        svg =
            '<svg viewBox="0 0 24 24" width="$size" height="$size"><path fill="$hex" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
        break;
      case 'github':
        svg =
            '<svg viewBox="0 0 24 24" width="$size" height="$size"><path fill="$hex" fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>';
        break;
      case 'instagram':
        svg =
            '<svg viewBox="0 0 24 24" width="$size" height="$size"><path fill="$hex" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>';
        break;
      case 'website':
      default:
        svg =
            '<svg viewBox="0 0 24 24" width="$size" height="$size" fill="none" stroke="$hex" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
        break;
    }
    return SvgPicture.string(
      svg,
      width: size,
      height: size,
      fit: BoxFit.contain,
    );
  }
}
