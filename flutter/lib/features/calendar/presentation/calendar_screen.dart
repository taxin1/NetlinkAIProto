import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/animated_glass_icon_button.dart';
import '../../../core/widgets/app_filter_chip.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/scrollable_list_window.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/utils/responsive.dart';
import '../../auth/providers/auth_provider.dart';
import '../../contacts/providers/contacts_provider.dart';
import '../providers/calendar_provider.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  static const _categories = ['All', 'Meeting', 'Networking', 'Call'];
  final ScrollController _eventsScrollController = ScrollController();

  @override
  void dispose() {
    _eventsScrollController.dispose();
    super.dispose();
  }

  List<String> _getWeekDays(BuildContext context) {
    return [
      context.tr('weekDaysSun'),
      context.tr('weekDaysMon'),
      context.tr('weekDaysTue'),
      context.tr('weekDaysWed'),
      context.tr('weekDaysThu'),
      context.tr('weekDaysFri'),
      context.tr('weekDaysSat'),
    ];
  }

  String _getCategoryLabel(BuildContext context, String cat) {
    switch (cat) {
      case 'Meeting':
        return context.tr('meetingCategory');
      case 'Networking':
        return context.tr('networkingCategory');
      case 'Call':
        return context.tr('callCategory');
      case 'Workshop':
        return context.tr('workshopCategory');
      case 'All':
        return context.tr('allCategory');
      default:
        return cat;
    }
  }

  String _getMonthName(BuildContext context, int month) {
    final isJa = Localizations.localeOf(context).languageCode == 'ja';
    if (isJa) return '$month月';
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[(month - 1).clamp(0, 11)];
  }

  void _showAddEventSheet(BuildContext context, {DateTime? initialDate}) {
    final state = ref.read(calendarNotifierProvider);
    final targetDate = initialDate ?? state.selectedDate;

    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final locCtrl = TextEditingController();

    DateTime selectedDate = targetDate;
    TimeOfDay startTime = const TimeOfDay(hour: 10, minute: 0);
    TimeOfDay endTime = const TimeOfDay(hour: 11, minute: 0);
    String selectedCategory = 'Meeting';
    String? selectedContactId;
    String? selectedContactName;
    bool notificationEnabled = true;
    bool isGoogleSynced = state.isGoogleCalendarConnected;

    final contactsState = ref.read(contactsProvider);
    final contactsList = contactsState.contacts;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Container(
              margin: EdgeInsets.only(
                top: 40,
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: context.colors.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: context.colors.glassBorder),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(context.tr('scheduleNewEvent'),
                              style: AppTypography.headlineSm.copyWith(fontSize: 18)),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.of(ctx).pop(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Title
                    Text(context.tr('eventTitleRequired'),
                        style: AppTypography.labelSm.copyWith(
                            color: context.colors.onSurfaceVariant, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: titleCtrl,
                      style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                      decoration: _inputDecoration(context, 'e.g. Partnership Discussion with Sarah'),
                    ),
                    const SizedBox(height: 14),

                    // Category Selector
                    Text(context.tr('category'),
                        style: AppTypography.labelSm.copyWith(
                            color: context.colors.onSurfaceVariant, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: ['Meeting', 'Networking', 'Call', 'Workshop'].map((cat) {
                        final isSel = selectedCategory == cat;
                        return GestureDetector(
                          onTap: () => setSheetState(() => selectedCategory = cat),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSel
                                  ? context.colors.primary.withValues(alpha: 0.2)
                                  : context.colors.surface.withValues(alpha: 0.3),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSel ? context.colors.primary : context.colors.glassBorder,
                                width: isSel ? 1.5 : 1.0,
                              ),
                            ),
                            child: Text(
                              _getCategoryLabel(context, cat),
                              style: AppTypography.bodySm.copyWith(
                                color: isSel ? context.colors.primary : context.colors.onSurface,
                                fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 14),

                    // Date & Times Row
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isCompact = constraints.maxWidth < 360;

                        final dateWidget = Column(
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
                                  initialDate: selectedDate,
                                  firstDate: DateTime(2020),
                                  lastDate: DateTime(2035),
                                );
                                if (picked != null) {
                                  setSheetState(() => selectedDate = picked);
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
                                    Expanded(
                                      child: Text(
                                        '${selectedDate.month}/${selectedDate.day}/${selectedDate.year}',
                                        style: AppTypography.bodySm
                                            .copyWith(color: context.colors.onSurface),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Icon(Icons.calendar_month,
                                        size: 16, color: context.colors.primary),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        );

                        final timeWidget = Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(context.tr('timeRange'),
                                style: AppTypography.labelSm.copyWith(
                                    color: context.colors.onSurfaceVariant,
                                    fontWeight: FontWeight.w600)),
                            const SizedBox(height: 6),
                            InkWell(
                              onTap: () async {
                                final pickedStart = await showTimePicker(
                                  context: context,
                                  initialTime: startTime,
                                );
                                if (pickedStart != null) {
                                  setSheetState(() {
                                    startTime = pickedStart;
                                    endTime = TimeOfDay(
                                      hour: (pickedStart.hour + 1) % 24,
                                      minute: pickedStart.minute,
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
                                    Expanded(
                                      child: FittedBox(
                                        fit: BoxFit.scaleDown,
                                        alignment: Alignment.centerLeft,
                                        child: Text(
                                          '${startTime.format(context)} - ${endTime.format(context)}',
                                          style: AppTypography.bodySm
                                              .copyWith(color: context.colors.onSurface),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Icon(Icons.access_time_rounded,
                                        size: 16, color: context.colors.primary),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        );

                        if (isCompact) {
                          return Column(
                            children: [
                              dateWidget,
                              const SizedBox(height: 12),
                              timeWidget,
                            ],
                          );
                        }

                        return Row(
                          children: [
                            Expanded(child: dateWidget),
                            const SizedBox(width: 12),
                            Expanded(child: timeWidget),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 14),

                    // Location or Meeting Link
                    Text(context.tr('locationPlatform'),
                        style: AppTypography.labelSm.copyWith(
                            color: context.colors.onSurfaceVariant, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: locCtrl,
                      style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                      decoration: _inputDecoration(
                          context, context.tr('locationHint')),
                    ),
                    const SizedBox(height: 14),

                    // Description
                    Text(context.tr('descriptionNotes'),
                        style: AppTypography.labelSm.copyWith(
                            color: context.colors.onSurfaceVariant, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: descCtrl,
                      maxLines: 2,
                      style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                      decoration: _inputDecoration(
                          context, context.tr('notesHint')),
                    ),
                    const SizedBox(height: 14),

                    // Link Contact Dropdown
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
                            value: selectedContactId,
                            isExpanded: true,
                            hint: Text(context.tr('selectContact'),
                                style: AppTypography.bodySm.copyWith(
                                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.6))),
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
                              setSheetState(() {
                                selectedContactId = val;
                                if (val != null) {
                                  selectedContactName =
                                      contactsList.firstWhere((c) => c.id == val).name;
                                } else {
                                  selectedContactName = null;
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
                        Expanded(
                          child: Text(context.tr('sendNotificationReminder'),
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface)),
                        ),
                        const SizedBox(width: 8),
                        Switch(
                          value: notificationEnabled,
                          activeThumbColor: context.colors.primary,
                          onChanged: (v) => setSheetState(() => notificationEnabled = v),
                        ),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(context.tr('syncWithGoogleCalendar'),
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface)),
                        ),
                        const SizedBox(width: 8),
                        Switch(
                          value: isGoogleSynced,
                          activeThumbColor: context.colors.primary,
                          onChanged: (v) => setSheetState(() => isGoogleSynced = v),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Submit CTA
                    SizedBox(
                      width: double.infinity,
                      child: GradientButton(
                        label: context.tr('scheduleEvent'),
                        icon: Icons.check_circle_rounded,
                        height: 48,
                        onPressed: () async {
                          if (titleCtrl.text.trim().isEmpty) return;
                          Navigator.of(ctx).pop();

                          final start = DateTime(
                            selectedDate.year,
                            selectedDate.month,
                            selectedDate.day,
                            startTime.hour,
                            startTime.minute,
                          );
                          final end = DateTime(
                            selectedDate.year,
                            selectedDate.month,
                            selectedDate.day,
                            endTime.hour,
                            endTime.minute,
                          );

                          await ref.read(calendarNotifierProvider.notifier).addEvent(
                                title: titleCtrl.text.trim(),
                                description: descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
                                startTime: start,
                                endTime: end,
                                location: locCtrl.text.trim().isEmpty ? null : locCtrl.text.trim(),
                                category: selectedCategory,
                                contactId: selectedContactId,
                                contactName: selectedContactName,
                                isGoogleSynced: isGoogleSynced,
                              );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
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

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(calendarNotifierProvider);
    final authState = ref.watch(authProvider);
    final isGuest = authState.user?.isGuest ?? true;
    final currentMonth = state.currentMonth;
    final selectedDate = state.selectedDate;

    // Calculate 42 days for calendar grid (6 weeks x 7 days)
    final firstDayOfMonth = DateTime(currentMonth.year, currentMonth.month, 1);
    final daysBeforeMonth = firstDayOfMonth.weekday % 7; // Sunday = 0
    final calendarStart = firstDayOfMonth.subtract(Duration(days: daysBeforeMonth));
    final calendarDays = List.generate(42, (idx) => calendarStart.add(Duration(days: idx)));

    final dayEvents = state.eventsForSelectedDay;
    final reminders = state.upcomingReminders;

    return SingleChildScrollView(
      padding: EdgeInsets.only(
        top: Responsive.topPadding(context),
        left: Responsive.pagePadding(context),
        right: Responsive.pagePadding(context),
        bottom: 40,
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
                      context.tr('calendar'),
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

              // ── Google Calendar Warning Banner (Only when not connected, like TrialBannerCard) ──
              if (!state.isGoogleCalendarConnected) ...[
                PopInItem(
                  index: isGuest ? 2 : 1,
                  child: GlassCard(
                    borderRadius: BorderRadius.circular(16),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    glowColor: context.colors.primary.withValues(alpha: 0.15),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline_rounded, color: context.colors.primary, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            context.tr('googleCalendarNotConnectedAlert'),
                            style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () {
                            context.go('${AppRoutes.settings}?section=integrations');
                          },
                          child: Text(
                            context.tr('connect'),
                            style: AppTypography.bodySm.copyWith(
                              color: context.colors.primary,
                              fontWeight: FontWeight.w700,
                              decoration: TextDecoration.underline,
                              decorationColor: context.colors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 18),
              ],

              // ── Meeting Reminders Alert ──
              if (reminders.isNotEmpty) ...[
                PopInItem(
                  index: 2,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 18),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          context.colors.primary.withValues(alpha: 0.18),
                          context.colors.primary.withValues(alpha: 0.06),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.colors.primary.withValues(alpha: 0.35)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${context.tr('upcomingMeetingSoon')} ${reminders.first.title}',
                                style: AppTypography.bodyMd.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: context.colors.onSurface,
                                ),
                              ),
                              Text(
                                '${reminders.first.timeRangeFormatted} • ${reminders.first.location ?? context.tr('onlineConference')}',
                                style: AppTypography.bodySm.copyWith(
                                  color: context.colors.onSurfaceVariant,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (reminders.first.location?.startsWith('http') == true)
                          GradientButton(
                            label: context.tr('join'),
                            icon: Icons.video_call_rounded,
                            height: 36,
                            maxWidth: 100,
                            onPressed: () {
                              final uri = Uri.tryParse(reminders.first.location!);
                              if (uri != null) launchUrl(uri);
                            },
                          ),
                      ],
                    ),
                  ),
                ),
              ],

              // ── Month Calendar Grid GlassCard ──
              SectionHeader(
                icon: Icons.calendar_month_rounded,
                label: context.tr('monthlySchedule'),
                color: context.colors.primary,
              ),
              const SizedBox(height: 16),
              PopInItem(
                index: 3,
                child: GlassCard(
                  borderRadius: BorderRadius.circular(20),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      // Month Selector Row
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final isNarrow = constraints.maxWidth < 560;
                          final addEventBtn = AnimatedGlassIconButton(
                            label: context.tr('scheduleEvent'),
                            icon: Icons.add_rounded,
                            size: 32,
                            iconSize: 15,
                            fontSize: 12,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            iconColor: context.colors.primary,
                            onPressed: () => _showAddEventSheet(context),
                          );

                          if (isNarrow) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '${_getMonthName(context, currentMonth.month)} ${currentMonth.year}',
                                        style: AppTypography.headlineSm.copyWith(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: context.colors.onSurface,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Row(
                                      children: [
                                        TextButton(
                                          onPressed: () => ref
                                              .read(calendarNotifierProvider.notifier)
                                              .jumpToToday(),
                                          style: TextButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            visualDensity: VisualDensity.compact,
                                          ),
                                          child: Text(context.tr('today'),
                                              style: AppTypography.labelSm
                                                  .copyWith(color: context.colors.primary)),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.chevron_left_rounded),
                                          visualDensity: VisualDensity.compact,
                                          onPressed: () => ref
                                              .read(calendarNotifierProvider.notifier)
                                              .changeMonth(-1),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.chevron_right_rounded),
                                          visualDensity: VisualDensity.compact,
                                          onPressed: () => ref
                                              .read(calendarNotifierProvider.notifier)
                                              .changeMonth(1),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: addEventBtn,
                                ),
                              ],
                            );
                          }

                          return Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  '${_getMonthName(context, currentMonth.month)} ${currentMonth.year}',
                                  style: AppTypography.headlineSm.copyWith(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: context.colors.onSurface,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Row(
                                children: [
                                  TextButton(
                                    onPressed: () => ref
                                        .read(calendarNotifierProvider.notifier)
                                        .jumpToToday(),
                                    style: TextButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      visualDensity: VisualDensity.compact,
                                    ),
                                    child: Text(context.tr('today'),
                                        style: AppTypography.labelSm
                                            .copyWith(color: context.colors.primary)),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.chevron_left_rounded),
                                    visualDensity: VisualDensity.compact,
                                    onPressed: () => ref
                                        .read(calendarNotifierProvider.notifier)
                                        .changeMonth(-1),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.chevron_right_rounded),
                                    visualDensity: VisualDensity.compact,
                                    onPressed: () => ref
                                        .read(calendarNotifierProvider.notifier)
                                        .changeMonth(1),
                                  ),
                                  const SizedBox(width: 8),
                                  addEventBtn,
                                ],
                              ),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 14),

                      // Weekdays Header
                      Row(
                        children: _getWeekDays(context).map((wd) {
                          return Expanded(
                            child: Center(
                              child: Text(
                                wd,
                                style: AppTypography.labelSm.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 10),
                      const Divider(height: 1, color: Colors.white12),
                      const SizedBox(height: 10),

                      // 42-day Calendar Grid (Constant height on desktop, tablet, and mobile)
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: 42,
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 7,
                          mainAxisSpacing: 6,
                          crossAxisSpacing: 6,
                          mainAxisExtent: 48,
                        ),
                        itemBuilder: (context, index) {
                          final date = calendarDays[index];
                          final isCurrentMonth = date.month == currentMonth.month;
                          final isSelected = date.year == selectedDate.year &&
                              date.month == selectedDate.month &&
                              date.day == selectedDate.day;

                          final now = DateTime.now();
                          final isToday = date.year == now.year &&
                              date.month == now.month &&
                              date.day == now.day;

                          // Find events on this day
                          final dayEventsList =
                              state.events.where((e) => e.isSameDay(date)).toList();

                          return GestureDetector(
                            onTap: () {
                              ref.read(calendarNotifierProvider.notifier).selectDate(date);
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? context.colors.primary
                                    : (isToday
                                        ? context.colors.primary.withValues(alpha: 0.12)
                                        : Colors.transparent),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSelected
                                      ? context.colors.primary
                                      : (isToday
                                          ? context.colors.primary.withValues(alpha: 0.6)
                                          : Colors.transparent),
                                  width: isSelected ? 1.5 : 1.0,
                                ),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    '${date.day}',
                                    style: AppTypography.bodySm.copyWith(
                                      fontWeight: isSelected || isToday
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                      color: isSelected
                                          ? context.colors.onPrimary
                                          : (isToday
                                              ? context.colors.primary
                                              : (isCurrentMonth
                                                  ? context.colors.onSurface
                                                  : context.colors.onSurfaceVariant
                                                      .withValues(alpha: 0.35))),
                                      fontSize: 12,
                                    ),
                                  ),
                                  if (dayEventsList.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: dayEventsList.take(3).map((e) {
                                        Color dotColor = isSelected
                                            ? context.colors.onPrimary
                                            : context.colors.primary;
                                        if (!isSelected && e.category == 'Networking') {
                                          dotColor = Colors.purpleAccent;
                                        } else if (!isSelected && e.category == 'Call') {
                                          dotColor = Colors.greenAccent;
                                        }
                                        return Container(
                                          margin: const EdgeInsets.symmetric(horizontal: 1.5),
                                          width: 5,
                                          height: 5,
                                          decoration: BoxDecoration(
                                            color: dotColor,
                                            shape: BoxShape.circle,
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

              // ── Day Schedule Agenda GlassCard ──
              SectionHeader(
                icon: Icons.event_note_rounded,
                label: context.tr('eventsAndAgenda'),
                color: const Color(0xFF10B981),
              ),
              const SizedBox(height: 16),
              PopInItem(
                index: 4,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: GlassCard(
                    borderRadius: BorderRadius.circular(20),
                    padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header with Date and Filters
                      LayoutBuilder(builder: (context, constraints) {
                        final isNarrow = constraints.maxWidth < 760;
                        return isNarrow
                            ? Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Wrap(
                                    crossAxisAlignment: WrapCrossAlignment.center,
                                    spacing: 8,
                                    runSpacing: 4,
                                    children: [
                                      Text(
                                        '${_getMonthName(context, selectedDate.month)} ${selectedDate.day}, ${selectedDate.year}',
                                        style: AppTypography.headlineSm.copyWith(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: context.colors.primary.withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          '${dayEvents.length} ${context.tr('eventsCount')}',
                                          style: AppTypography.labelSm.copyWith(
                                            fontSize: 11,
                                            color: context.colors.primary,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  SingleChildScrollView(
                                    scrollDirection: Axis.horizontal,
                                    child: Row(
                                      children: _categories.map((cat) {
                                        final isSel = state.categoryFilter == cat;
                                        return Padding(
                                          padding: const EdgeInsets.only(right: 8),
                                          child: AppFilterChip(
                                            label: _getCategoryLabel(context, cat),
                                            selected: isSel,
                                            onSelected: (_) => ref
                                                .read(calendarNotifierProvider.notifier)
                                                .setCategoryFilter(cat),
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ),
                                ],
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        '${_getMonthName(context, selectedDate.month)} ${selectedDate.day}, ${selectedDate.year}',
                                        style: AppTypography.headlineSm.copyWith(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: context.colors.primary.withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          '${dayEvents.length} ${context.tr('eventsCount')}',
                                          style: AppTypography.labelSm.copyWith(
                                            fontSize: 11,
                                            color: context.colors.primary,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(width: 12),
                                  Flexible(
                                    child: SingleChildScrollView(
                                      scrollDirection: Axis.horizontal,
                                      child: Row(
                                        children: _categories.map((cat) {
                                          final isSel = state.categoryFilter == cat;
                                          return Padding(
                                            padding: const EdgeInsets.only(left: 6),
                                            child: AppFilterChip(
                                              label: _getCategoryLabel(context, cat),
                                              selected: isSel,
                                              onSelected: (_) => ref
                                                  .read(calendarNotifierProvider.notifier)
                                                  .setCategoryFilter(cat),
                                            ),
                                          );
                                        }).toList(),
                                      ),
                                    ),
                                  ),
                                ],
                              );
                      }),
                      const SizedBox(height: 16),

                      // Day Schedule Items
                      if (dayEvents.isEmpty) ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(Icons.event_available_rounded,
                                    size: 40,
                                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.4)),
                                const SizedBox(height: 10),
                                Text(
                                  context.tr('noEventsScheduled'),
                                  style: AppTypography.bodySm.copyWith(
                                    color: context.colors.onSurfaceVariant,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                TextButton.icon(
                                  onPressed: () =>
                                      _showAddEventSheet(context, initialDate: selectedDate),
                                  icon: const Icon(Icons.add_rounded, size: 16),
                                  label: Text(context.tr('scheduleEvent')),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ] else ...[
                        ScrollableListWindow(
                          controller: _eventsScrollController,
                          maxHeight: MediaQuery.of(context).size.width > 700 ? 460 : 330,
                          child: ListView.builder(
                            controller: _eventsScrollController,
                            shrinkWrap: true,
                            physics: const ClampingScrollPhysics(),
                            padding: EdgeInsets.zero,
                            itemCount: dayEvents.length,
                            itemBuilder: (context, index) {
                                final event = dayEvents[index];
                                return Container(
                                  margin: EdgeInsets.only(
                                    bottom: index == dayEvents.length - 1 ? 0 : 12,
                                  ),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: context.colors.surface.withValues(alpha: 0.25),
                                    borderRadius: BorderRadius.circular(22),
                                    border: Border.all(color: context.colors.glassBorder),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Time Box & Actions Below
                                      Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                            width: 74,
                                            padding: const EdgeInsets.symmetric(vertical: 8),
                                            decoration: BoxDecoration(
                                              color: context.colors.primary.withValues(alpha: 0.12),
                                              borderRadius: BorderRadius.circular(10),
                                              border: Border.all(
                                                  color: context.colors.primary.withValues(alpha: 0.3)),
                                            ),
                                            child: Column(
                                              children: [
                                                Text(
                                                  event.startTime.hour >= 12
                                                      ? '${event.startTime.hour > 12 ? event.startTime.hour - 12 : event.startTime.hour}:${event.startTime.minute.toString().padLeft(2, '0')}'
                                                      : '${event.startTime.hour == 0 ? 12 : event.startTime.hour}:${event.startTime.minute.toString().padLeft(2, '0')}',
                                                  style: AppTypography.statsNumber.copyWith(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                    color: context.colors.primary,
                                                  ),
                                                ),
                                                Text(
                                                  event.startTime.hour >= 12 ? 'PM' : 'AM',
                                                  style: AppTypography.labelSm.copyWith(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                    color: context.colors.primary.withValues(alpha: 0.8),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              if (event.location?.startsWith('http') == true) ...[
                                                IconButton(
                                                  visualDensity: VisualDensity.compact,
                                                  constraints: const BoxConstraints.tightFor(width: 28, height: 28),
                                                  padding: EdgeInsets.zero,
                                                  splashRadius: 16,
                                                  icon: const Icon(Icons.open_in_new_rounded, size: 16),
                                                  color: context.colors.primary,
                                                  tooltip: context.tr('joinMeeting'),
                                                  onPressed: () {
                                                    final uri = Uri.tryParse(event.location!);
                                                    if (uri != null) launchUrl(uri);
                                                  },
                                                ),
                                                const SizedBox(width: 4),
                                              ],
                                              IconButton(
                                                visualDensity: VisualDensity.compact,
                                                constraints: const BoxConstraints.tightFor(width: 28, height: 28),
                                                padding: EdgeInsets.zero,
                                                splashRadius: 16,
                                                icon: const Icon(Icons.delete_outline_rounded,
                                                    size: 16, color: Colors.redAccent),
                                                tooltip: context.tr('delete'),
                                                onPressed: () => ref
                                                    .read(calendarNotifierProvider.notifier)
                                                    .deleteEvent(event.id),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const SizedBox(width: 12),

                                      // Details
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Wrap(
                                              crossAxisAlignment: WrapCrossAlignment.center,
                                              spacing: 6,
                                              runSpacing: 4,
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(
                                                      horizontal: 8, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: event.category == 'Networking'
                                                        ? Colors.purple.withValues(alpha: 0.2)
                                                        : (event.category == 'Call'
                                                            ? Colors.green.withValues(alpha: 0.2)
                                                            : context.colors.primary.withValues(alpha: 0.15)),
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    _getCategoryLabel(context, event.category).toUpperCase(),
                                                    style: AppTypography.labelSm.copyWith(
                                                      fontSize: 9,
                                                      fontWeight: FontWeight.bold,
                                                      color: event.category == 'Networking'
                                                          ? Colors.purpleAccent
                                                          : (event.category == 'Call'
                                                              ? Colors.greenAccent
                                                              : context.colors.primary),
                                                    ),
                                                    overflow: TextOverflow.ellipsis,
                                                    maxLines: 1,
                                                  ),
                                                ),
                                                if (event.isGoogleSynced)
                                                  Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      Icon(Icons.sync_rounded,
                                                          size: 12, color: context.colors.primary),
                                                      Flexible(
                                                        child: Text(
                                                          ' Google',
                                                          style: AppTypography.labelSm.copyWith(
                                                            fontSize: 10,
                                                            color: context.colors.primary,
                                                          ),
                                                          overflow: TextOverflow.ellipsis,
                                                          maxLines: 1,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                              ],
                                            ),
                                            const SizedBox(height: 6),
                                            Text(
                                              event.title,
                                              style: AppTypography.bodyMd.copyWith(
                                                fontWeight: FontWeight.bold,
                                                color: context.colors.onSurface,
                                              ),
                                            ),
                                            if (event.description != null &&
                                                event.description!.isNotEmpty) ...[
                                              const SizedBox(height: 4),
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
                                            if (event.location != null && event.location!.isNotEmpty) ...[
                                              const SizedBox(height: 6),
                                              Row(
                                                children: [
                                                  Icon(
                                                    event.location!.startsWith('http')
                                                        ? Icons.video_camera_front_rounded
                                                        : Icons.location_on_rounded,
                                                    size: 13,
                                                    color: context.colors.primary,
                                                  ),
                                                  const SizedBox(width: 4),
                                                  Expanded(
                                                    child: Text(
                                                      event.location!,
                                                      style: AppTypography.bodySm.copyWith(
                                                        fontSize: 11,
                                                        color: event.location!.startsWith('http')
                                                            ? context.colors.primary
                                                            : context.colors.onSurfaceVariant,
                                                      ),
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                            if (event.contactName != null) ...[
                                              const SizedBox(height: 4),
                                              Row(
                                                children: [
                                                  Icon(Icons.person_outline_rounded,
                                                      size: 13,
                                                      color: context.colors.onSurfaceVariant),
                                                  const SizedBox(width: 4),
                                                  Expanded(
                                                    child: Text(
                                                      '${event.contactName}${event.contactCompany != null ? ' (${event.contactCompany})' : ''}',
                                                      style: AppTypography.bodySm.copyWith(
                                                        fontSize: 11,
                                                        color: context.colors.onSurfaceVariant,
                                                      ),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                    ],
                  ),
                ),
              ),
            ),
          ],
          ),
        ),
      ),
    );
  }
}
