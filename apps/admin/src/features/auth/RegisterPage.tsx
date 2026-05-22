import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { UserPlus, Save } from 'lucide-react';
import { Button, Input, Label, extractErrorMessage, notify } from '@maill/shared';
import { useRegisterMutation } from './adminAuthApi';
import { setCredentials } from './adminAuthSlice';

export default function AdminRegisterPage() {
  const { t } = useTranslation(['auth', 'common']);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [registerMutation, { isLoading }] = useRegisterMutation();

  const schema = z.object({
    username: z.string().min(1, t('auth:validation.usernameRequired')),
    password: z.string().min(6, t('auth:validation.passwordMin')),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    inviteCode: z.string().min(16, '邀请码至少 16 位'),
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
        inviteCode: values.inviteCode,
      }).unwrap();
      dispatch(
        setCredentials({
          token: result.token,
          user: { userId: String(result.userId), username: values.username },
        }),
      );
      notify.success('注册成功，欢迎使用');
      navigate('/', { replace: true });
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 p-8 border border-border/60 rounded-2xl bg-card/60 backdrop-blur-md shadow-xl"
      >
        <div className="flex items-center justify-center mb-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-brand flex items-center justify-center text-brand-foreground shadow-lg shadow-brand/20">
            <UserPlus className="h-5 w-5" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center">管理员注册</h1>

        <div className="space-y-2">
          <Label htmlFor="username">{t('auth:username')} *</Label>
          <Input id="username" autoComplete="username" {...register('username')} />
          {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('auth:password')} *</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
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

        <div className="space-y-2">
          <Label htmlFor="inviteCode">邀请码 *</Label>
          <Input
            id="inviteCode"
            type="password"
            autoComplete="off"
            placeholder="向系统管理员索取"
            {...register('inviteCode')}
          />
          {errors.inviteCode && (
            <p className="text-xs text-destructive">{errors.inviteCode.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-brand hover:opacity-90"
          disabled={isLoading}
        >
          <Save className="h-4 w-4 mr-1.5" />
          {isLoading ? t('common:loading') : '注册'}
        </Button>

        <p className="text-center text-sm pt-1">
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            已有账号？去登录
          </Link>
        </p>
      </form>
    </div>
  );
}
