import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { GameScreen } from '../screens/GameScreen';
import { DailyCompleteScreen } from '../screens/DailyCompleteScreen';
import { HowToPlayScreen } from '../screens/HowToPlayScreen';
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
          options={{ gestureEnabled: false }} // prevent accidental swipe back during game
        />
        <Stack.Screen name="DailyComplete" component={DailyCompleteScreen} />
        <Stack.Screen
          name="HowToPlay"
          component={HowToPlayScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
