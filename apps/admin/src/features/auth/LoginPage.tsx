import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label, extractErrorMessage, notify } from '@maill/shared';
import { useLoginMutation } from './adminAuthApi';
import { setCredentials } from './adminAuthSlice';

export default function AdminLoginPage() {
  const { t } = useTranslation(['auth', 'common', 'admin']);
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
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 p-8 border border-border rounded-lg bg-card">
        <h1 className="text-2xl font-bold text-center">{t('admin:login.title')}</h1>
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('common:loading') : t('auth:login')}
        </Button>
        <p className="text-center text-sm pt-1">
          <Link to="/register" className="text-primary underline-offset-4 hover:underline">
            没有管理员账号？去注册
          </Link>
        </p>
      </form>
    </div>
  );
}
