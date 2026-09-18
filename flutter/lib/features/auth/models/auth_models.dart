// Auth model
class AppUser {
  final String id;
  final String name;
  final String email;
  final String? avatarUrl;
  final bool isGuest;
  final bool isPro;
  /// True when the user has filled out the onboarding/network profile form.
  final bool hasCompletedProfile;

  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.avatarUrl,
    this.isGuest = false,
    this.isPro = false,
    this.hasCompletedProfile = false,
  });

  factory AppUser.guest() => const AppUser(
        id: 'guest',
        name: 'Guest User',
        email: '',
        isGuest: true,
        hasCompletedProfile: true, // guests skip profile check
      );

  AppUser copyWith({
    String? id,
    String? name,
    String? email,
    String? avatarUrl,
    bool? isGuest,
    bool? isPro,
    bool? hasCompletedProfile,
  }) {
    return AppUser(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isGuest: isGuest ?? this.isGuest,
      isPro: isPro ?? this.isPro,
      hasCompletedProfile: hasCompletedProfile ?? this.hasCompletedProfile,
    );
  }
}

class AuthState {
  final AppUser? user;
  final bool isLoading;
  final String? errorMessage;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.errorMessage,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    AppUser? user,
    bool? isLoading,
    String? errorMessage,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}
