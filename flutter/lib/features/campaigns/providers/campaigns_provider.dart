import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/campaign_model.dart';
import '../services/campaigns_service.dart';

class CampaignsState {
  final List<EmailCampaign> campaigns;
  final List<CampaignContact> contacts;
  final Set<String> selectedContactIds;
  final bool isLoading;
  final bool isCreating;
  final bool isGeneratingPurpose;
  final bool isGeneratingSubject;
  final bool isGeneratingAll;
  final String? runningCampaignId;
  final double runningProgress;
  final String? currentRecipientName;
  final String statusFilter; // 'all' | 'running' | 'completed' | 'draft'
  final String searchQuery;
  final String? errorMessage;
  final String? successMessage;

  const CampaignsState({
    this.campaigns = const [],
    this.contacts = const [],
    this.selectedContactIds = const {},
    this.isLoading = false,
    this.isCreating = false,
    this.isGeneratingPurpose = false,
    this.isGeneratingSubject = false,
    this.isGeneratingAll = false,
    this.runningCampaignId,
    this.runningProgress = 0.0,
    this.currentRecipientName,
    this.statusFilter = 'all',
    this.searchQuery = '',
    this.errorMessage,
    this.successMessage,
  });

  bool get isRunningAny => runningCampaignId != null;

  List<EmailCampaign> get filteredCampaigns {
    var list = campaigns;
    if (statusFilter != 'all') {
      list = list.where((c) => c.status.toLowerCase() == statusFilter.toLowerCase()).toList();
    }
    if (searchQuery.trim().isNotEmpty) {
      final q = searchQuery.toLowerCase().trim();
      list = list.where((c) {
        return c.name.toLowerCase().contains(q) ||
            c.subject.toLowerCase().contains(q) ||
            c.purpose.toLowerCase().contains(q);
      }).toList();
    }
    return list;
  }

  List<CampaignContact> filteredContacts(String query) {
    if (query.trim().isEmpty) return contacts;
    final q = query.toLowerCase().trim();
    return contacts.where((c) {
      return c.name.toLowerCase().contains(q) ||
          (c.company?.toLowerCase().contains(q) ?? false) ||
          (c.email?.toLowerCase().contains(q) ?? false);
    }).toList();
  }

  CampaignsState copyWith({
    List<EmailCampaign>? campaigns,
    List<CampaignContact>? contacts,
    Set<String>? selectedContactIds,
    bool? isLoading,
    bool? isCreating,
    bool? isGeneratingPurpose,
    bool? isGeneratingSubject,
    bool? isGeneratingAll,
    String? runningCampaignId,
    bool clearRunningCampaign = false,
    double? runningProgress,
    String? currentRecipientName,
    bool clearRecipientName = false,
    String? statusFilter,
    String? searchQuery,
    String? errorMessage,
    bool clearError = false,
    String? successMessage,
    bool clearSuccess = false,
  }) {
    return CampaignsState(
      campaigns: campaigns ?? this.campaigns,
      contacts: contacts ?? this.contacts,
      selectedContactIds: selectedContactIds ?? this.selectedContactIds,
      isLoading: isLoading ?? this.isLoading,
      isCreating: isCreating ?? this.isCreating,
      isGeneratingPurpose: isGeneratingPurpose ?? this.isGeneratingPurpose,
      isGeneratingSubject: isGeneratingSubject ?? this.isGeneratingSubject,
      isGeneratingAll: isGeneratingAll ?? this.isGeneratingAll,
      runningCampaignId: clearRunningCampaign ? null : (runningCampaignId ?? this.runningCampaignId),
      runningProgress: runningProgress ?? this.runningProgress,
      currentRecipientName: clearRecipientName ? null : (currentRecipientName ?? this.currentRecipientName),
      statusFilter: statusFilter ?? this.statusFilter,
      searchQuery: searchQuery ?? this.searchQuery,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      successMessage: clearSuccess ? null : (successMessage ?? this.successMessage),
    );
  }
}

class CampaignsNotifier extends StateNotifier<CampaignsState> {
  final Ref ref;

  CampaignsNotifier(this.ref) : super(const CampaignsState()) {
    loadData();
  }

  String get _currentUserId {
    final auth = ref.read(authProvider);
    return auth.user?.id ?? 'guest_user';
  }

  Future<void> loadData() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final userId = _currentUserId;
      final results = await Future.wait([
        CampaignsService.fetchCampaigns(userId),
        CampaignsService.fetchContacts(userId),
      ]);

      final loadedCampaigns = results[0] as List<EmailCampaign>;
      final loadedContacts = results[1] as List<CampaignContact>;

