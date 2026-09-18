/// Domain layer — AI Assistant feature.
enum MessageRole { user, assistant }

class ChatMessageEntity {
  final String id;
  final String text;
  final MessageRole role;
  final DateTime timestamp;

  const ChatMessageEntity({
    required this.id,
    required this.text,
    required this.role,
    required this.timestamp,
  });
}

abstract class AiAssistantRepository {
  Future<ChatMessageEntity> sendMessage(String message, String conversationId);
  Future<List<ChatMessageEntity>> getConversationHistory(String conversationId);
  Future<String> generateEmail({
    required String contactName,
    required String purpose,
    String? additionalContext,
  });
  Future<String> generateNetworkingInsight(String prompt);
}

class SendMessageUseCase {
  final AiAssistantRepository _repo;
  SendMessageUseCase(this._repo);
  Future<ChatMessageEntity> call(String message, String conversationId) =>
      _repo.sendMessage(message, conversationId);
}

class GenerateEmailUseCase {
  final AiAssistantRepository _repo;
  GenerateEmailUseCase(this._repo);
  Future<String> call({
    required String contactName,
    required String purpose,
  }) =>
      _repo.generateEmail(contactName: contactName, purpose: purpose);
}
