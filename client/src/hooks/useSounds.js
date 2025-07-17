import { useMemo } from 'react';
import { Howl } from 'howler';

/**
 * Custom hook for managing game sounds
 * @param {Object} settings - Game settings containing sound volume
 */
export const useSounds = (settings) => {
  // Create sound effects using Howler
  const sounds = useMemo(() => ({
    correct: new Howl({
      src: ['/sounds/correct.mp3'],
      volume: settings?.soundVolume || 1.0
    }),
    incorrect: new Howl({
      src: ['/sounds/wrong.mp3'],
      volume: settings?.soundVolume || 1.0
    }),
    victory: new Howl({
      src: ['/sounds/victory.mp3'],
      volume: settings?.soundVolume || 1.0
    })
  }), [settings?.soundVolume]);
  
  return sounds;
}; 

/**
 * Play a Howl sound and return a Promise that resolves when it finishes
 */
export function playSoundAsync(howl) {
  return new Promise((resolve) => {
    if (!howl) return resolve();
    howl.once('end', resolve);
    howl.play();
  });
} 