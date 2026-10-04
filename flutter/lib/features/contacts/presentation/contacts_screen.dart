import 'package:flutter/material.dart';
import '../../../core/widgets/app_toast.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/tour/tour_controller.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/contact_model.dart';
import '../providers/contacts_provider.dart';
import '../../../core/localization/app_localizations.dart';

class ContactsScreen extends ConsumerStatefulWidget {
  const ContactsScreen({super.key});

  @override
  ConsumerState<ContactsScreen> createState() => _ContactsScreenState();
}

class _ContactsScreenState extends ConsumerState<ContactsScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showAddContactDialog(BuildContext context) {
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    final phoneController = TextEditingController();
    final companyController = TextEditingController();
    final positionController = TextEditingController();
    final whereMetController = TextEditingController();
    final dateMetController = TextEditingController();
    final notesController = TextEditingController();
    final tagsController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    Future<void> pickDate(BuildContext dialogCtx) async {
      final now = DateTime.now();
      final isLight = Theme.of(dialogCtx).brightness == Brightness.light;
      final picked = await showDatePicker(
        context: dialogCtx,
        initialDate: now,
        firstDate: DateTime(1990),
        lastDate: DateTime(2100),
        builder: (pickerCtx, child) {
          return Theme(
            data: Theme.of(pickerCtx).copyWith(
              colorScheme: isLight
                  ? ColorScheme.light(
                      primary: context.colors.primary,
                      onPrimary: Colors.white,
                      surface: Colors.white,
                      onSurface: const Color(0xFF0F172A),
                    )
                  : ColorScheme.dark(
                      primary: context.colors.primary,
                      onPrimary: Colors.white,
                      surface: const Color(0xFF141724),
                      onSurface: Colors.white,
                    ),
              dialogTheme: DialogThemeData(
                backgroundColor: isLight ? Colors.white : const Color(0xFF0F121E),
              ),
              datePickerTheme: DatePickerThemeData(
                backgroundColor: isLight ? Colors.white : const Color(0xFF0F121E),
                headerBackgroundColor:
                    isLight ? const Color(0xFFF1F5F9) : const Color(0xFF141724),
                headerForegroundColor:
                    isLight ? const Color(0xFF0F172A) : Colors.white,
                surfaceTintColor: Colors.transparent,
                dayForegroundColor: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.selected)) {
                    return Colors.white;
                  }
                  return isLight ? const Color(0xFF0F172A) : Colors.white;
                }),
                dayBackgroundColor: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.selected)) {
                    return context.colors.primary;
                  }
                  return Colors.transparent;
                }),
                todayForegroundColor:
                    WidgetStateProperty.all(context.colors.primary),
                yearForegroundColor: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.selected)) {
                    return Colors.white;
                  }
                  return isLight ? const Color(0xFF0F172A) : Colors.white;
                }),
              ),
            ),
            child: child!,
          );
        },
      );
      if (picked != null) {
        final mm = picked.month.toString().padLeft(2, '0');
        final dd = picked.day.toString().padLeft(2, '0');
        final yyyy = picked.year.toString();
        dateMetController.text = '$mm/$dd/$yyyy';
      }
    }

    Widget buildFormField({
      required String label,
      required Widget field,
    }) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: AppTypography.bodySm.copyWith(
                color: context.colors.onSurface,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 6),
            field,
          ],
        ),
      );
    }

    final isLight = Theme.of(context).brightness == Brightness.light;

    InputDecoration inputDecoration({String? hintText, Widget? suffixIcon}) {
      return InputDecoration(
        hintText: hintText,
        hintStyle: AppTypography.bodySm.copyWith(
          color: context.colors.onSurfaceVariant.withValues(alpha: 0.55),
        ),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: isLight ? const Color(0xFFF1F5F9) : context.colors.surface.withValues(alpha: 0.25),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: isLight ? const Color(0xFFCBD5E1) : context.colors.glassBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: isLight ? const Color(0xFFCBD5E1) : context.colors.glassBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: context.colors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Colors.redAccent),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
        ),
      );
    }

    showDialog(
      context: context,
      builder: (ctx) {
        final screenHeight = MediaQuery.of(ctx).size.height;
        final dialogHeight = screenHeight > 800 ? 720.0 : screenHeight * 0.85;

        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Container(
            width: 520,
            height: dialogHeight,
            decoration: BoxDecoration(
              color: isLight ? Colors.white : const Color(0xFF0D101C),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: context.colors.glassBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isLight ? 0.15 : 0.6),
                  blurRadius: 32,
                  spreadRadius: 4,
                ),
              ],
            ),
            child: Column(
              children: [
                // Header with Title, Subtitle, and Close X button
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 16, 14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.tr('addNewContact'),
                              style: AppTypography.headlineSm.copyWith(
                                fontWeight: FontWeight.bold,
                                color: context.colors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              context.tr('addNewContactSubtitle'),
                              style: AppTypography.bodySm.copyWith(
                                color: context.colors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        color: context.colors.onSurfaceVariant,
                        onPressed: () => Navigator.pop(ctx),
                        splashRadius: 20,
                      ),
                    ],
                  ),
                ),
                Divider(height: 1, color: context.colors.glassBorder),

                // Scrollable Form Fields
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                    child: Form(
                      key: formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Name *
                          buildFormField(
                            label: '${context.tr('name')} *',
                            field: TextFormField(
                              controller: nameController,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(hintText: context.tr('contactNameHint')),
                              validator: (v) =>
                                  (v == null || v.trim().isEmpty) ? context.tr('nameRequired') : null,
                            ),
                          ),

                          // Email
                          buildFormField(
                            label: context.tr('email'),
                            field: TextFormField(
                              controller: emailController,
                              keyboardType: TextInputType.emailAddress,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(hintText: context.tr('contactEmailHint')),
                            ),
                          ),

                          // Phone
                          buildFormField(
                            label: context.tr('phone'),
                            field: TextFormField(
                              controller: phoneController,
                              keyboardType: TextInputType.phone,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(hintText: '+1 (555) 000-0000'),
                            ),
                          ),

                          // Company
                          buildFormField(
                            label: context.tr('company'),
                            field: TextFormField(
                              controller: companyController,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(hintText: context.tr('contactCompanyHint')),
                            ),
                          ),

                          // Position
                          buildFormField(
                            label: context.tr('position'),
                            field: TextFormField(
                              controller: positionController,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(hintText: context.tr('contactRoleHint')),
                            ),
                          ),

                          // Where You Met
                          buildFormField(
                            label: context.tr('whereMet'),
                            field: TextFormField(
                              controller: whereMetController,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(
                                hintText: context.tr('contactMetAtHint'),
                              ),
                            ),
                          ),

                          // Date Met
                          buildFormField(
                            label: context.tr('dateMet'),
                            field: TextFormField(
                              controller: dateMetController,
                              readOnly: true,
                              onTap: () => pickDate(ctx),
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(
                                hintText: context.tr('contactDateHint'),
                                suffixIcon: IconButton(
                                  icon: const Icon(Icons.calendar_today_outlined, size: 18),
                                  color: context.colors.onSurfaceVariant,
                                  onPressed: () => pickDate(ctx),
                                ),
                              ),
                            ),
                          ),

                          // Notes
                          buildFormField(
                            label: context.tr('notes'),
                            field: TextFormField(
                              controller: notesController,
                              maxLines: 4,
                              minLines: 3,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(
                                hintText: context.tr('contactNotesHint'),
                              ),
                            ),
                          ),

                          // Tags
                          buildFormField(
                            label: context.tr('tags'),
                            field: TextFormField(
                              controller: tagsController,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(
                                hintText: context.tr('contactTagsHint'),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                Divider(height: 1, color: context.colors.glassBorder),

                // Side by Side Action Buttons (Cancel and Add Contact)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      LiquidGlassButton(
                        label: context.tr('cancel'),
                        height: 44,
                        width: 110,
                        onPressed: () => Navigator.pop(ctx),
                      ),
                      const SizedBox(width: 12),
                      GradientButton(
                        label: context.tr('saveContact'),
                        height: 44,
                        width: 145,
                        onPressed: () async {
                          if (!formKey.currentState!.validate()) return;
                          final tags = tagsController.text
                              .split(',')
                              .map((t) => t.trim())
                              .where((t) => t.isNotEmpty)
                              .toList();

                          final success = await ref.read(contactsProvider.notifier).addContact(
                                name: nameController.text.trim(),
                                company: companyController.text.trim().isNotEmpty
                                    ? companyController.text.trim()
                                    : null,
                                position: positionController.text.trim().isNotEmpty
                                    ? positionController.text.trim()
                                    : null,
                                email: emailController.text.trim().isNotEmpty
                                    ? emailController.text.trim()
                                    : null,
                                phone: phoneController.text.trim().isNotEmpty
                                    ? phoneController.text.trim()
                                    : null,
                                whereMet: whereMetController.text.trim().isNotEmpty
                                    ? whereMetController.text.trim()
                                    : null,
                                metAt: dateMetController.text.trim().isNotEmpty
                                    ? dateMetController.text.trim()
                                    : null,
                                notes: notesController.text.trim().isNotEmpty
                                    ? notesController.text.trim()
                                    : null,
                                tags: tags,
                              );

                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                            if (success) {
                              AppToast.show(context, context.tr('contactAddedSuccess'));
                            }
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isGuest = authState.user?.isGuest ?? true;

    final contactsState = ref.watch(contactsProvider);
    final contacts = contactsState.filteredContacts;

    return SingleChildScrollView(
      padding: EdgeInsets.only(
        top: Responsive.topPadding(context),
        left: Responsive.pagePadding(context),
        right: Responsive.pagePadding(context),
        bottom: 32,
      ),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
          width: double.infinity,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Page Heading (Standardized)
              if (!Responsive.hasShellTopBar(context)) ...[
                PopInItem(
                  index: 0,
                  child: Center(
                    child: Text(
                      context.l10n.contacts,
                      style: AppTypography.headlineMd,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Trial Banner (shows when not signed in)
              if (isGuest) ...[
                const PopInItem(
                  index: 1,
                  child: TrialBannerCard(),
                ),
                const SizedBox(height: 24),
              ],

              // Contacts Directory Section Header
              SectionHeader(
                icon: Icons.contacts_rounded,
                label: context.l10n.allContacts,
                color: context.colors.primary,
              ),
              const SizedBox(height: 16),

              // Search Bar & Action
              PopInItem(
                index: isGuest ? 2 : 1,
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final isUltraNarrow = constraints.maxWidth < 360;
                    final addContactBtn = GradientButton(
                      key: TourTargetKeys.contactsFeature,
                      label: context.l10n.addContact,
                      icon: Icons.person_add_outlined,
                      height: 42,
                      maxWidth: 145,
                      onPressed: () => _showAddContactDialog(context),
                    );

                    final searchField = TextField(
                      controller: _searchController,
                      onChanged: (val) =>
                          ref.read(contactsProvider.notifier).setSearchQuery(val),
                      decoration: InputDecoration(
                        hintText: context.l10n.searchContacts,
                        prefixIcon: Icon(Icons.search, color: context.colors.outline, size: 20),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  ref.read(contactsProvider.notifier).setSearchQuery('');
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: context.colors.surfaceCard,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: context.colors.glassBorder),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: context.colors.glassBorder),
                        ),
                      ),
                    );

                    if (isUltraNarrow) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          searchField,
                          const SizedBox(height: 12),
                          addContactBtn,
                        ],
                      );
                    }

                    return Row(
                      children: [
                        Expanded(child: searchField),
                        const SizedBox(width: 12),
                        addContactBtn,
                      ],
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),

              // Content Area: Loading / Empty / List
              if (contactsState.isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 48),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (contacts.isEmpty)
                PopInItem(
                  index: 2,
                  child: GlassCard(
                    borderRadius: BorderRadius.circular(20),
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
                    child: Center(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              color: context.colors.primary.withValues(alpha: 0.12),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: context.colors.primary.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Icon(
                              Icons.person_outline_rounded,
                              size: 36,
                              color: context.colors.primary,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            _searchController.text.isEmpty
                                ? context.l10n.noContactsFound
                                : '${context.tr('noContactsMatching')} "${_searchController.text}"',
                            style: AppTypography.headlineSm.copyWith(
                              color: context.colors.onSurface,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _searchController.text.isEmpty
                                ? context.tr('noContactsDesc')
                                : context.tr('tryDifferentSearch'),
                            style: AppTypography.bodySm.copyWith(
                              color: context.colors.onSurfaceVariant,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),
                          if (_searchController.text.isEmpty)
                            GradientButton(
                              label: context.l10n.addContact,
                              height: 44,
                              maxWidth: 220,
                              onPressed: () => _showAddContactDialog(context),
                            ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: contacts.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final contact = contacts[index];
                    return PopInItem(
                      index: index + 2,
                      child: _ContactCard(
                        contact: contact,
                        onDelete: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              backgroundColor: context.colors.surfaceCard,
                              title: Text(context.tr('deleteContactTitle')),
                              content: Text(
                                '${context.tr('deleteContactConfirm')}\n(${contact.name})',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, false),
                                  child: Text(context.tr('cancel')),
                                ),
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, true),
                                  child: Text(
                                    context.tr('delete'),
                                    style: const TextStyle(
                                      color: Color(0xFFEF4444),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );

                          if (confirm == true) {
                            await ref
                                .read(contactsProvider.notifier)
                                .deleteContact(contact.id);
                          }
                        },
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  final ContactModel contact;
  final VoidCallback onDelete;

  const _ContactCard({
    required this.contact,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(16),
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar Initial
          CircleAvatar(
            radius: 22,
            backgroundColor: context.colors.primary.withValues(alpha: 0.15),
            child: Text(
              contact.name.isNotEmpty ? contact.name[0].toUpperCase() : '?',
              style: AppTypography.headlineSm.copyWith(
                color: context.colors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 16),

          // Contact Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  contact.name,
                  style: AppTypography.bodyMd.copyWith(
                    fontWeight: FontWeight.bold,
                    color: context.colors.onSurface,
                  ),
                ),
                if ((contact.position != null && contact.position!.isNotEmpty) ||
                    (contact.company != null && contact.company!.isNotEmpty)) ...[
                  const SizedBox(height: 2),
                  Text(
                    [
                      if (contact.position != null && contact.position!.isNotEmpty)
                        contact.position,
                      if (contact.company != null && contact.company!.isNotEmpty)
                        contact.company,
                    ].join(' • '),
                    style: AppTypography.bodySm.copyWith(
                      color: context.colors.onSurfaceVariant,
                    ),
                  ),
                ],
                const SizedBox(height: 8),

                // Contact details row: email & phone
                Wrap(
                  spacing: 14,
                  runSpacing: 6,
                  children: [
                    if (contact.email != null && contact.email!.isNotEmpty)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.email_outlined,
                              size: 14, color: context.colors.outline),
                          const SizedBox(width: 4),
                          Text(
                            contact.email!,
                            style: AppTypography.bodySm.copyWith(
                              fontSize: 12,
                              color: context.colors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    if (contact.phone != null && contact.phone!.isNotEmpty)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.phone_outlined,
                              size: 14, color: context.colors.outline),
                          const SizedBox(width: 4),
                          Text(
                            contact.phone!,
                            style: AppTypography.bodySm.copyWith(
                              fontSize: 12,
                              color: context.colors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),

                // Tags
                if (contact.tags.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: contact.tags.map((tag) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: context.colors.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: context.colors.primary.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Text(
                          tag,
                          style: AppTypography.bodySm.copyWith(
                            fontSize: 11,
                            color: context.colors.primary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),

          // Delete Action (Red)
          IconButton(
            icon: const Icon(
              Icons.delete_outline_rounded,
              size: 20,
              color: Color(0xFFEF4444),
            ),
            tooltip: context.tr('deleteContactTitle'),
            splashColor: const Color(0xFFEF4444).withValues(alpha: 0.15),
            highlightColor: const Color(0xFFEF4444).withValues(alpha: 0.08),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}
