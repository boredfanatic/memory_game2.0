// screens/ModeSelectionScreen.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ModeSelectionScreen({ navigation }) {
  const handleModeSelect = (isEasyMode) => {
    navigation.navigate("Countdown", { isEasyMode });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a Mode</Text>

      <TouchableOpacity
        style={[styles.button, styles.easyButton]}
        onPress={() => handleModeSelect(true)}
      >
        <Text style={styles.buttonText}>Easy Mode</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.hardButton]}
        onPress={() => handleModeSelect(false)}
      >
        <Text style={styles.buttonText}>Difficult Mode</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#230486", // purple like your design
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
    width: "70%",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 15,
  },
  easyButton: {
    backgroundColor: "#4CAF50", // green
  },
  hardButton: {
    backgroundColor: "#F44336", // red
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
});
