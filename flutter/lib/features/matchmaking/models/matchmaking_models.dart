import 'package:flutter/foundation.dart';

@immutable
class MatchmakingProfile {
  final String id;
  final String name;
  final String role;
  final String company;
  final String avatarInitials;
  final String eventTitle;
  final int compatibilityScore; // 0 - 100
  final String whyAiMatched;
  final List<String> mutualInterests;
  final String seeking;
  final String? seekingDetail;
  final String offering;
  final String? offeringDetail;
  final String location;
  final String category; // 'founder', 'investor', 'tech_lead', 'partner'
  final bool isBookmarked;
  final String? meetingStatus; // null, 'pending', 'confirmed'

  const MatchmakingProfile({
    required this.id,
    required this.name,
    required this.role,
    required this.company,
    required this.avatarInitials,
    required this.eventTitle,
    required this.compatibilityScore,
    required this.whyAiMatched,
    required this.mutualInterests,
    required this.seeking,
    this.seekingDetail,
    required this.offering,
    this.offeringDetail,
    required this.location,
    required this.category,
    this.isBookmarked = false,
    this.meetingStatus,
  });

  MatchmakingProfile copyWith({
    String? id,
    String? name,
    String? role,
    String? company,
    String? avatarInitials,
    String? eventTitle,
    int? compatibilityScore,
    String? whyAiMatched,
    List<String>? mutualInterests,
    String? seeking,
    String? seekingDetail,
    String? offering,
    String? offeringDetail,
    String? location,
    String? category,
    bool? isBookmarked,
    String? meetingStatus,
  }) {
    return MatchmakingProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      role: role ?? this.role,
      company: company ?? this.company,
      avatarInitials: avatarInitials ?? this.avatarInitials,
      eventTitle: eventTitle ?? this.eventTitle,
      compatibilityScore: compatibilityScore ?? this.compatibilityScore,
      whyAiMatched: whyAiMatched ?? this.whyAiMatched,
      mutualInterests: mutualInterests ?? this.mutualInterests,
      seeking: seeking ?? this.seeking,
      seekingDetail: seekingDetail ?? this.seekingDetail,
      offering: offering ?? this.offering,
      offeringDetail: offeringDetail ?? this.offeringDetail,
      location: location ?? this.location,
      category: category ?? this.category,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      meetingStatus: meetingStatus ?? this.meetingStatus,
    );
  }
}

@immutable
class ScheduledMeeting {
  final String id;
  final String matchId;
  final String personName;
  final String personRole;
  final String personCompany;
  final String eventTitle;
  final DateTime scheduledTime;
  final String locationOrLink;
  final String topic;
  final bool isConfirmed;

  const ScheduledMeeting({
    required this.id,
    required this.matchId,
    required this.personName,
    required this.personRole,
    required this.personCompany,
    required this.eventTitle,
    required this.scheduledTime,
    required this.locationOrLink,
    required this.topic,
    this.isConfirmed = true,
  });

  ScheduledMeeting copyWith({
    String? id,
    String? matchId,
    String? personName,
    String? personRole,
    String? personCompany,
    String? eventTitle,
    DateTime? scheduledTime,
    String? locationOrLink,
    String? topic,
    bool? isConfirmed,
  }) {
    return ScheduledMeeting(
      id: id ?? this.id,
      matchId: matchId ?? this.matchId,
      personName: personName ?? this.personName,
      personRole: personRole ?? this.personRole,
      personCompany: personCompany ?? this.personCompany,
      eventTitle: eventTitle ?? this.eventTitle,
      scheduledTime: scheduledTime ?? this.scheduledTime,
      locationOrLink: locationOrLink ?? this.locationOrLink,
      topic: topic ?? this.topic,
      isConfirmed: isConfirmed ?? this.isConfirmed,
    );
  }
}

@immutable
class MatchmakingState {
  final List<MatchmakingProfile> profiles;
  final List<ScheduledMeeting> scheduledMeetings;
  final String selectedEvent;
  final String selectedCategory;
  final String searchQuery;
  final bool isLoading;

  const MatchmakingState({
    required this.profiles,
    required this.scheduledMeetings,
    this.selectedEvent = 'All Events',
    this.selectedCategory = 'all',
    this.searchQuery = '',
    this.isLoading = false,
  });

  List<MatchmakingProfile> get filteredProfiles {
    return profiles.where((p) {
      // Event filter
      if (selectedEvent != 'All Events' && p.eventTitle != selectedEvent) {
        return false;
      }
      // Category filter
      if (selectedCategory == 'high_match' && p.compatibilityScore < 90) {
        return false;
      } else if (selectedCategory == 'investors' && p.category != 'investor') {
        return false;
      } else if (selectedCategory == 'founders' && p.category != 'founder') {
        return false;
      } else if (selectedCategory == 'tech_leads' && p.category != 'tech_lead') {
        return false;
      } else if (selectedCategory == 'partners' && p.category != 'partner') {
        return false;
      }

      // Search query
      if (searchQuery.isNotEmpty) {
        final q = searchQuery.toLowerCase();
        final match = p.name.toLowerCase().contains(q) ||
            p.role.toLowerCase().contains(q) ||
            p.company.toLowerCase().contains(q) ||
            p.mutualInterests.any((i) => i.toLowerCase().contains(q)) ||
            p.whyAiMatched.toLowerCase().contains(q);
        if (!match) return false;
      }

      return true;
    }).toList();
  }

  MatchmakingState copyWith({
    List<MatchmakingProfile>? profiles,
    List<ScheduledMeeting>? scheduledMeetings,
    String? selectedEvent,
    String? selectedCategory,
    String? searchQuery,
    bool? isLoading,
  }) {
    return MatchmakingState(
      profiles: profiles ?? this.profiles,
      scheduledMeetings: scheduledMeetings ?? this.scheduledMeetings,
      selectedEvent: selectedEvent ?? this.selectedEvent,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      searchQuery: searchQuery ?? this.searchQuery,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}
