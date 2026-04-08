import { useWindowDimensions } from "react-native";

const BREAKPOINTS = {
  compact: 480,
  phone: 640,
  tablet: 840,
  desktop: 1120,
  wide: 1440,
} as const;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isCompact = width < BREAKPOINTS.compact;
  const isPhone = width < BREAKPOINTS.phone;
  const isTablet = width >= BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isWide = width >= BREAKPOINTS.wide;

  const pagePadding = isDesktop ? 36 : isTablet ? 26 : isCompact ? 12 : 18;
  const sectionGap = isDesktop ? 32 : isCompact ? 20 : 24;
  const contentMaxWidth = isWide ? 1380 : isDesktop ? 1220 : 980;
  const cardGridColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  const modalInset = isDesktop ? 32 : isTablet ? 24 : isCompact ? 12 : 16;
  const modalMaxHeight = isDesktop ? 0.84 : isCompact ? 0.94 : 0.9;

  return {
    width,
    height,
    isCompact,
    isPhone,
    isTablet,
    isDesktop,
    isWide,
    pagePadding,
    sectionGap,
    contentMaxWidth,
    cardGridColumns,
    modalInset,
    modalMaxHeight,
  };
}
