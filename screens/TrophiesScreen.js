import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ConfettiCannon from "react-native-confetti-cannon";
import { LinearGradient } from "expo-linear-gradient";
import DiamondPattern from "../components/DiamondPattern";

const STICKERS = [
  { key: "swiss_cheese", name: "Swiss Cheese", image: require("../assets/images/swiss_cheese.png"), type: "combined", easyThreshold: 1000, hardThreshold: 800, rank: "Bronze" },
  { key: "apple", name: "Apple", image: require("../assets/images/apple.png"), type: "combined", easyThreshold: 1080, hardThreshold: 880, rank: "Silver" },
  { key: "kitty", name: "Kitty", image: require("../assets/images/kitty.png"), type: "combined", easyThreshold: 1160, hardThreshold: 960, rank: "Gold" },
  { key: "magic_wand", name: "Magic Wand", image: require("../assets/images/magic_wand.png"), type: "combined", easyThreshold: 1200, hardThreshold: 1000, rank: "Diamond" },
  { key: "penguin", name: "Penguin", image: require("../assets/images/penguin.png"), type: "special", mode: "easy" },
  { key: "ember_flower", name: "Ember Flower", image: require("../assets/images/fire_flower.png"), type: "special", mode: "difficult" },
];

const STORAGE_KEY = "@sticker_unlocks";
const ANIMATED_KEY = "@unlock_animations_done";
const screenWidth = Dimensions.get("window").width;

const STICKER_COLORS = {
  Diamond: "#00CCFF",
  Gold:    "#FFD700",
  Silver:  "#ECECEC",
  Bronze:  "#CD7F32",
  Special: "#4D0D89",
};

const BG_COLORS = ["#4A18C2", "#0E0240"];
const BTN_COLORS = ["#C75EE8", "#6B1F9A"];

