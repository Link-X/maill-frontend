import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button, Input, Label, extractErrorMessage, notify } from '@maill/shared';
import { useLoginMutation } from './authApi';
import { setCredentials } from './authSlice';

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();

  const schema = z.object({
    username: z.string().min(1, t('auth:validation.usernameRequired')),
    password: z.string().min(6, t('auth:validation.passwordMin')),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await login(values).unwrap();
      dispatch(
        setCredentials({
          token: result.token,
          user: { userId: String(result.userId), username: values.username },
        }),
      );
      notify.success(t('auth:loginSuccess'));
      const to = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(to, { replace: true });
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-background text-foreground">
      {/* 背景:两个柔光球 + 渐变 */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-brand-soft opacity-60" />
        <div className="absolute -top-32 -left-24 w-72 h-72 rounded-full bg-brand/30 blur-3xl animate-breath-glow" />
        <div className="absolute -bottom-32 -right-24 w-80 h-80 rounded-full bg-brand-2/30 blur-3xl animate-breath-glow [animation-delay:1.2s]" />
      </div>

      <motion.form
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-3xl bg-card/75 dark:bg-card/55 backdrop-blur-2xl
                   border border-white/40 dark:border-white/10
                   shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25),inset_0_1px_0_0_rgba(255,255,255,0.5)]
                   p-7 space-y-5"
      >
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-brand/30">
            <Sparkles className="h-6 w-6 text-brand-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('auth:login')}</h1>
          <p className="text-xs text-muted-foreground">{t('common:appName')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">{t('auth:username')}</Label>
          <Input id="username" autoComplete="username" {...register('username')} />
          {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth:password')}</Label>
          <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-brand hover:opacity-90 shadow-md shadow-brand/25"
          disabled={isLoading}
        >
          {isLoading ? t('common:states.loading') : t('auth:login')}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/register" className="text-brand font-medium underline-offset-4 hover:underline">
            {t('auth:switchToRegister')}
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
