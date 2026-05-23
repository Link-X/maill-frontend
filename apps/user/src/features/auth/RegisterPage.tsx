import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label, extractErrorMessage, notify } from '@maill/shared';
import { useRegisterMutation } from './authApi';
import { setCredentials } from './authSlice';

export default function RegisterPage() {
  const { t } = useTranslation(['auth', 'common']);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [registerMutation, { isLoading }] = useRegisterMutation();

  const schema = z.object({
    username: z.string().min(1, t('auth:validation.usernameRequired')),
    password: z.string().min(6, t('auth:validation.passwordMin')),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await registerMutation({
        username: values.username,
        password: values.password,
        phone: values.phone || undefined,
        email: values.email || undefined,
      }).unwrap();
      dispatch(
        setCredentials({
          token: result.token,
          user: { userId: String(result.userId), username: values.username },
        }),
      );
      notify.success(t('auth:registerSuccess'));
      navigate('/', { replace: true });
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">{t('auth:register')}</h1>
        <div className="space-y-2">
          <Label htmlFor="username">{t('auth:username')}</Label>
          <Input id="username" {...register('username')} />
          {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth:password')}</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t('auth:phone')}</Label>
          <Input id="phone" {...register('phone')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth:email')}</Label>
          <Input id="email" type="email" {...register('email')} />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('common:states.loading') : t('auth:register')}
        </Button>
        <p className="text-center text-sm">
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            {t('auth:switchToLogin')}
          </Link>
        </p>
      </form>
    </div>
  );
}
