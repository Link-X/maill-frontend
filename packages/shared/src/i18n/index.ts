import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhCommon from './locales/zh-CN/common.json';
import zhAuth from './locales/zh-CN/auth.json';
import zhShow from './locales/zh-CN/show.json';
import zhOrder from './locales/zh-CN/order.json';
import zhAdmin from './locales/zh-CN/admin.json';
import zhCategory from './locales/zh-CN/category.json';
import zhCity from './locales/zh-CN/city.json';
import zhRoom from './locales/zh-CN/room.json';
import zhSession from './locales/zh-CN/session.json';
import zhReport from './locales/zh-CN/report.json';

import enCommon from './locales/en-US/common.json';
import enAuth from './locales/en-US/auth.json';
import enShow from './locales/en-US/show.json';
import enOrder from './locales/en-US/order.json';
import enAdmin from './locales/en-US/admin.json';
import enCategory from './locales/en-US/category.json';
import enCity from './locales/en-US/city.json';
import enRoom from './locales/en-US/room.json';
import enSession from './locales/en-US/session.json';
import enReport from './locales/en-US/report.json';

import type { AppLocale } from './localeSlice';
import type { Resource } from 'i18next';

export type AppName = 'user' | 'admin';

const USER_NAMESPACES = ['common', 'auth', 'show', 'order', 'category', 'city', 'session'] as const;
const ADMIN_NAMESPACES = [
  'common',
  'auth',
  'show',
  'order',
  'admin',
  'category',
  'city',
  'room',
  'session',
  'report',
] as const;

const ZH_BUNDLES = {
  common: zhCommon,
  auth: zhAuth,
  show: zhShow,
  order: zhOrder,
  admin: zhAdmin,
  category: zhCategory,
  city: zhCity,
  room: zhRoom,
  session: zhSession,
  report: zhReport,
};
const EN_BUNDLES = {
  common: enCommon,
  auth: enAuth,
  show: enShow,
  order: enOrder,
  admin: enAdmin,
  category: enCategory,
  city: enCity,
  room: enRoom,
  session: enSession,
  report: enReport,
};

const localeStorageKey = 'maill.locale';

const readInitialLocale = (): AppLocale => {
  if (typeof localStorage === 'undefined') return 'zh-CN';
  const raw = localStorage.getItem(localeStorageKey) as AppLocale | null;
  return raw === 'en-US' ? 'en-US' : 'zh-CN';
};

export const initI18n = async (app: AppName) => {
  const namespaces = app === 'admin' ? ADMIN_NAMESPACES : USER_NAMESPACES;
  const resources: Resource = { 'zh-CN': {}, 'en-US': {} };
  namespaces.forEach((ns) => {
    (resources['zh-CN'] as Record<string, unknown>)[ns] = (ZH_BUNDLES as Record<string, unknown>)[ns];
    (resources['en-US'] as Record<string, unknown>)[ns] = (EN_BUNDLES as Record<string, unknown>)[ns];
  });

  await i18n.use(initReactI18next).init({
    lng: readInitialLocale(),
    fallbackLng: 'zh-CN',
    ns: [...namespaces],
    defaultNS: 'common',
    resources,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  return i18n;
};

export { default as i18n } from 'i18next';
export * from './localeSlice';
export * from './LocaleSync';
