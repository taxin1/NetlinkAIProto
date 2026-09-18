import 'dart:math' as math;
import 'package:flutter/scheduler.dart';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'glass_card.dart';
import '../localization/app_localizations.dart';

/// Futuristic AI Voice Wave Visualizer Card inspired by Siri/ChatGPT voice interfaces
class AiVoiceWaveCard extends StatefulWidget {
  final String? title;
  final String? subtitle;
  final ValueChanged<bool>? onListeningChanged;
  final double height;

  const AiVoiceWaveCard({
    super.key,
    this.title,
    this.subtitle,
    this.onListeningChanged,
    this.height = 360,
  });

  @override
  State<AiVoiceWaveCard> createState() => _AiVoiceWaveCardState();
}

class _AiVoiceWaveCardState extends State<AiVoiceWaveCard>
    with SingleTickerProviderStateMixin {
  late Ticker _ticker;
  double _time = 0.0;
  bool _isListening = false;
  String? _liveText;
  int _promptIndex = 0;

  @override
  void initState() {
    super.initState();
    _ticker = createTicker((elapsed) {
      if (mounted) {
        setState(() {
          _time = elapsed.inMicroseconds / 1000000.0;
        });
      }
    })..start();
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  void _toggleListening() {
    setState(() {
      _isListening = !_isListening;
      if (_isListening) {
        final prompts = [
          context.tr('voicePromptQuotation'),
          context.tr('voicePromptFollowUp'),
          context.tr('voicePromptScanCard'),
        ];
        _liveText = prompts[_promptIndex % prompts.length];
        _promptIndex++;
      } else {
        _liveText = context.tr('voiceCommandCaptured');
      }
    });
    widget.onListeningChanged?.call(_isListening);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = context.colors.primary;

    return SizedBox(
      height: widget.height,
      child: GlassCard(
        borderRadius: BorderRadius.circular(24),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        glowColor: _isListening
            ? primaryColor.withValues(alpha: 0.3)
            : context.colors.tertiary.withValues(alpha: 0.15),
        child: Stack(
          children: [
            // Ambient glowing background orb
            Positioned.fill(
              child: Align(
                alignment: Alignment.bottomCenter,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 600),
                  width: _isListening ? 260 : 180,
                  height: _isListening ? 260 : 180,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        _isListening
                            ? primaryColor.withValues(alpha: isDark ? 0.35 : 0.25)
                            : const Color(0xFF0077FF).withValues(alpha: isDark ? 0.18 : 0.12),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Content column
            Column(
              children: [
                // Real-time voice text display
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: Padding(
                    key: ValueKey(_liveText),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: Column(
                      children: [
                        Text(
                          _liveText ?? context.tr('voiceLiveTapToSpeak'),
                          textAlign: TextAlign.center,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.headlineSm.copyWith(
                            fontSize: 16,
                            height: 1.35,
                            fontWeight: FontWeight.w600,
                            color: _isListening
                                ? context.colors.onSurface
                                : context.colors.onSurfaceVariant,
                          ),
                        ),
                        if (_isListening) ...[
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF00E5FF),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                context.tr('voiceStatusListening'),
                                style: AppTypography.labelSm.copyWith(
                                  color: const Color(0xFF00E5FF),
                                  letterSpacing: 1.2,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                const Spacer(),

                // Animated Sine Wave Visualizer
                SizedBox(
                  height: 80,
                  width: double.infinity,
                  child: CustomPaint(
                    painter: _VoiceWavePainter(
                      time: _time,
                      isListening: _isListening,
                      primaryColor: primaryColor,
                      accentColor: const Color(0xFF00E5FF),
                      isDark: isDark,
                    ),
                  ),
                ),

                const Spacer(),

                // Elevated Glowing Mic Button
                GestureDetector(
                  onTap: _toggleListening,
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: _isListening
                              ? const Color(0xFF00E5FF).withValues(alpha: 0.6)
                              : primaryColor.withValues(alpha: 0.35),
                          blurRadius: _isListening ? 28 : 16,
                          spreadRadius: _isListening ? 4 : 0,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(
                      _isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
                      color: _isListening ? const Color(0xFF0077FF) : const Color(0xFF1E293B),
                      size: 28,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _isListening ? context.tr('tapToStop') : context.tr('tapToStartSpeaking'),
                  style: AppTypography.labelSm.copyWith(
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Non-clickable inline voice wave header visualizer for embedding inside cards
class AiVoiceWaveHeader extends StatefulWidget {
  final bool isListening;

  const AiVoiceWaveHeader({
    super.key,
    this.isListening = false,
  });

  @override
  State<AiVoiceWaveHeader> createState() => _AiVoiceWaveHeaderState();
}

class _AiVoiceWaveHeaderState extends State<AiVoiceWaveHeader>
    with SingleTickerProviderStateMixin {
  late Ticker _ticker;
  double _time = 0.0;

  @override
  void initState() {
    super.initState();
    _ticker = createTicker((elapsed) {
      if (mounted) {
        setState(() {
          _time = elapsed.inMicroseconds / 1000000.0;
        });
      }
    })..start();
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = context.colors.primary;

    return IgnorePointer(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        decoration: BoxDecoration(
          color: context.colors.surfaceContainerLow.withValues(alpha: 0.3),
          border: Border(bottom: BorderSide(color: context.colors.glassBorder)),
        ),
        child: Column(
          children: [
            // Live status text (strictly NON-CLICKABLE display)
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: Text(
                widget.isListening
                    ? context.tr('voiceWaveHeaderListening')
                    : context.tr('tapMicrophoneToSpeak'),
                key: ValueKey(widget.isListening),
                textAlign: TextAlign.center,
                style: AppTypography.bodySm.copyWith(
                  color: widget.isListening
                      ? context.colors.primary
                      : context.colors.onSurfaceVariant,
                  fontWeight: widget.isListening ? FontWeight.w700 : FontWeight.normal,
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Animated Sine Wave Visualizer (strictly NON-CLICKABLE display)
            SizedBox(
              height: 52,
              width: double.infinity,
              child: CustomPaint(
                painter: _VoiceWavePainter(
                  time: _time,
                  isListening: widget.isListening,
                  primaryColor: primaryColor,
                  accentColor: const Color(0xFF00E5FF),
                  isDark: isDark,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


/// CustomPainter that renders multi-strand fluid sine wave curves with 100% continuous time
class _VoiceWavePainter extends CustomPainter {
  final double time;
  final bool isListening;
  final Color primaryColor;
  final Color accentColor;
  final bool isDark;

  _VoiceWavePainter({
    required this.time,
    required this.isListening,
    required this.primaryColor,
    required this.accentColor,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    final centerY = height / 2;

    final baseAmp = isListening ? 30.0 : 7.0;

    final waves = [
      _WaveParam(
        amplitude: baseAmp * 1.25,
        frequency: isListening ? 2.8 : 2.2,
        speed: isListening ? 4.5 : 2.8,
        color: accentColor.withValues(alpha: isDark ? 0.95 : 0.85),
        strokeWidth: isListening ? 3.0 : 2.0,
      ),
      _WaveParam(
        amplitude: baseAmp * 0.90,
        frequency: isListening ? 2.2 : 1.7,
        speed: isListening ? -3.8 : -2.2,
        color: primaryColor.withValues(alpha: isDark ? 0.85 : 0.75),
        strokeWidth: isListening ? 2.5 : 1.8,
      ),
      _WaveParam(
        amplitude: baseAmp * 0.65,
        frequency: isListening ? 3.5 : 2.9,
        speed: isListening ? 5.5 : 3.5,
        color: const Color(0xFF60A5FA).withValues(alpha: isDark ? 0.70 : 0.60),
        strokeWidth: isListening ? 2.0 : 1.5,
      ),
      _WaveParam(
        amplitude: baseAmp * 0.45,
        frequency: isListening ? 1.9 : 1.4,
        speed: isListening ? -2.8 : -1.5,
        color: Colors.white.withValues(alpha: isDark ? 0.90 : 0.50),
        strokeWidth: isListening ? 2.0 : 1.5,
      ),
    ];

    for (int i = 0; i < waves.length; i++) {
      final wave = waves[i];
      final path = Path();
      final paint = Paint()
        ..color = wave.color
        ..style = PaintingStyle.stroke
        ..strokeWidth = wave.strokeWidth
        ..strokeCap = StrokeCap.round;

      path.moveTo(0, centerY);

      for (double x = 0; x <= width; x += 2) {
        final normX = x / width;
        // Smooth bell curve envelope tapering: 0 at ends, max in center
        final envelope = math.sin(normX * math.pi);
        // Dynamic harmonic pulsation (makes the wave breathe organically over time)
        final organicMod = 1.0 + (isListening ? 0.35 : 0.15) * math.sin(time * 3.0 + i * 1.5 + normX * math.pi * 2);

        final y = centerY +
            wave.amplitude *
                organicMod *
                envelope *
                math.sin(normX * wave.frequency * 2 * math.pi + time * wave.speed + i * 0.8);

        path.lineTo(x, y);
      }

      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _VoiceWavePainter oldDelegate) {
    return oldDelegate.time != time || oldDelegate.isListening != isListening;
  }
}

class _WaveParam {
  final double amplitude;
  final double frequency;
  final double speed;
  final Color color;
  final double strokeWidth;

  _WaveParam({
    required this.amplitude,
    required this.frequency,
    required this.speed,
    required this.color,
    required this.strokeWidth,
  });
}
