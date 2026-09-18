import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/services/supabase_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/matchmaking_models.dart';

final matchmakingNotifierProvider =
    StateNotifierProvider<MatchmakingNotifier, MatchmakingState>((ref) {
  return MatchmakingNotifier(ref);
});

class MatchmakingNotifier extends StateNotifier<MatchmakingState> {
  final Ref _ref;

  MatchmakingNotifier(this._ref)
      : super(
          MatchmakingState(
            profiles: _initialProfiles(_ref),
            scheduledMeetings: _initialMeetings(_ref),
          ),
        ) {
    _loadUserMeetings();
  }

  static List<MatchmakingProfile> _initialProfiles(Ref ref) {
    final user = ref.read(authProvider).user;
    if (user != null && !user.isGuest) {
      return const [];
    }
    return _seedProfiles;
  }

  static List<ScheduledMeeting> _initialMeetings(Ref ref) {
    final user = ref.read(authProvider).user;
    if (user != null && !user.isGuest) {
      return const [];
    }
    return _seedMeetings;
  }

  Future<void> _loadUserMeetings() async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) return;

    try {
      final res = await SupabaseService.client
          .from('calendar_events')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', ascending: true);

      final list = res as List<dynamic>;
      if (list.isNotEmpty) {
        final loaded = list.map((item) {
          final map = item as Map<String, dynamic>;
          final startTime = DateTime.tryParse(map['start_time'] ?? '') ?? DateTime.now();
          final title = map['title'] as String? ?? 'Meeting';
          return ScheduledMeeting(
            id: map['id']?.toString() ?? 'meet-${DateTime.now().millisecondsSinceEpoch}',
            matchId: 'user-meet-${map['id']}',
            personName: map['contact_name'] ?? (title.startsWith('Meeting: ') ? title.substring(9) : title),
            personRole: 'Attendee',
            personCompany: map['location'] ?? 'Scheduled Meeting',
            eventTitle: title,
            scheduledTime: startTime,
            locationOrLink: map['location'] ?? 'Virtual / Meeting Room',
            topic: map['description'] ?? 'Event Discussion',
            isConfirmed: true,
          );
        }).toList();

        state = state.copyWith(scheduledMeetings: loaded);
      }
    } catch (_) {}
  }

  Future<void> findMatches({String? needs, String? goals}) async {
    state = state.copyWith(isLoading: true);

    final user = _ref.read(authProvider).user;
    List<MatchmakingProfile> fetchedProfiles = [];

    if (user != null && !user.isGuest) {
      final session = SupabaseService.client.auth.currentSession;
      if (session != null) {
        try {
          final res = await http.post(
            Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/event-matchmaking/suggest'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${session.accessToken}',
            },
            body: jsonEncode({
              'matchMode': 'needs',
              'needs': needs?.trim().isNotEmpty == true ? needs : 'Networking and technology partnerships',
              'goals': goals?.trim().isNotEmpty == true ? goals : 'Connect with industry peers and explore collaboration',
            }),
          ).timeout(const Duration(seconds: 12));

          if (res.statusCode == 200) {
            final data = jsonDecode(res.body) as Map<String, dynamic>;
            final matches = data['matches'] as List<dynamic>?;
            if (matches != null && matches.isNotEmpty) {
              fetchedProfiles = matches.map((m) {
                final map = m as Map<String, dynamic>;
                final name = (map['name'] as String?)?.trim().isNotEmpty == true ? map['name'] as String : 'Attendee';
                final initials = name.split(' ').where((s) => s.isNotEmpty).take(2).map((s) => s[0].toUpperCase()).join();
                final rawInterests = map['sharedInterests'] as List<dynamic>?;
                final interests = rawInterests != null
                    ? rawInterests.map((e) => e.toString()).toList()
                    : <String>['AI', 'Networking'];
                return MatchmakingProfile(
                  id: map['id']?.toString() ?? 'match-${DateTime.now().millisecondsSinceEpoch}',
                  name: name,
                  role: (map['title'] as String?)?.trim().isNotEmpty == true ? map['title'] as String : 'Networker',
                  company: (map['company'] as String?)?.trim().isNotEmpty == true ? map['company'] as String : 'Independent',
                  avatarInitials: initials.isNotEmpty ? initials : 'AI',
                  eventTitle: map['eventTitle'] as String? ?? 'AI Matchmaking Network',
                  compatibilityScore: (map['score'] as num?)?.toInt() ?? 88,
                  whyAiMatched: map['reason'] as String? ?? 'Strong complementary focus in technology and networking.',
                  mutualInterests: interests,
                  seeking: map['icebreaker'] as String? ?? 'Collaboration & Networking',
                  seekingDetail: map['icebreaker'] as String?,
                  offering: (map['title'] as String?) ?? 'Professional Partnership',
                  location: 'Global / Online',
                  category: 'founder',
                );
              }).toList();
            }
          }
        } catch (_) {}
      }
    }

    // Fallback gracefully to seed profiles if empty, error, or guest
    if (fetchedProfiles.isEmpty) {
      await Future.delayed(const Duration(milliseconds: 500));
      fetchedProfiles = _seedProfiles;
    }

    state = state.copyWith(
      profiles: fetchedProfiles,
      isLoading: false,
    );
  }

  static final List<ScheduledMeeting> _seedMeetings = [
    ScheduledMeeting(
      id: 'meet-1',
      matchId: 'match-1',
      personName: 'Elena Rostova',
      personRole: 'Partner',
      personCompany: 'Horizon Ventures',
      eventTitle: 'TechCrunch Disrupt 2026',
      scheduledTime: DateTime.now().add(const Duration(days: 1, hours: 2)),
      locationOrLink: 'Disrupt VIP Lounge - Table 14',
      topic: 'Seed Investment & Enterprise AI Pilot',
      isConfirmed: true,
    ),
  ];

  static const List<MatchmakingProfile> _seedProfiles = [
    MatchmakingProfile(
      id: 'match-1',
      name: 'Elena Rostova',
      role: 'General Partner',
      company: 'Horizon Ventures',
      avatarInitials: 'ER',
      eventTitle: 'TechCrunch Disrupt 2026',
      compatibilityScore: 98,
      whyAiMatched:
          'Actively deploying \$15M in AI automation & enterprise relationship tech. Needs innovative founder pipelines with proven engagement metrics.',
      mutualInterests: ['Enterprise AI', 'SaaS Growth', 'Angel Syndicates', 'Cross-platform'],
      seeking: 'Seed/Series A AI Platforms, Visionary Tech Founders',
      seekingDetail:
          'Actively seeking Seed to Series A founders pioneering enterprise AI automation, proprietary workflow engines, and relational graph models. Looking for teams with initial product-market fit (\$20k+ MRR) seeking lead institutional capital.',
      offering: 'Growth Capital (\$1M-\$3M), Tier-1 Silicon Valley Network',
      offeringDetail:
          'Direct check-writing authority up to \$3M with dedicated follow-on reserves. Direct warm introductions to 50+ enterprise C-level buyers, recruiting support for executive engineering hires, and strategic guidance.',
      location: 'San Francisco, CA',
      category: 'investor',
      isBookmarked: true,
      meetingStatus: 'confirmed',
    ),
    MatchmakingProfile(
      id: 'match-2',
      name: 'Marcus Chen',
      role: 'Founder & CEO',
      company: 'Omniflow AI',
      avatarInitials: 'MC',
      eventTitle: 'TechCrunch Disrupt 2026',
      compatibilityScore: 94,
      whyAiMatched:
          'Building automated B2B sales workflows; high synergy for mutual product integration, API data exchanges, and co-marketing enterprise pilots.',
      mutualInterests: ['B2B Sales', 'Workflow Orchestration', 'LLM Agents', 'Product Strategy'],
      seeking: 'Ecosystem Partners, Mobile Integration Experts',
      seekingDetail:
          'Seeking integration partners with active enterprise user bases to connect our workflow engine into existing communication and CRM stacks via bidirectional APIs.',
      offering: 'Enterprise Pipeline Access, Co-Selling Agreements',
      offeringDetail:
          'Willing to co-market integrated solutions to our 120+ Mid-Market and Enterprise customers, offering joint sales rep incentives and bundled rollout pricing.',
      location: 'New York, NY',
      category: 'founder',
      isBookmarked: false,
    ),
    MatchmakingProfile(
      id: 'match-3',
      name: 'Dr. Aris Thorne',
      role: 'VP of Engineering',
      company: 'NeuralScale Inc.',
      avatarInitials: 'AT',
      eventTitle: 'AI Summit SF 2026',
      compatibilityScore: 92,
      whyAiMatched:
          'Leading edge-AI agent architectures. Strong alignment in high-performance Flutter interfaces and low-latency offline sync algorithms.',
      mutualInterests: ['Flutter Architecture', 'Local LLMs', 'Edge Compute', 'DevOps'],
      seeking: 'Principal UI/UX Engineers, Tech Collaborators',
      seekingDetail:
          'Seeking technical collaborators with deep Flutter performance optimization experience and offline-first data sync architecture knowledge for real-time mobile agents.',
      offering: 'Proprietary Vector Indexing Frameworks, Technical Advisory',
      offeringDetail:
          'Can provide access to our proprietary quantized vector search library (C++ FFI / Rust) and technical advisory on on-device LLM inference latency reduction.',
      location: 'Austin, TX',
      category: 'tech_lead',
      isBookmarked: false,
    ),
    MatchmakingProfile(
      id: 'match-4',
      name: 'Julian Becker',
      role: 'Managing Director',
      company: 'Apex Founder Syndicate',
      avatarInitials: 'JB',
      eventTitle: 'Global Founder Circle',
      compatibilityScore: 96,
      whyAiMatched:
          'Manages private syndicate of 200+ tech executives. Looking to recommend automated relationship intelligence tooling to his portfolio companies.',
      mutualInterests: ['Founder Community', 'Executive Networking', 'Deal Flow', 'Venture Studio'],
      seeking: 'Innovative Networking Apps for Executive Portfolios',
      seekingDetail:
          'Evaluating cutting-edge AI networking and founder matchmaking platforms to deploy as the official intelligence layer across our syndicate members and portfolio founders.',
      offering: 'Instant Distribution to 200+ Tech C-Suite Executives',
      offeringDetail:
          'Can deliver immediate pilot adoption across 200+ vetted tech CEOs, VCs, and CTOs in London and Berlin, generating rapid feedback and viral peer distribution.',
      location: 'London, UK',
      category: 'partner',
      isBookmarked: true,
    ),
    MatchmakingProfile(
      id: 'match-5',
      name: 'Sophia Vance',
      role: 'Head of Strategic Partnerships',
      company: 'VectorBridge',
      avatarInitials: 'SV',
      eventTitle: 'AI Summit SF 2026',
      compatibilityScore: 89,
      whyAiMatched:
          'Organizing private roundtables at AI Summit. Offers direct introductions to Fortune 500 digital transformation leaders exploring AI.',
      mutualInterests: ['Enterprise Sales', 'Corporate Innovation', 'Strategic Alliances'],
      seeking: 'Demonstrable AI Networking Products for Pilot Sponsors',
      seekingDetail:
          'Looking for live AI matchmaking and smart follow-up platforms to showcase as featured innovation pilots during our executive roundtables at AI Summit SF.',
      offering: 'Access to Fortune 500 CIO Roundtables',
      offeringDetail:
          'Direct introductions to Innovation VPs and CIOs from Fortune 500 financial and enterprise tech enterprises looking to sponsor high-value pilots.',
      location: 'Boston, MA',
      category: 'partner',
      isBookmarked: false,
    ),
    MatchmakingProfile(
      id: 'match-6',
      name: 'Amina Al-Mansoor',
      role: 'Co-Founder & CTO',
      company: 'Synapse Mobility',
      avatarInitials: 'AM',
      eventTitle: 'Global Founder Circle',
      compatibilityScore: 86,
      whyAiMatched:
          'Scaling a distributed team of 40 across EMEA. Needs automated calendar extraction and smart follow-up tools to optimize international partnerships.',
      mutualInterests: ['Distributed Teams', 'Event Automation', 'Smart CRM', 'EMEA Expansion'],
      seeking: 'Automated Relationship Tracking Tools',
      seekingDetail:
          'Looking to deploy an enterprise-grade relationship intelligence tool for our 40-person team distributed across EMEA. Key needs include seamless calendar scraping, smart automated follow-ups, and CRM synchronization.',
      offering: 'GCC / MENA Enterprise Market Access',
      offeringDetail:
          'Offering high-level commercial access to enterprise fleets, mobility providers, and smart infrastructure partners across the UAE and Saudi Arabia, alongside regulatory sandbox navigation.',
      location: 'Dubai, UAE',
      category: 'founder',
      isBookmarked: false,
    ),
  ];

  void setEventFilter(String event) {
    state = state.copyWith(selectedEvent: event);
  }

  void setCategoryFilter(String category) {
    state = state.copyWith(selectedCategory: category);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void toggleBookmark(String profileId) {
    final updatedProfiles = state.profiles.map((p) {
      if (p.id == profileId) {
        return p.copyWith(isBookmarked: !p.isBookmarked);
      }
      return p;
    }).toList();

    state = state.copyWith(profiles: updatedProfiles);
  }

  void scheduleMeeting({
    required String matchId,
    required DateTime time,
    required String location,
    required String topic,
  }) {
    final profile = state.profiles.firstWhere((p) => p.id == matchId);

    final newMeeting = ScheduledMeeting(
      id: 'meet-${DateTime.now().millisecondsSinceEpoch}',
      matchId: matchId,
      personName: profile.name,
      personRole: profile.role,
      personCompany: profile.company,
      eventTitle: profile.eventTitle,
      scheduledTime: time,
      locationOrLink: location,
      topic: topic,
      isConfirmed: true,
    );

    final updatedProfiles = state.profiles.map((p) {
      if (p.id == matchId) {
        return p.copyWith(meetingStatus: 'confirmed');
      }
      return p;
    }).toList();

    state = state.copyWith(
      profiles: updatedProfiles,
      scheduledMeetings: [newMeeting, ...state.scheduledMeetings],
    );

    // Persist to calendar_events in Supabase if authenticated
    final user = _ref.read(authProvider).user;
    if (user != null && !user.isGuest) {
      try {
        SupabaseService.client.from('calendar_events').insert({
          'user_id': user.id,
          'title': 'Meeting: ${profile.name} (${profile.company})',
          'description': 'Topic: $topic. Matched at ${profile.eventTitle}',
          'start_time': time.toUtc().toIso8601String(),
          'end_time': time.add(const Duration(minutes: 30)).toUtc().toIso8601String(),
          'location': location,
        }).then((_) {}).catchError((_) {});
      } catch (_) {}
    }
  }

  String generateIcebreaker(String profileId) {
    final profile = state.profiles.firstWhere(
      (p) => p.id == profileId,
      orElse: () => state.profiles.isNotEmpty ? state.profiles.first : _seedProfiles.first,
    );
    final user = _ref.read(authProvider).user;
    final senderName = (user != null && !user.isGuest && user.name.trim().isNotEmpty)
        ? user.name.trim()
        : 'Alex Mercer';
    final firstName = profile.name.split(' ').first;
    final interestsStr = profile.mutualInterests.isNotEmpty
        ? profile.mutualInterests.take(2).join(' and ')
        : 'innovative technologies';
    final seekingStr = profile.seeking.isNotEmpty
        ? profile.seeking
        : 'strategic growth';

    return '''Hi $firstName,

I noticed you're attending ${profile.eventTitle}. Netlink AI highlighted our strong mutual synergy in $interestsStr.

I'm particularly impressed by your focus at ${profile.company} on $seekingStr. Given our work in next-gen relationship intelligence and AI-driven automation, I believe a quick 10-minute coffee chat during the event would be mutually valuable.

Would you be open to connecting briefly at the event lounge?

Best regards,
$senderName''';
  }
}
