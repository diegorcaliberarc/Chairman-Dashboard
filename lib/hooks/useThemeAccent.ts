import { useState, useEffect } from 'react';

const DEFAULT_LEFT = '#3B82F6';
const DEFAULT_RIGHT = '#8B5CF6';

export function useThemeAccent() {
  const [colorLeft, setColorLeft] = useState<string>(DEFAULT_LEFT);
  const [colorRight, setColorRight] = useState<string>(DEFAULT_RIGHT);
  const [mounted, setMounted] = useState(false);

  // Load initial state
  useEffect(() => {
    setMounted(true);
    const storedLeft = localStorage.getItem('theme-grad-start') || DEFAULT_LEFT;
    const storedRight = localStorage.getItem('theme-grad-end') || DEFAULT_RIGHT;
    
    setColorLeft(storedLeft);
    setColorRight(storedRight);
  }, []);

  // DOM Injection and persistence when colors change
  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty('--theme-grad-start', colorLeft);
      document.documentElement.style.setProperty('--theme-grad-end', colorRight);
      localStorage.setItem('theme-grad-start', colorLeft);
      localStorage.setItem('theme-grad-end', colorRight);
    }
  }, [colorLeft, colorRight, mounted]);

  return { colorLeft, setColorLeft, colorRight, setColorRight, mounted };
}
