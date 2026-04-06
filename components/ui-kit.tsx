import React from "react";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/contexts/theme-context";
import { ThemeTokens } from "@/constants/theme";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  rightContent,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}) {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: colors.cardAlt,
        borderRadius: ThemeTokens.radii.lg,
        padding: ThemeTokens.spacing.l,
        ...ThemeTokens.shadows.low,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <Text
              style={{
                color: colors.primary,
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 1.1,
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </Text>
          ) : null}

          <Text
            style={{
              color: colors.text,
              fontSize: 30,
              fontWeight: "800",
              marginTop: eyebrow ? ThemeTokens.spacing.s : 0,
              lineHeight: 36,
            }}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={{
                color: colors.subtext,
                fontSize: 15,
                lineHeight: 23,
                marginTop: ThemeTokens.spacing.m,
                maxWidth: 560,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightContent}
      </View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.primary,
        paddingHorizontal: ThemeTokens.spacing.m,
        paddingVertical: ThemeTokens.spacing.s + 7,
        borderRadius: ThemeTokens.radii.md,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "700" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        paddingHorizontal: ThemeTokens.spacing.m,
        paddingVertical: ThemeTokens.spacing.s + 7,
        borderRadius: ThemeTokens.radii.md,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function InfoCard({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: ThemeTokens.radii.lg,
        padding: ThemeTokens.spacing.m,
        ...ThemeTokens.shadows.low,
      }}
    >
      {title ? (
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
          {title}
        </Text>
      ) : null}

      {subtitle ? (
        <Text
          style={{
            color: colors.subtext,
            fontSize: 14,
            lineHeight: 20,
            marginTop: title ? 6 : 0,
          }}
        >
          {subtitle}
        </Text>
      ) : null}

      {children ? <View style={{ marginTop: title || subtitle ? 14 : 0 }}>{children}</View> : null}
    </View>
  );
}

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: ThemeTokens.radii.lg,
        padding: ThemeTokens.spacing.m,
        ...ThemeTokens.shadows.low,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: 13 }}>{label}</Text>
      <Text
        style={{
          color: colors.text,
          fontSize: 24,
          fontWeight: "700",
          marginTop: 8,
        }}
      >
        {value}
      </Text>
      {helper ? (
        <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 6 }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
