import { Platform } from 'react-native';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { Storage } from '../utils/storage';

export type TrackingPermissionResult =
  | 'granted'
  | 'denied'
  | 'restricted'
  | 'undetermined'
  | 'unavailable'
  | 'error';

function normalizeStatus(status?: string): TrackingPermissionResult {
  switch (status) {
    case 'granted':
    case 'denied':
    case 'restricted':
    case 'undetermined':
      return status;
    default:
      return 'unavailable';
  }
}

export const TrackingPermission = {
  async shouldShowPrePrompt(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;

    const handled = await Storage.hasHandledTrackingPrompt();
    if (handled) return false;

    try {
      const { status } = await getTrackingPermissionsAsync();
      return normalizeStatus(status) === 'undetermined';
    } catch {
      return false;
    }
  },

  async requestSystemPermission(): Promise<TrackingPermissionResult> {
    if (Platform.OS !== 'ios') return 'unavailable';

    try {
      const { status } = await requestTrackingPermissionsAsync();
      await Storage.markTrackingPromptHandled();
      return normalizeStatus(status);
    } catch {
      await Storage.markTrackingPromptHandled();
      return 'error';
    }
  },

};
