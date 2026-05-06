import { useState, useEffect } from 'react';

const DEFAULT_COLOR = '#3B82F6'; // Default Blue

export function useThemeAccent() {
  const [accentColor, setAccentColor] = useState<string>(DEFAULT_COLOR);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme-accent-color');
    if (stored) {
      setAccentColor(stored);
      applyColorToDOM(stored);
    } else {
      applyColorToDOM(DEFAULT_COLOR);
    }
  }, []);

  const applyColorToDOM = (hex: string) => {
    document.documentElement.style.setProperty('--color-primary', hex);
    // Optional: generate hover or glow variants if needed, or simply rely on primary
  };

  const updateAccentColor = (newColor: string) => {
    setAccentColor(newColor);
    localStorage.setItem('theme-accent-color', newColor);
    applyColorToDOM(newColor);
  };

  return { accentColor, updateAccentColor, mounted };
}
