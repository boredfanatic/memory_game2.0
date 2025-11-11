import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Images
import appleImg from "../assets/images/apple.png";
import fireFlowerImg from "../assets/images/fire_flower.png";
import kittyImg from "../assets/images/kitty.png";
import magicWandImg from "../assets/images/magic_wand.png";
import penguinImg from "../assets/images/penguin.png";
import questionImg from "../assets/images/question_mark.png";
import swissCheeseImg from "../assets/images/swiss_cheese.png";

const TOTAL_TIME = 120;
const BASE_SCORE = 1000;
const TIME_DEDUCTION = { easy: 30, difficult: 60 };
const MATCH_REWARD = {
  easy: { firstTry: 60, afterError: 30 },
  difficult: { firstTry: 30, afterError: 15 },
};

const CARD_IMAGES = [
  { name: "Apple", img: appleImg },
  { name: "Fire Flower", img: fireFlowerImg },
  { name: "Kitty", img: kittyImg },
  { name: "Magic Wand", img: magicWandImg },
  { name: "Penguin", img: penguinImg },
  { name: "Swiss Cheese", img: swissCheeseImg },
];

const TILE_BG = "#9A3EC6";

function shuffleArray(array) {
  const arr = [...array, ...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const THEORETICAL_MIN = {
  easy: () => BASE_SCORE - Math.floor(TOTAL_TIME / 10) * TIME_DEDUCTION.easy,
  difficult: () =>
    BASE_SCORE - Math.floor(TOTAL_TIME / 10) * TIME_DEDUCTION.difficult,
};

export default function GameScreen({ navigation, route }) {
  const isEasyMode = route.params?.isEasyMode ?? true;

  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [score, setScore] = useState(BASE_SCORE);
  const [cards, setCards] = useState(() =>
    shuffleArray(CARD_IMAGES).map((value) => ({
      ...value,
      flipped: false,
      matched: false,
    }))
  );
  const [matches, setMatches] = useState(0);
  const [errors, setErrors] = useState(0);

  const timerRef = useRef(null);
  const elapsedRef = useRef(0);
  const firstCardRef = useRef(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleLose();
          return 0;
        }
        const newTime = prev - 1;
        elapsedRef.current++;
        if (elapsedRef.current % 10 === 0) {
          setScore((prevScore) =>
            prevScore - TIME_DEDUCTION[isEasyMode ? "easy" : "difficult"]
          );
        }
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleWin = async (finalScore) => {
    clearInterval(timerRef.current);
    const pendingUnlocks = await saveScore(finalScore, false);
    navigation.replace("Win", {
      finalScore,
      timeTaken: TOTAL_TIME - timeLeft,
      isDifficultMode: !isEasyMode,
      pendingUnlocks,
    });
  };

  const handleLose = async () => {
    clearInterval(timerRef.current);
    const mode = isEasyMode ? "easy" : "difficult";
    const expectedMin = THEORETICAL_MIN[mode]();
    const finalScore = Math.min(score, expectedMin);
    setScore(finalScore);
    const pendingUnlocks = await saveScore(finalScore, true);
    navigation.replace("Lose", {
      finalScore,
      timeTaken: TOTAL_TIME,
      isDifficultMode: !isEasyMode,
      pendingUnlocks,
    });
  };

  const saveScore = async (finalScore, isLose) => {
    try {
      const STORAGE_KEY = "@sticker_unlocks";
      const PENDING_KEY = "@pending_unlocks";

      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : {};

      state.easyScore = state.easyScore ?? 0;
      state.hardScore = state.hardScore ?? 0;
      state.lowestEasy = state.lowestEasy ?? Infinity;
      state.lowestDifficult = state.lowestDifficult ?? Infinity;

      const pending = [];

      if (isEasyMode) {
        state.easyScore = Math.max(state.easyScore, finalScore);
        if (isLose && finalScore < state.lowestEasy) {
          state.lowestEasy = finalScore;
          state.lowestEasyAchieved = true;
          pending.push("penguin");
        }
      } else {
        state.hardScore = Math.max(state.hardScore, finalScore);
        if (isLose && finalScore < state.lowestDifficult) {
          state.lowestDifficult = finalScore;
          state.lowestDifficultAchieved = true;
          pending.push("ember_flower");
        }
      }

      const combinedTrophies = [
        { key: "swiss_cheese", easyThreshold: 1000, hardThreshold: 800 },
        { key: "apple", easyThreshold: 1080, hardThreshold: 880 },
        { key: "kitty", easyThreshold: 1160, hardThreshold: 960 },
        { key: "magic_wand", easyThreshold: 1200, hardThreshold: 1000 },
      ];

      combinedTrophies.forEach((t) => {
        if (
          (state.easyScore ?? 0) >= t.easyThreshold &&
          (state.hardScore ?? 0) >= t.hardThreshold &&
          !state[t.key]
        ) {
          state[t.key] = true;
          pending.push(t.key);
        }
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));

      return pending;
    } catch (e) {
      console.warn("Failed to save score", e);
      return [];
    }
  };

  // ------------------------ CARD PRESS ------------------------
  const handleCardPress = (index) => {
    if (isCheckingRef.current) return;

    setCards((prev) => {
      const updated = [...prev];
      const card = updated[index];
      if (!card || card.flipped || card.matched) return prev;
      updated[index] = { ...card, flipped: true };
      return updated;
    });

    if (firstCardRef.current === null) {
      firstCardRef.current = index;
      return;
    }

    isCheckingRef.current = true;
    const firstIndex = firstCardRef.current;
    firstCardRef.current = null;

    setTimeout(() => {
      setCards((prevNow) => {
        const newCards = [...prevNow];
        const firstCard = newCards[firstIndex];
        const secondCard = newCards[index];

        if (firstCard.name === secondCard.name) {
          newCards[firstIndex].matched = true;
          newCards[index].matched = true;
          setMatches((m) => m + 1);

          const points =
            MATCH_REWARD[isEasyMode ? "easy" : "difficult"][
              errors === 0 ? "firstTry" : "afterError"
            ];

          setScore((prevScore) => {
            const newScore = prevScore + points;
            if (matches + 1 === CARD_IMAGES.length) {
              clearInterval(timerRef.current);
              handleWin(newScore);
            }
            return newScore;
          });
        } else {
          newCards[firstIndex].flipped = false;
          newCards[index].flipped = false;
          setErrors((prev) => prev + 1);
        }

        isCheckingRef.current = false;
        return newCards;
      });
    }, 350);
  };

  const RenderCard = ({ card, index }) => {
    return (
      <Pressable onPress={() => handleCardPress(index)}>
        <View
          style={[
            styles.card,
            { backgroundColor: TILE_BG },
            { borderRightWidth: 2, borderBottomWidth: 2, borderColor: "#000" },
          ]}
        >
          <Image
            source={card.flipped || card.matched ? card.img : questionImg}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mode}>Mode: {isEasyMode ? "Easy" : "Difficult"}</Text>
      <Text style={styles.timer}>
        Time: {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </Text>
      <Text style={styles.score}>Score: {score}</Text>

      <View style={styles.grid}>
        {cards.map((card, i) => (
          <RenderCard key={i} card={card} index={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#230486",
  },
  mode: { fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "#fff" },
  timer: { fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#fff" },
  score: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#fff" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  card: {
    width: 70,
    height: 70,
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    overflow: "hidden",
  },
  cardImage: { width: 60, height: 60 },
});
