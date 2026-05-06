import { useState, useEffect } from 'react';

const DEFAULT_LEFT = '#3B82F6';
const DEFAULT_RIGHT = '#8B5CF6';

export function useThemeAccent() {
  const [colorLeft, setColorLeft] = useState<string>(DEFAULT_LEFT);
  const [colorRight, setColorRight] = useState<string>(DEFAULT_RIGHT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedLeft = localStorage.getItem('theme-grad-start') || DEFAULT_LEFT;
    const storedRight = localStorage.getItem('theme-grad-end') || DEFAULT_RIGHT;
    
    setColorLeft(storedLeft);
    setColorRight(storedRight);
    
    applyColorsToDOM(storedLeft, storedRight);
  }, []);

  const applyColorsToDOM = (left: string, right: string) => {
    document.documentElement.style.setProperty('--theme-grad-start', left);
    document.documentElement.style.setProperty('--theme-grad-end', right);
  };

  const updateColorLeft = (hex: string) => {
    setColorLeft(hex);
    localStorage.setItem('theme-grad-start', hex);
    applyColorsToDOM(hex, colorRight);
  };

  const updateColorRight = (hex: string) => {
    setColorRight(hex);
    localStorage.setItem('theme-grad-end', hex);
    applyColorsToDOM(colorLeft, hex);
  };

  return { colorLeft, colorRight, updateColorLeft, updateColorRight, mounted };
}
