import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, Save, ArrowLeft, CalendarRange, Building2 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SessionStatus,
  extractErrorMessage,
  notify,
  type ShowSession,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { useListRoomsQuery } from '@/features/rooms/roomsApi';
import {
  useCreateSessionMutation,
  useGetSessionQuery,
  useUpdateSessionMutation,
} from './sessionsApi';

const toInputDateTime = (iso?: string) => {
  if (!iso) return '';
  return iso.slice(0, 16);
};

export default function SessionFormPage() {
  const { t } = useTranslation(['session', 'common']);
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const isEdit = !!params.id;
  const editId = params.id ?? '';
  const presetShowId = search.get('showId') ?? '';

  const { data: rooms = [] } = useListRoomsQuery();
  const { data: existing } = useGetSessionQuery(editId, { skip: !isEdit });
  const [createSession, { isLoading: creating }] = useCreateSessionMutation();
  const [updateSession, { isLoading: updating }] = useUpdateSessionMutation();
  const isLoading = creating || updating;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().optional(),
        showId: z.coerce.number().int().positive(t('session:form.showRequired')),
        roomId: z.coerce.number().int().positive(t('session:form.roomRequired')),
        startTime: z.string().min(1, t('session:form.startRequired')),
        endTime: z.string().min(1, t('session:form.endRequired')),
        openSaleTime: z.string().optional(),
        limitPerUser: z.coerce
          .number()
          .int()
          .min(1, t('session:form.limitMin'))
          .max(20, t('session:form.limitMax')),
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
            { message: t('session:form.extendInvalid') },
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
      showId: presetShowId ? Number(presetShowId) : 0,
      roomId: 0,
      startTime: '',
      endTime: '',
      openSaleTime: '',
      limitPerUser: 4,
      extend: '',
    },
  });

  useEffect(() => {
    if (isEdit && existing) {
      reset({
        name: existing.name ?? '',
        showId: Number(existing.showId),
        roomId: Number(existing.roomId ?? 0),
        startTime: toInputDateTime(existing.startTime),
        endTime: toInputDateTime(existing.endTime),
        openSaleTime: toInputDateTime(existing.openSaleTime),
        limitPerUser: existing.limitPerUser ?? 4,
        extend: existing.extend ?? '',
      });
    }
  }, [isEdit, existing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: Partial<ShowSession> = {
      showId: values.showId,
      roomId: values.roomId,
      name: values.name || undefined,
      startTime: values.startTime,
      endTime: values.endTime,
      openSaleTime: values.openSaleTime?.trim() || undefined,
      limitPerUser: values.limitPerUser,
      extend: values.extend?.trim() || undefined,
    };
    try {
      if (isEdit && existing) {
        await updateSession({ ...existing, ...payload }).unwrap();
        notify.success(t('session:form.savedToast'));
        navigate(`/shows/${existing.showId}/sessions`);
      } else {
        const created = await createSession({ ...payload, status: SessionStatus.Draft }).unwrap();
        notify.success(t('session:form.createdToast'));
        navigate(`/sessions/${created.id}`);
      }
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={isEdit ? t('session:form.titleEdit') : t('session:form.titleNew')}
        icon={CalendarPlus}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.cancel')}
          </Button>
        }
      />
      <form className="max-w-xl space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="showId" className="flex items-center gap-1">
            <CalendarRange className="h-3.5 w-3.5" />
            {t('session:form.showId')}
          </Label>
          <Input
            id="showId"
            type="number"
            placeholder={t('session:form.showIdPlaceholder')}
            readOnly={!!presetShowId && !isEdit}
            {...register('showId')}
          />
          {errors.showId && <p className="text-xs text-destructive">{errors.showId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            {t('session:form.room')}
          </Label>
          <Controller
            control={control}
            name="roomId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('session:form.roomPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={String(r.id)} value={String(r.id)}>
                      {t('session:form.roomLabelExtra', {
                        name: r.name,
                        rows: r.rowCount,
                        cols: r.colCount,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.roomId && <p className="text-xs text-destructive">{errors.roomId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">{t('session:form.name')}</Label>
          <Input id="name" placeholder={t('session:form.namePlaceholder')} {...register('name')} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="startTime">{t('session:form.startTime')}</Label>
            <Input id="startTime" type="datetime-local" {...register('startTime')} />
            {errors.startTime && (
              <p className="text-xs text-destructive">{errors.startTime.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">{t('session:form.endTime')}</Label>
            <Input id="endTime" type="datetime-local" {...register('endTime')} />
            {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="openSaleTime">{t('session:form.openSaleTime')}</Label>
          <Input id="openSaleTime" type="datetime-local" {...register('openSaleTime')} />
          <p className="text-[11px] text-muted-foreground">{t('session:form.openSaleTimeHint')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="limitPerUser">{t('session:form.limitPerUser')}</Label>
          <Input id="limitPerUser" type="number" min={1} max={20} {...register('limitPerUser')} />
          {errors.limitPerUser && (
            <p className="text-xs text-destructive">{errors.limitPerUser.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="extend">{t('session:form.extend')}</Label>
          <textarea
            id="extend"
            rows={4}
            placeholder={'{\n  "preSaleLeadMinutes": 30,\n  "notice": "..."\n}'}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('extend')}
          />
          {errors.extend && (
            <p className="text-xs text-destructive">{errors.extend.message as string}</p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {t('session:form.extendHint')}
          </p>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isLoading} className="bg-gradient-brand hover:opacity-90">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isLoading
              ? t('common:actions.saving')
              : isEdit
                ? t('common:actions.save')
                : t('session:action.createSubmit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
