/// Domain layer stubs — connect to real API in backend phase.
/// All entities, repository interfaces, and use cases go here.
// ─── Entities ───────────────────────────────────────────────────────────────

/// Core user entity (domain model).
library;

class UserEntity {
  final String id;
  final String name;
  final String email;
  final bool isPro;
  final bool isGuest;

  const UserEntity({
    required this.id,
    required this.name,
    required this.email,
    this.isPro = false,
    this.isGuest = false,
  });
}

// ─── Repository interfaces ───────────────────────────────────────────────────

/// Abstract contract — implemented in data layer.
abstract class AuthRepository {
  Future<UserEntity?> signIn(String email, String password);
  Future<UserEntity?> signInWithGoogle();
  Future<UserEntity?> signInAsGuest();
  Future<UserEntity?> createAccount({
    required String name,
    required String email,
    required String password,
  });
  Future<void> signOut();
  Stream<UserEntity?> get authStateChanges;
}

// ─── Use cases ───────────────────────────────────────────────────────────────

class SignInUseCase {
  final AuthRepository _repo;
  SignInUseCase(this._repo);

  Future<UserEntity?> call(String email, String password) =>
      _repo.signIn(email, password);
}

class SignInWithGoogleUseCase {
  final AuthRepository _repo;
  SignInWithGoogleUseCase(this._repo);

  Future<UserEntity?> call() => _repo.signInWithGoogle();
}

class CreateAccountUseCase {
  final AuthRepository _repo;
  CreateAccountUseCase(this._repo);

  Future<UserEntity?> call({
    required String name,
    required String email,
    required String password,
  }) =>
      _repo.createAccount(name: name, email: email, password: password);
}

class SignOutUseCase {
  final AuthRepository _repo;
  SignOutUseCase(this._repo);

  Future<void> call() => _repo.signOut();
}
