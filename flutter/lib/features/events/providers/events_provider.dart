import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/events_models.dart';

final eventsNotifierProvider =
    StateNotifierProvider<EventsNotifier, EventsState>((ref) {
  return EventsNotifier(ref);
});

class EventsNotifier extends StateNotifier<EventsState> {
  final Ref _ref;

  EventsNotifier(this._ref) : super(const EventsState()) {
    loadEvents();
  }

  SupabaseClient? get _client => SupabaseService.client;

  Future<void> loadEvents() async {
    state = state.copyWith(isLoading: true);
    final user = _ref.read(authProvider).user;

    List<SmartEventItem> loadedEvents = [];

    if (user != null && !user.isGuest) {
      try {
        final res = await _client
            ?.from('calendar_events')
            .select('id, title, description, event_url, url_preview_image, url_preview_title, start_time, end_time, location, notification_enabled, google_calendar_synced, contact_id, contacts(name, company)')
            .eq('user_id', user.id)
            .order('start_time', ascending: true);

        if (res != null) {
          final list = res as List<dynamic>;
          if (list.isNotEmpty) {
            loadedEvents = list
                .map((e) => SmartEventItem.fromMap(e as Map<String, dynamic>))
                .toList();
          }
        }
      } catch (_) {
        // Fallback without contact relation
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
                  .map((e) => SmartEventItem.fromMap(e as Map<String, dynamic>))
                  .toList();
            }
          }
        } catch (_) {}
      }
    }

    if (loadedEvents.isEmpty && (user == null || user.isGuest)) {
      final now = DateTime.now();
      loadedEvents = [
        SmartEventItem(
          id: 'evt-1',
          title: 'AI Founder Pitch & Networking Summit',
          description: 'Meet and collaborate with 50+ AI innovators, venture partners, and angel investors.',
          eventUrl: 'https://lu.ma/ai-founder-summit-2026',
          location: 'San Francisco Innovation Center / Online Video Stream',
          startTime: DateTime(now.year, now.month, now.day, 14, 0),
          endTime: DateTime(now.year, now.month, now.day, 17, 30),
          contactName: 'Elena Rostova',
          contactCompany: 'Quantum Ventures',
          notificationEnabled: true,
          isGoogleSynced: true,
        ),
        SmartEventItem(
          id: 'evt-2',
          title: 'Product Strategy Review & Demo',
          description: 'Deep dive into Network Link AI interactive portfolio and contact automations.',
          eventUrl: 'https://meet.google.com/abc-defg-hij',
          location: 'https://meet.google.com/abc-defg-hij',
          startTime: DateTime(now.year, now.month, now.day + 1, 11, 0),
          endTime: DateTime(now.year, now.month, now.day + 1, 12, 0),
          contactName: 'Sarah Lin',
          contactCompany: 'NextGen AI Labs',
          notificationEnabled: true,
          isGoogleSynced: true,
        ),
        SmartEventItem(
          id: 'evt-3',
          title: 'Enterprise Tech Networking Breakfast',
          description: 'Informal morning roundtable on scaling B2B enterprise apps and security.',
          location: 'Four Seasons Hotel, Downtown',
          startTime: DateTime(now.year, now.month, now.day + 4, 8, 30),
          endTime: DateTime(now.year, now.month, now.day + 4, 10, 0),
          contactName: 'Marcus Brody',
          contactCompany: 'HyperScale Cloud',
          notificationEnabled: false,
        ),
        SmartEventItem(
          id: 'evt-4',
          title: 'Global Web3 & AI Hackathon Kickoff',
          description: 'Opening keynote and team formation mixer for developers.',
          eventUrl: 'https://eventbrite.com/e/global-ai-hackathon',
          location: 'Online Webinar Stream',
          startTime: DateTime(now.year, now.month, now.day - 3, 10, 0),
          endTime: DateTime(now.year, now.month, now.day - 3, 13, 0),
          notificationEnabled: false,
        ),
      ];
    }

    state = state.copyWith(
      events: loadedEvents,
      isLoading: false,
    );
  }

  Future<Map<String, String>?> extractUrlMetadata(String url) async {
    final cleanUrl = url.trim();
    if (cleanUrl.isEmpty) return null;

    state = state.copyWith(isExtracting: true);

    Map<String, String> extracted = {};

    // 1. Attempt to call Next.js /api/scrape-event-page
    try {
      final apiUri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/scrape-event-page');
      final response = await http
          .post(
            apiUri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'url': cleanUrl}),
          )
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final resData = jsonDecode(response.body) as Map<String, dynamic>;
        final title = resData['title'] as String?;
        final desc = resData['description'] as String?;
        final loc = resData['location'] as String?;
        if (title != null && title.isNotEmpty) {
          extracted = {
            'title': title,
            'description': desc ?? '',
            'location': loc ?? cleanUrl,
            'category': (resData['category'] as String?) ?? 'Event',
          };
          state = state.copyWith(
            isExtracting: false,
            extractedUrlData: extracted,
          );
          return extracted;
        }
      }
    } catch (_) {}

    await Future.delayed(const Duration(milliseconds: 300));

    try {
      final uri = Uri.parse(cleanUrl.startsWith('http') ? cleanUrl : 'https://$cleanUrl');
      final host = uri.host.toLowerCase();
      final path = uri.path;

      if (host.contains('zoom.us') || host.contains('zoom.com')) {
        final meetingId = RegExp(r'/j/(\d+)').firstMatch(path)?.group(1) ?? 'Conference';
        extracted = {
          'title': 'Zoom Meeting #$meetingId',
          'description': 'Online video conference via Zoom',
          'location': cleanUrl,
          'category': 'Meeting',
        };
      } else if (host.contains('meet.google.com')) {
        final code = path.replaceAll('/', '').trim();
        extracted = {
          'title': 'Google Meet ($code)',
          'description': 'Online video conference via Google Meet',
          'location': cleanUrl,
          'category': 'Meeting',
        };
      } else if (host.contains('lu.ma')) {
        final slug = path.replaceAll('/', '').replaceAll('-', ' ');
        final cleanTitle = slug.isNotEmpty
            ? slug[0].toUpperCase() + slug.substring(1)
            : 'Luma Community Event';
        extracted = {
          'title': cleanTitle,
          'description': 'Networking event hosted on Luma platform',
          'location': cleanUrl,
          'category': 'Networking',
        };
      } else if (host.contains('eventbrite')) {
        extracted = {
          'title': 'Eventbrite Networking Session',
          'description': 'Conference or meetup registered through Eventbrite',
          'location': cleanUrl,
          'category': 'Workshop',
        };
      } else {
        extracted = {
          'title': 'Event on ${uri.host}',
          'description': 'Online session or event page',
          'location': cleanUrl,
          'category': 'Meeting',
        };
      }
    } catch (_) {
      extracted = {
        'title': 'Online Meeting / Event',
        'location': cleanUrl,
        'category': 'Meeting',
      };
    }

    state = state.copyWith(
      isExtracting: false,
      extractedUrlData: extracted,
    );

    return extracted;
  }

  void clearExtractedData() {
    state = state.copyWith(extractedUrlData: null);
  }

  void setFilter(String filter) {
    state = state.copyWith(filter: filter);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  Future<bool> createEvent({
    required String title,
    String? description,
    String? eventUrl,
    required DateTime startTime,
    DateTime? endTime,
    String? location,
    String? contactId,
    String? contactName,
    bool notificationEnabled = true,
    bool isGoogleSynced = true,
  }) async {
    final user = _ref.read(authProvider).user;
    final newId = DateTime.now().millisecondsSinceEpoch.toString();

    final newEvent = SmartEventItem(
      id: newId,
      title: title,
      description: description,
      eventUrl: eventUrl,
      startTime: startTime,
      endTime: endTime,
      location: location,
      contactId: contactId,
      contactName: contactName,
      notificationEnabled: notificationEnabled,
      isGoogleSynced: isGoogleSynced,
    );

    state = state.copyWith(
      events: [newEvent, ...state.events],
      extractedUrlData: null,
    );

    if (user != null && !user.isGuest) {
      try {
        await _client?.from('calendar_events').insert({
          'user_id': user.id,
          'title': title,
          'description': description,
          'event_url': eventUrl,
          'start_time': startTime.toUtc().toIso8601String(),
          'end_time': endTime?.toUtc().toIso8601String(),
          'location': location,
          'contact_id': contactId,
          'notification_enabled': notificationEnabled,
          'google_calendar_synced': isGoogleSynced,
        });

        await _client?.from('events').insert({
          'user_id': user.id,
          'event_type': 'meeting',
          'description': 'Created event: $title',
          'created_at': DateTime.now().toUtc().toIso8601String(),
        });
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
        await _client
            ?.from('calendar_events')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
      } catch (_) {}
    }
  }
}
