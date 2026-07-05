import React, { useEffect } from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import DiamondPattern from "../components/DiamondPattern";

const STORAGE_KEY = "@sticker_unlocks";
const PENDING_KEY = "@pending_unlocks";

const BG_COLORS = ["#F03030", "#7A0000"];
const BTN_COLORS = ["#C75EE8", "#6B1F9A"];

export default function LoseScreen({ navigation, route }) {
  const { finalScore, timeTaken, isDifficultMode, pendingUnlocks = [] } = route.params ?? {};

  useEffect(() => {
    const updateScores = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const state = raw ? JSON.parse(raw) : {};

        if (Array.isArray(pendingUnlocks) && pendingUnlocks.length > 0) {
          await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pendingUnlocks));
        }

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn("Failed to update lose scores", e);
      }
    };

    updateScores();
  }, []);

  return (
    <LinearGradient colors={BG_COLORS} style={styles.container}>
      <DiamondPattern />
      <Text style={styles.title}>You Lost…</Text>
      <Text style={styles.text}>Score: {finalScore}</Text>
      <Text style={styles.text}>Time Taken: {timeTaken}s</Text>

      <TouchableOpacity onPress={() => navigation.navigate("Start")}>
        <LinearGradient colors={BTN_COLORS} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.button}>
          <Text style={styles.buttonText}>Back to Start</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 36, fontWeight: "bold", marginBottom: 20, color: "#fff" },
  text: { fontSize: 24, marginVertical: 5, color: "#fff" },
  button: {
    marginTop: 30,
    padding: 15,
    borderRadius: 12,
    width: 200,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
