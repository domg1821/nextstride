import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemeTokens } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  /** if true, apply card surface styling (radius + shadow) */
  surface?: boolean;
  elevation?: 'low' | 'medium';
  radius?: keyof typeof ThemeTokens.radii;
};

export function ThemedView({ style, lightColor, darkColor, surface, elevation = 'low', radius = 'md', ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  const surfaceStyle = surface
    ? {
        backgroundColor,
        borderRadius: ThemeTokens.radii[radius],
        ...(elevation ? ThemeTokens.shadows[elevation] : {}),
      }
    : { backgroundColor };

  return <View style={[surfaceStyle, style]} {...otherProps} />;
}
