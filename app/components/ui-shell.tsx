import React from "react";
import { ScrollView, Text, View } from "react-native";
import { ThemeColors } from "../theme-context";

export function AnimatedTabScene({
  tabKey,
  children,
}: {
  tabKey?: string;
  children: React.ReactNode;
}) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

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
        paddingTop: 18,
        paddingBottom: 40,
        gap: 20,
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
        borderRadius: 26,
        borderWidth: 1,
        borderColor: colors.border,
        padding: padded ? 20 : 0,
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
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 24,
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
              fontWeight: "800",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 30,
              fontWeight: "800",
              marginTop: 10,
              lineHeight: 36,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.subtext,
              fontSize: 15,
              lineHeight: 23,
              marginTop: 12,
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
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
