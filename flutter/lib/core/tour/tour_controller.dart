import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Tour Target Global Keys (On-page features & buttons)
// ─────────────────────────────────────────────────────────────────────────────

class TourTargetKeys {
  static final dashboardScanner = GlobalKey(debugLabel: 'tour_target_scanner');
  static final contactsFeature = GlobalKey(debugLabel: 'tour_target_contacts_feature');
  static final calendarFeature = GlobalKey(debugLabel: 'tour_target_calendar_feature');
  static final emailsFeature = GlobalKey(debugLabel: 'tour_target_emails_feature');
  static final assistantFeature = GlobalKey(debugLabel: 'tour_target_assistant_feature');
  static final portfolioFeature = GlobalKey(debugLabel: 'tour_target_portfolio_feature');
  static final profileFeature = GlobalKey(debugLabel: 'tour_target_profile_feature');
  static final campaignsFeature = GlobalKey(debugLabel: 'tour_target_campaigns_feature');
  static final analyticsFeature = GlobalKey(debugLabel: 'tour_target_analytics_feature');

  static GlobalKey? getKeyForRoute(String route) {
    switch (route) {
      case '/app/dashboard':
        return dashboardScanner;
      case '/app/contacts':
        return contactsFeature;
      case '/app/calendar':
        return calendarFeature;
      case '/app/emails':
        return emailsFeature;
      case '/app/ai-assistant':
        return assistantFeature;
      case '/app/portfolio':
        return portfolioFeature;
      case '/app/profile':
        return profileFeature;
      case '/app/campaigns':
        return campaignsFeature;
      case '/app/analytics':
        return analyticsFeature;
      default:
        return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tour Step Item Model
// ─────────────────────────────────────────────────────────────────────────────

enum TourPosition { center, bottom, right, top, left }

class TourStepItem {
  final String id;
  final String title;
  final String description;
  final IconData icon;
  final Color accentColor;
  final String featureTag;
  final String keyCapability;
  final String targetRoute;
  final GlobalKey? targetKey;
  final TourPosition preferredPosition;
  final String locationHint;

  const TourStepItem({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    this.accentColor = const Color(0xFF2B5EFF),
    required this.featureTag,
    required this.keyCapability,
    required this.targetRoute,
    this.targetKey,
    this.preferredPosition = TourPosition.bottom,
    this.locationHint = 'Main Screen',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// The 11 Steps (With exact on-page targets and routes)
// ─────────────────────────────────────────────────────────────────────────────

final List<TourStepItem> appTourSteps = [
  // Step 0: Welcome
  const TourStepItem(
    id: 'welcome',
    title: 'Welcome to Netlink AI',
    description:
        "Let's take a quick guided tour of your key networking tools. We'll show you each feature right where it lives.",
    icon: Icons.auto_awesome_rounded,
    accentColor: Color(0xFF2B5EFF),
    featureTag: 'GETTING STARTED',
    keyCapability: '✨ Complete AI-powered networking platform',
    targetRoute: '/app/dashboard',
    preferredPosition: TourPosition.center,
    locationHint: 'Dashboard Overview',
  ),

  // Step 1: Business Card Scanner
  TourStepItem(
    id: 'dashboard',
    title: 'Business Card Scanner',
    description:
        'Upload or take a photo of any business card. Our AI extracts contact details and saves them directly to your network.',
    icon: Icons.crop_free_rounded,
    accentColor: const Color(0xFF0EA5E9),
    featureTag: 'CORE FEATURE',
    keyCapability: '⚡ Instant OCR & AI Contact Extraction',
    targetRoute: '/app/dashboard',
    targetKey: TourTargetKeys.dashboardScanner,
    preferredPosition: TourPosition.bottom,
    locationHint: 'Dashboard • Scanner',
  ),

  // Step 2: Contacts Management
  TourStepItem(
    id: 'contacts',
    title: 'Contacts Management',
    description:
        'View, search, and manage all your networking relationships in one place with smart tags, interaction logs, and quick actions.',
    icon: Icons.group_rounded,
    accentColor: const Color(0xFF10B981),
    featureTag: 'RELATIONSHIPS',
    keyCapability: '👥 Smart Search & Relationship History',
    targetRoute: '/app/contacts',
    targetKey: TourTargetKeys.contactsFeature,
    preferredPosition: TourPosition.bottom,
    locationHint: 'Contacts Page',
  ),

  // Step 3: Events & Calendar
  TourStepItem(
    id: 'events',
    title: 'Events & Calendar',
    description:
        'Sync your Google Calendar to view upcoming networking meetings, conferences, and automated follow-up reminders.',
    icon: Icons.calendar_month_rounded,
    accentColor: const Color(0xFF8B5CF6),
    featureTag: 'PRODUCTIVITY',
    keyCapability: '📅 Google Calendar Sync & Reminders',
    targetRoute: '/app/calendar',
    targetKey: TourTargetKeys.calendarFeature,
    preferredPosition: TourPosition.bottom,
    locationHint: 'Calendar Page',
  ),

  // Step 4: AI Email Agent
  TourStepItem(
    id: 'emails',
    title: 'AI Email Agent',
    description:
        'Draft personalized, context-aware networking emails and follow-ups in seconds with built-in AI assistance.',
    icon: Icons.mail_rounded,
    accentColor: const Color(0xFF2B5EFF),
    featureTag: 'AI POWERED',
    keyCapability: '✉️ Smart Email Drafting & Follow-ups',
    targetRoute: '/app/emails',
    targetKey: TourTargetKeys.emailsFeature,
    preferredPosition: TourPosition.bottom,
    locationHint: 'Email Features',
  ),

  // Step 5: AI Voice Assistant
  TourStepItem(
    id: 'ai-assistant',
    title: 'AI Voice & Chat Assistant',
    description:
        'Ask your assistant who you met, get follow-up strategies, or dictate emails hands-free with real-time voice intelligence.',
    icon: Icons.smart_toy_rounded,
    accentColor: const Color(0xFF06B6D4),
    featureTag: 'INTELLIGENT AGENT',
    keyCapability: '🤖 Hands-free Voice & Chat Intelligence',
    targetRoute: '/app/ai-assistant',
    targetKey: TourTargetKeys.assistantFeature,
    preferredPosition: TourPosition.top,
    locationHint: 'AI Assistant Input Bar',
  ),

  // Step 6: Portfolio Builder
  TourStepItem(
    id: 'portfolio',
    title: 'Portfolio Builder',
    description:
        'Create a professional digital portfolio showcasing your work, achievements, and credentials with a shareable custom link.',
    icon: Icons.folder_shared_rounded,
    accentColor: const Color(0xFFF59E0B),
    featureTag: 'SHOWCASE',
    keyCapability: '💼 Public Shareable Portfolio Page',
    targetRoute: '/app/portfolio',
    targetKey: TourTargetKeys.portfolioFeature,
    preferredPosition: TourPosition.bottom,
    locationHint: 'Portfolio Builder',
  ),

  // Step 7: Network Profile
  TourStepItem(
    id: 'profile',
    title: 'Network Profile',
    description:
        'Keep your public profile updated so other professionals can discover you, view your expertise, and connect.',
    icon: Icons.person_search_rounded,
    accentColor: const Color(0xFFEC4899),
    featureTag: 'DISCOVERABILITY',
    keyCapability: '🌐 Discoverable Professional Card',
    targetRoute: '/app/profile',
    targetKey: TourTargetKeys.profileFeature,
    preferredPosition: TourPosition.bottom,
    locationHint: 'Profile Info Card',
  ),

  // Step 8: AI Campaigns
  TourStepItem(
    id: 'campaigns',
    title: 'AI Campaigns',
    description:
        'Automate outreach to multiple contacts at once with personalized emails tailored to each person’s background.',
    icon: Icons.campaign_rounded,
    accentColor: const Color(0xFF7C3AED),
    featureTag: 'OUTREACH',
    keyCapability: '🚀 Scalable Personalized Outreach',
    targetRoute: '/app/campaigns',
    targetKey: TourTargetKeys.campaignsFeature,
    preferredPosition: TourPosition.bottom,
    locationHint: 'Campaigns Studio',
  ),

  // Step 9: Analytics
  TourStepItem(
    id: 'analytics',
    title: 'Analytics & Insights',
    description:
        'Monitor your network growth, email engagement, and follow-up conversions with interactive charts and metrics.',
    icon: Icons.analytics_rounded,
    accentColor: const Color(0xFF14B8A6),
    featureTag: 'INSIGHTS',
    keyCapability: '📊 Growth Trends & Engagement Stats',
    targetRoute: '/app/analytics',
    targetKey: TourTargetKeys.analyticsFeature,
    preferredPosition: TourPosition.bottom,
    locationHint: 'Analytics Overview',
  ),

  // Step 10: Completion
  const TourStepItem(
    id: 'complete',
    title: "You're All Set!",
    description:
        'You have seen all key features of Netlink AI. Start scanning cards, connect with contacts, and let AI power your network!',
    icon: Icons.celebration_rounded,
    accentColor: Color(0xFF2B5EFF),
    featureTag: 'TOUR COMPLETE',
    keyCapability: '🚀 Ready to accelerate your network',
    targetRoute: '/app/dashboard',
    preferredPosition: TourPosition.center,
    locationHint: 'Dashboard',
  ),
];

// ─────────────────────────────────────────────────────────────────────────────
// Tour State & Notifier
// ─────────────────────────────────────────────────────────────────────────────

class TourState {
  final bool isActive;
  final int currentStep;
  final bool hasCompleted;
  final bool sessionDismissed;

  const TourState({
    this.isActive = false,
    this.currentStep = 0,
    this.hasCompleted = false,
    this.sessionDismissed = false,
  });

  TourState copyWith({
    bool? isActive,
    int? currentStep,
    bool? hasCompleted,
    bool? sessionDismissed,
  }) {
    return TourState(
      isActive: isActive ?? this.isActive,
      currentStep: currentStep ?? this.currentStep,
      hasCompleted: hasCompleted ?? this.hasCompleted,
      sessionDismissed: sessionDismissed ?? this.sessionDismissed,
    );
  }

  TourStepItem get currentStepItem => appTourSteps[currentStep.clamp(0, appTourSteps.length - 1)];
  int get totalSteps => appTourSteps.length;
  bool get isFirstStep => currentStep == 0;
  bool get isLastStep => currentStep == appTourSteps.length - 1;
  double get progress => (currentStep + 1) / totalSteps;
}

class TourController extends StateNotifier<TourState> {
  static const _storageKey = 'netlink-tour-completed';

  TourController() : super(const TourState()) {
    _loadInitialState();
  }

  Future<void> _loadInitialState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final done = prefs.getBool(_storageKey) ?? false;
      if (mounted) {
        state = state.copyWith(hasCompleted: done);
      }
    } catch (_) {}
  }

  void startTour([int step = 0, bool force = false]) {
    // If user already dismissed/completed the tour and this isn't an explicit user trigger, ignore
    if (!force && (state.sessionDismissed || state.hasCompleted)) {
      return;
    }
    state = state.copyWith(
      isActive: true,
      currentStep: step.clamp(0, appTourSteps.length - 1),
      sessionDismissed: false,
    );
  }

  void nextStep() {
    if (state.currentStep < appTourSteps.length - 1) {
      state = state.copyWith(currentStep: state.currentStep + 1);
    } else {
      completeTour();
    }
  }

  void previousStep() {
    if (state.currentStep > 0) {
      state = state.copyWith(currentStep: state.currentStep - 1);
    }
  }

  void goToStep(int step) {
    state = state.copyWith(currentStep: step.clamp(0, appTourSteps.length - 1));
  }

  Future<void> skipTour() async {
    state = state.copyWith(isActive: false, hasCompleted: true, sessionDismissed: true);
    _saveCompleted();
  }

  Future<void> completeTour() async {
    state = state.copyWith(isActive: false, hasCompleted: true, sessionDismissed: true);
    _saveCompleted();
  }

  Future<void> _saveCompleted() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_storageKey, true);
    } catch (_) {}
  }
}

final tourControllerProvider =
    StateNotifierProvider<TourController, TourState>((ref) => TourController());
