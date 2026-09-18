import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/features/contacts/providers/contacts_provider.dart';

void main() {
  group('ContactsProvider Tests', () {
    test('Initial state loads sample contacts for guest mode', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final state = container.read(contactsProvider);
      expect(state.contacts, isNotEmpty);
      expect(state.contacts.any((c) => c.name == 'Sarah Lin'), isTrue);
    });

    test('Add contact in guest mode prepends to state list', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(contactsProvider.notifier);
      final success = await notifier.addContact(
        name: 'Taro Yamada',
        company: 'Tokyo Tech Labs',
        email: 'taro.yamada@tokyotech.jp',
        position: 'Lead AI Researcher',
      );

      expect(success, isTrue);
      final state = container.read(contactsProvider);
      expect(state.contacts.first.name, 'Taro Yamada');
      expect(state.contacts.first.company, 'Tokyo Tech Labs');
    });

    test('Search filter filters contacts by name, company, and position', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(contactsProvider.notifier);
      notifier.setSearchQuery('Apex');

      final state = container.read(contactsProvider);
      final filtered = state.filteredContacts;
      expect(filtered.length, 1);
      expect(filtered.first.company, 'Apex Robotics');
    });

    test('Delete contact removes contact by id', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(contactsProvider.notifier);
      final success = await notifier.deleteContact('sample_1');

      expect(success, isTrue);
      final state = container.read(contactsProvider);
      expect(state.contacts.any((c) => c.id == 'sample_1'), isFalse);
    });
  });
}
