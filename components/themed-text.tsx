import { StyleSheet, Text, type TextProps, TextStyle } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemeTokens, Fonts } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  /** legacy `type` supported for backward compatibility */
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  variant,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  // map legacy `type` to new `variant` names
  const resolvedVariant: ThemedTextProps['variant'] =
    variant ||
    (type === 'title'
      ? 'h1'
      : type === 'defaultSemiBold'
      ? 'bodyStrong'
      : type === 'subtitle'
      ? 'h3'
      : type === 'link'
      ? 'link'
      : 'body');

  const token = ThemeTokens.typography[resolvedVariant as keyof typeof ThemeTokens.typography] as TextStyle | undefined;

  // if variant is link, prefer palette link color, otherwise use theme text color
  const linkColor = ThemeTokens.palette.primary;

  const variantStyle: TextStyle = {
    ...(token || {}),
    color: resolvedVariant === 'link' ? linkColor : color,
    fontFamily: (Fonts && (Fonts as any).sans) || undefined,
  };

  return <Text style={[variantStyle, style]} {...rest} />;
}

const styles = StyleSheet.create({});
