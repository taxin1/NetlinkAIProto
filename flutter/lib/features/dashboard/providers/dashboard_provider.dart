import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/supabase_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../services/dashboard_service.dart';

export '../models/dashboard_models.dart';

class DashboardNotifier extends StateNotifier<DashboardData> {
  final Ref _ref;
  RealtimeChannel? _realtimeChannel;
  String? _currentUserId;
  Timer? _debounceTimer;

  DashboardNotifier(this._ref) : super(const DashboardData(isLoading: true)) {
    _init();
  }

  void _init() {
    // Listen to auth changes
    _ref.listen(authProvider, (previous, next) {
      final user = next.user;
      if (user == null || user.isGuest) {
        _cleanupRealtime();
        state = DashboardData.empty;
      } else if (user.id != _currentUserId) {
        _currentUserId = user.id;
        loadData(user.id);
      }
    });

    final currentUser = _ref.read(authProvider).user;
    if (currentUser != null && !currentUser.isGuest) {
      _currentUserId = currentUser.id;
      loadData(currentUser.id);
    } else {
      state = DashboardData.empty;
    }
  }

  Future<void> loadData(String userId, {bool silent = false}) async {
    if (!silent) {
      state = state.copyWith(isLoading: true);
    }

    try {
      final user = _ref.read(authProvider).user;
      final data = await DashboardService.fetchDashboardData(
        userId,
        userEmail: user?.email,
      );
      state = data;
      _setupRealtimeSubscription(userId);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> refresh({bool silent = false}) async {
    final user = _ref.read(authProvider).user;
    if (user != null && !user.isGuest) {
      await loadData(user.id, silent: silent);
    }
  }

  void _setupRealtimeSubscription(String userId) {
    if (_realtimeChannel != null) return;

    try {
      _realtimeChannel = SupabaseService.client.channel('dashboard_realtime_$userId');

      _realtimeChannel!
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'contacts',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => _onRealtimeChange(payload),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'emails',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => _onRealtimeChange(payload),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'calendar_events',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => _onRealtimeChange(payload),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'events',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => _onRealtimeChange(payload),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'email_replies',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => _onRealtimeChange(payload),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'gmail_connections',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => _onRealtimeChange(payload),
        )
        .subscribe();
    } catch (_) {}
  }

  void _onRealtimeChange(PostgresChangePayload payload) {
    // Debounce fast successive changes
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      final user = _ref.read(authProvider).user;
      if (user != null && !user.isGuest) {
        loadData(user.id, silent: true);
      }
    });
  }

  void _cleanupRealtime() {
    _debounceTimer?.cancel();
    if (_realtimeChannel != null) {
      try {
        SupabaseService.client.removeChannel(_realtimeChannel!);
      } catch (_) {}
      _realtimeChannel = null;
    }
    _currentUserId = null;
  }

  @override
  void dispose() {
    _cleanupRealtime();
    super.dispose();
  }
}

final dashboardProvider = StateNotifierProvider.autoDispose<DashboardNotifier, DashboardData>((ref) {
  return DashboardNotifier(ref);
});
