import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useProfile } from "@/contexts/profile-context";

export default function Onboarding() {
  const { updateProfile } = useProfile();
  const [name, setName] = useState("");
  const [mileage, setMileage] = useState("");
  const [goalEvent, setGoalEvent] = useState("");
  const [pr5k, setPr5k] = useState("");

  const handleContinue = () => {
    updateProfile({
      name,
      mileage,
      goalEvent,
      pr5k,
      prs: {
        "400": "",
        "800": "",
        "1600": "",
        "3200": "",
        "5k": pr5k,
        "10k": "",
        half: "",
        marathon: "",
      },
    });

    router.replace("/(tabs)");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0f172a",
        padding: 24,
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontSize: 32, fontWeight: "bold" }}>
        Welcome to NextStride
      </Text>

      <Text style={{ color: "#94a3b8", marginTop: 8, marginBottom: 24 }}>
        Let&apos;s build your training profile
      </Text>

      <TextInput
        placeholder="Name"
        placeholderTextColor="#64748b"
        value={name}
        onChangeText={setName}
        style={{
          backgroundColor: "#1e293b",
          color: "white",
          padding: 16,
          borderRadius: 14,
          marginBottom: 14,
        }}
      />

      <TextInput
        placeholder="Weekly Mileage"
        placeholderTextColor="#64748b"
        value={mileage}
        onChangeText={setMileage}
        keyboardType="numeric"
        style={{
          backgroundColor: "#1e293b",
          color: "white",
          padding: 16,
          borderRadius: 14,
          marginBottom: 14,
        }}
      />

      <TextInput
        placeholder="Goal Event (800, 1600, 5k, 10k...)"
        placeholderTextColor="#64748b"
        value={goalEvent}
        onChangeText={setGoalEvent}
        style={{
          backgroundColor: "#1e293b",
          color: "white",
          padding: 16,
          borderRadius: 14,
          marginBottom: 14,
        }}
      />

      <TextInput
        placeholder="5k PR (example: 16:53)"
        placeholderTextColor="#64748b"
        value={pr5k}
        onChangeText={setPr5k}
        style={{
          backgroundColor: "#1e293b",
          color: "white",
          padding: 16,
          borderRadius: 14,
          marginBottom: 20,
        }}
      />

      <Pressable
        onPress={handleContinue}
        style={{
          backgroundColor: "#2563eb",
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Continue
        </Text>
      </Pressable>
    </View>
  );
}
