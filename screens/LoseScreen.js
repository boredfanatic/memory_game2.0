import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@sticker_unlocks";
const PENDING_KEY = "@pending_unlocks";

export default function LoseScreen({ navigation, route }) {
  const { finalScore, timeTaken, isDifficultMode } = route.params;

  useEffect(() => {
    const updateScores = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const state = raw ? JSON.parse(raw) : {};
        const pendingRaw = await AsyncStorage.getItem(PENDING_KEY);
        const pending = pendingRaw ? JSON.parse(pendingRaw) : [];

        if (isDifficultMode) {
          const lowest = state.lowestDifficult ?? Infinity;
          if (finalScore < lowest) {
            state.lowestDifficult = finalScore;
            if (!state.lowestDifficultAchieved) {
              state.lowestDifficultAchieved = true;
              pending.push("Ember Flower 🔥");
            }
          }
        } else {
          const lowest = state.lowestEasy ?? Infinity;
          if (finalScore < lowest) {
            state.lowestEasy = finalScore;
            if (!state.lowestEasyAchieved) {
              state.lowestEasyAchieved = true;
              pending.push("Penguin 🐧");
            }
          }
        }

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
      } catch (e) {
        console.warn("Failed to update lose scores", e);
      }
    };

    updateScores();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: "#CC1212" }]}>
      <Text style={styles.title}>You Lost…</Text>
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
    backgroundColor: "#230486",
    padding: 15,
    borderRadius: 12,
    width: "60%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