export default function TrophiesScreen({ navigation }) {
  const [unlocks, setUnlocks] = useState({});
  const [animDone, setAnimDone] = useState({});

  const animRefs = {};
  STICKERS.forEach((s) => (animRefs[s.key] = useRef(null)));
  const pendingAnimQueue = useRef([]);

  useEffect(() => {
    const fetchData = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const savedAnim = await AsyncStorage.getItem(ANIMATED_KEY);
      const unlockData = saved ? JSON.parse(saved) : {};
      const animData = savedAnim ? JSON.parse(savedAnim) : {};
      setUnlocks(unlockData);
      setAnimDone(animData);

      const newUnlocks = STICKERS.filter(
        (s) => isStickerUnlockedStatic(s, unlockData) && !animData[s.key]
      );

      // Queue all but the first; each animation triggers the next on completion
      if (newUnlocks.length > 0) {
        pendingAnimQueue.current = newUnlocks.slice(1);
        setTimeout(() => {
          animRefs[newUnlocks[0].key]?.current?.startUnlockAnimation();
        }, 300);
      }
    };
    fetchData();
  }, []);

  const saveAnimState = async (key) => {
    const updated = { ...animDone, [key]: true };
    setAnimDone(updated);
    await AsyncStorage.setItem(ANIMATED_KEY, JSON.stringify(updated));

    // Start the next queued animation once this one is fully saved
    const next = pendingAnimQueue.current.shift();
    if (next) {
      setTimeout(() => {
        animRefs[next.key]?.current?.startUnlockAnimation();
      }, 500);
    }
  };

  const isStickerUnlockedStatic = (sticker, unlockData) => {
    if (sticker.type === "combined") {
      return (
        (unlockData.easyScore ?? 0) >= sticker.easyThreshold &&
        (unlockData.hardScore ?? 0) >= sticker.hardThreshold
      );
    }
    if (sticker.type === "special") {
      return sticker.mode === "easy"
        ? unlockData.lowestEasyAchieved ?? false
        : unlockData.lowestDifficultAchieved ?? false;
    }
    return false;
  };

  const isStickerUnlocked = (sticker) =>
    isStickerUnlockedStatic(sticker, unlocks);

  const getStickerColor = (sticker) =>
    sticker.type === "special"
      ? STICKER_COLORS.Special
      : STICKER_COLORS[sticker.rank] ?? "#000";

  return (
    <LinearGradient colors={BG_COLORS} style={styles.container}>
      <DiamondPattern />
      <Text style={styles.title}>Your Stickers</Text>

      <View style={styles.grid}>
        {STICKERS.map((item) => {
          const unlocked = isStickerUnlocked(item);
          return (
            <StickerCard
              key={item.key}
              ref={animRefs[item.key]}
              sticker={item}
              unlocked={unlocked}
              alreadyAnimated={animDone[item.key]}
              onAnimationComplete={() => saveAnimState(item.key)}
              getStickerColor={getStickerColor}
            />
          );
        })}
      </View>

      <TouchableOpacity
        onPress={() => {
          Alert.alert(
            "Clear Progress",
            "Are you sure you want to clear all progress? This cannot be undone.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Yes",
                onPress: async () => {
                  await AsyncStorage.removeItem(STORAGE_KEY);
                  await AsyncStorage.removeItem(ANIMATED_KEY);
                  setUnlocks({});
                  setAnimDone({});
                },
              },
            ]
          );
        }}
      >
        <LinearGradient colors={BTN_COLORS} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.button}>
          <Text style={styles.buttonText}>Clear Progress</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 10 }}
        onPress={() => navigation.navigate("Start")}
      >
        <LinearGradient colors={BTN_COLORS} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.button}>
          <Text style={styles.buttonText}>Back to Start</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const StickerCard = React.forwardRef(
  ({ sticker, unlocked, alreadyAnimated, onAnimationComplete, getStickerColor }, ref) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const unlockOpacity = useRef(new Animated.Value(1)).current;
    const [showConfetti, setShowConfetti] = useState(false);

    const [wasUnlocked, setWasUnlocked] = useState(alreadyAnimated);

    React.useImperativeHandle(ref, () => ({
      startUnlockAnimation: () => {
        if (!unlocked || wasUnlocked) return;

        setWasUnlocked(true);
        setShowConfetti(true);

        const sequence = [
          Animated.timing(shakeAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -5, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1.3, friction: 3, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
          Animated.timing(unlockOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ];

        const runStep = (index) => {
          if (index >= sequence.length) {
            setShowConfetti(false);
            onAnimationComplete?.();
            return;
          }
          sequence[index].start(() => setTimeout(() => runStep(index + 1), 500));
        };

        runStep(0);
      },
    }));

    const translateX = shakeAnim.interpolate({
      inputRange: [-5, 5],
      outputRange: [-5, 5],
    });

    return (
      <Animated.View
        style={[styles.stickerContainer, { transform: [{ translateX }, { scale: scaleAnim }] }]}
      >
        <View>
          <Image
            source={sticker.image}
            style={[
              styles.stickerImage,
              { opacity: unlocked ? 1 : 0.25, borderColor: unlocked ? "#FFD700" : "#666" },
            ]}
          />
          {!unlocked && <Image source={require("../assets/lock.png")} style={styles.lockOverlay} />}
          {unlocked && !alreadyAnimated && (
            <Animated.Image
              source={require("../assets/unlock.png")}
              style={[styles.lockOverlay, { opacity: unlockOpacity }]}
            />
          )}
        </View>

        <Text style={[styles.stickerText, { color: unlocked ? getStickerColor(sticker) : "#888" }]}>
          {sticker.name}
        </Text>

        {sticker.type === "special" && unlocked && (
          <Text style={[styles.secretText, { color: STICKER_COLORS.Special }]}>Secret</Text>
        )}
        {unlocked && sticker.rank && (
          <Text style={[styles.rankText, { color: getStickerColor(sticker) }]}>{sticker.rank}</Text>
        )}

        {showConfetti && <ConfettiCannon count={50} origin={{ x: screenWidth / 2, y: -10 }} fadeOut />}
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 50 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, color: "#fff" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  stickerContainer: { alignItems: "center", justifyContent: "center", marginVertical: 10, width: screenWidth / 3 - 10 },
  stickerImage: { width: screenWidth / 3.5, height: screenWidth / 3.5, borderWidth: 2, borderRadius: 16, marginBottom: 4 },
  lockOverlay: { position: "absolute", top: "25%", left: "25%", width: "50%", height: "50%" },
  stickerText: { fontWeight: "bold", fontSize: 14, textAlign: "center" },
  secretText: { fontSize: 13, fontWeight: "bold", marginTop: 1 },
  rankText: { fontSize: 13, fontWeight: "bold", marginTop: 1 },
  button: { padding: 14, borderRadius: 12, width: 200, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
