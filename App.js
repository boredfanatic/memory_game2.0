import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import StartScreen from './screens/StartScreen';
import ModeSelectionScreen from './screens/ModeSelectionScreen';
import CountdownScreen from './screens/CountdownScreen';
import GameScreen from './screens/GameScreen';
import WinScreen from './screens/WinScreen';
import LoseScreen from './screens/LoseScreen';
import TrophiesScreen from './screens/TrophiesScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Start"
      >
        <Stack.Screen name="Start" component={StartScreen} />
        <Stack.Screen name="ModeSelection" component={ModeSelectionScreen} />
        <Stack.Screen name="Countdown" component={CountdownScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Win" component={WinScreen} />
        <Stack.Screen name="Lose" component={LoseScreen} />
        <Stack.Screen name="Trophies" component={TrophiesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
