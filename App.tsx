import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AdManager } from './src/ads/AdManager';
import { Analytics } from './src/analytics';
import { SoundManager } from './src/audio/SoundManager';

export default function App() {
  useEffect(() => {
    async function initializeServices() {
      Analytics.initialize();
      await SoundManager.loadSettings();
      await SoundManager.initialize();
      await AdManager.initialize();
    }
    void initializeServices();
  }, []);

  return (
    <>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <AppNavigator />
    </>
  );
}
