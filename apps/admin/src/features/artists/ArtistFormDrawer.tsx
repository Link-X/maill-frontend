import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  extractErrorMessage,
  notify,
  type Artist,
} from '@maill/shared';
import { Drawer } from '@/components/Drawer';
import { ImageUploader } from '@/components/ImageUploader';
import { useSaveArtistMutation } from './artistsApi';

interface Props {
  open: boolean;
  onClose: () => void;
  initial: Artist | null;
}

export function ArtistFormDrawer({ open, onClose, initial }: Props) {
  const { t } = useTranslation(['artist', 'common']);
  const [saveArtist, { isLoading }] = useSaveArtistMutation();
  const isEdit = !!initial;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('artist:form.nameRequired')),
        stageName: z.string().optional().or(z.literal('')),
        avatarUrl: z.string().optional().or(z.literal('')),
        gender: z.coerce.number().int().min(0).max(2),
        nationality: z.string().optional().or(z.literal('')),
        tags: z.string().optional().or(z.literal('')),
        bio: z.string().optional().or(z.literal('')),
        description: z.string().optional().or(z.literal('')),
        socialLinks: z.string().optional().or(z.literal('')),
        status: z.coerce.number().int().min(0).max(1),
      }),
    [t],
  );
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      stageName: '',
      avatarUrl: '',
      gender: 0,
      nationality: '',
      tags: '',
      bio: '',
      description: '',
      socialLinks: '',
      status: 1,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        stageName: initial?.stageName ?? '',
        avatarUrl: initial?.avatarUrl ?? '',
        gender: (initial?.gender ?? 0) as 0,
        nationality: initial?.nationality ?? '',
        tags: initial?.tags ?? '',
        bio: initial?.bio ?? '',
        description: initial?.description ?? '',
        socialLinks: initial?.socialLinks ?? '',
        status: (initial?.status ?? 1) as 0,
      });
    }
  }, [open, initial, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveArtist({
        id: initial?.id,
        name: values.name,
        stageName: values.stageName || undefined,
        avatarUrl: values.avatarUrl || undefined,
        gender: values.gender as 0,
        nationality: values.nationality || undefined,
        tags: values.tags || undefined,
        bio: values.bio || undefined,
        description: values.description || undefined,
        socialLinks: values.socialLinks || undefined,
        status: values.status as 0,
      }).unwrap();
      notify.success(t(isEdit ? 'artist:form.savedToast' : 'artist:form.createdToast'));
      onClose();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? t('artist:form.titleEdit') : t('artist:form.titleNew')}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isLoading}
            className="bg-gradient-brand hover:opacity-90"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isLoading ? t('common:actions.saving') : t('common:actions.save')}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">{t('artist:form.name')} *</Label>
          <Input id="name" {...register('name')} placeholder={t('artist:form.namePlaceholder')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stageName">{t('artist:form.stageName')}</Label>
          <Input
            id="stageName"
            {...register('stageName')}
            placeholder={t('artist:form.stageNamePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('artist:form.avatarUrl')}</Label>
          <Controller
            control={control}
            name="avatarUrl"
            render={({ field }) => (
              <ImageUploader value={field.value} onChange={field.onChange} dir="artists" />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('artist:form.gender')}</Label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('artist:gender.secret')}</SelectItem>
                    <SelectItem value="1">{t('artist:gender.male')}</SelectItem>
                    <SelectItem value="2">{t('artist:gender.female')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">{t('artist:form.nationality')}</Label>
            <Input id="nationality" {...register('nationality')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">{t('artist:form.tags')}</Label>
          <Input id="tags" {...register('tags')} placeholder={t('artist:form.tagsPlaceholder')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">{t('artist:form.bio')}</Label>
          <Input id="bio" {...register('bio')} placeholder={t('artist:form.bioPlaceholder')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('artist:form.description')}</Label>
          <textarea
            id="description"
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={t('artist:form.descriptionPlaceholder')}
            {...register('description')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="socialLinks">{t('artist:form.socialLinks')}</Label>
          <textarea
            id="socialLinks"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            placeholder={t('artist:form.socialLinksPlaceholder')}
            {...register('socialLinks')}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('artist:form.status')}</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('artist:status.online')}</SelectItem>
                  <SelectItem value="0">{t('artist:status.offline')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}
