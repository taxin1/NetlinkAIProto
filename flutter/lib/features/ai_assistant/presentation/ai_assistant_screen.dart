import 'package:flutter/material.dart';
import '../../../core/widgets/app_toast.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/router/app_router.dart';
import '../../../core/widgets/app_filter_chip.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/ai_voice_wave_visualizer.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/tour/tour_controller.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/services/business_card_scanner_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../core/localization/app_localizations.dart';

class _ChatMessage {
  final String text;
  final bool isUser;
  final String time;
  final String? actionLabel;
  final String? actionRoute;
  final IconData? actionIcon;

  _ChatMessage({
    required this.text,
    required this.isUser,
    required this.time,
    this.actionLabel,
    this.actionRoute,
    this.actionIcon,
  });
}

final _chatMessagesProvider = StateProvider<List<_ChatMessage>>((ref) => [
      _ChatMessage(
        text:
            'Hello! I am Netlink AI, your personal networking and relationship intelligence copilot. I can find high-synergy attendees at events, draft tailored cold outreach, estimate project quotations, and track your conversion analytics.',
        isUser: false,
        time: '12:00',
        actionLabel: 'Explore Event Matches',
        actionRoute: AppRoutes.eventMatchmaking,
        actionIcon: Icons.handshake_rounded,
      ),
    ]);

