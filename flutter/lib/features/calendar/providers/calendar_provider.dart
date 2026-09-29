import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/services/supabase_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/calendar_models.dart';

final calendarNotifierProvider =
    StateNotifierProvider<CalendarNotifier, CalendarState>((ref) {
  return CalendarNotifier(ref);
});

class CalendarNotifier extends StateNotifier<CalendarState> {
  final Ref _ref;

  CalendarNotifier(this._ref)
      : super(CalendarState(
          currentMonth: DateTime(DateTime.now().year, DateTime.now().month, 1),
          selectedDate: DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day),
        )) {
    loadEvents();
  }

  SupabaseClient? get _client => SupabaseService.client;

  Future<void> loadEvents() async {
    state = state.copyWith(isLoading: true);
    final user = _ref.read(authProvider).user;
    final now = DateTime.now();

    bool isGoogleConnected = false;
    String? googleEmail;

    // Check Google Calendar connection from real database table
    if (user != null && !user.isGuest) {
      try {
        final connRes = await _client
            ?.from('google_calendar_connections')
            .select('calendar_id, sync_enabled')
            .eq('user_id', user.id)
            .maybeSingle();

        if (connRes != null && connRes['sync_enabled'] == true) {
          isGoogleConnected = true;
          googleEmail = user.email;
        }
      } catch (_) {}
    }

    List<CalendarEventItem> loadedEvents = [];

    if (user != null && !user.isGuest) {
      try {
        final startOfMonth = DateTime(state.currentMonth.year, state.currentMonth.month, 1);
        final endOfMonth = DateTime(state.currentMonth.year, state.currentMonth.month + 1, 0, 23, 59, 59);

        final res = await _client
            ?.from('calendar_events')
            .select('id, title, description, start_time, end_time, location, contact_id, google_calendar_synced, notification_enabled, contacts(name, company)')
            .eq('user_id', user.id)
            .gte('start_time', startOfMonth.toUtc().toIso8601String())
            .lte('start_time', endOfMonth.toUtc().toIso8601String())
            .order('start_time', ascending: true);

        if (res != null) {
          final list = res as List<dynamic>;
          if (list.isNotEmpty) {
            loadedEvents = list
                .map((e) => CalendarEventItem.fromMap(e as Map<String, dynamic>))
                .toList();
          }
        }
      } catch (_) {
        // Fallback query without contact relation
        try {
          final res = await _client
              ?.from('calendar_events')
              .select('*')
              .eq('user_id', user.id)
              .order('start_time', ascending: true);

          if (res != null) {
            final list = res as List<dynamic>;
            if (list.isNotEmpty) {
              loadedEvents = list
                  .map((e) => CalendarEventItem.fromMap(e as Map<String, dynamic>))
                  .toList();
            }
          }
        } catch (_) {}
      }
    }

    // If no events in DB yet, provide realistic networking demo events for guests
    if (loadedEvents.isEmpty && (user == null || user.isGuest)) {
      final y = now.year;
      final m = state.currentMonth.month;

      loadedEvents = [
        CalendarEventItem(
          id: 'demo-1',
          title: 'Product Strategy Sync with Alex',
          description: 'Review quarterly networking milestones & enterprise features roadmap.',
          startTime: DateTime(y, m, now.day, 10, 0),
          endTime: DateTime(y, m, now.day, 11, 0),
          location: 'https://meet.google.com/net-link-ai',
          contactName: 'Alex Johnson',
          contactCompany: 'TechVentures Labs',
          category: 'Meeting',
          isGoogleSynced: true,
          source: 'google',
        ),
        CalendarEventItem(
          id: 'demo-2',
          title: 'Networking Coffee with Sarah Lin',
          description: 'Discussing AI Business Card scanning workflows and collaboration.',
          startTime: DateTime(y, m, now.day, 14, 30),
          endTime: DateTime(y, m, now.day, 15, 15),
          location: 'Blue Bottle Cafe, Downtown',
          contactName: 'Sarah Lin',
          contactCompany: 'NextGen AI',
          category: 'Networking',
          source: 'local',
        ),
        CalendarEventItem(
          id: 'demo-3',
          title: 'Quarterly Investors Intro Call',
          description: 'Briefing angel syndicate on Network Link AI growth.',
          startTime: DateTime(y, m, (now.day + 2).clamp(1, 28), 16, 0),
          endTime: DateTime(y, m, (now.day + 2).clamp(1, 28), 17, 0),
          location: 'https://zoom.us/j/987654321',
          contactName: 'Elena Rostova',
          contactCompany: 'Quantum Ventures',
          category: 'Call',
          isGoogleSynced: true,
          source: 'google',
        ),
        CalendarEventItem(
          id: 'demo-4',
          title: 'Developer Meetup & Pitch Session',
          description: 'Showcasing our interactive digital portfolio platform to founders.',
          startTime: DateTime(y, m, (now.day + 5).clamp(1, 28), 18, 30),
          endTime: DateTime(y, m, (now.day + 5).clamp(1, 28), 20, 30),
          location: 'Innovation Hub, Floor 4',
          category: 'Workshop',
          source: 'local',
        ),
      ];
    }

    state = state.copyWith(
      events: loadedEvents,
      isLoading: false,
      isGoogleCalendarConnected: isGoogleConnected,
      googleCalendarEmail: googleEmail,
    );
  }

  void selectDate(DateTime date) {
    state = state.copyWith(
      selectedDate: DateTime(date.year, date.month, date.day),
    );
  }

  void changeMonth(int offset) {
    final nextMonth = DateTime(state.currentMonth.year, state.currentMonth.month + offset, 1);
    state = state.copyWith(
      currentMonth: nextMonth,
      selectedDate: DateTime(nextMonth.year, nextMonth.month, 1),
    );
    loadEvents();
  }

  void jumpToToday() {
    final now = DateTime.now();
    state = state.copyWith(
      currentMonth: DateTime(now.year, now.month, 1),
      selectedDate: DateTime(now.year, now.month, now.day),
    );
    loadEvents();
  }

  void setCategoryFilter(String filter) {
    state = state.copyWith(categoryFilter: filter);
  }

  Future<bool> addEvent({
    required String title,
    String? description,
    required DateTime startTime,
    DateTime? endTime,
    String? location,
    String? contactId,
    String? contactName,
    String category = 'Meeting',
    bool isGoogleSynced = true,
  }) async {
    final user = _ref.read(authProvider).user;
    final newId = DateTime.now().millisecondsSinceEpoch.toString();

    final newEvent = CalendarEventItem(
      id: newId,
      title: title,
      description: description,
      startTime: startTime,
      endTime: endTime,
      location: location,
      contactId: contactId,
      contactName: contactName,
      category: category,
      isGoogleSynced: isGoogleSynced,
      source: isGoogleSynced ? 'google' : 'local',
    );

    // Update local state immediately
    state = state.copyWith(
      events: [...state.events, newEvent],
      selectedDate: DateTime(startTime.year, startTime.month, startTime.day),
    );

    // Save to Supabase & Google Calendar
    if (user != null && !user.isGuest) {
      try {
        final inserted = await _client?.from('calendar_events').insert({
          'user_id': user.id,
          'title': title,
          'description': description,
          'start_time': startTime.toUtc().toIso8601String(),
          'end_time': endTime?.toUtc().toIso8601String(),
          'location': location,
          'contact_id': contactId,
          'google_calendar_synced': isGoogleSynced,
          'notification_enabled': true,
        }).select('id').maybeSingle();

        final dbEventId = inserted?['id']?.toString() ?? newId;

        await _client?.from('events').insert({
          'user_id': user.id,
          'event_type': 'meeting',
          'description': 'Scheduled $category: $title',
          'created_at': DateTime.now().toUtc().toIso8601String(),
        });

        // Trigger Google Calendar sync if connected & requested
        if (isGoogleSynced && state.isGoogleCalendarConnected) {
          final session = _client?.auth.currentSession;
          if (session != null) {
            final token = session.accessToken;
            http.post(
              Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/google-calendar/sync'),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer $token',
              },
              body: jsonEncode({
                'eventId': dbEventId,
                'action': 'create',
                'event': {
                  'title': title,
                  'description': description ?? '',
                  'start_time': startTime.toUtc().toIso8601String(),
                  'end_time': (endTime ?? startTime.add(const Duration(hours: 1))).toUtc().toIso8601String(),
                  'location': location ?? '',
                },
              }),
            ).timeout(const Duration(seconds: 8)).catchError((_) => http.Response('', 500));
          }
        }
      } catch (_) {}
    }

    return true;
  }

  Future<void> deleteEvent(String id) async {
    final user = _ref.read(authProvider).user;

    state = state.copyWith(
      events: state.events.where((e) => e.id != id).toList(),
    );

    if (user != null && !user.isGuest) {
      try {
        if (state.isGoogleCalendarConnected) {
          final session = _client?.auth.currentSession;
          if (session != null) {
            final token = session.accessToken;
            http.post(
              Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/google-calendar/sync'),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer $token',
              },
              body: jsonEncode({
                'eventId': id,
                'action': 'delete',
              }),
            ).timeout(const Duration(seconds: 8)).catchError((_) => http.Response('', 500));
          }
        }

        await _client
            ?.from('calendar_events')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
      } catch (_) {}
    }
  }

  Future<void> connectGoogleCalendar() async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) return;

    if (state.isGoogleCalendarConnected) {
      // Disconnect
      try {
        await _client
            ?.from('google_calendar_connections')
            .delete()
            .eq('user_id', user.id);
        state = state.copyWith(
          isGoogleCalendarConnected: false,
          googleCalendarEmail: null,
        );
      } catch (_) {}
    } else {
      // Launch real Google Calendar OAuth directly into Google's consent screen
      try {
        String? targetAuthUrl;
        try {
          final res = await http.get(
            Uri.parse('${BusinessCardScannerService.webBaseUrl}/api/google-calendar/auth'),
            headers: {
              if (_client?.auth.currentSession?.accessToken != null)
                'Authorization': 'Bearer ${_client!.auth.currentSession!.accessToken}',
            },
          ).timeout(const Duration(seconds: 4));

          if (res.statusCode == 200) {
            final data = jsonDecode(res.body);
            if (data is Map && data['authUrl'] != null) {
              targetAuthUrl = data['authUrl'] as String;
            }
          }
        } catch (_) {}

        // Direct fallback to Google OAuth consent screen if API is unreachable
        targetAuthUrl ??= 'https://accounts.google.com/o/oauth2/v2/auth'
            '?access_type=offline'
            '&scope=${Uri.encodeComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')}'
            '&prompt=consent'
            '&response_type=code'
            '&client_id=783966653046-n6quk2616a8t1rk61r2mn0rtcurnt9q9.apps.googleusercontent.com'
            '&redirect_uri=${Uri.encodeComponent('https://www.networklinkai.com/api/google-calendar/callback')}';

        final authUri = Uri.parse(targetAuthUrl);
        if (await canLaunchUrl(authUri)) {
          await launchUrl(authUri, mode: LaunchMode.externalApplication);
          _startConnectionPolling(user.id, user.email);
        }
      } catch (_) {}
    }
  }

  void _startConnectionPolling(String userId, String userEmail) {
    int attempts = 0;
    Timer.periodic(const Duration(seconds: 2), (timer) async {
      attempts++;
      if (attempts > 60 || state.isGoogleCalendarConnected) {
        timer.cancel();
        return;
      }

      try {
        final connRes = await _client
            ?.from('google_calendar_connections')
            .select('calendar_id, sync_enabled')
            .eq('user_id', userId)
            .maybeSingle();

        if (connRes != null && connRes['sync_enabled'] == true) {
          timer.cancel();
          state = state.copyWith(
            isGoogleCalendarConnected: true,
            googleCalendarEmail: userEmail,
          );
          await loadEvents();
        }
      } catch (_) {}
    });
  }
}
