/// Domain layer — Contacts feature.
library;
// ─── Entities ───────────────────────────────────────────────────────────────

class ContactEntity {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String? company;
  final String? title;
  final String? notes;
  final List<String> tags;
  final DateTime? addedAt;
  final int? aiMatchScore; // 0–100

  const ContactEntity({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.company,
    this.title,
    this.notes,
    this.tags = const [],
    this.addedAt,
    this.aiMatchScore,
  });
}

// ─── Repository interfaces ───────────────────────────────────────────────────

abstract class ContactsRepository {
  Future<List<ContactEntity>> getContacts();
  Future<ContactEntity> getContactById(String id);
  Future<ContactEntity> addContact(ContactEntity contact);
  Future<ContactEntity> updateContact(ContactEntity contact);
  Future<void> deleteContact(String id);
  Future<ContactEntity> scanBusinessCard(String imagePath);
  Stream<List<ContactEntity>> watchContacts();
}

// ─── Use cases ───────────────────────────────────────────────────────────────

class GetContactsUseCase {
  final ContactsRepository _repo;
  GetContactsUseCase(this._repo);
  Future<List<ContactEntity>> call() => _repo.getContacts();
}

class ScanBusinessCardUseCase {
  final ContactsRepository _repo;
  ScanBusinessCardUseCase(this._repo);
  Future<ContactEntity> call(String imagePath) =>
      _repo.scanBusinessCard(imagePath);
}

class AddContactUseCase {
  final ContactsRepository _repo;
  AddContactUseCase(this._repo);
  Future<ContactEntity> call(ContactEntity contact) =>
      _repo.addContact(contact);
}

class DeleteContactUseCase {
  final ContactsRepository _repo;
  DeleteContactUseCase(this._repo);
  Future<void> call(String id) => _repo.deleteContact(id);
}
