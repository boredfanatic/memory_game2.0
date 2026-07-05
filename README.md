# Memory Game 2.0

A memory card matching game built with React Native and Expo. Flip cards to find matching pairs before the timer runs out. Earn trophies based on your scores across both difficulty modes.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Screens](#screens)
- [Game Mechanics](#game-mechanics)
- [Scoring System](#scoring-system)
- [Trophy System](#trophy-system)
- [Visual Design](#visual-design)
- [Performance Notes](#performance-notes)
- [Setup and Running](#setup-and-running)
- [Dependencies](#dependencies)

---

## Overview

The player is shown a 3x4 grid of 12 face-down cards (6 unique images, each appearing twice). Cards are tapped to reveal them. When two revealed cards match, they stay face-up permanently. When they do not match, they flip back after a brief pause. The goal is to match all six pairs before the 120-second timer expires.

---

## Tech Stack

- React Native 0.81.5
- Expo SDK 54
- React Navigation (native stack)
- AsyncStorage for persistent score and trophy data
- expo-linear-gradient for gradient backgrounds
- react-native-svg for the animated diamond background pattern
- expo-av for countdown audio
- react-native-confetti-cannon for trophy unlock celebrations
- react-native-reanimated and react-native-gesture-handler (navigation dependencies)

---

## Project Structure

```
memory_game2.0/
  assets/
    images/         # Card face images: apple, fire_flower, kitty, magic_wand,
    |               # penguin, swiss_cheese, question_mark
    sounds/         # countdown_wii.mp3
    lock.png
    unlock.png
  components/
    DiamondPattern.js    # Animated SVG diamond tile background, used on all screens
    FloatingBackground.js  # Unused legacy file
  screens/
    StartScreen.js
    ModeSelectionScreen.js
    CountdownScreen.js
    GameScreen.js
    WinScreen.js
    LoseScreen.js
    TrophiesScreen.js
  App.js
  index.js
  package.json
```

---

## Screens

### StartScreen

Entry point. Shows the game title and two buttons: Start and Trophies. When returning from a game session that earned new trophies, displays a sequential fade-in popup for each newly unlocked trophy. Each popup must be dismissed before the next one appears.

### ModeSelectionScreen

Lets the player choose Easy Mode or Difficult Mode before a game begins.

### CountdownScreen

Plays a countdown audio clip and displays a 3-2-1-Go sequence before navigating to the game. Receives `isEasyMode` from navigation params.

### GameScreen

The main game screen. Displays a 3x4 card grid, a live timer, the current score, and the mode label. Handles all match logic, scoring, and navigation to Win or Lose on game end.

### WinScreen

Shown when all pairs are matched before the timer expires. Displays final score and time taken. Background is mint-to-green.

### LoseScreen

Shown when the timer reaches zero. Displays final score and time taken. Background is red-to-crimson.

### TrophiesScreen

Displays all six collectible stickers with their unlock status. Newly unlocked stickers play a sequential shake-scale-confetti animation the first time the screen is visited after they are earned. Subsequent visits show the sticker as unlocked with no animation. Includes a Clear Progress button that wipes all saved scores and trophy state.

---

## Game Mechanics

- The grid contains 12 cards: 6 unique images duplicated and shuffled at the start of each game.
- Tapping a card reveals its image immediately on touch-down (not touch-up) for instant response.
- The first tap selects a card. The second tap on a different card triggers evaluation.
- **Match:** both cards are permanently marked face-up with no delay, and the next pair can be tapped immediately.
- **Mismatch:** both cards remain visible for 600ms so the player can see what they got wrong, then flip back face-down.
- The game ends when all 6 pairs are matched (win) or the timer hits zero (lose).
- The timer stops at the exact moment the last matching card is tapped.

---

## Scoring System

Base score starts at 1000 points.

**Time deductions** (applied once every 10 seconds elapsed):

| Mode | Deduction per 10s |
|---|---|
| Easy | -30 |
| Difficult | -60 |

**Match bonuses:**

| Mode | First-try match | Match after any error |
|---|---|---|
| Easy | +60 | +30 |
| Difficult | +30 | +15 |

A "first-try match" means the player has made zero errors in total so far during the game. Once any mismatch occurs, all subsequent matches use the "after error" rate for the remainder of that session.

Best scores for easy and difficult are persisted separately. Trophy evaluation compares the best score ever recorded in each mode.

---

## Trophy System

There are six trophies. Four are combined trophies that require minimum best scores in both modes simultaneously. Two are secret trophies awarded for setting a new personal lowest score on a loss.

| Trophy | Type | Easy Threshold | Hard Threshold | Rank |
|---|---|---|---|---|
| Swiss Cheese | Combined | 1000 | 800 | Bronze |
| Apple | Combined | 1080 | 880 | Silver |
| Kitty | Combined | 1160 | 960 | Gold |
| Magic Wand | Combined | 1200 | 1000 | Diamond |
| Penguin | Secret (easy loss) | new personal low | — | Secret |
| Ember Flower | Secret (hard loss) | — | new personal low | Secret |

Combined trophies unlock as soon as both mode thresholds are met in the same session or across sessions. The penguin and ember flower trophies unlock only when the player sets a new worst score on a losing run.

Trophy unlock animations play sequentially: the first newly unlocked trophy completes its full shake-scale-confetti sequence before the next one begins.
---

## Visual Design

All screens use a top-to-bottom linear gradient background:

| Screen(s) | Colors |
|---|---|
| Start, Mode Selection, Countdown, Game, Trophies | `#4A18C2` to `#0E0240` (deep indigo to near-black) |
| Win | `#8FFFBE` to `#3ABF7A` (mint to forest green) |
| Lose | `#F03030` to `#7A0000` (vivid red to deep crimson) |

All buttons use a consistent purple gradient: `#C75EE8` to `#6B1F9A`. Card tiles use the same gradient.

A slow-drifting diamond pattern overlays every screen. It is built from an SVG tiling pattern — 18px squares rotated 45 degrees, repeating every ~25.5px in screen space — with semi-transparent white fill and stroke. The pattern drifts diagonally (left and down) on a continuous seamless loop. Translate offset resets by exactly one tile period per loop so there is no visible jump.

---

## Performance Notes

**Card rendering:**
`RenderCard` is defined outside the `GameScreen` component body and wrapped in `React.memo`. All card state changes use immutable spread copies (`{ ...card, flipped: true }`) rather than in-place mutation. This means memo's shallow comparison correctly identifies which card changed, so only the 1-2 affected cards re-render per tap — even while the timer fires a state update every second.

**Animated background:**
`DiamondPattern` renders the SVG once and bakes it to a GPU texture via `renderToHardwareTextureAndroid` / `shouldRasterizeIOS`. The animation runs with `useNativeDriver: true`, so every frame is a GPU texture translate with zero JavaScript thread involvement after mount.

**Stable callbacks:**
`handleCardPress` uses `useCallback` with a single dependency `[isEasyMode]`. All mutable values it needs (matches, errors, score, timeLeft, cards) are mirrored in refs that are updated synchronously alongside their corresponding state setters. This keeps the `onPress` prop reference stable across re-renders so `React.memo` on `RenderCard` is not bypassed by a prop change.

**Touch response:**
Cards use `onPressIn` instead of `onPress`, so the flip is triggered on finger-down rather than finger-up. Match evaluation runs synchronously (not inside a `setTimeout`) for correct pairs, and `isCheckingRef` is released immediately after a match so the next pair can be tapped without any artificial delay.

---

## Setup and Running

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

Requires Expo Go or a development build on a device or emulator. The project is pinned to Expo SDK 54 — do not run `npx expo install` for individual packages without checking the compatible version range first, as it may upgrade the SDK.

---

## Dependencies

```json
{
  "expo": "~54.0.0",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "expo-av": "^16.0.7",
  "expo-linear-gradient": "~14.0.2",
  "expo-status-bar": "~3.0.8",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@react-navigation/native": "^7.1.19",
  "@react-navigation/native-stack": "^7.6.2",
  "@react-navigation/stack": "^7.4.8",
  "react-native-confetti-cannon": "^1.5.2",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "react-native-svg": "~15.8.0",
  "react-native-get-random-values": "^1.11.0",
  "react-native-worklets": "0.5.1"
}
```
