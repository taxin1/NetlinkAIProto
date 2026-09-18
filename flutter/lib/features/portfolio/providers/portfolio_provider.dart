import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/services/supabase_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/portfolio_model.dart';
import '../services/portfolio_service.dart';


class PortfolioState {
  final Portfolio? portfolio;
  final Map<String, dynamic>? networkProfile;
  final bool isLoading;
  final bool isGenerating;
  final bool isSaving;
  final bool isUploadingImage;
  final bool isSyncingGoogle;
  final bool isExtractingCV;
  final String? cvFileName;
  final Map<String, dynamic>? cvData;
  final String? errorMessage;
  final String? successMessage;

  const PortfolioState({
    this.portfolio,
    this.networkProfile,
    this.isLoading = true,
    this.isGenerating = false,
    this.isSaving = false,
    this.isUploadingImage = false,
    this.isSyncingGoogle = false,
    this.isExtractingCV = false,
    this.cvFileName,
    this.cvData,
    this.errorMessage,
    this.successMessage,
  });

  PortfolioState copyWith({
    Portfolio? portfolio,
    Map<String, dynamic>? networkProfile,
    bool? isLoading,
    bool? isGenerating,
    bool? isSaving,
    bool? isUploadingImage,
    bool? isSyncingGoogle,
    bool? isExtractingCV,
    String? cvFileName,
    Map<String, dynamic>? cvData,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
    bool clearCV = false,
  }) {
    return PortfolioState(
      portfolio: portfolio ?? this.portfolio,
      networkProfile: networkProfile ?? this.networkProfile,
      isLoading: isLoading ?? this.isLoading,
      isGenerating: isGenerating ?? this.isGenerating,
      isSaving: isSaving ?? this.isSaving,
      isUploadingImage: isUploadingImage ?? this.isUploadingImage,
      isSyncingGoogle: isSyncingGoogle ?? this.isSyncingGoogle,
      isExtractingCV: isExtractingCV ?? this.isExtractingCV,
      cvFileName: clearCV ? null : (cvFileName ?? this.cvFileName),
      cvData: clearCV ? null : (cvData ?? this.cvData),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      successMessage: clearSuccess ? null : (successMessage ?? this.successMessage),
    );
  }
}

class PortfolioNotifier extends StateNotifier<PortfolioState> {
  PortfolioNotifier([this._ref]) : super(const PortfolioState()) {
    loadPortfolioData();
  }

  final Ref? _ref;
  final _picker = ImagePicker();

