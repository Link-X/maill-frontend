import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppLocale = 'zh-CN' | 'en-US';

export interface LocaleState {
  locale: AppLocale;
}

const STORAGE_KEY = 'maill.locale';

const load = (): LocaleState => {
  if (typeof localStorage === 'undefined') return { locale: 'zh-CN' };
  const raw = localStorage.getItem(STORAGE_KEY) as AppLocale | null;
  return { locale: raw === 'en-US' ? 'en-US' : 'zh-CN' };
};

const save = (locale: AppLocale) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, locale);
};

export const localeSlice = createSlice({
  name: 'locale',
  initialState: load(),
  reducers: {
    setLocale: (state, action: PayloadAction<AppLocale>) => {
      state.locale = action.payload;
      save(action.payload);
    },
  },
});

export const { setLocale } = localeSlice.actions;
export const selectLocale = (root: { locale: LocaleState }) => root.locale.locale;
export const localeStorageKey = STORAGE_KEY;
