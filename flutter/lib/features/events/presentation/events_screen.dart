import 'package:flutter/material.dart';
import '../../../core/widgets/app_toast.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/app_filter_chip.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/utils/responsive.dart';
import '../../auth/providers/auth_provider.dart';
import '../../contacts/providers/contacts_provider.dart';
import '../models/events_models.dart';
import '../providers/events_provider.dart';
import '../../../core/localization/app_localizations.dart';

class EventsScreen extends ConsumerStatefulWidget {
  const EventsScreen({super.key});

  @override
  ConsumerState<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends ConsumerState<EventsScreen> {
  final TextEditingController _urlController = TextEditingController();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descController = TextEditingController();
  final TextEditingController _locController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();

  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _startTime = const TimeOfDay(hour: 14, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 15, minute: 30);
  String? _selectedContactId;
  String? _selectedContactName;
  bool _notificationEnabled = true;
  bool _isGoogleSynced = true;
  final GlobalKey _createSectionKey = GlobalKey();
  final GlobalKey _eventsSectionKey = GlobalKey();
  final ScrollController _scrollController = ScrollController();
  String _activeTab = 'Create';
  bool _isAutoScrolling = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _urlController.dispose();
    _titleController.dispose();
    _descController.dispose();
    _locController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isAutoScrolling || !mounted || !_scrollController.hasClients) return;

    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentPixels = _scrollController.position.pixels;

    final eventsCtx = _eventsSectionKey.currentContext;
    double? eventsY;
    if (eventsCtx != null) {
      final box = eventsCtx.findRenderObject() as RenderBox?;
      if (box != null && box.hasSize) {
        eventsY = box.localToGlobal(Offset.zero).dy;
      }
    }

    final screenHeight = MediaQuery.of(context).size.height;

