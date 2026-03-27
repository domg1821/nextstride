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
      style={({ pressed }) => ({
        minWidth: 168,
        paddingHorizontal: 22,
        paddingVertical: 15,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primary ? "#3b82f6" : "rgba(10, 22, 38, 0.78)",
        borderWidth: 1,
        borderColor: primary ? "#60a5fa" : "rgba(148, 163, 184, 0.16)",
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Text
        style={{
          color: primary ? "#f8fbff" : "#dbeafe",
          fontSize: 15,
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
  children,
  padding,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  padding: number;
}) {
  return (
    <View style={{ paddingHorizontal: padding, marginTop: 92 }}>
      {eyebrow ? (
        <Text
          style={{
            color: "#7dd3fc",
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 1.4,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </Text>
      ) : null}

      <Text
        style={{
          color: "#f8fafc",
          fontSize: 40,
          fontWeight: "800",
          marginTop: eyebrow ? 12 : 0,
          maxWidth: 760,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: "#9fb2cb",
          fontSize: 16,
          lineHeight: 26,
          marginTop: 14,
          maxWidth: 720,
        }}
      >
        {subtitle}
      </Text>
      <View style={{ marginTop: 32 }}>{children}</View>
    </View>
  );
}

export function FeatureCard({
  title,
  body,
  badge,
  icon,
}: {
  title: string;
  body: string;
  badge: string;
  icon: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(10, 22, 37, 0.74)",
        borderRadius: 28,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.1)",
        padding: 22,
        minHeight: 198,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "rgba(59, 130, 246, 0.18)",
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: "#93c5fd", fontSize: 12, fontWeight: "700" }}>{badge}</Text>
        </View>

        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: "rgba(8, 15, 28, 0.78)",
            borderWidth: 1,
            borderColor: "rgba(96, 165, 250, 0.12)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#bfdbfe", fontSize: 17, fontWeight: "700" }}>{icon}</Text>
        </View>
      </View>

      <Text
        style={{
          color: "#f8fafc",
          fontSize: 21,
          fontWeight: "700",
          marginTop: 18,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: "#9fb2cb",
          fontSize: 15,
          lineHeight: 22,
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
        backgroundColor: "rgba(10, 22, 37, 0.72)",
        borderRadius: 26,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.1)",
        padding: 22,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 16,
          backgroundColor: "rgba(59, 130, 246, 0.18)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#93c5fd", fontSize: 13, fontWeight: "800" }}>{step}</Text>
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
          color: "#9fb2cb",
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
        backgroundColor: "rgba(10, 22, 37, 0.72)",
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.1)",
        padding: 18,
        minHeight: tall ? 370 : 300,
      }}
    >
      <View
        style={{
          backgroundColor: "#081220",
          borderRadius: 25,
          borderWidth: 1,
          borderColor: "rgba(96, 165, 250, 0.1)",
          padding: 16,
          flex: 1,
        }}
      >
        <View
          style={{
            width: 84,
            height: 6,
            borderRadius: 999,
            backgroundColor: "rgba(148, 163, 184, 0.22)",
            alignSelf: "center",
          }}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 18,
          }}
        >
          <Text
            style={{
              color: "#f8fafc",
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            {title}
          </Text>
          <View
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.14)",
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: accent, fontSize: 11, fontWeight: "700" }}>LIVE PREVIEW</Text>
          </View>
        </View>

        <Text
          style={{
            color: "#9fb2cb",
            fontSize: 14,
            lineHeight: 21,
            marginTop: 8,
          }}
        >
          {subtitle}
        </Text>

        <View
          style={{
            marginTop: 18,
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            borderRadius: 20,
            borderWidth: 1,
              borderColor: "rgba(96, 165, 250, 0.08)",
              padding: 16,
            }}
          >
          <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>NextStride</Text>
          <Text
            style={{
              color: "#f8fafc",
              fontSize: 16,
              fontWeight: "700",
              marginTop: 8,
            }}
          >
            Product preview
          </Text>
          <Text
            style={{
              color: "#9fb2cb",
              fontSize: 13,
              lineHeight: 20,
              marginTop: 6,
            }}
          >
            Premium structure, cleaner focus, and a daily flow built for runners.
          </Text>
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          {["Today", "This week", "Training notes"].map((label, index) => (
            <View
              key={label}
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                borderRadius: 18,
                padding: 12,
                borderWidth: 1,
                borderColor: "rgba(96, 165, 250, 0.08)",
              }}
            >
              <Text style={{ color: "#e2e8f0", fontWeight: "600" }}>{label}</Text>
              <Text style={{ color: "#64748b", marginTop: 4, fontSize: 13 }}>
                {index === 0
                  ? "Clear priorities and workout focus."
                  : index === 1
                    ? "A week that feels structured, not random."
                    : "Context that keeps the plan useful."}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function WeeklyPlanPreview({
  days,
}: {
  days: { day: string; title: string; detail: string }[];
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(14, 27, 48, 0.92)",
        borderRadius: 34,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.14)",
        padding: 22,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <View>
          <Text style={{ color: "#f8fafc", fontSize: 28, fontWeight: "800" }}>Demo Week</Text>
          <Text style={{ color: "#9fb2cb", fontSize: 14, marginTop: 6 }}>
            A polished view of how NextStride organizes your training.
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.14)",
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
          }}
        >
          <Text style={{ color: "#93c5fd", fontSize: 12, fontWeight: "700" }}>7-DAY VIEW</Text>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        {days.map((item, index) => (
          <View
            key={item.day}
            style={{
              backgroundColor: "#081220",
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "rgba(96, 165, 250, 0.1)",
              padding: 16,
              flexDirection: "row",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: index === 5 ? "rgba(34, 197, 94, 0.18)" : "rgba(59, 130, 246, 0.18)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#e0f2fe", fontSize: 13, fontWeight: "800" }}>
                {item.day.slice(0, 3).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: "#f8fafc", fontSize: 17, fontWeight: "700" }}>
                {item.title}
              </Text>
              <Text
                style={{
                  color: "#9fb2cb",
                  fontSize: 14,
                  lineHeight: 21,
                  marginTop: 6,
                }}
              >
                {item.detail}
              </Text>
            </View>
          </View>
        ))}
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
    <Pressable onPress={onPress} style={{ opacity: 1 }}>
      <Text style={{ color: "#d7e3f4", fontSize: 14, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}
