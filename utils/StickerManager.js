// utils/StickerManager.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const STICKERS = {
  Diamond: { type: "combined", icon: "magic_wand.png" },
  Gold: { type: "combined", icon: "kitty.png" },
  Silver: { type: "combined", icon: "apple.png" },
  Bronze: { type: "combined", icon: "swiss_cheese.png" },
  Penguin: { type: "secret_easy", icon: "penguin.png" },
  FireFlower: { type: "secret_difficult", icon: "fire_flower.png" },
};

export async function handleStickerUnlocks(isEasyMode, finalScore, isLose = false) {
  try {
    const saved = await AsyncStorage.getItem("@sticker_unlocks");
    const state = saved ? JSON.parse(saved) : {};

    // Update high/low scores
    if (isEasyMode) {
      state.easyScore = Math.max(state.easyScore ?? 0, finalScore);
      if (isLose) {
        const lowest = state.lowestEasy ?? Infinity;
        if (finalScore < lowest) state.lowestEasy = finalScore;
      }
    } else {
      state.hardScore = Math.max(state.hardScore ?? 0, finalScore);
      if (isLose) {
        const lowest = state.lowestDifficult ?? Infinity;
        if (finalScore < lowest) state.lowestDifficult = finalScore;
      }
    }

    const unlocks = [];

    // Combined trophies
    const combinedTrophies = [
      { name: "Diamond", easyThreshold: 1270, hardThreshold: 1000 },
      { name: "Gold", easyThreshold: 970, hardThreshold: 600 },
      { name: "Silver", easyThreshold: 670, hardThreshold: 200 },
      { name: "Bronze", easyThreshold: 370, hardThreshold: 50 },
    ];

    combinedTrophies.forEach(t => {
      if ((state.easyScore ?? 0) >= t.easyThreshold &&
          (state.hardScore ?? 0) >= t.hardThreshold &&
          !state[t.name]) {
        state[t.name] = true;
        unlocks.push(t.name);
      }
    });

    // Secret trophies
    if ((isLose || !isLose) && isEasyMode) {
      if ((state.lowestEasy ?? Infinity) === finalScore && !state.Penguin) {
        state.Penguin = true;
        unlocks.push("Penguin");
      }
    }
    if ((isLose || !isLose) && !isEasyMode) {
      if ((state.lowestDifficult ?? Infinity) === finalScore && !state.FireFlower) {
        state.FireFlower = true;
        unlocks.push("FireFlower");
      }
    }

    await AsyncStorage.setItem("@sticker_unlocks", JSON.stringify(state));

    // Show alerts
    unlocks.forEach(name => {
      Alert.alert("Sticker Unlocked!", `You unlocked the ${name} sticker!`);
    });

    return state;
  } catch (e) {
    console.warn("StickerManager error:", e);
    return {};
  }
}

// Utility to get current unlocked stickers
export async function getUnlockedStickers() {
  try {
    const saved = await AsyncStorage.getItem("@sticker_unlocks");
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}