    final targetTab = ((maxScroll > 0 && currentPixels >= maxScroll - 80) ||
            (eventsY != null && eventsY <= screenHeight * 0.65))
        ? 'Events'
        : 'Create';
    if (targetTab != _activeTab) {
      setState(() => _activeTab = targetTab);
    }
  }

  void _scrollTo(GlobalKey key, String tabLabel) {
    setState(() => _activeTab = tabLabel);
    _isAutoScrolling = true;
    final context = key.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      ).then((_) {
        Future.delayed(const Duration(milliseconds: 100), () {
          if (mounted) _isAutoScrolling = false;
        });
      });
    } else {
      _isAutoScrolling = false;
    }
  }

  Future<void> _handleExtractUrl() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;

    final extracted = await ref.read(eventsNotifierProvider.notifier).extractUrlMetadata(url);
    if (extracted != null && mounted) {
      setState(() {
        if (extracted['title'] != null) _titleController.text = extracted['title']!;
        if (extracted['description'] != null) _descController.text = extracted['description']!;
        if (extracted['location'] != null) _locController.text = extracted['location']!;
      });

      AppToast.show(context, '${context.tr('extractedPrefix')}${extracted['title']}', type: ToastType.info);
    }
  }

  Future<void> _handleCreateEvent() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      AppToast.show(context, context.tr('pleaseEnterEventTitle'));
      return;
    }

    final start = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
      _startTime.hour,
      _startTime.minute,
    );
    final end = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
      _endTime.hour,
      _endTime.minute,
    );

    await ref.read(eventsNotifierProvider.notifier).createEvent(
          title: title,
          description: _descController.text.trim().isEmpty ? null : _descController.text.trim(),
          eventUrl: _urlController.text.trim().isEmpty ? null : _urlController.text.trim(),
          location: _locController.text.trim().isEmpty ? null : _locController.text.trim(),
          startTime: start,
          endTime: end,
          contactId: _selectedContactId,
          contactName: _selectedContactName,
          notificationEnabled: _notificationEnabled,
          isGoogleSynced: _isGoogleSynced,
        );

    // Clear form
    _urlController.clear();
    _titleController.clear();
    _descController.clear();
    _locController.clear();
    setState(() {
      _selectedContactId = null;
      _selectedContactName = null;
    });

    if (mounted) {
      final successMsg = context.isJapanese
          ? 'イベント「$title」が正常に作成されました！'
          : 'Event "$title" created successfully!';
      AppToast.show(context, successMsg, type: ToastType.success);
      _scrollTo(_eventsSectionKey, 'Events');
    }
  }

  InputDecoration _inputDecoration(BuildContext context, String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: AppTypography.bodySm
          .copyWith(color: context.colors.onSurfaceVariant.withValues(alpha: 0.6)),
      filled: true,
      fillColor: context.colors.surface.withValues(alpha: 0.25),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: context.colors.glassBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: context.colors.glassBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: context.colors.primary),
      ),
    );
  }

  String _getMonthShort(BuildContext context, int month) {
    final isJa = Localizations.localeOf(context).languageCode == 'ja';
    if (isJa) return '$month月';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[(month - 1).clamp(0, 11)];
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(eventsNotifierProvider);
    final authState = ref.watch(authProvider);
    final isGuest = authState.user?.isGuest ?? true;
    final contactsList = ref.watch(contactsProvider).contacts;
    final events = state.filteredEvents;

    return Stack(
      children: [
        SingleChildScrollView(
          controller: _scrollController,
          padding: EdgeInsets.only(
            top: Responsive.topPadding(context),
            left: Responsive.pagePadding(context),
            right: Responsive.pagePadding(context),
            bottom: 120,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Page Heading (Standardized) ──
                  if (!Responsive.hasShellTopBar(context)) ...[
                    PopInItem(
                      index: 0,
                      child: Center(
                        child: Text(
                          context.l10n.events,
                          style: AppTypography.headlineMd,
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Trial Banner (Shows when not signed in) ──
                  if (isGuest) ...[
                    const PopInItem(
                      index: 1,
                      child: TrialBannerCard(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Smart Event Creator GlassCard ──
                  SectionHeader(
                    icon: Icons.add_circle_outline_rounded,
                    label: context.tr('createEvent'),
                    color: context.colors.primary,
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    key: _createSectionKey,
                    index: isGuest ? 2 : 1,
                    child: GlassCard(
                  borderRadius: BorderRadius.circular(20),
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('smartEventCreator'),
                        style: AppTypography.headlineSm.copyWith(fontSize: 17),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        context.tr('smartEventDesc'),
                        style: AppTypography.bodySm.copyWith(
                          color: context.colors.onSurfaceVariant.withValues(alpha: 0.8),
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Event URL Input + Extract Button
                      LayoutBuilder(builder: (context, constraints) {
                        final isNarrow = constraints.maxWidth < 550;
                        return isNarrow
                            ? Column(
                                children: [
                                  TextField(
                                    controller: _urlController,
                                    style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                                    decoration: _inputDecoration(
                                      context,
                                      context.tr('pasteEventUrl'),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  SizedBox(
                                    width: double.infinity,
                                    child: GradientButton(
                                      label: context.tr('extractDetails'),
                                      icon: Icons.auto_awesome_rounded,
                                      isLoading: state.isExtracting,
                                      height: 44,
                                      onPressed: _handleExtractUrl,
                                    ),
                                  ),
                                ],
                              )
                            : Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _urlController,
                                      style: AppTypography.bodySm
                                          .copyWith(color: context.colors.onSurface),
                                      decoration: _inputDecoration(
                                        context,
                                        context.tr('pasteEventUrl'),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  GradientButton(
                                    label: context.tr('extractDetails'),
                                    icon: Icons.auto_awesome_rounded,
                                    isLoading: state.isExtracting,
                                    height: 44,
                                    maxWidth: 170,
                                    onPressed: _handleExtractUrl,
                                  ),
                                ],
                              );
                      }),

                      // Extracted Preview Banner
                      if (state.extractedUrlData != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: context.colors.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: context.colors.primary.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.check_circle_rounded,
                                  color: context.colors.primary, size: 18),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  '${context.tr('aiExtracted')}: ${state.extractedUrlData!['title']}',
                                  style: AppTypography.bodySm.copyWith(
                                    color: context.colors.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.close_rounded, size: 16),
                                visualDensity: VisualDensity.compact,
                                onPressed: () => ref
                                    .read(eventsNotifierProvider.notifier)
                                    .clearExtractedData(),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 18),
                      const Divider(height: 1, color: Colors.white12),
                      const SizedBox(height: 18),

                      // Title Field
                      Text(context.tr('eventTitleRequired'),
                          style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _titleController,
                        style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                        decoration: _inputDecoration(context, context.tr('eventTitleHint')),
                      ),
                      const SizedBox(height: 14),

                      // Description Field
                      Text(context.tr('descriptionNotes'),
                          style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _descController,
                        maxLines: 2,
                        style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                        decoration: _inputDecoration(
                            context, context.tr('notesHint')),
                      ),
                      const SizedBox(height: 14),

                      // Date & Time Row
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(context.tr('date'),
                                    style: AppTypography.labelSm.copyWith(
                                        color: context.colors.onSurfaceVariant,
                                        fontWeight: FontWeight.w600)),
                                const SizedBox(height: 6),
                                InkWell(
                                  onTap: () async {
                                    final picked = await showDatePicker(
                                      context: context,
                                      initialDate: _selectedDate,
                                      firstDate: DateTime(2020),
                                      lastDate: DateTime(2035),
                                    );
                                    if (picked != null) setState(() => _selectedDate = picked);
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: context.colors.surface.withValues(alpha: 0.25),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: context.colors.glassBorder),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          '${_selectedDate.month}/${_selectedDate.day}/${_selectedDate.year}',
                                          style: AppTypography.bodySm
                                              .copyWith(color: context.colors.onSurface),
                                        ),
                                        Icon(Icons.calendar_today_rounded,
                                            size: 16, color: context.colors.primary),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(context.tr('timeRange'),
                                    style: AppTypography.labelSm.copyWith(
                                        color: context.colors.onSurfaceVariant,
                                        fontWeight: FontWeight.w600)),
                                const SizedBox(height: 6),
                                InkWell(
                                  onTap: () async {
                                    final picked = await showTimePicker(
                                      context: context,
                                      initialTime: _startTime,
                                    );
                                    if (picked != null) {
                                      setState(() {
                                        _startTime = picked;
                                        _endTime = TimeOfDay(
                                          hour: (picked.hour + 1) % 24,
                                          minute: picked.minute,
                                        );
                                      });
                                    }
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: context.colors.surface.withValues(alpha: 0.25),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: context.colors.glassBorder),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          '${_startTime.format(context)} - ${_endTime.format(context)}',
                                          style: AppTypography.bodySm
                                              .copyWith(color: context.colors.onSurface),
                                        ),
                                        Icon(Icons.access_time_rounded,
                                            size: 16, color: context.colors.primary),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Location Field
                      Text(context.tr('locationPlatform'),
                          style: AppTypography.labelSm.copyWith(
                              color: context.colors.onSurfaceVariant,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _locController,
                        style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                        decoration: _inputDecoration(
                            context, context.tr('locationHint')),
                      ),
                      const SizedBox(height: 14),

                      // Link to Contact
                      if (contactsList.isNotEmpty) ...[
                        Text(context.tr('associatedContact'),
                            style: AppTypography.labelSm.copyWith(
                                color: context.colors.onSurfaceVariant,
                                fontWeight: FontWeight.w600)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: context.colors.surface.withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: context.colors.glassBorder),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedContactId,
                              isExpanded: true,
                              hint: Text(context.tr('selectContact'),
                                  style: AppTypography.bodySm.copyWith(
                                      color: context.colors.onSurfaceVariant
                                          .withValues(alpha: 0.6))),
                              dropdownColor: context.colors.surface,
                              items: [
                                DropdownMenuItem<String>(
                                  value: null,
                                  child: Text(context.tr('noneGeneralEvent'),
                                      style: AppTypography.bodySm
                                          .copyWith(color: context.colors.onSurfaceVariant)),
                                ),
                                ...contactsList.map((c) {
                                  return DropdownMenuItem<String>(
                                    value: c.id,
                                    child: Text('${c.name} (${c.company ?? 'Contact'})',
                                        style: AppTypography.bodySm
                                            .copyWith(color: context.colors.onSurface)),
                                  );
                                }),
                              ],
                              onChanged: (val) {
                                setState(() {
                                  _selectedContactId = val;
                                  if (val != null) {
                                    _selectedContactName =
                                        contactsList.firstWhere((c) => c.id == val).name;
                                  } else {
                                    _selectedContactName = null;
                                  }
                                });
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Switches
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(context.tr('sendNotificationReminder'),
                              style: AppTypography.bodySm
                                  .copyWith(color: context.colors.onSurface)),
                          Switch(
                            value: _notificationEnabled,
                            activeThumbColor: context.colors.primary,
                            onChanged: (v) => setState(() => _notificationEnabled = v),
                          ),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(context.tr('syncWithGoogleCalendar'),
                              style: AppTypography.bodySm
                                  .copyWith(color: context.colors.onSurface)),
                          Switch(
                            value: _isGoogleSynced,
                            activeThumbColor: context.colors.primary,
                            onChanged: (v) => setState(() => _isGoogleSynced = v),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Submit Button
                      Align(
                        alignment: Alignment.centerRight,
                        child: GradientButton(
                          label: context.tr('createEvent'),
                          icon: Icons.add_rounded,
                          height: 46,
                          maxWidth: 180,
                          onPressed: _handleCreateEvent,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 60),

              // ── Your Events Section ──
              PopInItem(
                key: _eventsSectionKey,
                index: 2,
                child: Column(
                  children: [
                    SectionHeader(
                      icon: Icons.event_rounded,
                      label: context.tr('yourEvents'),
                      color: const Color(0xFF8B5CF6),
                    ),
                    const SizedBox(height: 20),

                    // Search & Filters Row
                    LayoutBuilder(builder: (context, constraints) {
                      final isNarrow = constraints.maxWidth < 600;
                      return isNarrow
                          ? Column(
                              children: [
                                TextField(
                                  controller: _searchController,
                                  style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                                  decoration: InputDecoration(
                                    hintText: context.tr('searchEvents'),
                                    hintStyle: AppTypography.bodySm.copyWith(
                                        color: context.colors.onSurfaceVariant.withValues(alpha: 0.6)),
                                    prefixIcon: Icon(Icons.search_rounded,
                                        color: context.colors.onSurfaceVariant, size: 18),
                                    filled: true,
                                    fillColor: context.colors.surface.withValues(alpha: 0.25),
                                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(color: context.colors.glassBorder),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(color: context.colors.glassBorder),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(color: context.colors.primary),
                                    ),
                                  ),
                                  onChanged: (q) =>
                                      ref.read(eventsNotifierProvider.notifier).setSearchQuery(q),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: ['all', 'upcoming', 'past'].map((tab) {
                                    final isSel = state.filter == tab;
                                    final tabLabel = tab == 'all'
                                        ? context.tr('filterAll')
                                        : tab == 'upcoming'
                                            ? context.tr('filterUpcoming')
                                            : context.tr('filterPast');
                                    return Padding(
                                      padding: const EdgeInsets.only(right: 8),
                                      child: AppFilterChip(
                                        label: tabLabel,
                                        selected: isSel,
                                        onSelected: (_) =>
                                            ref.read(eventsNotifierProvider.notifier).setFilter(tab),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],
                            )
                          : Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _searchController,
                                    style: AppTypography.bodySm
                                        .copyWith(color: context.colors.onSurface),
                                    decoration: InputDecoration(
                                      hintText: context.tr('eventSearchHint'),
                                      hintStyle: AppTypography.bodySm.copyWith(
                                          color: context.colors.onSurfaceVariant
                                              .withValues(alpha: 0.6)),
                                      prefixIcon: Icon(Icons.search_rounded,
                                          color: context.colors.onSurfaceVariant, size: 18),
                                      filled: true,
                                      fillColor: context.colors.surface.withValues(alpha: 0.25),
                                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(color: context.colors.glassBorder),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(color: context.colors.glassBorder),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(color: context.colors.primary),
                                      ),
                                    ),
                                    onChanged: (q) =>
                                        ref.read(eventsNotifierProvider.notifier).setSearchQuery(q),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Row(
                                  children: ['all', 'upcoming', 'past'].map((tab) {
                                    final isSel = state.filter == tab;
                                    final tabLabel = tab == 'all'
                                        ? context.tr('filterAll')
                                        : tab == 'upcoming'
                                            ? context.tr('filterUpcoming')
                                            : context.tr('filterPast');
                                    return Padding(
                                      padding: const EdgeInsets.only(left: 8),
                                      child: AppFilterChip(
                                        label: tabLabel,
                                        selected: isSel,
                                        onSelected: (_) =>
                                            ref.read(eventsNotifierProvider.notifier).setFilter(tab),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],
                            );
                    }),
                    const SizedBox(height: 18),

                    // Event Cards Grid / List
                    if (events.isEmpty) ...[
                      GlassCard(
                        borderRadius: BorderRadius.circular(20),
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(
                                Icons.event_busy_rounded,
                                size: 48,
                                color: context.colors.onSurfaceVariant.withValues(alpha: 0.4),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                context.tr('noEventsFound'),
                                style: AppTypography.bodyMd
                                    .copyWith(color: context.colors.onSurfaceVariant),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                context.tr('noEventsDesc'),
                                style: AppTypography.bodySm.copyWith(
                                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.7)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ] else ...[
                      ...events.map((event) {
                        return _buildEventCard(context, event);
                      }),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    ),

    // ── Floating Liquid Glass Bottom Navigation Bar ──
    FloatingLiquidGlassNavBar(
        activeTabLabel: _activeTab,
        items: [
          FloatingNavItem(
            id: 'Create',
            label: context.tr('create'),
            icon: Icons.add_circle_outline,
            activeIcon: Icons.add_circle_rounded,
            onTap: () => _scrollTo(_createSectionKey, 'Create'),
          ),
          FloatingNavItem(
            id: 'Events',
            label: context.l10n.events,
            icon: Icons.event_outlined,
            activeIcon: Icons.event_rounded,
            onTap: () => _scrollTo(_eventsSectionKey, 'Events'),
          ),
        ],
      ),
    ],
  );
  }

  String _cleanLocationName(String loc) {
    if (loc.contains('meet.google.com')) return 'Google Meet';
    if (loc.contains('zoom.us') || loc.contains('zoom.com')) return context.tr('zoomMeeting');
    if (loc.contains('teams.microsoft.com')) return 'Microsoft Teams';
    if (loc.contains('luma.com') || loc.contains('lu.ma')) return context.tr('lumaEvent');
    if (loc.startsWith('http')) return context.tr('onlineMeeting');
    return loc;
  }

  Widget _buildEventCard(BuildContext context, SmartEventItem event) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: context.colors.surface.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: context.colors.glassBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 3D Date Block (Matching EventCardLuma)
                Container(
                  width: 58,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        context.colors.primary.withValues(alpha: 0.28),
                        context.colors.primary.withValues(alpha: 0.08),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: context.colors.primary.withValues(alpha: 0.35),
                      width: 1.0,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _getMonthShort(context, event.startTime.month),
                        style: AppTypography.labelCaps.copyWith(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: context.colors.primary,
                        ),
                      ),
                      Text(
                        '${event.startTime.day}',
                        style: AppTypography.statsNumber.copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: context.colors.primary,
                          height: 1.05,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),

                // Title and Status
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event.title,
                        style: AppTypography.bodyMd.copyWith(
                          fontWeight: FontWeight.bold,
                          color: context.colors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          if (event.isToday)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFF34D399)),
                              ),
                              child: Text(
                                context.tr('today').toUpperCase(),
                                style: AppTypography.labelSm.copyWith(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF34D399),
                                ),
                              ),
                            )
                          else if (event.isUpcoming)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: context.colors.primary.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: context.colors.primary.withValues(alpha: 0.4)),
                              ),
                              child: Text(
                                context.tr('upcoming').toUpperCase(),
                                style: AppTypography.labelSm.copyWith(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: context.colors.primary,
                                ),
                              ),
                            )
                          else
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.grey.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                context.tr('past').toUpperCase(),
                                style: AppTypography.labelSm.copyWith(
                                  fontSize: 9,
                                  color: Colors.grey,
                                ),
                              ),
                            ),
                          if (event.notificationEnabled) ...[
                            const SizedBox(width: 8),
                            Icon(Icons.notifications_active_rounded,
                                size: 13, color: context.colors.primary),
                          ],
                          if (event.isGoogleSynced) ...[
                            const SizedBox(width: 8),
                            Icon(Icons.sync_rounded, size: 13, color: context.colors.primary),
                            Text(' Google',
                                style: AppTypography.labelSm
                                    .copyWith(fontSize: 10, color: context.colors.primary)),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),

                // Delete Action
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.redAccent),
                  tooltip: context.tr('delete'),
                  onPressed: () =>
                      ref.read(eventsNotifierProvider.notifier).deleteEvent(event.id),
                ),
              ],
            ),

            if (event.description != null && event.description!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                event.description!,
                style: AppTypography.bodySm.copyWith(
                  color: context.colors.onSurfaceVariant,
                  fontSize: 12,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],

            const SizedBox(height: 12),
            const Divider(height: 1, color: Colors.white10),
            const SizedBox(height: 10),

            // Meta Row (Time, Location, Contact)
            Wrap(
              spacing: 16,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.access_time_rounded,
                        size: 14, color: context.colors.onSurfaceVariant),
                    const SizedBox(width: 5),
                    Text(
                      event.timeRangeFormatted,
                      style: AppTypography.bodySm.copyWith(
                        fontSize: 11,
                        color: context.colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                if (event.location != null)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        event.location!.startsWith('http')
                            ? Icons.video_camera_front_rounded
                            : Icons.location_on_rounded,
                        size: 14,
                        color: context.colors.primary,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        _cleanLocationName(event.location!),
                        style: AppTypography.bodySm.copyWith(
                          fontSize: 11,
                          color: event.location!.startsWith('http')
                              ? context.colors.primary
                              : context.colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                if (event.contactName != null)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.person_outline_rounded,
                          size: 14, color: context.colors.onSurfaceVariant),
                      const SizedBox(width: 5),
                      Text(
                        '${event.contactName}${event.contactCompany != null ? ' (${event.contactCompany})' : ''}',
                        style: AppTypography.bodySm.copyWith(
                          fontSize: 11,
                          color: context.colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
            if (event.location?.startsWith('http') == true) ...[
              const SizedBox(height: 16),
              GradientButton(
                label: context.tr('joinMeeting'),
                icon: Icons.open_in_new_rounded,
                height: 44,
                maxWidth: 180,
                onPressed: () {
                  final uri = Uri.tryParse(event.location!);
                  if (uri != null) launchUrl(uri);
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
