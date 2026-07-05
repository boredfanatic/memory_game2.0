import React from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DiamondPattern from "../components/DiamondPattern";

const BG_COLORS = ["#4A18C2", "#0E0240"];
const BTN_COLORS = ["#C75EE8", "#6B1F9A"];

export default function ModeSelectionScreen({ navigation }) {
  const handleModeSelect = (isEasyMode) => {
    navigation.navigate("Countdown", { isEasyMode });
  };

  return (
    <LinearGradient colors={BG_COLORS} style={styles.container}>
      <DiamondPattern />
      <Text style={styles.title}>Choose a Mode</Text>

      <TouchableOpacity onPress={() => handleModeSelect(true)}>
        <LinearGradient colors={BTN_COLORS} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.button}>
          <Text style={styles.buttonText}>Easy Mode</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleModeSelect(false)}>
        <LinearGradient colors={BTN_COLORS} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.button}>
          <Text style={styles.buttonText}>Difficult Mode</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#fff",
  },
  button: {
    width: 240,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 15,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
});