  Future<void> loadPortfolioData() async {
    state = state.copyWith(isLoading: true, clearError: true, clearSuccess: true);
    try {
      final user = SupabaseService.client.auth.currentUser;
      if (user == null) {
        // Guest / Trial Mode: pre-populate rich sample draft portfolio so screen is fully accessible
        const guestPortfolio = Portfolio(
          id: 'guest_portfolio',
          userId: 'guest',
          slug: 'alex-rivera',
          title: 'Alex Rivera',
          subtitle: 'Senior AI & Full-Stack Architect',
          bio: 'Passionate about building intelligent multi-agent systems, delightful user interfaces, and robust cloud infrastructure.',
          profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          theme: 'modern',
          isPublic: true,
          showContactInfo: true,
          showSocialLinks: true,
          sections: [
            PortfolioSection(
              id: 'sec_1',
              type: 'about',
              title: 'About Me',
              content: 'Dedicated software architect with 8+ years of experience leading cross-functional engineering teams, building scalable microservices, and deploying production machine learning models.',
              order: 0,
            ),
            PortfolioSection(
              id: 'sec_2',
              type: 'skills',
              title: 'Core Expertise & Skills',
              content: '• Mobile: Flutter, Dart, React Native, Swift\n• Web & Cloud: TypeScript, React, Next.js, Node.js, Python, PostgreSQL, Supabase, Docker\n• AI & Agents: LangChain, OpenAI APIs, Gemini SDK, Autonomous Tool Calling',
              order: 1,
            ),
            PortfolioSection(
              id: 'sec_3',
              type: 'projects',
              title: 'Featured Projects',
              content: '1. Netlink AI — Real-time business card scanner and smart follow-up dispatching engine.\n2. QuantumFlow — Distributed asynchronous task execution framework with sub-second latency.',
              order: 2,
            ),
          ],
        );

        state = state.copyWith(
          portfolio: guestPortfolio,
          isLoading: false,
        );
        return;
      }

      final profile = await PortfolioService.fetchNetworkProfile(user.id);
      var portfolio = await PortfolioService.fetchPortfolio(user.id);

      // If no saved portfolio yet, create empty scaffold with profile autofill
      if (portfolio == null) {
        final displayName = (profile?['display_name'] as String?) ??
            (profile?['full_name'] as String?) ??
            user.email?.split('@').first ??
            'My Portfolio';
        final userTitle = (profile?['title'] as String?) ?? 'Professional';
        final initialSlug = displayName
            .toLowerCase()
            .replaceAll(RegExp(r'[^a-z0-9]'), '-')
            .replaceAll(RegExp(r'-+'), '-')
            .trim();

        portfolio = Portfolio(
          id: '',
          userId: user.id,
          slug: initialSlug.isNotEmpty ? initialSlug : 'user-${user.id.substring(0, 8)}',
          title: displayName,
          subtitle: userTitle,
          bio: profile?['bio'] as String?,
          profileImageUrl: profile?['avatar_url'] as String? ?? await PortfolioService.getGoogleAvatarUrl(),
          theme: 'modern',
          isPublic: true,
          showContactInfo: true,
          showSocialLinks: true,
          sections: const [],
        );
      }

      state = state.copyWith(
        portfolio: portfolio,
        networkProfile: profile,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load portfolio: $e',
      );
    }
  }

  /// Generate or regenerate portfolio using AI
  Future<void> generatePortfolio({String? additionalInfo}) async {
    final user = SupabaseService.client.auth.currentUser;
    final userId = user?.id ?? 'guest';

    state = state.copyWith(isGenerating: true, clearError: true, clearSuccess: true);
    try {
      final generated = await PortfolioService.generatePortfolioWithAI(
        userId: userId,
        profile: state.networkProfile,
        cvData: state.cvData,
        additionalInfo: additionalInfo,
        currentProfileImageUrl: state.portfolio?.profileImageUrl,
      );

      // Preserve existing ID if already created
      final updated = generated.copyWith(
        id: state.portfolio?.id,
        slug: (state.portfolio?.slug.isNotEmpty == true)
            ? state.portfolio!.slug
            : generated.slug,
        theme: state.portfolio?.theme ?? 'modern',
        isPublic: state.portfolio?.isPublic ?? true,
      );

      state = state.copyWith(
        portfolio: updated,
        isGenerating: false,
        successMessage: 'Portfolio generated with AI! Review and save your changes.',
      );
    } catch (e) {
      state = state.copyWith(
        isGenerating: false,
        errorMessage: 'AI generation failed: $e',
      );
    }
  }

  /// Save current portfolio to Supabase
  Future<bool> savePortfolio() async {
    if (state.portfolio == null) return false;

    final user = SupabaseService.client.auth.currentUser;
    if (user == null) {
      // Trial mode: local in-memory save with notice
      state = state.copyWith(
        isSaving: false,
        successMessage: 'Portfolio updated in Trial Mode! (Progress will not be saved permanently)',
      );
      return true;
    }

    state = state.copyWith(isSaving: true, clearError: true, clearSuccess: true);
    try {
      final saved = await PortfolioService.savePortfolio(state.portfolio!);
      if (saved != null) {
        state = state.copyWith(
          portfolio: saved,
          isSaving: false,
          successMessage: 'Portfolio published successfully!',
        );
        return true;
      }
      state = state.copyWith(
        isSaving: false,
        errorMessage: 'Failed to save portfolio.',
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: 'Error saving portfolio: $e',
      );
      return false;
    }
  }

