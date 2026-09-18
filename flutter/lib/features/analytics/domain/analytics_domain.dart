/// Domain layer — Analytics feature.
class AnalyticsStatsEntity {
  final int profileViews;
  final int connections;
  final int emailsSent;
  final double responseRate;
  final List<WeeklyDataPoint> weeklyGrowth;
  final List<WeeklyDataPoint> activityTrend;

  const AnalyticsStatsEntity({
    this.profileViews = 0,
    this.connections = 0,
    this.emailsSent = 0,
    this.responseRate = 0.0,
    this.weeklyGrowth = const [],
    this.activityTrend = const [],
  });
}

class WeeklyDataPoint {
  final String label; // e.g., 'Mon', 'Tue'
  final double value;
  const WeeklyDataPoint({required this.label, required this.value});
}

abstract class AnalyticsRepository {
  Future<AnalyticsStatsEntity> getStats(String period); // '7D', '30D', etc.
  Stream<AnalyticsStatsEntity> watchStats(String period);
}

class GetAnalyticsStatsUseCase {
  final AnalyticsRepository _repo;
  GetAnalyticsStatsUseCase(this._repo);
  Future<AnalyticsStatsEntity> call(String period) => _repo.getStats(period);
}
