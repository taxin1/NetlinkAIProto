/// Domain layer — Network Profile & Global Directory features.
library;
// ─── Entities ───────────────────────────────────────────────────────────────

class NetworkerEntity {
  final String id;
  final String username;
  final String? displayName;
  final String? title;
  final String? company;
  final String? email;
  final String? phone;
  final String? bio;
  final String? avatarUrl;
  final List<String> skills;
  final List<String> interests;
  final String? location;
  final String? linkedin;
  final String? twitter;
  final String? github;
  final String? instagram;
  final String? website;
  final bool isPublic;
  final int aiMatchScore; // 0–100
  final String? portfolioUrl;

  const NetworkerEntity({
    required this.id,
    required this.username,
    this.displayName,
    this.title,
    this.company,
    this.email,
    this.phone,
    this.bio,
    this.avatarUrl,
    this.skills = const [],
    this.interests = const [],
    this.location,
    this.linkedin,
    this.twitter,
    this.github,
    this.instagram,
    this.website,
    this.isPublic = true,
    this.aiMatchScore = 0,
    this.portfolioUrl,
  });
}

class ProfileStatsEntity {
  final int connections;
  final int events;
  final int posts;
  final double profileCompleteness; // 0.0–1.0
  final int networkReachScore;
  final int aiMatchScore;

  const ProfileStatsEntity({
    this.connections = 0,
    this.events = 0,
    this.posts = 0,
    this.profileCompleteness = 0.0,
    this.networkReachScore = 0,
    this.aiMatchScore = 0,
  });
}

// ─── Repository interfaces ───────────────────────────────────────────────────

abstract class NetworkProfileRepository {
  Future<NetworkerEntity> getMyProfile();
  Future<NetworkerEntity> updateProfile(NetworkerEntity profile);
  Future<List<NetworkerEntity>> getGlobalDirectory({
    String? query,
    String? industry,
    String? location,
  });
  Future<void> sendConnectionRequest(String targetUserId);
  Future<ProfileStatsEntity> getProfileStats();
}

// ─── Use cases ───────────────────────────────────────────────────────────────

class GetGlobalDirectoryUseCase {
  final NetworkProfileRepository _repo;
  GetGlobalDirectoryUseCase(this._repo);

  Future<List<NetworkerEntity>> call({String? query, String? industry}) =>
      _repo.getGlobalDirectory(query: query, industry: industry);
}

class ConnectWithNetworkerUseCase {
  final NetworkProfileRepository _repo;
  ConnectWithNetworkerUseCase(this._repo);

  Future<void> call(String targetUserId) =>
      _repo.sendConnectionRequest(targetUserId);
}

class UpdateProfileUseCase {
  final NetworkProfileRepository _repo;
  UpdateProfileUseCase(this._repo);

  Future<NetworkerEntity> call(NetworkerEntity profile) =>
      _repo.updateProfile(profile);
}
