import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Audio } from 'expo-av';

export default function CountdownScreen({ navigation, route }) {
  const isEasyMode = route?.params?.isEasyMode ?? true;

  const [display, setDisplay] = useState('Get Ready!');
  const soundRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadAndPlay() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/countdown_wii.mp3'),
          { shouldPlay: true, rate: 1.0 }
        );
        soundRef.current = sound;
      } catch (e) {
        console.warn('Audio load failed:', e);
      }
    }

    loadAndPlay();

    async function runCountdown() {
      if (!mounted) return;
      // Hold "Get Ready!" for longer so it's visible
      await delay(700);
      if (!mounted) return;
      setDisplay('3');
      await delay(900);
      if (!mounted) return;
      setDisplay('2');
      await delay(900);
      if (!mounted) return;
      setDisplay('1');
      await delay(900);
      if (!mounted) return;
      setDisplay('Start!');
      await delay(900);
      if (!mounted) return;
      navigation.replace('Game', { isEasyMode });
    }

    runCountdown();

    return () => {
      mounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, [navigation, route]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.countText}>{display}</Text>
      <Text style={styles.modeText}>{isEasyMode ? 'Easy Mode' : 'Difficult Mode'}</Text>
    </View>
  );
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#230486',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 96,
    color: '#fff',
    textAlign: 'center',
  },
  modeText: {
    marginTop: 16,
    fontSize: 18,
    color: '#fff',
  },
});
