import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/models/auth_models.dart';
import '../../auth/providers/auth_provider.dart';
import '../services/profile_service.dart';

class UserProfileData {
  final String name;
  final String title;
  final String company;
  final String phone;
  final String email;
  final String linkedin;
  final String website;
  final String twitter;
  final String github;
  final String instagram;
  final bool isPublic;
  final bool isLoading;
  final bool isSaving;
  final String? message;

  const UserProfileData({
    this.name = '',
    this.title = '',
    this.company = '',
    this.phone = '',
    this.email = '',
    this.linkedin = '',
    this.website = '',
    this.twitter = '',
    this.github = '',
    this.instagram = '',
    this.isPublic = true,
    this.isLoading = false,
    this.isSaving = false,
    this.message,
  });

  UserProfileData copyWith({
    String? name,
    String? title,
    String? company,
    String? phone,
    String? email,
    String? linkedin,
    String? website,
    String? twitter,
    String? github,
    String? instagram,
    bool? isPublic,
    bool? isLoading,
    bool? isSaving,
    String? message,
  }) {
    return UserProfileData(
      name: name ?? this.name,
      title: title ?? this.title,
      company: company ?? this.company,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      linkedin: linkedin ?? this.linkedin,
      website: website ?? this.website,
      twitter: twitter ?? this.twitter,
      github: github ?? this.github,
      instagram: instagram ?? this.instagram,
      isPublic: isPublic ?? this.isPublic,
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      message: message,
    );
  }
}

class ProfileNotifier extends StateNotifier<UserProfileData> {
  final Ref _ref;

  ProfileNotifier(this._ref) : super(const UserProfileData()) {
    loadProfile();

    // Reactively reload profile if authenticated user changes
    _ref.listen<AuthState>(authProvider, (previous, next) {
      if (previous?.user?.id != next.user?.id) {
        loadProfile();
      }
    });
  }

  Future<void> loadProfile() async {
    final user = _ref.read(authProvider).user;
    if (user == null) {
      state = const UserProfileData();
      return;
    }

    if (user.isGuest) {
      state = const UserProfileData(
        name: 'Alex Johnson',
        title: 'Product Designer',
        company: 'NetworkLink Labs',
        phone: '+1 (555) 234-5678',
        email: 'alex.j@networklink.ai',
        linkedin: 'linkedin.com/in/alexjohnson',
        website: 'alexjohnson.design',
        twitter: '@alexj_design',
        github: 'github.com/alexj',
        instagram: '@alexj_design',
        isPublic: true,
        isLoading: false,
      );
      return;
    }

    state = state.copyWith(isLoading: true);
    try {
      final data = await ProfileService.fetchProfile(user.id);
      if (data != null) {
        state = UserProfileData(
          name: data['name']?.toString() ?? user.name,
          title: data['title']?.toString() ?? '',
          company: data['company']?.toString() ?? '',
          phone: data['phone']?.toString() ?? '',
          email: data['email']?.toString() ?? user.email,
          linkedin: data['linkedin']?.toString() ?? '',
          website: data['website']?.toString() ?? '',
          twitter: data['twitter']?.toString() ?? '',
          github: data['github']?.toString() ?? '',
          instagram: data['instagram']?.toString() ?? '',
          isPublic: data['is_public_profile'] as bool? ?? true,
          isLoading: false,
        );
      } else {
        state = UserProfileData(
          name: user.name,
          email: user.email,
          isPublic: true,
          isLoading: false,
        );
      }
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  void togglePublicProfile(bool value) {
    state = state.copyWith(isPublic: value);
  }

  Future<bool> saveProfile({
    required String name,
    required String title,
    required String company,
    required String phone,
    required String email,
    required String linkedin,
    required String website,
    required String twitter,
    required String github,
    required String instagram,
    required bool isPublic,
  }) async {
    final user = _ref.read(authProvider).user;
    if (user == null) return false;

    state = state.copyWith(isSaving: true, message: null);

    if (user.isGuest) {
      state = UserProfileData(
        name: name,
        title: title,
        company: company,
        phone: phone,
        email: email,
        linkedin: linkedin,
        website: website,
        twitter: twitter,
        github: github,
        instagram: instagram,
        isPublic: isPublic,
        isSaving: false,
        message: 'Profile updated (Guest Mode)',
      );
      return true;
    }

    final success = await ProfileService.saveProfile(
      userId: user.id,
      data: {
        'name': name.trim(),
        'title': title.trim(),
        'company': company.trim(),
        'phone': phone.trim(),
        'email': email.trim(),
        'linkedin': linkedin.trim(),
        'website': website.trim(),
        'twitter': twitter.trim(),
        'github': github.trim(),
        'instagram': instagram.trim(),
        'is_public_profile': isPublic,
      },
    );

    if (success) {
      state = UserProfileData(
        name: name,
        title: title,
        company: company,
        phone: phone,
        email: email,
        linkedin: linkedin,
        website: website,
        twitter: twitter,
        github: github,
        instagram: instagram,
        isPublic: isPublic,
        isSaving: false,
        message: 'Profile saved successfully!',
      );
      return true;
    } else {
      state = state.copyWith(
        isSaving: false,
        message: 'Failed to save profile',
      );
      return false;
    }
  }
}

final profileProvider =
    StateNotifierProvider<ProfileNotifier, UserProfileData>(
  (ref) => ProfileNotifier(ref),
);
