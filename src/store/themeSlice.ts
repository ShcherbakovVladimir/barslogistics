import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'barslogistics_theme';

function loadTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  return 'dark';
}

interface ThemeState {
  mode: ThemeMode;
}

const initialState: ThemeState = {
  mode: loadTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
      try {
        localStorage.setItem(STORAGE_KEY, action.payload);
      } catch {
        /* ignore */
      }
    },
    toggleTheme(state) {
      const next = state.mode === 'dark' ? 'light' : 'dark';
      state.mode = next;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
