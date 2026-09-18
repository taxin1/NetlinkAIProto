import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/features/emails/models/email_models.dart';
import 'package:networklink_ai/features/emails/providers/emails_provider.dart';

void main() {
  group('EmailsProvider Tests', () {
    test('generateAiEmail creates relevant personalized email and subject', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(emailsProvider.notifier);
      const contact = EmailContactOption(
        id: 'contact_1',
        name: 'Elena Rostova',
        email: 'elena@quantumventures.vc',
        company: 'Quantum Ventures',
      );

      final generated = await notifier.generateAiEmail(
        contact: contact,
        purpose: 'follow up after AI Summit pitch',
        userName: 'Alex Mercer',
      );

      expect(generated['subject'], isNotEmpty);
      expect(generated['body'], contains('Elena Rostova'));
      expect(generated['body'], contains('Alex Mercer'));
    });

    test('saveDraft adds draft email to state list', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(emailsProvider.notifier);
      const contact = EmailContactOption(
        id: 'contact_2',
        name: 'Sarah Lin',
        email: 'sarah@nextgen.ai',
        company: 'NextGen AI',
      );

      final success = await notifier.saveDraft(
        contact: contact,
        subject: 'Collaboration inquiry',
        body: 'Hi Sarah, let us connect.',
      );

      expect(success, isTrue);
      final state = container.read(emailsProvider);
      expect(state.emails.any((e) => e.subject == 'Collaboration inquiry'), isTrue);
    });
  });
}
