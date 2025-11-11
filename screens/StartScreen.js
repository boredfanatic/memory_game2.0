import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_KEY = "@pending_unlocks";

const TROPHY_FRIENDLY = {
  swiss_cheese: { rank: "Bronze", emoji: "🥉" },
  apple: { rank: "Silver", emoji: "🥈" },
  kitty: { rank: "Gold", emoji: "🥇" },
  magic_wand: { rank: "Diamond", emoji: "💎" },
  penguin: { rank: "Secret", emoji: "🐧" },
  ember_flower: { rank: "Secret", emoji: "🔥" },
};

const BUTTON_COLOR = "#9A3EC6";

export default function StartScreen() {
  const navigation = useNavigation();
  const [queue, setQueue] = useState([]);
  const [currentKey, setCurrentKey] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadPending = async () => {
      try {
        const raw = await AsyncStorage.getItem(PENDING_KEY);
        const pending = raw ? JSON.parse(raw) : [];

        if (Array.isArray(pending) && pending.length > 0) {
          setQueue(pending);
        }
      } catch (e) {
        console.warn("Failed to load pending unlocks", e);
      }
    };

    loadPending();
  }, []);

  useEffect(() => {
    if (queue.length > 0 && !popupVisible) {
      setCurrentKey(queue[0]);
      setPopupVisible(true);
      fadeIn();
    }
  }, [queue, popupVisible]);

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  const fadeOut = (callback) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.in(Easing.cubic),
    }).start(callback);
  };

  const handleDismiss = async () => {
    fadeOut(async () => {
      const newQueue = queue.slice(1);
      setPopupVisible(false);
      setQueue(newQueue);
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(newQueue));

      if (newQueue.length > 0) {
        setTimeout(() => {
          setCurrentKey(newQueue[0]);
          setPopupVisible(true);
          fadeIn();
        }, 500);
      }
    });
  };

  const trophy = currentKey ? TROPHY_FRIENDLY[currentKey] : null;
  const popupText = trophy
    ? `🏆 You won the ${trophy.rank} Trophy! ${trophy.emoji}`
    : "🏆 New Unlock!";

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

      {popupVisible && (
        <Animated.View style={[modalStyles.overlay, { opacity: fadeAnim }]}>
          <View style={[modalStyles.popup, { backgroundColor: BUTTON_COLOR }]}>
            <TouchableOpacity style={modalStyles.close} onPress={handleDismiss}>
              <Text style={modalStyles.closeText}>✖</Text>
            </TouchableOpacity>

            <Text style={modalStyles.titleText}>🎉 New Unlock!</Text>
            <Text style={modalStyles.bodyText}>{popupText}</Text>

            <TouchableOpacity style={modalStyles.okButton} onPress={handleDismiss}>
              <Text style={modalStyles.okText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#230486", justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 36, fontWeight: "bold", color: "white", marginBottom: 60 },
  button: { backgroundColor: BUTTON_COLOR, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, marginVertical: 10 },
  buttonText: { fontSize: 20, color: "white", fontWeight: "bold" },
});

const modalStyles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  popup: { width: "80%", borderRadius: 14, padding: 20, alignItems: "center" },
  close: { position: "absolute", top: 8, right: 10, zIndex: 2 },
  closeText: { color: "#fff", fontSize: 20 },
  titleText: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 10 },
  bodyText: { color: "#fff", fontSize: 16, textAlign: "center", marginBottom: 18 },
  okButton: { backgroundColor: "#ffffff20", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  okText: { color: "#fff", fontWeight: "700" },
});
