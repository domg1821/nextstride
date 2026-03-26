import React from "react";
import { ScrollView, Text, View } from "react-native";
import { ThemeColors } from "../theme-context";

export function ScreenScroll({
  colors,
  children,
}: {
  colors: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 36,
        gap: 18,
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function SectionCard({
  colors,
  children,
  padded = true,
}: {
  colors: ThemeColors;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        padding: padded ? 18 : 0,
      }}
    >
      {children}
    </View>
  );
}

export function HeroCard({
  colors,
  eyebrow,
  title,
  subtitle,
  rightContent,
}: {
  colors: ThemeColors;
  eyebrow: string;
  title: string;
  subtitle: string;
  rightContent?: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.cardAlt,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 22,
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
          <Text
            style={{
              color: colors.primary,
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 28,
              fontWeight: "700",
              marginTop: 8,
              lineHeight: 34,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.subtext,
              fontSize: 15,
              lineHeight: 22,
              marginTop: 10,
            }}
          >
            {subtitle}
          </Text>
        </View>
        {rightContent}
      </View>
    </View>
  );
}

export function SectionTitle({
  colors,
  title,
  subtitle,
}: {
  colors: ThemeColors;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
