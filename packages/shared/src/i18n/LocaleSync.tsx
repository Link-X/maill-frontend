import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import i18n from 'i18next';
import { setDefaultOptions } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { selectLocale } from './localeSlice';

const dateFnsLocaleMap = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export const LocaleSync = ({ children }: { children: React.ReactNode }) => {
  const locale = useSelector(selectLocale);
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
    setDefaultOptions({ locale: dateFnsLocaleMap[locale] });
  }, [locale]);
  return <>{children}</>;
};
