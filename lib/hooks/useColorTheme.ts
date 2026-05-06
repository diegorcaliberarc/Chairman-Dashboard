import { useState, useEffect } from 'react';

export type ColorTheme = 'default' | 'crimson' | 'cyber';

export function useColorTheme() {
  const [theme, setTheme] = useState<ColorTheme>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('color-theme') as ColorTheme;
    if (stored && ['default', 'crimson', 'cyber'].includes(stored)) {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      document.documentElement.setAttribute('data-theme', 'default');
    }
  }, []);

  const setColorTheme = (newTheme: ColorTheme) => {
    setTheme(newTheme);
    localStorage.setItem('color-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return { theme, setColorTheme, mounted };
}
