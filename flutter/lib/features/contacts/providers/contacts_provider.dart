import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/contact_model.dart';
import '../services/contacts_service.dart';

class ContactsState {
  final List<ContactModel> contacts;
  final bool isLoading;
  final String? error;
  final String searchQuery;

  const ContactsState({
    this.contacts = const [],
    this.isLoading = false,
    this.error,
    this.searchQuery = '',
  });

  List<ContactModel> get filteredContacts {
    if (searchQuery.trim().isEmpty) return contacts;
    final q = searchQuery.toLowerCase().trim();
    return contacts.where((c) {
      final nameMatch = c.name.toLowerCase().contains(q);
      final companyMatch = c.company?.toLowerCase().contains(q) ?? false;
      final roleMatch = c.position?.toLowerCase().contains(q) ?? false;
      final tagMatch = c.tags.any((t) => t.toLowerCase().contains(q));
      return nameMatch || companyMatch || roleMatch || tagMatch;
    }).toList();
  }

  ContactsState copyWith({
    List<ContactModel>? contacts,
    bool? isLoading,
    String? error,
    String? searchQuery,
  }) {
    return ContactsState(
      contacts: contacts ?? this.contacts,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

class ContactsNotifier extends StateNotifier<ContactsState> {
  final Ref _ref;

  ContactsNotifier(this._ref) : super(const ContactsState()) {
    loadContacts();
  }

  Future<void> loadContacts() async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      // Guest / Trial Mode: pre-populate rich sample contacts so page looks vibrant and accessible
      state = ContactsState(
        contacts: [
          ContactModel(
            id: 'sample_1',
            userId: user?.id ?? 'guest',
            name: 'Sarah Lin',
            email: 'sarah.lin@nextgen.ai',
            phone: '+1 (555) 234-5678',
            company: 'NextGen AI Labs',
            position: 'VP of Engineering',
            notes: 'Met at AI Summit. Interested in enterprise API partnership.',
            whereMet: 'AI Summit San Francisco',
            metAt: '09/01/2026',
            tags: const ['VIP', 'Engineering', 'Partner'],
            createdAt: DateTime.now().subtract(const Duration(days: 2)),
          ),
          ContactModel(
            id: 'sample_2',
            userId: user?.id ?? 'guest',
            name: 'David Vance',
            email: 'david.vance@apexrobotics.io',
            phone: '+1 (555) 345-6789',
            company: 'Apex Robotics',
            position: 'Head of Product',
            notes: 'Discussed computer vision integrations and SDK roadmap.',
            whereMet: 'Robotics Expo',
            metAt: '09/03/2026',
            tags: const ['Product', 'Robotics'],
            createdAt: DateTime.now().subtract(const Duration(days: 4)),
          ),
          ContactModel(
            id: 'sample_3',
            userId: user?.id ?? 'guest',
            name: 'Elena Rostova',
            email: 'elena@quantumventures.vc',
            phone: '+1 (555) 456-7890',
            company: 'Quantum Ventures',
            position: 'General Partner',
            notes: 'Follow up regarding Seed & Series A opportunities.',
            whereMet: 'Venture Capital Mixer',
            metAt: '09/05/2026',
            tags: const ['Investor', 'Seed'],
            createdAt: DateTime.now().subtract(const Duration(days: 6)),
          ),
        ],
        isLoading: false,
      );
      return;
    }

    state = state.copyWith(isLoading: true, error: null);
    try {
      final contacts = await ContactsService.fetchContacts(user.id);
      state = state.copyWith(contacts: contacts, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  Future<bool> addContact({
    required String name,
    String? email,
    String? phone,
    String? company,
    String? position,
    String? notes,
    String? whereMet,
    String? metAt,
    List<String> tags = const [],
  }) async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      // Trial mode: add locally in memory
      final localContact = ContactModel(
        id: 'guest_${DateTime.now().millisecondsSinceEpoch}',
        userId: user?.id ?? 'guest',
        name: name,
        email: email,
        phone: phone,
        company: company,
        position: position,
        notes: notes,
        whereMet: whereMet,
        metAt: metAt,
        tags: tags,
        createdAt: DateTime.now(),
      );
      state = state.copyWith(contacts: [localContact, ...state.contacts]);
      return true;
    }

    final newContact = ContactModel(
      id: '',
      userId: user.id,
      name: name,
      email: email,
      phone: phone,
      company: company,
      position: position,
      notes: notes,
      whereMet: whereMet,
      metAt: metAt,
      tags: tags,
      createdAt: DateTime.now(),
    );

    final created = await ContactsService.createContact(newContact);
    if (created != null) {
      state = state.copyWith(contacts: [created, ...state.contacts]);
      return true;
    }
    return false;
  }

  Future<bool> deleteContact(String contactId) async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      // Trial mode: delete locally in memory
      state = state.copyWith(
        contacts: state.contacts.where((c) => c.id != contactId).toList(),
      );
      return true;
    }

    final success = await ContactsService.deleteContact(contactId);
    if (success) {
      state = state.copyWith(
        contacts: state.contacts.where((c) => c.id != contactId).toList(),
      );
      return true;
    }
    return false;
  }
}

final contactsProvider = StateNotifierProvider<ContactsNotifier, ContactsState>(
  (ref) => ContactsNotifier(ref),
);
