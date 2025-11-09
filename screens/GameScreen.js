import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
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

// Map cards to images
const CARD_IMAGES = [
  { name: "Apple", img: appleImg },
  { name: "Fire Flower", img: fireFlowerImg },
  { name: "Kitty", img: kittyImg },
  { name: "Magic Wand", img: magicWandImg },
  { name: "Penguin", img: penguinImg },
  { name: "Swiss Cheese", img: swissCheeseImg },
];

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
  difficult: () => BASE_SCORE - Math.floor(TOTAL_TIME / 10) * TIME_DEDUCTION.difficult,
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
  const [firstCard, setFirstCard] = useState(null);
  const [secondCard, setSecondCard] = useState(null);
  const [matches, setMatches] = useState(0);
  const [errors, setErrors] = useState(0);

  const timerRef = useRef(null);
  const elapsedRef = useRef(0);

  // Timer
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
          setScore((prevScore) => prevScore - TIME_DEDUCTION[isEasyMode ? "easy" : "difficult"]);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  // Handle card press
  const handleCardPress = (index) => {
    const card = cards[index];
    if (card.flipped || card.matched || secondCard) return;

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    if (!firstCard) {
      setFirstCard({ ...card, index });
    } else {
      setSecondCard({ ...card, index });
      setTimeout(() => checkMatch(firstCard.index, index), 700);
    }
  };

  // Check match
  const checkMatch = (index1, index2) => {
    const newCards = [...cards];
    const first = newCards[index1];
    const second = newCards[index2];
    const firstTry = errors === 0;

    if (first.name === second.name) {
      newCards[index1].matched = true;
      newCards[index2].matched = true;
      setMatches((prev) => prev + 1);

      const points =
        MATCH_REWARD[isEasyMode ? "easy" : "difficult"][firstTry ? "firstTry" : "afterError"];
      setScore((prevScore) => prevScore + points);

      if (matches + 1 === CARD_IMAGES.length) {
        clearInterval(timerRef.current);
        handleWin(score + points);
      }
    } else {
      newCards[index1].flipped = false;
      newCards[index2].flipped = false;
      setErrors((prev) => prev + 1);
    }

    setCards(newCards);
    setFirstCard(null);
    setSecondCard(null);
  };

  // Win handler
  const handleWin = async (finalScore) => {
    clearInterval(timerRef.current);
    await saveScore(finalScore, false);
    navigation.replace("Win", {
      finalScore,
      timeTaken: TOTAL_TIME - timeLeft,
      isDifficultMode: !isEasyMode,
    });
  };

  // Lose handler
  const handleLose = async () => {
    clearInterval(timerRef.current);
    const mode = isEasyMode ? "easy" : "difficult";
    const expectedMin = THEORETICAL_MIN[mode]();
    const finalScore = Math.min(score, expectedMin);
    setScore(finalScore);
    await saveScore(finalScore, true);
    navigation.replace("Lose", {
      finalScore,
      timeTaken: TOTAL_TIME,
      isDifficultMode: !isEasyMode,
    });
  };

  // Save score and manage unlocks
  const saveScore = async (finalScore, isLose) => {
    try {
      const STORAGE_KEY = "@sticker_unlocks";
      const PENDING_KEY = "@pending_unlocks";

      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : {};
      const pendingRaw = await AsyncStorage.getItem(PENDING_KEY);
      const pending = pendingRaw ? JSON.parse(pendingRaw) : [];

      state.easyScore = state.easyScore ?? 0;
      state.hardScore = state.hardScore ?? 0;
      state.lowestEasy = state.lowestEasy ?? Infinity;
      state.lowestDifficult = state.lowestDifficult ?? Infinity;

      // Update mode scores
      if (isEasyMode) {
        state.easyScore = Math.max(state.easyScore, finalScore);
        if (isLose && finalScore < state.lowestEasy) {
          state.lowestEasy = finalScore;
          state.lowestEasyAchieved = true;
          pending.push("Penguin 🐧");
        }
      } else {
        state.hardScore = Math.max(state.hardScore, finalScore);
        if (isLose && finalScore < state.lowestDifficult) {
          state.lowestDifficult = finalScore;
          state.lowestDifficultAchieved = true;
          pending.push("Ember Flower 🔥");
        }
      }

      // Combined trophies with updated thresholds
      const combinedTrophies = [
        { name: "Bronze", easyThreshold: 700, hardThreshold: 300 },
        { name: "Silver", easyThreshold: 850, hardThreshold: 500 },
        { name: "Gold", easyThreshold: 1000, hardThreshold: 750 },
        { name: "Diamond", easyThreshold: 1150, hardThreshold: 1000 },
      ];

      combinedTrophies.forEach((t) => {
        if (
          (state.easyScore ?? 0) >= t.easyThreshold &&
          (state.hardScore ?? 0) >= t.hardThreshold &&
          !state[t.name]
        ) {
          state[t.name] = true;
          pending.push(`${t.name} Trophy 🏆`);
        }
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    } catch (e) {
      console.warn("Failed to save score", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mode}>Mode: {isEasyMode ? "Easy" : "Difficult"}</Text>
      <Text style={styles.timer}>
        Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
      </Text>
      <Text style={styles.score}>Score: {score}</Text>

      <View style={styles.grid}>
        {cards.map((card, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.card, card.flipped || card.matched ? styles.cardFlipped : {}]}
            onPress={() => handleCardPress(i)}
          >
            <Image
              source={card.flipped || card.matched ? card.img : questionImg}
              style={styles.cardImage}
            />
          </TouchableOpacity>
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
    backgroundColor: "#ddd",
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  cardFlipped: { backgroundColor: "#fff" },
  cardImage: { width: 70, height: 70, resizeMode: "contain" },
});
