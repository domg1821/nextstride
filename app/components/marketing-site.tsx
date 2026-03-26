import React from "react";
import { Pressable, Text, View } from "react-native";

type SiteButtonProps = {
  label: string;
  variant?: "primary" | "secondary";
  onPress: () => void;
};

export function SiteButton({
  label,
  variant = "primary",
  onPress,
}: SiteButtonProps) {
  const primary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      style={{
        minWidth: 170,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primary ? "#2563eb" : "#10203a",
        borderWidth: primary ? 0 : 1,
        borderColor: primary ? "transparent" : "#22314a",
      }}
    >
      <Text
        style={{
          color: primary ? "#ffffff" : "#e2e8f0",
          fontSize: 15,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SiteSection({
  title,
  subtitle,
  children,
  padding,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  padding: number;
}) {
  return (
    <View style={{ paddingHorizontal: padding, marginTop: 54 }}>
      <Text style={{ color: "#f8fafc", fontSize: 34, fontWeight: "700" }}>{title}</Text>
      <Text
        style={{
          color: "#94a3b8",
          fontSize: 16,
          lineHeight: 24,
          marginTop: 10,
          maxWidth: 760,
        }}
      >
        {subtitle}
      </Text>
      <View style={{ marginTop: 22 }}>{children}</View>
    </View>
  );
}

export function FeatureCard({
  title,
  body,
  badge,
}: {
  title: string;
  body: string;
  badge: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "#10203a",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#22314a",
        padding: 22,
      }}
    >
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: "#dbeafe",
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}
      >
        <Text style={{ color: "#1d4ed8", fontSize: 12, fontWeight: "700" }}>{badge}</Text>
      </View>
      <Text
        style={{
          color: "#f8fafc",
          fontSize: 22,
          fontWeight: "700",
          marginTop: 18,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: "#94a3b8",
          fontSize: 15,
          lineHeight: 23,
          marginTop: 10,
        }}
      >
        {body}
      </Text>
    </View>
  );
}

export function StepCard({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 220,
        backgroundColor: "#10203a",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#22314a",
        padding: 22,
      }}
    >
      <Text style={{ color: "#60a5fa", fontSize: 12, fontWeight: "700" }}>{step}</Text>
      <Text
        style={{
          color: "#f8fafc",
          fontSize: 22,
          fontWeight: "700",
          marginTop: 14,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: "#94a3b8",
          fontSize: 15,
          lineHeight: 23,
          marginTop: 10,
        }}
      >
        {body}
      </Text>
    </View>
  );
}

export function PreviewCard({
  title,
  subtitle,
  accent,
  tall,
}: {
  title: string;
  subtitle: string;
  accent: string;
  tall?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 240,
        backgroundColor: "#10203a",
        borderRadius: 28,
        borderWidth: 1,
        borderColor: "#22314a",
        padding: 18,
        minHeight: tall ? 350 : 300,
      }}
    >
      <View
        style={{
          backgroundColor: "#09111f",
          borderRadius: 24,
          borderWidth: 1,
          borderColor: "#22314a",
          padding: 16,
          flex: 1,
        }}
      >
        <View
          style={{
            width: 84,
            height: 6,
            borderRadius: 999,
            backgroundColor: "#22314a",
            alignSelf: "center",
          }}
        />

        <Text
          style={{
            color: "#f8fafc",
            fontSize: 20,
            fontWeight: "700",
            marginTop: 18,
          }}
        >
          {title}
        </Text>

        <View
          style={{
            marginTop: 16,
            backgroundColor: "#10203a",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#22314a",
            padding: 14,
          }}
        >
          <Text style={{ color: accent, fontSize: 13, fontWeight: "700" }}>NEXTSTRIDE</Text>
          <Text
            style={{
              color: "#f8fafc",
              fontSize: 17,
              fontWeight: "700",
              marginTop: 8,
            }}
          >
            Product preview
          </Text>
          <Text
            style={{
              color: "#94a3b8",
              fontSize: 13,
              lineHeight: 20,
              marginTop: 6,
            }}
          >
            {subtitle}
          </Text>
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          {["Planned", "Logged", "Reviewed"].map((label) => (
            <View
              key={label}
              style={{
                backgroundColor: "#10203a",
                borderRadius: 16,
                padding: 12,
                borderWidth: 1,
                borderColor: "#1e3355",
              }}
            >
              <Text style={{ color: "#e2e8f0", fontWeight: "600" }}>{label}</Text>
              <Text style={{ color: "#64748b", marginTop: 4, fontSize: 13 }}>
                Calm, clear, and ready for daily use.
              </Text>
            </View>
          ))}
        </View>
      </View>
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
    <Pressable onPress={onPress}>
      <Text style={{ color: "#cbd5e1", fontSize: 14, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}
