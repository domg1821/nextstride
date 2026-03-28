import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { InfoCard, PageHeader, PrimaryButton } from "./components/ui-kit";
import { ScreenScroll, SectionTitle } from "./components/ui-shell";
import { useThemeColors } from "./theme-context";
import { useWorkouts } from "./workout-context";

export default function GearScreen() {
  const { shoes, addShoe, getShoeMileage } = useWorkouts();
  const { colors } = useThemeColors();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");

  const handleAdd = () => {
    addShoe({
      name,
      brand,
      mileageAlert: 325,
    });
    setName("");
    setBrand("");
  };

  return (
    <ScreenScroll colors={colors}>
      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PageHeader
        eyebrow="Gear"
        title="Shoe tracking"
        subtitle="Keep your rotation simple with mileage totals, quick warnings, and a lightweight place to add pairs."
      />

      <InfoCard>
        <SectionTitle
          colors={colors}
          title="Add shoes"
          subtitle="A name is enough, but brand helps make the rotation easier to scan."
        />

        <Field colors={colors} label="Shoe name" value={name} placeholder="Daily Trainer" onChangeText={setName} />
        <Field colors={colors} label="Brand" value={brand} placeholder="Nike, Saucony, ASICS..." onChangeText={setBrand} />

        <View style={{ marginTop: 18 }}>
          <PrimaryButton label="Add Shoe" onPress={handleAdd} />
        </View>
      </InfoCard>

      <InfoCard>
        <SectionTitle
          colors={colors}
          title="Current rotation"
          subtitle="Mileage updates automatically when a logged run is assigned to a shoe."
        />

        <View style={{ marginTop: 16, gap: 12 }}>
          {shoes.map((shoe) => {
            const miles = getShoeMileage(shoe.id);
            const nearingLimit = miles >= (shoe.mileageAlert ?? 325);

            return (
              <View
                key={shoe.id}
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: nearingLimit ? colors.primary : colors.border,
                  padding: 16,
                  gap: 8,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                  {shoe.name}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 14 }}>
                  {shoe.brand || "Brand not added"}
                </Text>
                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>
                  {miles.toFixed(1)} mi
                </Text>
                <Text style={{ color: nearingLimit ? colors.primary : colors.subtext, fontSize: 13, fontWeight: "700" }}>
                  {nearingLimit ? "Mileage is getting high. Consider rotating or replacing soon." : `Alert at ${shoe.mileageAlert ?? 325} mi`}
                </Text>
              </View>
            );
          })}
        </View>
      </InfoCard>
    </ScreenScroll>
  );
}

function Field({
  colors,
  label,
  value,
  placeholder,
  onChangeText,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
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
