import 'package:flutter/foundation.dart';

@immutable
class SmartEventItem {
  final String id;
  final String title;
  final String? description;
  final String? eventUrl;
  final String? urlPreviewImage;
  final String? urlPreviewTitle;
  final DateTime startTime;
  final DateTime? endTime;
  final String? location;
  final bool notificationEnabled;
  final bool isGoogleSynced;
  final String? contactId;
  final String? contactName;
  final String? contactCompany;

  const SmartEventItem({
    required this.id,
    required this.title,
    this.description,
    this.eventUrl,
    this.urlPreviewImage,
    this.urlPreviewTitle,
    required this.startTime,
    this.endTime,
    this.location,
    this.notificationEnabled = true,
    this.isGoogleSynced = false,
    this.contactId,
    this.contactName,
    this.contactCompany,
  });

  bool get isToday {
    final now = DateTime.now();
    return startTime.year == now.year &&
        startTime.month == now.month &&
        startTime.day == now.day;
  }

  bool get isPast => startTime.isBefore(DateTime.now()) && !isToday;
  bool get isUpcoming => !isPast && !isToday;

  String get timeRangeFormatted {
    final startStr = _formatTime(startTime);
    if (endTime == null) return startStr;
    final endStr = _formatTime(endTime!);
    return '$startStr - $endStr';
  }

  static String _formatTime(DateTime dt) {
    final hour = dt.hour;
    final minute = dt.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final standardHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    return '$standardHour:$minute $period';
  }

  factory SmartEventItem.fromMap(Map<String, dynamic> map) {
    String? contactName;
    String? contactCompany;

    if (map['contacts'] is Map) {
      contactName = map['contacts']['name'] as String?;
      contactCompany = map['contacts']['company'] as String?;
    } else if (map['contact'] is Map) {
      contactName = map['contact']['name'] as String?;
      contactCompany = map['contact']['company'] as String?;
    }

    final parsedStart =
        DateTime.tryParse(map['start_time']?.toString() ?? '') ?? DateTime.now();
    final parsedEnd = map['end_time'] != null
        ? DateTime.tryParse(map['end_time'].toString())
        : null;

    return SmartEventItem(
      id: map['id']?.toString() ?? '',
      title: map['title']?.toString() ?? 'Networking Event',
      description: map['description']?.toString(),
      eventUrl: map['event_url']?.toString(),
      urlPreviewImage: map['url_preview_image']?.toString(),
      urlPreviewTitle: map['url_preview_title']?.toString(),
      startTime: parsedStart,
      endTime: parsedEnd,
      location: map['location']?.toString(),
      notificationEnabled: map['notification_enabled'] != false,
      isGoogleSynced: map['google_calendar_synced'] == true,
      contactId: map['contact_id']?.toString(),
      contactName: contactName,
      contactCompany: contactCompany,
    );
  }

  SmartEventItem copyWith({
    String? id,
    String? title,
    String? description,
    String? eventUrl,
    String? urlPreviewImage,
    String? urlPreviewTitle,
    DateTime? startTime,
    DateTime? endTime,
    String? location,
    bool? notificationEnabled,
    bool? isGoogleSynced,
    String? contactId,
    String? contactName,
    String? contactCompany,
  }) {
    return SmartEventItem(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      eventUrl: eventUrl ?? this.eventUrl,
      urlPreviewImage: urlPreviewImage ?? this.urlPreviewImage,
      urlPreviewTitle: urlPreviewTitle ?? this.urlPreviewTitle,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      location: location ?? this.location,
      notificationEnabled: notificationEnabled ?? this.notificationEnabled,
      isGoogleSynced: isGoogleSynced ?? this.isGoogleSynced,
      contactId: contactId ?? this.contactId,
      contactName: contactName ?? this.contactName,
      contactCompany: contactCompany ?? this.contactCompany,
    );
  }
}

@immutable
class EventsState {
  final List<SmartEventItem> events;
  final bool isLoading;
  final bool isExtracting;
  final String filter; // 'all', 'upcoming', 'past'
  final String searchQuery;
  final Map<String, String>? extractedUrlData;
  final String? errorMessage;

  const EventsState({
    this.events = const [],
    this.isLoading = false,
    this.isExtracting = false,
    this.filter = 'all',
    this.searchQuery = '',
    this.extractedUrlData,
    this.errorMessage,
  });

  List<SmartEventItem> get filteredEvents {
    return events.where((e) {
      if (filter == 'upcoming' && !e.isUpcoming && !e.isToday) return false;
      if (filter == 'past' && !e.isPast) return false;

      if (searchQuery.isNotEmpty) {
        final q = searchQuery.toLowerCase();
        final matchTitle = e.title.toLowerCase().contains(q);
        final matchLoc = (e.location ?? '').toLowerCase().contains(q);
        final matchContact = (e.contactName ?? '').toLowerCase().contains(q);
        final matchDesc = (e.description ?? '').toLowerCase().contains(q);
        if (!matchTitle && !matchLoc && !matchContact && !matchDesc) {
          return false;
        }
      }

      return true;
    }).toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));
  }

  EventsState copyWith({
    List<SmartEventItem>? events,
    bool? isLoading,
    bool? isExtracting,
    String? filter,
    String? searchQuery,
    Map<String, String>? extractedUrlData,
    String? errorMessage,
  }) {
    return EventsState(
      events: events ?? this.events,
      isLoading: isLoading ?? this.isLoading,
      isExtracting: isExtracting ?? this.isExtracting,
      filter: filter ?? this.filter,
      searchQuery: searchQuery ?? this.searchQuery,
      extractedUrlData: extractedUrlData,
      errorMessage: errorMessage,
    );
  }
}
