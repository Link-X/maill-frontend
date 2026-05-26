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
  type Banner,
} from '@maill/shared';
import { Drawer } from '@/components/Drawer';
import { ImageUploader } from '@/components/ImageUploader';
import { useSaveBannerMutation } from './bannersApi';

interface Props {
  open: boolean;
  onClose: () => void;
  initial: Banner | null;
}

// MySQL ISO → datetime-local: "2025-12-01 10:00:00" → "2025-12-01T10:00"
const toLocalInput = (s?: string): string => {
  if (!s) return '';
  return s.replace(' ', 'T').slice(0, 16);
};
// datetime-local → MySQL ISO: "2025-12-01T10:00" → "2025-12-01 10:00:00"
const toBackend = (s?: string): string | undefined => {
  if (!s) return undefined;
  return s.replace('T', ' ') + ':00';
};

export function BannerFormDrawer({ open, onClose, initial }: Props) {
  const { t } = useTranslation(['banner', 'common']);
  const [saveBanner, { isLoading }] = useSaveBannerMutation();
  const isEdit = !!initial;

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().max(100).optional().or(z.literal('')),
        imageUrl: z
          .string()
          .url(t('banner:form.imageInvalid'))
          .min(1, t('banner:form.imageRequired')),
        linkType: z.coerce.number().int().min(0).max(4),
        linkTarget: z.string().max(500).optional().or(z.literal('')),
        sort: z.coerce.number().int().min(0).default(0),
        startAt: z.string().optional().or(z.literal('')),
        endAt: z.string().optional().or(z.literal('')),
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
      title: '',
      imageUrl: '',
      linkType: 0,
      linkTarget: '',
      sort: 0,
      startAt: '',
      endAt: '',
      status: 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: initial?.title ?? '',
        imageUrl: initial?.imageUrl ?? '',
        linkType: initial?.linkType ?? 0,
        linkTarget: initial?.linkTarget ?? '',
        sort: initial?.sort ?? 0,
        startAt: toLocalInput(initial?.startAt),
        endAt: toLocalInput(initial?.endAt),
        status: initial?.status ?? 0,
      });
    }
  }, [open, initial, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveBanner({
        id: initial?.id,
        title: values.title || undefined,
        imageUrl: values.imageUrl,
        linkType: values.linkType as 0,
        linkTarget: values.linkTarget || undefined,
        sort: values.sort,
        startAt: toBackend(values.startAt),
        endAt: toBackend(values.endAt),
        status: values.status as 0,
      }).unwrap();
      notify.success(t(isEdit ? 'banner:form.savedToast' : 'banner:form.createdToast'));
      onClose();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? t('banner:form.titleEdit') : t('banner:form.titleNew')}
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
          <Label>{t('banner:form.image')} *</Label>
          <Controller
            control={control}
            name="imageUrl"
            render={({ field }) => (
              <ImageUploader value={field.value} onChange={field.onChange} dir="banners" />
            )}
          />
          {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">{t('banner:form.remark')}</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder={t('banner:form.remarkPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('banner:form.linkType')}</Label>
            <Controller
              control={control}
              name="linkType"
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('banner:linkType.none')}</SelectItem>
                    <SelectItem value="1">{t('banner:linkType.show')}</SelectItem>
                    <SelectItem value="2">{t('banner:linkType.artist')}</SelectItem>
                    <SelectItem value="3">{t('banner:linkType.article')}</SelectItem>
                    <SelectItem value="4">{t('banner:linkType.url')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort">{t('banner:form.sort')}</Label>
            <Input id="sort" type="number" {...register('sort')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkTarget">{t('banner:form.linkTarget')}</Label>
          <Input
            id="linkTarget"
            {...register('linkTarget')}
            placeholder={t('banner:form.linkTargetPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="startAt">{t('banner:form.startAt')}</Label>
            <Input id="startAt" type="datetime-local" {...register('startAt')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt">{t('banner:form.endAt')}</Label>
            <Input id="endAt" type="datetime-local" {...register('endAt')} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t('banner:form.dateTimeHelp')}</p>

        <div className="space-y-2">
          <Label>{t('banner:form.status')}</Label>
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
                  <SelectItem value="1">{t('banner:status.online')}</SelectItem>
                  <SelectItem value="0">{t('banner:status.offline')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}
