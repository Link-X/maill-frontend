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
  ShowStatus,
  extractErrorMessage,
  notify,
  type Show,
} from '@maill/shared';
import { Drawer } from '@/components/Drawer';
import { ImageUploader } from '@/components/ImageUploader';
import { useCreateShowMutation, useUpdateShowMutation } from './showsApi';
import { useListCategoriesQuery } from '@/features/categories/categoriesApi';
import { useListCitiesQuery } from '@/features/cities/citiesApi';

interface Props {
  open: boolean;
  onClose: () => void;
  initial: Show | null;
}

export function ShowFormDrawer({ open, onClose, initial }: Props) {
  const { t } = useTranslation(['show', 'common']);
  const [createShow, { isLoading: creating }] = useCreateShowMutation();
  const [updateShow, { isLoading: updating }] = useUpdateShowMutation();
  // 仅启用的分类/城市供下拉
  const { data: categories = [] } = useListCategoriesQuery({ status: 1 });
  const { data: cities = [] } = useListCitiesQuery({ status: 1 });
  const isEdit = !!initial;
  const isLoading = creating || updating;

  // schema 依赖 t（错误文案需本地化），随语言变化重建
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('show:form.nameRequired')),
        categoryId: z
          .union([z.coerce.number().int().positive(), z.literal('')])
          .optional()
          .transform((v) => (v === '' || v == null ? undefined : Number(v))),
        cityCode: z.string().optional(),
        venue: z.string().optional(),
        address: z.string().optional(),
        posterUrl: z.string().url(t('show:form.posterInvalid')).optional().or(z.literal('')),
        description: z.string().optional(),
        extend: z
          .string()
          .optional()
          .refine(
            (v) => {
              if (!v || !v.trim()) return true;
              try {
                const parsed = JSON.parse(v);
                return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
              } catch {
                return false;
              }
            },
            { message: t('show:form.extendInvalid') },
          ),
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
      categoryId: undefined,
      cityCode: '',
      venue: '',
      address: '',
      posterUrl: '',
      description: '',
      extend: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        categoryId: initial?.categoryId,
        cityCode: initial?.cityCode ?? '',
        venue: initial?.venue ?? '',
        address: initial?.address ?? '',
        posterUrl: initial?.posterUrl ?? '',
        description: initial?.description ?? '',
        extend: initial?.extend ?? '',
      });
    }
  }, [open, initial, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      ...values,
      cityCode: values.cityCode || undefined,
      venue: values.venue || undefined,
      address: values.address || undefined,
      posterUrl: values.posterUrl || undefined,
      extend: values.extend?.trim() || undefined,
    };
    try {
      if (isEdit && initial) {
        await updateShow({ ...initial, ...payload }).unwrap();
        notify.success(t('show:form.savedToast'));
      } else {
        await createShow({ ...payload, status: ShowStatus.Draft }).unwrap();
        notify.success(t('show:form.createdToast'));
      }
      onClose();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? t('show:form.titleEdit') : t('show:form.titleNew')}
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
          <Label htmlFor="name">{t('show:form.name')} *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t('show:form.category')}</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value == null ? '__none__' : String(field.value)}
                onValueChange={(v) => field.onChange(v === '__none__' ? undefined : Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('show:form.categoryUnspecified')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('show:form.categoryUnspecified')}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId && (
            <p className="text-xs text-destructive">{errors.categoryId.message as string}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('show:form.city')}</Label>
            <Controller
              control={control}
              name="cityCode"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value : '__none__'}
                  onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('show:form.cityUnspecified')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('show:form.cityUnspecified')}</SelectItem>
                    {cities.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue">{t('show:form.venue')}</Label>
            <Input id="venue" placeholder={t('show:form.venuePlaceholder')} {...register('venue')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">{t('show:form.address')}</Label>
          <Input id="address" placeholder={t('show:form.addressPlaceholder')} {...register('address')} />
        </div>
        <div className="space-y-2">
          <Label>{t('show:form.poster')}</Label>
          <Controller
            control={control}
            name="posterUrl"
            render={({ field }) => (
              <ImageUploader value={field.value} onChange={field.onChange} dir="posters" />
            )}
          />
          {errors.posterUrl && (
            <p className="text-xs text-destructive">{errors.posterUrl.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t('show:form.description')}</Label>
          <textarea
            id="description"
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('description')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="extend">{t('show:form.extend')}</Label>
          <textarea
            id="extend"
            rows={4}
            placeholder={'{\n  "duration": 120,\n  "ageLimit": "6+",\n  "refundRule": "..."\n}'}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('extend')}
          />
          {errors.extend && (
            <p className="text-xs text-destructive">{errors.extend.message as string}</p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {t('show:form.extendHint')}
          </p>
        </div>
      </form>
    </Drawer>
  );
}
