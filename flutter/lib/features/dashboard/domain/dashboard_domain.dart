/// Domain layer — Dashboard feature.
library;
// ─── Entities ───────────────────────────────────────────────────────────────

class DashboardStatsEntity {
  final int totalContacts;
  final int emailsSent;
  final int upcomingEvents;
  final int networkGrowth;
  final List<RecentActivityEntity> recentActivity;

  const DashboardStatsEntity({
    this.totalContacts = 0,
    this.emailsSent = 0,
    this.upcomingEvents = 0,
    this.networkGrowth = 0,
    this.recentActivity = const [],
  });
}

class RecentActivityEntity {
  final String id;
  final String type; // 'contact_added', 'email_sent', 'card_scanned'
  final String description;
  final DateTime timestamp;

  const RecentActivityEntity({
    required this.id,
    required this.type,
    required this.description,
    required this.timestamp,
  });
}

// ─── Repository interfaces ───────────────────────────────────────────────────

abstract class DashboardRepository {
  Future<DashboardStatsEntity> getDashboardStats();
  Future<String> uploadBusinessCard(String imagePath);
  Stream<DashboardStatsEntity> watchDashboardStats();
}

// ─── Use cases ───────────────────────────────────────────────────────────────

class GetDashboardStatsUseCase {
  final DashboardRepository _repo;
  GetDashboardStatsUseCase(this._repo);
  Future<DashboardStatsEntity> call() => _repo.getDashboardStats();
}

class UploadBusinessCardUseCase {
  final DashboardRepository _repo;
  UploadBusinessCardUseCase(this._repo);
  Future<String> call(String imagePath) => _repo.uploadBusinessCard(imagePath);
}