class AiAssistantScreen extends ConsumerStatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  ConsumerState<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends ConsumerState<AiAssistantScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  bool _isListening = false;

  void _toggleListening() {
    setState(() {
      _isListening = !_isListening;
    });
  }

  Future<void> _sendMessage([String? textInput]) async {
    final text = (textInput ?? _controller.text).trim();
    if (text.isEmpty) return;

    if (textInput == null) {
      _controller.clear();
    }

    setState(() {
      _isListening = false;
    });

    final currentMessages = ref.read(_chatMessagesProvider);
    final history = currentMessages.take(10).map((m) => {
      'role': m.isUser ? 'user' : 'model',
      'parts': [{'text': m.text}],
    }).toList();

    ref.read(_chatMessagesProvider.notifier).update((state) => [
          ...state,
          _ChatMessage(text: text, isUser: true, time: _now()),
        ]);
    _scrollToBottom();

    _ChatMessage? aiResponse;
    try {
      final user = ref.read(authProvider).user;
      final locale = ref.read(localeProvider).languageCode;
      final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/chat');

      final response = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'message': text,
              'language': locale,
              'userId': user?.id ?? 'guest',
              'conversationHistory': history,
            }),
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final replyText = data['response'] as String?;
        if (replyText != null && replyText.trim().isNotEmpty) {
          aiResponse = _ChatMessage(
            text: replyText.trim(),
            isUser: false,
            time: _now(),
          );
        }
      }
    } catch (_) {}

    aiResponse ??= _generateAiMessage(text);

    if (mounted) {
      ref.read(_chatMessagesProvider.notifier).update((state) => [
            ...state,
            aiResponse!,
          ]);
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _now() {
    final now = DateTime.now();
    return '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
  }

  _ChatMessage _generateAiMessage(String input) {
    final lower = input.toLowerCase();

    if (lower.contains('match') ||
        lower.contains('event') ||
        lower.contains('disrupt') ||
        lower.contains('who should i meet')) {
      return _ChatMessage(
        text:
            'I analyzed attendees for TechCrunch Disrupt 2026. Elena Rostova (General Partner @ Horizon Ventures, 98% Compatibility) is your top match. She is actively backing AI workflow automation and enterprise SaaS.',
        isUser: false,
        time: _now(),
        actionLabel: 'View in AI Matchmaking',
        actionRoute: AppRoutes.eventMatchmaking,
        actionIcon: Icons.handshake_rounded,
      );
    } else if (lower.contains('email') ||
        lower.contains('follow up') ||
        lower.contains('intro') ||
        lower.contains('draft')) {
      return _ChatMessage(
        text:
            'I drafted a personalized cold outreach email for Elena Rostova referencing your mutual overlap in enterprise AI scaling and cross-platform apps.',
        isUser: false,
        time: _now(),
        actionLabel: 'Open in Emails',
        actionRoute: AppRoutes.emails,
        actionIcon: Icons.mail_rounded,
      );
    } else if (lower.contains('quotation') ||
        lower.contains('project') ||
        lower.contains('cost') ||
        lower.contains('budget')) {
      return _ChatMessage(
        text:
            'Based on your scope, I configured an Enterprise AI Suite estimate (\$8,500 – \$14,000) with 4 core modules and a 1-2 month delivery timeline.',
        isUser: false,
        time: _now(),
        actionLabel: 'View in Quotation Builder',
        actionRoute: AppRoutes.quotation,
        actionIcon: Icons.description_rounded,
      );
    } else if (lower.contains('analytics') ||
        lower.contains('stats') ||
        lower.contains('metrics') ||
        lower.contains('growth')) {
      return _ChatMessage(
        text:
            'Your outreach conversion rate is currently 46.8% (2.6x industry benchmark) with 19 scheduled meetings this period.',
        isUser: false,
        time: _now(),
        actionLabel: 'View Full Analytics',
        actionRoute: AppRoutes.analytics,
        actionIcon: Icons.analytics_rounded,
      );
    }

    return _ChatMessage(
      text:
          'I can help you coordinate event meetings, draft cold emails, calculate project quotations, and track networking analytics. Try one of the suggested prompts below!',
      isUser: false,
      time: _now(),
    );
  }

  void _clearChat() {
    ref.read(_chatMessagesProvider.notifier).state = [
      _ChatMessage(
        text:
            'Chat history reset. How can I assist with your networking and project workflow today?',
        isUser: false,
        time: _now(),
      ),
    ];
    AppToast.show(context, context.tr('conversationCleared'));
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(_chatMessagesProvider);

    return Stack(
      children: [
        LayoutBuilder(
          builder: (context, constraints) {
            final isConstrainedHeight = constraints.maxHeight < 620;

            Widget cardContent = Column(
              children: [
                // 1. Header Bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: context.colors.surfaceCard.withValues(alpha: 0.8),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  ),
                  child: Row(
                    children: [
                      Text(
                        context.tr('netlinkAiAssistant'),
                        style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Color(0xFFEF4444)),
                        tooltip: context.tr('clearChat'),
                        onPressed: _clearChat,
                      ),
                    ],
                  ),
                ),

                // 2. Voice Wave Header Visualizer
                IgnorePointer(
                  child: AiVoiceWaveHeader(isListening: _isListening),
                ),

                // 3. Chat Messages History
                isConstrainedHeight
                    ? SizedBox(
                        height: 260,
                        child: ListView.separated(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: messages.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 16),
                          itemBuilder: (context, index) {
                            final message = messages[index];
                            return _buildMessageBubble(context, message);
                          },
                        ),
                      )
                    : Expanded(
                        child: ListView.separated(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: messages.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 16),
                          itemBuilder: (context, index) {
                            final message = messages[index];
                            return _buildMessageBubble(context, message);
                          },
                        ),
                      ),

                // 4. Quick Suggestion Prompt Chips Bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: context.colors.surfaceCard.withValues(alpha: 0.5),
                    border: Border(
                      top: BorderSide(color: context.colors.glassBorder),
                    ),
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        AppFilterChip(
                          label: context.tr('topMatchesChip'),
                          selected: false,
                          showCheckmark: false,
                          onSelected: (_) => _sendMessage(context.tr('topMatchesPrompt')),
                        ),
                        const SizedBox(width: 8),
                        AppFilterChip(
                          label: context.tr('draftFollowUpChip'),
                          selected: false,
                          showCheckmark: false,
                          onSelected: (_) => _sendMessage(context.tr('draftFollowUpPrompt')),
                        ),
                        const SizedBox(width: 8),
                        AppFilterChip(
                          label: context.tr('projectQuotationChip'),
                          selected: false,
                          showCheckmark: false,
                          onSelected: (_) => _sendMessage(context.tr('projectQuotationPrompt')),
                        ),
                        const SizedBox(width: 8),
                        AppFilterChip(
                          label: context.tr('growthAnalyticsChip'),
                          selected: false,
                          showCheckmark: false,
                          onSelected: (_) => _sendMessage(context.tr('growthAnalyticsPrompt')),
                        ),
                      ],
                    ),
                  ),
                ),

                // 5. Input Bar at Bottom
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    border: Border(top: BorderSide(color: context.colors.glassBorder)),
                    color: context.colors.surfaceCard.withValues(alpha: 0.9),
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                  ),
                  child: Container(
                    key: TourTargetKeys.assistantFeature,
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    decoration: BoxDecoration(
                      color: context.colors.surface.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(99),
                      border: Border.all(
                        color: _isListening
                            ? context.colors.primary.withValues(alpha: 0.8)
                            : context.colors.glassBorder,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: _isListening
                              ? context.colors.primary.withValues(alpha: 0.25)
                              : context.colors.onSurface.withValues(alpha: 0.04),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          icon: Icon(_isListening ? Icons.mic_rounded : Icons.mic_none_outlined),
                          color: _isListening ? context.colors.primary : context.colors.onSurfaceVariant,
                          onPressed: _toggleListening,
                        ),
                        Expanded(
                          child: TextField(
                            controller: _controller,
                            style: AppTypography.bodyMd,
                            decoration: InputDecoration(
                              hintText: _isListening
                                  ? context.tr('listening')
                                  : context.tr('chatPlaceholder'),
                              hintStyle: AppTypography.bodySm.copyWith(
                                color: _isListening
                                    ? context.colors.primary.withValues(alpha: 0.8)
                                    : context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                              ),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                            ),
                            onSubmitted: (_) => _sendMessage(),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.volume_up_outlined, size: 20),
                          color: context.colors.onSurfaceVariant,
                          onPressed: () {
                            AppToast.show(context, context.tr('audioPlaybackEnabled'));
                          },
                        ),
                        GestureDetector(
                          onTap: () => _sendMessage(),
                          child: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: context.colors.primaryButtonGradient,
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: context.colors.primary.withValues(alpha: 0.4),
                                  blurRadius: 15,
                                ),
                              ],
                            ),
                            child: const Icon(Icons.send_rounded, color: Colors.white, size: 17),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );

            final topSpacing = Responsive.isDesktop(context)
                ? 0.0
                : (kToolbarHeight + MediaQuery.of(context).padding.top);

            Widget innerContent = ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: Responsive.pagePadding(context)),
                child: Column(
                  children: [
                    // Header OUTSIDE & ABOVE container
                    PopInItem(
                      index: 0,
                      child: Padding(
                        padding: EdgeInsets.only(
                          top: isConstrainedHeight ? 12 : 20,
                          bottom: isConstrainedHeight ? 12 : 18,
                        ),
                        child: Center(
                          child: Text(
                            context.l10n.aiAssistant,
                            style: AppTypography.headlineMd,
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                    ),

                    // Single Unified GlassCard Container
                    isConstrainedHeight
                        ? PopInItem(
                            index: 1,
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 90),
                              child: GlassCard(
                                borderRadius: BorderRadius.circular(20),
                                padding: EdgeInsets.zero,
                                child: cardContent,
                              ),
                            ),
                          )
                        : Expanded(
                            child: PopInItem(
                              index: 1,
                              child: Padding(
                                padding: const EdgeInsets.only(bottom: 90),
                                child: GlassCard(
                                  borderRadius: BorderRadius.circular(20),
                                  padding: EdgeInsets.zero,
                                  child: cardContent,
                                ),
                              ),
                            ),
                          ),
                  ],
                ),
              ),
            );

            if (isConstrainedHeight) {
              return SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Padding(
                  padding: EdgeInsets.only(top: topSpacing),
                  child: Center(child: innerContent),
                ),
              );
            }

            return Column(
              children: [
                SizedBox(height: topSpacing),
                Expanded(
                  child: Center(child: innerContent),
                ),
              ],
            );
          },
        ),

      ],
    );
  }

  Widget _buildMessageBubble(BuildContext context, _ChatMessage message) {
    if (message.isUser) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.colors.primary.withValues(alpha: 0.15),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(4),
                ),
                border: Border.all(color: context.colors.primary.withValues(alpha: 0.35)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    message.text,
                    style: AppTypography.bodyMd.copyWith(color: context.colors.onSurface),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message.time,
                    style: AppTypography.labelSm.copyWith(
                      color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: context.colors.primaryContainer.withValues(alpha: 0.2),
            border: Border.all(color: context.colors.primary.withValues(alpha: 0.3)),
          ),
          child: Icon(Icons.smart_toy_outlined, color: context.colors.primary, size: 18),
        ),
        const SizedBox(width: 10),
        Flexible(
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: context.colors.surfaceContainer.withValues(alpha: 0.65),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(4),
                topRight: Radius.circular(16),
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
              border: Border.all(color: context.colors.glassBorder),
              boxShadow: [
                BoxShadow(
                  color: context.colors.onSurface.withValues(alpha: 0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Builder(
                  builder: (context) {
                    String displayText = message.text;
                    if (message.text.startsWith('Hello! I am Netlink AI') && context.isJapanese) {
                      displayText = 'こんにちは！私はNetlink AIです。あなたのネットワーキングおよび関係性インテリジェンスの専属コパイロットです。イベントでの最適な参加者の発見、個別のアプローチメールの作成、案件の見積もり、コンバージョン分析を支援します。';
                    } else if (message.text.startsWith('Chat history reset') && context.isJapanese) {
                      displayText = context.tr('chatHistoryResetIntro');
                    }
                    String? displayAction = message.actionLabel;
                    if (displayAction == 'Explore Event Matches' && context.isJapanese) {
                      displayAction = context.tr('exploreEventMatches');
                    }

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayText,
                          style: AppTypography.bodyMd.copyWith(
                            color: context.colors.onSurface,
                            height: 1.45,
                          ),
                        ),
                        if (displayAction != null) ...[
                          const SizedBox(height: 12),
                          GradientButton(
                            label: displayAction,
                            icon: message.actionIcon ?? Icons.arrow_forward_rounded,
                            height: 38,
                            maxWidth: 240,
                            onPressed: () {
                              if (message.actionRoute != null) {
                                context.go(message.actionRoute!);
                              }
                            },
                          ),
                        ],
                      ],
                    );
                  },
                ),
                const SizedBox(height: 6),
                Text(
                  message.time,
                  style: AppTypography.labelSm.copyWith(
                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
