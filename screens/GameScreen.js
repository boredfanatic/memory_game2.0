import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import DiamondPattern from "../components/DiamondPattern";

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

const BG_COLORS = ["#4A18C2", "#0E0240"];
const TILE_COLORS = ["#C75EE8", "#6B1F9A"];

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
  const cardStateRef = useRef([]);

  // Refs so useCallback closures always see the latest values
  const matchesRef = useRef(0);
  const errorsRef = useRef(0);
  const timeLeftRef = useRef(TOTAL_TIME);
  const scoreRef = useRef(BASE_SCORE);

  useEffect(() => {
    cardStateRef.current = cards.map((c) => ({ ...c }));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleLose();
          return 0;
        }
        const newTime = prev - 1;
        timeLeftRef.current = newTime;
        elapsedRef.current++;
        if (elapsedRef.current % 10 === 0) {
          setScore((prevScore) => {
            const deducted = prevScore - TIME_DEDUCTION[isEasyMode ? "easy" : "difficult"];
            scoreRef.current = deducted;
            return deducted;
          });
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
      timeTaken: TOTAL_TIME - timeLeftRef.current,
      isDifficultMode: !isEasyMode,
      pendingUnlocks,
    });
  };

  const handleLose = async () => {
    clearInterval(timerRef.current);
    const mode = isEasyMode ? "easy" : "difficult";
    const expectedMin = THEORETICAL_MIN[mode]();
    const finalScore = Math.min(scoreRef.current, expectedMin);
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

  const handleCardPress = useCallback((index) => {
    if (isCheckingRef.current) return;

    const localCards = cardStateRef.current;
    const card = localCards[index];
    if (!card || card.flipped || card.matched) return;

    // Flip the tapped card immediately (new object so memo re-renders only this card)
    const flippedCards = localCards.map((c, i) =>
      i === index ? { ...c, flipped: true } : c
    );
    cardStateRef.current = flippedCards;
    setCards(flippedCards);

    if (firstCardRef.current === null) {
      firstCardRef.current = index;
      return;
    }

    // Second card tapped — evaluate right now, not inside a timeout
    isCheckingRef.current = true;
    const firstIndex = firstCardRef.current;
    firstCardRef.current = null;

    const firstCard = flippedCards[firstIndex];
    const secondCard = flippedCards[index];

    if (firstCard.name === secondCard.name) {
      // MATCH: update state immediately, no 600ms wait
      const matchedCards = flippedCards.map((c, i) =>
        i === firstIndex || i === index ? { ...c, matched: true } : c
      );
      cardStateRef.current = matchedCards;
      setCards(matchedCards);

      matchesRef.current += 1;
      setMatches(matchesRef.current);

      const mode = isEasyMode ? "easy" : "difficult";
      const points = MATCH_REWARD[mode][errorsRef.current === 0 ? "firstTry" : "afterError"];
      const newScore = scoreRef.current + points;
      scoreRef.current = newScore;
      setScore(newScore);

      if (matchesRef.current === CARD_IMAGES.length) {
        // Stop timer EXACTLY when the last card is flipped — not a ms later
        clearInterval(timerRef.current);
        handleWin(newScore);
      }

      // Unlock immediately so the next pair can be tapped without delay
      isCheckingRef.current = false;
    } else {
      // MISMATCH: show both wrong cards for 600ms then flip them back
      setTimeout(() => {
        const current = cardStateRef.current;
        const unflipped = current.map((c, i) =>
          i === firstIndex || i === index ? { ...c, flipped: false } : c
        );
        cardStateRef.current = unflipped;
        setCards(unflipped);
        errorsRef.current += 1;
        setErrors(errorsRef.current);
        isCheckingRef.current = false;
      }, 600);
    }
  }, [isEasyMode]);

  return (
    <LinearGradient colors={BG_COLORS} style={styles.container}>
      <DiamondPattern />
      <Text style={styles.mode}>Mode: {isEasyMode ? "Easy" : "Difficult"}</Text>
      <Text style={styles.timer}>
        Time: {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </Text>
      <Text style={styles.score}>Score: {score}</Text>

      <View style={styles.grid}>
        {cards.map((card, i) => (
          <RenderCard key={i} card={card} index={i} onPress={handleCardPress} />
        ))}
      </View>
    </LinearGradient>
  );
}

const RenderCard = memo(({ card, index, onPress }) => (
  <Pressable onPressIn={() => onPress(index)}>
    <LinearGradient
      colors={TILE_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.card,
        { borderRightWidth: 2, borderBottomWidth: 2, borderColor: "#000" },
      ]}
    >
      <Image
        source={card.flipped || card.matched ? card.img : questionImg}
        style={styles.cardImage}
        resizeMode="contain"
      />
    </LinearGradient>
  </Pressable>
));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
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
