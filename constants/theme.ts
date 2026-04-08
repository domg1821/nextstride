/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Design tokens for spacing, radii, shadows and a small accent palette.
export const Spacing = {
  xs: 4,
  s: 8,
  ms: 12,
  m: 16,
  ml: 20,
  l: 24,
  xl: 32,
  xxl: 40,
  xxxl: 56,
};

export const Radii = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 36,
  round: 9999,
};

// Simple shadow presets for iOS / Android (React Native style)
export const Shadows = {
  low: {
    shadowColor: '#020817',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },
  medium: {
    shadowColor: '#020817',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 11,
  },
  high: {
    shadowColor: '#020817',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 36,
    elevation: 14,
  },
};

export const Palette = {
  primary: '#63B3FF',
  accent: '#2DD4BF',
  secondary: '#38BDF8',
  backgroundSoft: '#F7FBFC',
  surface: '#FFFFFF',
  borderSubtle: '#E6EEF0',
  textPrimary: '#0F1720',
  textMuted: '#6B7280',
};

export const Typography = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '800' },
  h1: { fontSize: 34, lineHeight: 40, fontWeight: '800' },
  h2: { fontSize: 26, lineHeight: 32, fontWeight: '800' },
  h3: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 23, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 23, fontWeight: '600' },
  small: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  link: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: '#63B3FF' },
};

export const IconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
};

// Export a minimal ThemeTokens object for easy imports elsewhere.
export const ThemeTokens = {
  spacing: Spacing,
  radii: Radii,
  shadows: Shadows,
  palette: Palette,
  typography: Typography,
  icons: IconSizes,
};
