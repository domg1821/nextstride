import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { InfoCard, PageHeader, PrimaryButton } from "@/components/ui-kit";
import { ScreenScroll } from "@/components/ui-shell";
import { PRsType, useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";

export default function EditProfile() {
  const { profile, updateProfile } = useProfile();
  const { colors } = useThemeColors();
  const [form, setForm] = useState({
    name: profile.name,
    goalEvent: profile.goalEvent,
    mileage: profile.mileage,
    prs: profile.prs,
  });

  const closeScreen = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/settings");
  };

  const handleSave = () => {
    updateProfile({
      name: form.name,
      goalEvent: form.goalEvent,
      mileage: form.mileage,
      prs: form.prs,
      pr5k: form.prs["5k"],
    });
    closeScreen();
  };

  const updatePr = (key: keyof PRsType, value: string) => {
    setForm((current) => ({
      ...current,
      prs: {
        ...current.prs,
        [key]: value,
      },
    }));
  };

  return (
    <ScreenScroll colors={colors}>
      <Pressable onPress={closeScreen} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PageHeader
        eyebrow="Edit Profile"
        title="Your training identity"
        subtitle="This is the main place to update your personal info, training setup, and recent race times."
      />

      <InfoCard title="Personal Info" subtitle="Keep the basics up to date.">
        <Field
          colors={colors}
          label="Name"
          value={form.name}
          placeholder="Runner name"
          onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
        />
      </InfoCard>

      <InfoCard title="Training Info" subtitle="The fields your plans and progress views rely on most.">
        <Field
          colors={colors}
          label="Goal Event"
          value={form.goalEvent}
          placeholder="5k, 10k, half marathon..."
          onChangeText={(value) => setForm((current) => ({ ...current, goalEvent: value }))}
        />
        <Field
          colors={colors}
          label="Weekly Mileage Goal"
          value={form.mileage}
          placeholder="30"
          keyboardType="numeric"
          onChangeText={(value) => setForm((current) => ({ ...current, mileage: value }))}
        />
      </InfoCard>

      <InfoCard title="PRs / Recent Times" subtitle="Use recent race marks or best times to shape your training profile. Logged race efforts can also update these automatically when they are faster.">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <View style={{ width: "47.5%" }}>
            <Field colors={colors} label="400m" value={form.prs["400"]} placeholder="60" onChangeText={(value) => updatePr("400", value)} />
          </View>
          <View style={{ width: "47.5%" }}>
            <Field colors={colors} label="800m" value={form.prs["800"]} placeholder="2:12" onChangeText={(value) => updatePr("800", value)} />
          </View>
          <View style={{ width: "47.5%" }}>
            <Field colors={colors} label="1600m / Mile" value={form.prs["1600"]} placeholder="4:48" onChangeText={(value) => updatePr("1600", value)} />
          </View>
          <View style={{ width: "47.5%" }}>
            <Field colors={colors} label="3200m / 2 Mile" value={form.prs["3200"]} placeholder="10:30" onChangeText={(value) => updatePr("3200", value)} />
          </View>
          <View style={{ width: "47.5%" }}>
            <Field colors={colors} label="5K" value={form.prs["5k"]} placeholder="18:05" onChangeText={(value) => updatePr("5k", value)} />
          </View>
          <View style={{ width: "47.5%" }}>
            <Field colors={colors} label="10K" value={form.prs["10k"]} placeholder="38:15" onChangeText={(value) => updatePr("10k", value)} />
          </View>
          <View style={{ width: "47.5%" }}>
            <Field colors={colors} label="Half Marathon" value={form.prs.half} placeholder="1:25:00" onChangeText={(value) => updatePr("half", value)} />
          </View>
          <View style={{ width: "47.5%" }}>
            <Field colors={colors} label="Marathon" value={form.prs.marathon} placeholder="3:02:00" onChangeText={(value) => updatePr("marathon", value)} />
          </View>
        </View>
      </InfoCard>

      <PrimaryButton label="Save Profile" onPress={handleSave} />
    </ScreenScroll>
  );
}

function Field({
  colors,
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        keyboardType={keyboardType}
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 13,
          fontSize: 15,
        }}
      />
    </View>
  );
}
