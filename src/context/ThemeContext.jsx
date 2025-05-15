import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase/client';

const themeColors = {
  'blue-600': '#2563eb',
  'emerald-500': '#10b981',
  'purple-600': '#7c3aed',
  'rose-500': '#f43f5e',
  'amber-500': '#f59e42',
};

const ThemeContext = createContext();

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function ThemeContextProvider({ children }) {
  const { user, profile } = useAuth();
  const [mode, setModeState] = useState('light');
  const [accent, setAccentState] = useState('blue-600');
  const [loading, setLoading] = useState(true);

  // Load theme/accent from profile or localStorage
  useEffect(() => {
    async function loadTheme() {
      if (profile) {
        setModeState(profile.theme || 'light');
        setAccentState(profile.accent_color || 'blue-600');
      } else {
        setModeState(localStorage.getItem('theme') || 'light');
        setAccentState(localStorage.getItem('themeColor') || 'blue-600');
      }
      setLoading(false);
    }
    loadTheme();
  }, [profile]);

  // Save to localStorage and update <html> for custom CSS
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('theme', mode);
      localStorage.setItem('themeColor', accent);
      document.documentElement.classList.toggle('dark', mode === 'dark');
      document.documentElement.style.setProperty('--accent', themeColors[accent] || themeColors['blue-600']);
    }
  }, [mode, accent, loading]);

  // Update Supabase profile when theme/accent changes (if logged in)
  useEffect(() => {
    if (!loading && user) {
      // Only update if values differ from profile
      if ((profile?.theme !== mode || profile?.accent_color !== accent)) {
        supabase.from('profiles').update({ theme: mode, accent_color: accent }).eq('id', user.id);
      }
    }
  }, [mode, accent, user, profile, loading]);

  const setMode = (newMode) => setModeState(newMode);
  const setAccent = (newAccent) => setAccentState(newAccent);

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode,
        primary: {
          main: themeColors[accent] || themeColors['blue-600'],
        },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            containedPrimary: {
              color: '#fff',
            },
          },
        },
      },
    }),
    [mode, accent]
  );

  const value = {
    mode,
    setMode,
    accent,
    setAccent,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
} 