import { useCallback, useState } from 'react';

export default function useSound() {
  const [enabled, setEnabled] = useState(true);

  const play = useCallback(async (soundName) => {
    
    return;
  }, [enabled]);

  const toggle = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);

  return { play, enabled, toggle };
}