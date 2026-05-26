import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Save, Rows3, Columns3 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  extractErrorMessage,
  notify,
  type Room,
} from '@maill/shared';
import { Drawer } from '@/components/Drawer';
import { useCreateRoomMutation, useUpdateRoomMutation } from './roomsApi';

interface Props {
  open: boolean;
  onClose: () => void;
  initial: Room | null;
}

export function RoomFormDrawer({ open, onClose, initial }: Props) {
  const { t } = useTranslation(['room', 'common']);
  const [createRoom, { isLoading: creating }] = useCreateRoomMutation();
  const [updateRoom, { isLoading: updating }] = useUpdateRoomMutation();
  const isEdit = !!initial;
  const isLoading = creating || updating;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('room:form.nameRequired')),
        venue: z.string().optional(),
        rowCount: z.coerce
          .number()
          .int()
          .min(1, t('room:form.rowsMin'))
          .max(5000, t('room:form.rowsMax')),
        colCount: z.coerce
          .number()
          .int()
          .min(1, t('room:form.colsMin'))
          .max(5000, t('room:form.colsMax')),
        description: z.string().optional(),
      }),
    [t],
  );
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', venue: '', rowCount: 10, colCount: 10, description: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        venue: initial?.venue ?? '',
        rowCount: initial?.rowCount ?? 10,
        colCount: initial?.colCount ?? 10,
        description: initial?.description ?? '',
      });
    }
  }, [open, initial, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && initial) {
        await updateRoom({ ...initial, ...values }).unwrap();
        notify.success(t('room:form.savedToast'));
      } else {
        await createRoom(values).unwrap();
        notify.success(t('room:form.createdToast'));
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
      title={isEdit ? t('room:form.titleEdit') : t('room:form.titleNew')}
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
          <Label htmlFor="name">{t('room:form.name')} *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue">{t('room:form.venue')}</Label>
          <Input id="venue" placeholder={t('room:form.venuePlaceholder')} {...register('venue')} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="rowCount" className="flex items-center gap-1">
              <Rows3 className="h-3.5 w-3.5" />
              {t('room:form.rowCount')} *
            </Label>
            <Input id="rowCount" type="number" min={1} {...register('rowCount')} />
            {errors.rowCount && (
              <p className="text-xs text-destructive">{errors.rowCount.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="colCount" className="flex items-center gap-1">
              <Columns3 className="h-3.5 w-3.5" />
              {t('room:form.colCount')} *
            </Label>
            <Input id="colCount" type="number" min={1} {...register('colCount')} />
            {errors.colCount && (
              <p className="text-xs text-destructive">{errors.colCount.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t('room:form.description')}</Label>
          <textarea
            id="description"
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('description')}
          />
        </div>
      </form>
    </Drawer>
  );
}