  /// Upload new profile photo
  Future<void> pickAndUploadImage() async {
    final user = SupabaseService.client.auth.currentUser;

    try {
      final XFile? file = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (file == null) return;

      if (user == null) {
        state = state.copyWith(
          portfolio: state.portfolio?.copyWith(profileImageUrl: file.path),
          successMessage: 'Profile photo updated for this session!',
        );
        return;
      }

      state = state.copyWith(isUploadingImage: true, clearError: true);
      final bytes = await file.readAsBytes();
      final url = await PortfolioService.uploadProfileImage(
        bytes: bytes,
        fileName: file.name,
        userId: user.id,
      );

      if (url != null) {
        state = state.copyWith(
          portfolio: state.portfolio?.copyWith(profileImageUrl: url),
          isUploadingImage: false,
          successMessage: 'Profile photo uploaded!',
        );
      } else {
        state = state.copyWith(
          isUploadingImage: false,
          errorMessage: 'Could not upload image.',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isUploadingImage: false,
        errorMessage: 'Image upload error: $e',
      );
    }
  }

  /// Directly set a profile photo URL (e.g. from Google sync, modal or URL input)
  Future<void> setProfileImage(String url) async {
    final cleanUrl = url.trim();
    if (cleanUrl.isEmpty) return;

    final updated = state.portfolio?.copyWith(profileImageUrl: cleanUrl);
    state = state.copyWith(
      portfolio: updated,
      isSyncingGoogle: false,
      successMessage: 'Profile photo updated successfully!',
    );

    // Update current auth user avatar so Settings and App Shell update immediately
    _ref?.read(authProvider.notifier).updateUserAvatar(cleanUrl);

    final userId = updated?.userId ?? SupabaseService.client.auth.currentUser?.id;
    if (userId != null && userId.isNotEmpty && userId != 'guest') {
      try {
        if (updated != null) {
          await PortfolioService.savePortfolio(updated);
        }
      } catch (_) {}
      try {
        await SupabaseService.client
            .from('network_profiles')
            .update({'avatar_url': cleanUrl})
            .eq('user_id', userId);
      } catch (_) {}
    }
  }

  /// Sync photo from Google OAuth / Google Account or specified email
  Future<bool> syncGoogleAvatar({String? email, String? directUrl}) async {
    state = state.copyWith(isSyncingGoogle: true, clearError: true, clearSuccess: true);

    if (directUrl != null && directUrl.trim().isNotEmpty) {
      await setProfileImage(directUrl.trim());
      return true;
    }

    // Try finding avatar from specified email or current user metadata
    String? avatarUrl = await PortfolioService.getGoogleAvatarUrl(explicitEmail: email);

    if (avatarUrl != null && avatarUrl.trim().isNotEmpty) {
      await setProfileImage(avatarUrl.trim());
      return true;
    } else {
      state = state.copyWith(
        isSyncingGoogle: false,
        errorMessage: 'Could not find a Google profile photo. You can enter your Gmail or upload an image.',
      );
      return false;
    }
  }

  /// Remove profile photo

  void removeProfileImage() {
    state = state.copyWith(
      portfolio: state.portfolio?.copyWith(profileImageUrl: ''),
      successMessage: 'Profile photo removed.',
    );
  }

  /// Pick CV/Resume document and extract details
  Future<void> pickAndExtractCV() async {
    try {
      final file = await FilePicker.pickFile(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'docx', 'doc', 'txt'],
      );

      if (file != null) {
        state = state.copyWith(isExtractingCV: true, clearError: true);
        final bytes = await file.readAsBytes();
        final extracted = await PortfolioService.extractCVData(
          fileBytes: bytes,
          fileName: file.name,
        );

        state = state.copyWith(
          isExtractingCV: false,
          cvFileName: file.name,
          cvData: extracted,
          successMessage: 'Extracted skills and experience from ${file.name}!',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isExtractingCV: false,
        errorMessage: 'Failed to process CV: $e',
      );
    }
  }

  /// Remove CV file
  void removeCVFile() {
    state = state.copyWith(clearCV: true);
  }

  /// Update Basic Info
  void updateBasicInfo({String? title, String? subtitle, String? bio}) {
    if (state.portfolio == null) return;
    state = state.copyWith(
      portfolio: state.portfolio!.copyWith(
        title: title ?? state.portfolio!.title,
        subtitle: subtitle ?? state.portfolio!.subtitle,
        bio: bio ?? state.portfolio!.bio,
      ),
    );
  }

  /// Update Portfolio Settings
  void updateSettings({
    bool? isPublic,
    bool? showContactInfo,
    bool? showSocialLinks,
    String? theme,
    String? slug,
  }) {
    if (state.portfolio == null) return;

    final sanitizedSlug = (slug != null)
        ? slug.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9_-]'), '-')
        : state.portfolio!.slug;

    state = state.copyWith(
      portfolio: state.portfolio!.copyWith(
        isPublic: isPublic ?? state.portfolio!.isPublic,
        showContactInfo: showContactInfo ?? state.portfolio!.showContactInfo,
        showSocialLinks: showSocialLinks ?? state.portfolio!.showSocialLinks,
        theme: theme ?? state.portfolio!.theme,
        slug: sanitizedSlug,
      ),
    );
  }

