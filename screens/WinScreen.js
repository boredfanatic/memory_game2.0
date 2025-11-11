import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@sticker_unlocks";
const PENDING_KEY = "@pending_unlocks";

export default function WinScreen({ navigation, route }) {
  const { finalScore, timeTaken, isDifficultMode, pendingUnlocks = [] } = route.params ?? {};

  useEffect(() => {
    const updateScores = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const state = raw ? JSON.parse(raw) : {};

        if (isDifficultMode) {
          state.hardScore = Math.max(state.hardScore ?? 0, finalScore);
        } else {
          state.easyScore = Math.max(state.easyScore ?? 0, finalScore);
        }

        // Save pending unlocks (but don't display popups here)
        if (Array.isArray(pendingUnlocks) && pendingUnlocks.length > 0) {
          await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pendingUnlocks));
        }

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn("Failed to update win scores", e);
      }
    };

    updateScores();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: "#6DE2A0" }]}>
      <Text style={styles.title}>You Won!</Text>
      <Text style={styles.text}>Score: {finalScore}</Text>
      <Text style={styles.text}>Time Taken: {timeTaken}s</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Start")}
      >
        <Text style={styles.buttonText}>Back to Start</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 36, fontWeight: "bold", marginBottom: 20, color: "#fff" },
  text: { fontSize: 24, marginVertical: 5, color: "#fff" },
  button: {
    marginTop: 30,
    backgroundColor: "#9A3EC6",
    padding: 15,
    borderRadius: 12,
    width: "60%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
