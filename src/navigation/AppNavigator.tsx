import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { GameScreen } from '../screens/GameScreen';
import { EndlessGameScreen } from '../screens/EndlessGameScreen';
import { DailyCompleteScreen } from '../screens/DailyCompleteScreen';
import { HowToPlayScreen } from '../screens/HowToPlayScreen';
import { RecordScreen } from '../screens/RecordScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="EndlessGame"
          component={EndlessGameScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="DailyComplete" component={DailyCompleteScreen} />
        <Stack.Screen
          name="HowToPlay"
          component={HowToPlayScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Record" component={RecordScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
