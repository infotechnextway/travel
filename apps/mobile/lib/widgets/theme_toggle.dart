import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/theme_provider.dart';

/// Compact sun/moon button — drop into any AppBar `actions: [ThemeToggleButton()]`.
class ThemeToggleButton extends StatelessWidget {
  const ThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context) {
    final tp = context.watch<ThemeProvider>();
    final dark = tp.isDark(context);
    return IconButton(
      tooltip: dark ? 'Switch to light' : 'Switch to dark',
      icon: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        transitionBuilder: (c, a) => RotationTransition(turns: a, child: FadeTransition(opacity: a, child: c)),
        child: Icon(dark ? Icons.light_mode : Icons.dark_mode,
            key: ValueKey(dark), color: context.brand.gold),
      ),
      onPressed: () => context.read<ThemeProvider>().toggle(context),
    );
  }
}

/// Full Light / Dark / System selector for the Profile → Appearance row.
class ThemeModeSelector extends StatelessWidget {
  const ThemeModeSelector({super.key});

  @override
  Widget build(BuildContext context) {
    final tp = context.watch<ThemeProvider>();
    final brand = context.brand;
    Widget seg(String label, IconData icon, ThemeMode mode) {
      final on = tp.mode == mode;
      return Expanded(
        child: GestureDetector(
          onTap: () => context.read<ThemeProvider>().setMode(mode),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: on ? brand.gold : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(children: [
              Icon(icon, size: 20, color: on ? brand.background : brand.textSecondary),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                  color: on ? brand.background : brand.textSecondary)),
            ]),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: brand.surfaceGlass,
        border: Border.all(color: brand.glassBorder),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(children: [
        seg('Light', Icons.light_mode, ThemeMode.light),
        seg('Dark', Icons.dark_mode, ThemeMode.dark),
        seg('System', Icons.brightness_auto, ThemeMode.system),
      ]),
    );
  }
}