      state = state.copyWith(
        campaigns: loadedCampaigns,
        contacts: loadedContacts,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load campaigns: $e',
      );
    }
  }

  void toggleContact(String contactId) {
    final updated = Set<String>.from(state.selectedContactIds);
    if (updated.contains(contactId)) {
      updated.remove(contactId);
    } else {
      updated.add(contactId);
    }
    state = state.copyWith(selectedContactIds: updated);
  }

  void selectAllContacts() {
    state = state.copyWith(
      selectedContactIds: state.contacts.map((c) => c.id).toSet(),
    );
  }

  void clearContactSelection() {
    state = state.copyWith(selectedContactIds: {});
  }

  Future<String?> generatePurpose(String campaignName) async {
    if (campaignName.trim().isEmpty) return null;
    state = state.copyWith(isGeneratingPurpose: true, clearError: true);
    try {
      final purpose = await CampaignsService.generateCampaignPurpose(campaignName);
      state = state.copyWith(isGeneratingPurpose: false);
      return purpose;
    } catch (e) {
      state = state.copyWith(
        isGeneratingPurpose: false,
        errorMessage: 'Failed to generate campaign purpose: $e',
      );
      return null;
    }
  }

  Future<String?> generateSubject(String campaignName, [String? purpose]) async {
    if (campaignName.trim().isEmpty) return null;
    state = state.copyWith(isGeneratingSubject: true, clearError: true);
    try {
      final subject = await CampaignsService.generateCampaignSubject(campaignName, purpose);
      state = state.copyWith(isGeneratingSubject: false);
      return subject;
    } catch (e) {
      state = state.copyWith(
        isGeneratingSubject: false,
        errorMessage: 'Failed to generate subject line: $e',
      );
      return null;
    }
  }

  Future<Map<String, String>?> generateAll(String campaignName) async {
    if (campaignName.trim().isEmpty) return null;
    state = state.copyWith(isGeneratingAll: true, clearError: true);
    try {
      final content = await CampaignsService.generateAllContent(campaignName);
      state = state.copyWith(isGeneratingAll: false);
      return content;
    } catch (e) {
      state = state.copyWith(
        isGeneratingAll: false,
        errorMessage: 'Failed to generate campaign content: $e',
      );
      return null;
    }
  }

  Future<bool> createCampaign({
    required String name,
    required String purpose,
    required String subject,
  }) async {
    if (name.trim().isEmpty || purpose.trim().isEmpty || subject.trim().isEmpty) {
      state = state.copyWith(errorMessage: 'Please fill in all campaign fields');
      return false;
    }
    if (state.selectedContactIds.isEmpty) {
      state = state.copyWith(errorMessage: 'Please select at least one recipient contact');
      return false;
    }

    state = state.copyWith(isCreating: true, clearError: true);
    try {
      final selectedContactsList = state.contacts
          .where((c) => state.selectedContactIds.contains(c.id))
          .toList();

      final newCampaign = await CampaignsService.createCampaign(
        userId: _currentUserId,
        name: name,
        purpose: purpose,
        subject: subject,
        contacts: selectedContactsList,
      );

      final updatedList = [newCampaign, ...state.campaigns];
      state = state.copyWith(
        campaigns: updatedList,
        selectedContactIds: {},
        isCreating: false,
        successMessage: 'Campaign "${newCampaign.name}" created successfully!',
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isCreating: false,
        errorMessage: 'Failed to create campaign: $e',
      );
      return false;
    }
  }

  Future<void> runCampaign(EmailCampaign campaign, {bool skipAlreadySent = false}) async {
    if (state.isRunningAny) return;

    state = state.copyWith(
      runningCampaignId: campaign.id,
      runningProgress: 0.0,
      clearError: true,
      clearSuccess: true,
    );

    // Update status in local list to running
    final runningList = state.campaigns.map((c) {
      if (c.id == campaign.id) {
        return c.copyWith(status: 'running');
      }
      return c;
    }).toList();
    state = state.copyWith(campaigns: runningList);

    try {
      final updatedCampaign = await CampaignsService.runCampaign(
        campaign: campaign,
        skipAlreadySent: skipAlreadySent,
        onProgress: (progress, contactName) {
          state = state.copyWith(
            runningProgress: progress,
            currentRecipientName: contactName,
          );
        },
      );

      final finalList = state.campaigns.map((c) {
        if (c.id == campaign.id) {
          return updatedCampaign;
        }
        return c;
      }).toList();

      state = state.copyWith(
        campaigns: finalList,
        clearRunningCampaign: true,
        clearRecipientName: true,
        runningProgress: 1.0,
        successMessage: 'Campaign "${campaign.name}" finished sending successfully!',
      );
    } catch (e) {
      state = state.copyWith(
        clearRunningCampaign: true,
        clearRecipientName: true,
        errorMessage: 'Error running campaign: $e',
      );
    }
  }

  Future<void> rerunCampaign(EmailCampaign campaign) async {
    final resetCampaign = campaign.copyWith(
      status: 'draft',
      sentCount: 0,
    );
    await runCampaign(resetCampaign);
  }

  Future<void> deleteCampaign(String campaignId) async {
    try {
      await CampaignsService.deleteCampaign(campaignId);
      final updated = state.campaigns.where((c) => c.id != campaignId).toList();
      state = state.copyWith(
        campaigns: updated,
        successMessage: 'Campaign deleted.',
      );
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to delete campaign: $e');
    }
  }

  void setStatusFilter(String filter) {
    state = state.copyWith(statusFilter: filter);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void clearMessages() {
    state = state.copyWith(clearError: true, clearSuccess: true);
  }
}

final campaignsProvider = StateNotifierProvider<CampaignsNotifier, CampaignsState>((ref) {
  return CampaignsNotifier(ref);
});
