import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../services/analytics_service.dart';

class AnalyticsState {
  final AnalyticsData data;
  final String timeframe;
  final bool isLoading;
  final String? errorMessage;

  const AnalyticsState({
    required this.data,
    this.timeframe = '30d',
    this.isLoading = false,
    this.errorMessage,
  });

  AnalyticsState copyWith({
    AnalyticsData? data,
    String? timeframe,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AnalyticsState(
      data: data ?? this.data,
      timeframe: timeframe ?? this.timeframe,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

final analyticsProvider =
    StateNotifierProvider<AnalyticsNotifier, AnalyticsState>((ref) {
  return AnalyticsNotifier(ref);
});

class AnalyticsNotifier extends StateNotifier<AnalyticsState> {
  final Ref _ref;

  AnalyticsNotifier(this._ref)
      : super(AnalyticsState(data: AnalyticsData.empty(), isLoading: true)) {
    loadAnalytics();
  }

  Future<void> loadAnalytics() async {
    final user = _ref.read(authProvider).user;
    final isGuest = user == null || user.isGuest;
    final userId = user?.id ?? 'guest';

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final analytics = await AnalyticsService.fetchAnalytics(
        userId: userId,
        isGuest: isGuest,
        timeframe: state.timeframe,
      );
      state = state.copyWith(data: analytics, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load analytics: $e',
      );
    }
  }

  Future<void> setTimeframe(String timeframe) async {
    state = state.copyWith(timeframe: timeframe);
    await loadAnalytics();
  }
}