  /// Add a new section
  void addSection({
    required String type,
    required String title,
    required String content,
  }) {
    if (state.portfolio == null) return;
    final currentSections = List<PortfolioSection>.from(state.portfolio!.sections);
    final newSection = PortfolioSection(
      id: '${type}_${DateTime.now().millisecondsSinceEpoch}',
      type: type,
      title: title,
      content: content,
      order: currentSections.length,
    );
    currentSections.add(newSection);

    state = state.copyWith(
      portfolio: state.portfolio!.copyWith(sections: currentSections),
      successMessage: 'Section "$title" added.',
    );
  }

  /// Update an existing section
  void updateSection(String id, {String? title, String? content}) {
    if (state.portfolio == null) return;
    final currentSections = state.portfolio!.sections.map((sec) {
      if (sec.id == id) {
        return sec.copyWith(
          title: title ?? sec.title,
          content: content ?? sec.content,
        );
      }
      return sec;
    }).toList();

    state = state.copyWith(
      portfolio: state.portfolio!.copyWith(sections: currentSections),
    );
  }

  /// Delete a section
  void deleteSection(String id) {
    if (state.portfolio == null) return;
    final currentSections = state.portfolio!.sections
        .where((s) => s.id != id)
        .toList();

    for (int i = 0; i < currentSections.length; i++) {
      currentSections[i] = currentSections[i].copyWith(order: i);
    }

    state = state.copyWith(
      portfolio: state.portfolio!.copyWith(sections: currentSections),
    );
  }

  /// Move section up or down
  void moveSection(int index, int delta) {
    if (state.portfolio == null) return;
    final newIndex = index + delta;
    if (newIndex < 0 || newIndex >= state.portfolio!.sections.length) return;

    final currentSections = List<PortfolioSection>.from(state.portfolio!.sections);
    final item = currentSections.removeAt(index);
    currentSections.insert(newIndex, item);

    for (int i = 0; i < currentSections.length; i++) {
      currentSections[i] = currentSections[i].copyWith(order: i);
    }

    state = state.copyWith(
      portfolio: state.portfolio!.copyWith(sections: currentSections),
    );
  }

  void clearMessages() {
    state = state.copyWith(clearError: true, clearSuccess: true);
  }
}

final portfolioProvider =
    StateNotifierProvider<PortfolioNotifier, PortfolioState>((ref) {
  return PortfolioNotifier(ref);
});
