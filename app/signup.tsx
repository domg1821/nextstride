import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        Create Account
      </Text>

      <Text style={{ color: "#94a3b8", marginTop: 8, marginBottom: 24 }}>
        Start training smarter with NextStride
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
        placeholder="Email"
        placeholderTextColor="#64748b"
        value={email}
        onChangeText={setEmail}
        style={{
          backgroundColor: "#1e293b",
          color: "white",
          padding: 16,
          borderRadius: 14,
          marginBottom: 14,
        }}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#64748b"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          backgroundColor: "#1e293b",
          color: "white",
          padding: 16,
          borderRadius: 14,
          marginBottom: 20,
        }}
      />

      <Pressable
        onPress={() => router.replace("/(tabs)")}
        style={{
          backgroundColor: "#2563eb",
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Create Account
        </Text>
      </Pressable>
    </View>
  );
}