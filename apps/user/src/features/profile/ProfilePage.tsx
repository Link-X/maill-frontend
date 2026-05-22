import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Button,
  selectThemeMode,
  setTheme,
  selectLocale,
  setLocale,
  type ThemeMode,
  type AppLocale,
} from '@maill/shared';
import { logout, selectUser } from '@/features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

const themeOptions: { value: ThemeMode; key: string }[] = [
  { value: 'light', key: 'common:theme.light' },
  { value: 'dark', key: 'common:theme.dark' },
  { value: 'system', key: 'common:theme.system' },
];

const localeOptions: { value: AppLocale; key: string }[] = [
  { value: 'zh-CN', key: 'common:locale.zh-CN' },
  { value: 'en-US', key: 'common:locale.en-US' },
];

export default function ProfilePage() {
  const { t } = useTranslation(['common', 'auth']);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const themeMode = useSelector(selectThemeMode);
  const locale = useSelector(selectLocale);

  return (
    <div className="p-4 space-y-6">
      <section>
        <h2 className="text-lg font-semibold">{user?.username ?? '-'}</h2>
        <p className="text-xs text-muted-foreground">uid: {user?.userId ?? '-'}</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">{t('common:profile.theme')}</h3>
        <div className="flex gap-2">
          {themeOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={themeMode === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => dispatch(setTheme(opt.value))}
            >
              {t(opt.key)}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">{t('common:profile.language')}</h3>
        <div className="flex gap-2">
          {localeOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={locale === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => dispatch(setLocale(opt.value))}
            >
              {t(opt.key)}
            </Button>
          ))}
        </div>
      </section>

      <Button
        variant="destructive"
        className="w-full"
        onClick={() => {
          dispatch(logout());
          navigate('/login', { replace: true });
        }}
      >
        {t('auth:logout')}
      </Button>
    </div>
  );
}
