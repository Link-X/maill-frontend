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
  type Category,
} from '@maill/shared';
import { Drawer } from '@/components/Drawer';
import { ImageUploader } from '@/components/ImageUploader';
import { useCreateCategoryMutation, useUpdateCategoryMutation } from './categoriesApi';

interface Props {
  open: boolean;
  onClose: () => void;
  initial: Category | null;
}

export function CategoryFormDrawer({ open, onClose, initial }: Props) {
  const { t } = useTranslation(['category', 'common']);
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const isEdit = !!initial;
  const isLoading = creating || updating;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('category:form.nameRequired')),
        sort: z.coerce.number().int().min(0).default(0),
        icon: z.string().url(t('category:form.iconInvalid')).optional().or(z.literal('')),
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
    defaultValues: { name: '', sort: 0, icon: '', status: 1 },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        sort: initial?.sort ?? 0,
        icon: initial?.icon ?? '',
        status: initial?.status ?? 1,
      });
    }
  }, [open, initial, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: Partial<Category> = {
      name: values.name,
      sort: values.sort,
      icon: values.icon || undefined,
      status: values.status as 0 | 1,
    };
    try {
      if (isEdit && initial) {
        await updateCategory({ ...initial, ...payload }).unwrap();
        notify.success(t('category:form.savedToast'));
      } else {
        await createCategory(payload).unwrap();
        notify.success(t('category:form.createdToast'));
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
      title={isEdit ? t('category:form.titleEdit') : t('category:form.titleNew')}
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
          <Label htmlFor="name">{t('category:form.name')} *</Label>
          <Input id="name" {...register('name')} placeholder={t('category:form.namePlaceholder')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort">{t('category:form.sort')}</Label>
          <Input id="sort" type="number" {...register('sort')} placeholder={t('category:form.sortPlaceholder')} />
          {errors.sort && <p className="text-xs text-destructive">{errors.sort.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t('category:form.icon')}</Label>
          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <ImageUploader value={field.value} onChange={field.onChange} dir="categories" />
            )}
          />
          {errors.icon && <p className="text-xs text-destructive">{errors.icon.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t('category:form.status')}</Label>
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
                  <SelectItem value="1">{t('category:status.enabled')}</SelectItem>
                  <SelectItem value="0">{t('category:status.disabled')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}
