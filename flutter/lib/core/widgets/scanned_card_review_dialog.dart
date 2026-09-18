import 'dart:ui';
import 'package:flutter/material.dart';
import '../services/business_card_scanner_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../localization/app_localizations.dart';
import 'gradient_button.dart';

class ScannedCardReviewDialog extends StatefulWidget {
  final ScannedCardData initialData;
  final Future<void> Function({
    required String name,
    required String company,
    required String title,
    required String email,
    required String phone,
    String? linkedin,
  }) onSave;

  const ScannedCardReviewDialog({
    super.key,
    required this.initialData,
    required this.onSave,
  });

  static Future<void> show({
    required BuildContext context,
    required ScannedCardData data,
    required Future<void> Function({
      required String name,
      required String company,
      required String title,
      required String email,
      required String phone,
      String? linkedin,
    }) onSave,
  }) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black.withValues(alpha: 0.70),
      builder: (ctx) => ScannedCardReviewDialog(
        initialData: data,
        onSave: onSave,
      ),
    );
  }

  @override
  State<ScannedCardReviewDialog> createState() => _ScannedCardReviewDialogState();
}

class _ScannedCardReviewDialogState extends State<ScannedCardReviewDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _titleController;
  late final TextEditingController _companyController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  late final TextEditingController _linkedinController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialData.name);
    _titleController = TextEditingController(text: widget.initialData.position ?? '');
    _companyController = TextEditingController(text: widget.initialData.company ?? '');
    _emailController = TextEditingController(text: widget.initialData.email ?? '');
    _phoneController = TextEditingController(text: widget.initialData.phone ?? '');
    _linkedinController = TextEditingController(text: widget.initialData.linkedinUrl ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _titleController.dispose();
    _companyController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _linkedinController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      await widget.onSave(
        name: _nameController.text.trim(),
        company: _companyController.text.trim(),
        title: _titleController.text.trim(),
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        linkedin: _linkedinController.text.trim().isNotEmpty ? _linkedinController.text.trim() : null,
      );
      if (mounted) {
        Navigator.of(context).pop();
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: Material(
              color: Colors.transparent,
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xEB131B2A),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(
                    color: context.colors.primary.withValues(alpha: 0.35),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: context.colors.primary.withValues(alpha: 0.12),
                      blurRadius: 32,
                      spreadRadius: 2,
                    ),
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.55),
                      blurRadius: 24,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header with Icon
                      Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: context.colors.primary.withValues(alpha: 0.14),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: context.colors.primary.withValues(alpha: 0.30),
                                width: 1.0,
                              ),
                            ),
                            child: Icon(
                              Icons.document_scanner_rounded,
                              color: context.colors.primary,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  context.tr('reviewScannedCard'),
                                  style: AppTypography.headlineSm.copyWith(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: context.colors.onSurface,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  context.tr('reviewCardSubtitle'),
                                  style: AppTypography.bodySm.copyWith(
                                    color: context.colors.onSurfaceVariant,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: Icon(Icons.close_rounded, color: context.colors.onSurfaceVariant, size: 20),
                            onPressed: () => Navigator.of(context).pop(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Fields
                      _buildTextField(
                        controller: _nameController,
                        label: context.tr('name'),
                        icon: Icons.person_outline_rounded,
                        required: true,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _buildTextField(
                              controller: _companyController,
                              label: context.tr('company'),
                              icon: Icons.business_rounded,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildTextField(
                              controller: _titleController,
                              label: context.tr('position'),
                              icon: Icons.badge_outlined,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        controller: _emailController,
                        label: context.tr('email'),
                        icon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        controller: _phoneController,
                        label: context.tr('phone'),
                        icon: Icons.phone_outlined,
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        controller: _linkedinController,
                        label: 'LinkedIn',
                        icon: Icons.link_rounded,
                      ),
                      const SizedBox(height: 24),

                      // Actions
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          LiquidGlassButton(
                            label: context.tr('cancel'),
                            icon: Icons.close_rounded,
                            height: 40,
                            onPressed: _isSaving ? null : () => Navigator.of(context).pop(),
                          ),
                          const SizedBox(width: 12),
                          GradientButton(
                            label: _isSaving ? '...' : context.tr('saveContact'),
                            icon: _isSaving ? Icons.hourglass_top_rounded : Icons.check_circle_outline_rounded,
                            height: 40,
                            onPressed: _isSaving ? null : _handleSave,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool required = false,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label + (required ? ' *' : ''),
          style: AppTypography.labelSm.copyWith(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: context.colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          style: AppTypography.bodyMd.copyWith(color: context.colors.onSurface),
          validator: required
              ? (val) {
                  if (val == null || val.trim().isEmpty) {
                    return context.tr('fieldRequired');
                  }
                  return null;
                }
              : null,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, size: 18, color: context.colors.primary),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            filled: true,
            fillColor: const Color(0xFF0F1522),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: context.colors.surfaceVariant, width: 1.0),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: context.colors.surfaceVariant, width: 1.0),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: context.colors.primary, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
