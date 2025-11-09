import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Dimensions, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STICKERS = [
  { key: "swiss_cheese", name: "Swiss Cheese", image: require("../assets/images/swiss_cheese.png"), type: "combined", easyThreshold: 700, hardThreshold: 300, rank: "Bronze" },
  { key: "apple", name: "Apple", image: require("../assets/images/apple.png"), type: "combined", easyThreshold: 850, hardThreshold: 500, rank: "Silver" },
  { key: "kitty", name: "Kitty", image: require("../assets/images/kitty.png"), type: "combined", easyThreshold: 1000, hardThreshold: 750, rank: "Gold" },
  { key: "magic_wand", name: "Magic Wand", image: require("../assets/images/magic_wand.png"), type: "combined", easyThreshold: 1150, hardThreshold: 1000, rank: "Diamond" },
  { key: "penguin", name: "Penguin", image: require("../assets/images/penguin.png"), type: "special", mode: "easy" },
  { key: "ember_flower", name: "Ember Flower", image: require("../assets/images/fire_flower.png"), type: "special", mode: "difficult" },
];

const STORAGE_KEY = "@sticker_unlocks";
const screenWidth = Dimensions.get("window").width;

const STICKER_COLORS = {
  Diamond: "#00CCFF",
  Gold: "#FFD700",
  Silver: "#ECECEC",
  Bronze: "#CD7F32",
  Special: "#4D0D89",
};

export default function TrophiesScreen({ navigation }) {
  const [unlocks, setUnlocks] = useState({});

  useEffect(() => {
    const fetchUnlocks = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      setUnlocks(saved ? JSON.parse(saved) : {});
    };
    fetchUnlocks();
  }, []);

  const isStickerUnlocked = (sticker) => {
    if (sticker.type === "combined") {
      return (unlocks.easyScore ?? 0) >= sticker.easyThreshold &&
             (unlocks.hardScore ?? 0) >= sticker.hardThreshold;
    }
    if (sticker.type === "special") {
      return sticker.mode === "easy"
        ? unlocks.lowestEasyAchieved ?? false
        : unlocks.lowestDifficultAchieved ?? false;
    }
    return false;
  };

  // Hide special stickers until unlocked
  const visibleStickers = STICKERS.filter((s) => {
    if (s.type === "special" && !isStickerUnlocked(s)) return false;
    return true;
  });

  const getStickerColor = (sticker) => {
    if (sticker.type === "special") return STICKER_COLORS.Special;
    return STICKER_COLORS[sticker.rank] ?? "#000";
  };

  const renderSticker = ({ item }) => {
    const unlocked = isStickerUnlocked(item);
    return (
      <View style={styles.stickerContainer}>
        <Image
          source={item.image}
          style={[
            styles.stickerImage,
            { opacity: unlocked ? 1 : 0.3, borderColor: unlocked ? "#FFD700" : "#aaa" },
          ]}
          resizeMode="contain"
        />
        <Text
          style={
            unlocked
              ? { color: getStickerColor(item), fontWeight: "bold", fontSize: 16, textAlign: "center" }
              : styles.stickerNameLocked
          }
        >
          {item.name}
        </Text>
        {item.type === "special" && unlocked && (
          <Text style={[styles.secretText, { color: STICKER_COLORS.Special }]}>Secret</Text>
        )}
        {unlocked && item.rank && (
          <Text style={[styles.rankText, { color: getStickerColor(item) }]}>{item.rank}</Text>
        )}
      </View>
    );
  };

  const clearProgress = async () => {
    Alert.alert(
      "Clear Progress",
      "Are you sure you want to clear all progress? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setUnlocks({});
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Stickers</Text>
      <FlatList
        data={visibleStickers}
        keyExtractor={(item) => item.key}
        numColumns={2}
        renderItem={renderSticker}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
      />
      <TouchableOpacity style={styles.button} onPress={clearProgress}>
        <Text style={styles.buttonText}>Clear Progress</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { marginTop: 10 }]}
        onPress={() => navigation.navigate("Start")}
      >
        <Text style={styles.buttonText}>Back to Start</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#230486", alignItems: "center", paddingTop: 50 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, color: "#fff" },
  gridContainer: { alignItems: "center", justifyContent: "center", paddingBottom: 40 },
  row: { justifyContent: "space-evenly", width: "100%" },
  stickerContainer: { alignItems: "center", justifyContent: "center", marginVertical: 20 },
  stickerImage: {
    width: screenWidth / 2.8,
    height: screenWidth / 2.8,
    borderWidth: 2,
    borderRadius: 16,
    marginBottom: 6,
  },
  stickerNameLocked: { fontWeight: "bold", color: "#888", fontSize: 16, textAlign: "center" },
  secretText: { fontSize: 14, fontWeight: "bold", marginTop: 2 },
  rankText: { fontSize: 14, fontWeight: "bold", marginTop: 2 },
  button: {
    backgroundColor: "#9A3EC6",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    width: "60%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
