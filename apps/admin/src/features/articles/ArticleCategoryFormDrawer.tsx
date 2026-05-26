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
  type ArticleCategory,
} from '@maill/shared';
import { Drawer } from '@/components/Drawer';
import {
  useCreateArticleCategoryMutation,
  useUpdateArticleCategoryMutation,
} from './articleCategoriesApi';

interface Props {
  open: boolean;
  onClose: () => void;
  initial: ArticleCategory | null;
}

export function ArticleCategoryFormDrawer({ open, onClose, initial }: Props) {
  const { t } = useTranslation(['articleCategory', 'common']);
  const [createCat, { isLoading: creating }] = useCreateArticleCategoryMutation();
  const [updateCat, { isLoading: updating }] = useUpdateArticleCategoryMutation();
  const isEdit = !!initial;
  const isLoading = creating || updating;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('articleCategory:form.nameRequired')),
        sort: z.coerce.number().int().min(0).default(0),
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
    defaultValues: { name: '', sort: 0, status: 1 },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        sort: initial?.sort ?? 0,
        status: (initial?.status ?? 1) as 0 | 1,
      });
    }
  }, [open, initial, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && initial) {
        await updateCat({ ...initial, ...values, status: values.status as 0 | 1 }).unwrap();
        notify.success(t('articleCategory:form.savedToast'));
      } else {
        await createCat({ ...values, status: values.status as 0 | 1 }).unwrap();
        notify.success(t('articleCategory:form.createdToast'));
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
      title={isEdit ? t('articleCategory:form.titleEdit') : t('articleCategory:form.titleNew')}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {t('common:actions.cancel')}
          </Button>
          <Button size="sm" onClick={onSubmit} disabled={isLoading} className="bg-gradient-brand hover:opacity-90">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isLoading ? t('common:actions.saving') : t('common:actions.save')}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">{t('articleCategory:form.name')} *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort">{t('articleCategory:form.sort')}</Label>
          <Input id="sort" type="number" {...register('sort')} />
        </div>
        <div className="space-y-2">
          <Label>{t('articleCategory:form.status')}</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('articleCategory:status.enabled')}</SelectItem>
                  <SelectItem value="0">{t('articleCategory:status.disabled')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}
