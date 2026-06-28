import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Dark palette (original brand colors).
class AppColors {
  static const midnight = Color(0xFF0F172A);
  static const midnightLight = Color(0xFF1E293B);
  static const midnightLighter = Color(0xFF334155);
  static const sand = Color(0xFFD4AF37);
  static const sandLight = Color(0xFFF5E6A3);
  static const cloud = Color(0xFFF8FAFC);
  static const cloudDim = Color(0xFFCBD5E1);
  static const saffron = Color(0xFFFF9933);
  static const saffronLight = Color(0xFFFFB74D);
  static const glassWhite = Color(0x14FFFFFF);
  static const glassBorder = Color(0x1AFFFFFF);
  static const error = Color(0xFFEF4444);
  static const success = Color(0xFF22C55E);
}

/// Light palette — same brand DNA (gold + saffron) on warm paper.
class AppColorsLight {
  static const paper = Color(0xFFF8FAFC);        // scaffold bg
  static const paperRaised = Color(0xFFFFFFFF);  // surfaces/cards
  static const ink = Color(0xFF0F172A);          // primary text
  static const inkDim = Color(0xFF64748B);        // secondary text
  static const sand = Color(0xFFB8901E);          // gold (darkened for contrast on light)
  static const saffron = Color(0xFFE07B12);
  static const glass = Color(0x0A0F172A);         // translucent dark on light
  static const glassBorder = Color(0x14000000);
  static const error = Color(0xFFDC2626);
  static const success = Color(0xFF16A34A);
}

/// Theme-extension so screens can read brand colors that adapt to the mode,
/// e.g. `Theme.of(context).extension<BrandColors>()!.surfaceGlass`.
@immutable
class BrandColors extends ThemeExtension<BrandColors> {
  final Color background;
  final Color surface;
  final Color surfaceGlass;
  final Color glassBorder;
  final Color textPrimary;
  final Color textSecondary;
  final Color gold;
  final Color saffron;
  final Color success;
  final Color error;

  const BrandColors({
    required this.background,
    required this.surface,
    required this.surfaceGlass,
    required this.glassBorder,
    required this.textPrimary,
    required this.textSecondary,
    required this.gold,
    required this.saffron,
    required this.success,
    required this.error,
  });

  static const dark = BrandColors(
    background: AppColors.midnight,
    surface: AppColors.midnightLight,
    surfaceGlass: AppColors.glassWhite,
    glassBorder: AppColors.glassBorder,
    textPrimary: AppColors.cloud,
    textSecondary: AppColors.cloudDim,
    gold: AppColors.sand,
    saffron: AppColors.saffron,
    success: AppColors.success,
    error: AppColors.error,
  );

  static const light = BrandColors(
    background: AppColorsLight.paper,
    surface: AppColorsLight.paperRaised,
    surfaceGlass: AppColorsLight.glass,
    glassBorder: AppColorsLight.glassBorder,
    textPrimary: AppColorsLight.ink,
    textSecondary: AppColorsLight.inkDim,
    gold: AppColorsLight.sand,
    saffron: AppColorsLight.saffron,
    success: AppColorsLight.success,
    error: AppColorsLight.error,
  );

  @override
  BrandColors copyWith({
    Color? background, Color? surface, Color? surfaceGlass, Color? glassBorder,
    Color? textPrimary, Color? textSecondary, Color? gold, Color? saffron,
    Color? success, Color? error,
  }) => BrandColors(
        background: background ?? this.background,
        surface: surface ?? this.surface,
        surfaceGlass: surfaceGlass ?? this.surfaceGlass,
        glassBorder: glassBorder ?? this.glassBorder,
        textPrimary: textPrimary ?? this.textPrimary,
        textSecondary: textSecondary ?? this.textSecondary,
        gold: gold ?? this.gold,
        saffron: saffron ?? this.saffron,
        success: success ?? this.success,
        error: error ?? this.error,
      );

  @override
  BrandColors lerp(ThemeExtension<BrandColors>? other, double t) {
    if (other is! BrandColors) return this;
    return BrandColors(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceGlass: Color.lerp(surfaceGlass, other.surfaceGlass, t)!,
      glassBorder: Color.lerp(glassBorder, other.glassBorder, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      gold: Color.lerp(gold, other.gold, t)!,
      saffron: Color.lerp(saffron, other.saffron, t)!,
      success: Color.lerp(success, other.success, t)!,
      error: Color.lerp(error, other.error, t)!,
    );
  }
}

/// Convenience: `context.brand.gold`
extension BrandColorsContext on BuildContext {
  BrandColors get brand => Theme.of(this).extension<BrandColors>()!;
}

class AppTheme {
  static ThemeData get darkTheme => _build(dark: true);
  static ThemeData get lightTheme => _build(dark: false);

  static ThemeData _build({required bool dark}) {
    final c = dark ? BrandColors.dark : BrandColors.light;
    final scheme = dark
        ? const ColorScheme.dark(
            primary: AppColors.sand, secondary: AppColors.saffron,
            surface: AppColors.midnightLight, background: AppColors.midnight,
            onPrimary: AppColors.midnight, onSecondary: AppColors.midnight,
            onSurface: AppColors.cloud, onBackground: AppColors.cloud, error: AppColors.error)
        : const ColorScheme.light(
            primary: AppColorsLight.sand, secondary: AppColorsLight.saffron,
            surface: AppColorsLight.paperRaised, background: AppColorsLight.paper,
            onPrimary: Colors.white, onSecondary: Colors.white,
            onSurface: AppColorsLight.ink, onBackground: AppColorsLight.ink, error: AppColorsLight.error);

    return ThemeData(
      useMaterial3: true,
      brightness: dark ? Brightness.dark : Brightness.light,
      scaffoldBackgroundColor: c.background,
      colorScheme: scheme,
      fontFamily: 'Inter',
      extensions: <ThemeExtension<dynamic>>[c],
      textTheme: TextTheme(
        displayLarge: TextStyle(fontFamily: 'PlayfairDisplay', fontSize: 32, fontWeight: FontWeight.w700, color: c.textPrimary),
        displayMedium: TextStyle(fontFamily: 'PlayfairDisplay', fontSize: 24, fontWeight: FontWeight.w700, color: c.textPrimary),
        headlineLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: c.textPrimary),
        headlineMedium: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: c.textPrimary),
        titleLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: c.textPrimary),
        bodyLarge: TextStyle(fontSize: 15, color: c.textPrimary),
        bodyMedium: TextStyle(fontSize: 13, color: c.textSecondary),
        labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: c.gold),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent, elevation: 0, centerTitle: true,
        foregroundColor: c.textPrimary,
        systemOverlayStyle: dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: c.surface, selectedItemColor: c.gold, unselectedItemColor: c.textSecondary,
        type: BottomNavigationBarType.fixed, elevation: 8),
      cardTheme: CardTheme(color: c.surfaceGlass, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)), elevation: 0),
      inputDecorationTheme: InputDecorationTheme(
        filled: true, fillColor: c.surfaceGlass,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: c.glassBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: c.glassBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: c.gold)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: TextStyle(color: c.textSecondary.withOpacity(0.7)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.gold, foregroundColor: dark ? AppColors.midnight : Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700))),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.gold, side: BorderSide(color: c.gold),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)))),
    );
  }
}
