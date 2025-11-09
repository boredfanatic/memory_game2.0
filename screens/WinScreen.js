import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@sticker_unlocks";
const PENDING_KEY = "@pending_unlocks";

export default function WinScreen({ navigation, route }) {
  const { finalScore, timeTaken, isDifficultMode } = route.params;

  useEffect(() => {
    const updateScores = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const state = raw ? JSON.parse(raw) : {};
        const pendingRaw = await AsyncStorage.getItem(PENDING_KEY);
        const pending = pendingRaw ? JSON.parse(pendingRaw) : [];

        // Update mode score
        if (isDifficultMode) {
          state.hardScore = Math.max(state.hardScore ?? 0, finalScore);
        } else {
          state.easyScore = Math.max(state.easyScore ?? 0, finalScore);
        }

        // Combined trophies
        const combinedTrophies = [
          { name: "Bronze", easyThreshold: 370, hardThreshold: 50 },
          { name: "Silver", easyThreshold: 670, hardThreshold: 200 },
          { name: "Gold", easyThreshold: 970, hardThreshold: 600 },
          { name: "Diamond", easyThreshold: 1270, hardThreshold: 1000 },
        ];

        combinedTrophies.forEach((t) => {
          if (
            (state.easyScore ?? 0) >= t.easyThreshold &&
            (state.hardScore ?? 0) >= t.hardThreshold &&
            !state[t.name]
          ) {
            state[t.name] = true; // mark as unlocked
            pending.push(`${t.name} Trophy 🏆`);
          }
        });

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
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
  title: { fontSize: 36, fontWeight: "bold", marginBottom: 20 },
  text: { fontSize: 24, marginVertical: 5 },
  button: {
    marginTop: 30,
    backgroundColor: "#230486",
    padding: 15,
    borderRadius: 12,
    width: "60%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
