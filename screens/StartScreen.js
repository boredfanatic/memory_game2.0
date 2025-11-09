import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_KEY = "@pending_unlocks";

// Ranking order for sequential popups
const STICKER_ORDER = ["Bronze", "Silver", "Gold", "Platinum", "Secret"];

export default function StartScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const showPendingUnlocks = async () => {
      try {
        const raw = await AsyncStorage.getItem(PENDING_KEY);
        const pending = raw ? JSON.parse(raw) : [];

        if (pending.length > 0) {
          // Sort pending by defined rank order
          const sorted = pending.sort((a, b) => {
            const rankA = STICKER_ORDER.find(r => a.includes(r)) || "Secret";
            const rankB = STICKER_ORDER.find(r => b.includes(r)) || "Secret";
            return STICKER_ORDER.indexOf(rankA) - STICKER_ORDER.indexOf(rankB);
          });

          // Show popups one by one
          for (const sticker of sorted) {
            await new Promise(resolve => {
              Alert.alert("🎉 New Sticker Unlocked!", sticker, [{ text: "OK", onPress: resolve }]);
            });
            await new Promise(r => setTimeout(r, 400)); // small delay
          }

          // Clear pending after showing
          await AsyncStorage.setItem(PENDING_KEY, JSON.stringify([]));
        }
      } catch (e) {
        console.warn("Failed to show pending unlocks", e);
      }
    };

    showPendingUnlocks();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Memory Game</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ModeSelection")}
      >
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Trophies")}
      >
        <Text style={styles.buttonText}>Trophies</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#230486", justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 36, fontWeight: "bold", color: "white", marginBottom: 60 },
  button: { backgroundColor: "#9A3EC6", paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, marginVertical: 10 },
  buttonText: { fontSize: 20, color: "white", fontWeight: "bold" },
});
