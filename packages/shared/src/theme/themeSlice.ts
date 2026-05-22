import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  mode: ThemeMode;
}

const STORAGE_KEY = 'maill.theme';

const load = (): ThemeState => {
  if (typeof localStorage === 'undefined') return { mode: 'system' };
  const raw = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (raw === 'light' || raw === 'dark' || raw === 'system') return { mode: raw };
  return { mode: 'system' };
};

const save = (mode: ThemeMode) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, mode);
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState: load(),
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      save(action.payload);
    },
  },
});

export const { setTheme } = themeSlice.actions;
export const selectThemeMode = (root: { theme: ThemeState }) => root.theme.mode;
export const themeStorageKey = STORAGE_KEY;
