import { useEffect, useRef, useCallback, useState } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Sound effect filenames expected in /assets/sounds/
 * Use free sounds from freesound.org or generate with a tone library.
 * The hook gracefully skips if files are missing.
 */
const SOUND_FILES = {
  turnStart:    require('../../assets/sounds/turn_start.mp3'),
  argScored:    require('../../assets/sounds/scored.mp3'),
  aiResponse:   require('../../assets/sounds/ai_response.mp3'),
  roundEnd:     require('../../assets/sounds/round_end.mp3'),
  debateWin:    require('../../assets/sounds/win.mp3'),
  debateLoss:   require('../../assets/sounds/loss.mp3'),
  buttonTap:    require('../../assets/sounds/tap.mp3'),
  timerUrgent:  require('../../assets/sounds/timer_urgent.mp3'),
  matched:      require('../../assets/sounds/matched.mp3'),
};

const soundCache = new Map(); // key → Sound instance

/**
 * useSound
 * Manages debate sound effects with enable/disable toggle and AudioSession setup.
 *
 * Usage:
 *   const { play, enabled, toggle } = useSound();
 *   play('turnStart');
 */
export default function useSound() {
  const [enabled, setEnabled] = useState(true);
  const loadedRef  = useRef(false);

  // Restore preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.SOUND_ENABLED).then(val => {
      if (val !== null) setEnabled(val === 'true');
    });
  }, []);

  // Set up AudioSession once
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS:    false,
      staysActiveInBackground: false,
      shouldDuckAndroid:       true,
    }).catch(() => {});
  }, []);

  // Preload all sounds
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const preload = async () => {
      for (const [key, file] of Object.entries(SOUND_FILES)) {
        try {
          const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: false });
          soundCache.set(key, sound);
        } catch {
          // Sound file missing — skip silently
        }
      }
    };
    preload();

    return () => {
      soundCache.forEach(s => s.unloadAsync().catch(() => {}));
      soundCache.clear();
    };
  }, []);

  /**
   * play(soundName, volume?)
   * Plays a named sound effect. Silently skips if disabled or file missing.
   */
  const play = useCallback(async (soundName, volume = 1.0) => {
    if (!enabled) return;
    const sound = soundCache.get(soundName);
    if (!sound) return;
    try {
      await sound.setPositionAsync(0);
      await sound.setVolumeAsync(Math.min(1, Math.max(0, volume)));
      await sound.playAsync();
    } catch {
      // Ignore playback errors
    }
  }, [enabled]);

  const toggle = useCallback(async () => {
    const next = !enabled;
    setEnabled(next);
    await AsyncStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(next));
  }, [enabled]);

  return { play, enabled, toggle };
}
