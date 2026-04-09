import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { MarketingBackdrop, RunningSurfaceAccent } from "@/components/running-visuals";
import { useResponsiveLayout } from "@/lib/responsive";

export type SiteSectionProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  padding: number;
  children: React.ReactNode;
  centered?: boolean;
};

export function SiteButton({
  label,
  variant = "primary",
  onPress,
  compact,
}: {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  onPress: () => void;
  compact?: boolean;
}) {
  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: compact ? 0 : 170,
        paddingHorizontal: compact ? 16 : 22,
        paddingVertical: compact ? 11 : 15,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isPrimary
          ? "#2563eb"
          : isGhost
            ? "transparent"
            : "rgba(15, 27, 45, 0.9)",
        borderWidth: 1,
        borderColor: isPrimary
          ? "rgba(125, 211, 252, 0.45)"
          : isGhost
            ? "rgba(125, 211, 252, 0.18)"
            : "rgba(125, 211, 252, 0.14)",
        shadowColor: isPrimary ? "#38bdf8" : "#000000",
        shadowOpacity: isPrimary ? 0.22 : 0.08,
        shadowRadius: isPrimary ? 18 : 10,
        shadowOffset: { width: 0, height: isPrimary ? 10 : 4 },
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }, { translateY: pressed ? 1 : 0 }],
      })}
    >
      <Text
        style={{
          color: isPrimary ? "#f8fbff" : "#d9e9ff",
          fontSize: compact ? 13 : 15,
          fontWeight: "700",
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SiteSection({
  eyebrow,
  title,
  subtitle,
  padding,
  centered,
  children,
}: SiteSectionProps) {
  const layout = useResponsiveLayout();
  const sectionTopMargin = layout.isDesktop ? 124 : layout.isPhone ? 84 : 104;
  const titleSize = centered ? (layout.isPhone ? 34 : 44) : layout.isPhone ? 32 : 40;
  const titleLineHeight = centered ? (layout.isPhone ? 40 : 50) : layout.isPhone ? 38 : 46;
  const contentTopMargin = layout.isPhone ? 26 : 34;

  return (
    <View style={{ paddingHorizontal: padding, marginTop: sectionTopMargin }}>
      <View style={{ alignItems: centered ? "center" : "flex-start" }}>
        {eyebrow ? (
          <Text
            style={{
              color: "#67e8f9",
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Text>
        ) : null}

        <Text
          style={{
            color: "#f8fbff",
            fontSize: titleSize,
            fontWeight: "800",
            lineHeight: titleLineHeight,
            marginTop: eyebrow ? 14 : 0,
            maxWidth: 760,
            textAlign: centered ? "center" : "left",
          }}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={{
              color: "#9db2ca",
              fontSize: layout.isPhone ? 15 : 16,
              lineHeight: layout.isPhone ? 24 : 26,
              marginTop: layout.isPhone ? 12 : 14,
              maxWidth: 760,
              textAlign: centered ? "center" : "left",
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={{ marginTop: contentTopMargin }}>{children}</View>
    </View>
  );
}

export function GlassPanel({
  children,
  highlight,
  padding = 22,
  radius = 28,
}: {
  children: React.ReactNode;
  highlight?: boolean;
  padding?: number;
  radius?: number;
}) {
  return (
    <View
      style={{
        backgroundColor: highlight ? "rgba(15, 27, 45, 0.98)" : "rgba(15, 27, 45, 0.9)",
        borderRadius: radius,
        borderWidth: 1,
        borderColor: highlight ? "rgba(103, 232, 249, 0.26)" : "rgba(70, 102, 138, 0.34)",
        padding,
        shadowColor: highlight ? "#38bdf8" : "#000000",
        shadowOpacity: highlight ? 0.18 : 0.1,
        shadowRadius: highlight ? 24 : 12,
        shadowOffset: { width: 0, height: highlight ? 10 : 5 },
        overflow: "hidden",
      }}
    >
      {highlight ? <RunningSurfaceAccent variant="race" /> : null}
      {highlight ? <MarketingBackdrop tone="panel" /> : null}
      {children}
    </View>
  );
}

export function SectionChip({ label }: { label: string }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: "rgba(37, 99, 235, 0.16)",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(103, 232, 249, 0.18)",
        paddingHorizontal: 12,
        paddingVertical: 7,
      }}
    >
      <Text style={{ color: "#d6f7ff", fontSize: 12, fontWeight: "700", letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

export function MarketingIcon({
  label,
  active,
  icon,
}: {
  label: string;
  active?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: active ? "rgba(37, 99, 235, 0.2)" : "rgba(8, 17, 29, 0.72)",
        borderWidth: 1,
        borderColor: active ? "rgba(103, 232, 249, 0.28)" : "rgba(103, 232, 249, 0.12)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon ? (
        <Ionicons name={icon} size={20} color="#f8fbff" />
      ) : (
        <Text style={{ color: "#f8fbff", fontWeight: "800", fontSize: 15 }}>{label}</Text>
      )}
    </View>
  );
}

export function FooterLink({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => ({ opacity: hovered ? 0.92 : 1 })}>
      <Text style={{ color: "#d7e3f4", fontSize: 14, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

export function FooterSocialLink({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered, pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        alignSelf: "flex-start",
        opacity: pressed ? 0.88 : 1,
        transform: [{ translateY: hovered ? -1 : 0 }],
      })}
    >
      {({ hovered }) => (
        <>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: hovered ? "rgba(37, 99, 235, 0.18)" : "rgba(15, 27, 45, 0.92)",
              borderWidth: 1,
              borderColor: hovered ? "rgba(103, 232, 249, 0.24)" : "rgba(103, 232, 249, 0.12)",
              shadowColor: "#38bdf8",
              shadowOpacity: hovered ? 0.18 : 0.08,
              shadowRadius: hovered ? 16 : 8,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            <Ionicons name={icon} size={15} color={hovered ? "#dff8ff" : "#b8c8da"} />
          </View>
          <Text
            style={{
              color: hovered ? "#dff4ff" : "#a5b8cd",
              fontSize: 14,
              lineHeight: 20,
              fontWeight: "600",
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
