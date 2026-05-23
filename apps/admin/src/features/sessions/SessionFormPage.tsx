import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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

const schema = z.object({
  name: z.string().optional(),
  showId: z.coerce.number().int().positive('请选择演出'),
  roomId: z.coerce.number().int().positive('请选择场地'),
  startTime: z.string().min(1, '请填写开始时间'),
  endTime: z.string().min(1, '请填写结束时间'),
  limitPerUser: z.coerce.number().int().min(1, '最少 1').max(20, '最多 20'),
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
      { message: '需要合法的 JSON 对象（如 {"notice":"现场须知"}）' },
    ),
});
type FormValues = z.infer<typeof schema>;

const toInputDateTime = (iso?: string) => {
  if (!iso) return '';
  return iso.slice(0, 16);
};

export default function SessionFormPage() {
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
      limitPerUser: values.limitPerUser,
      extend: values.extend?.trim() || undefined,
    };
    try {
      if (isEdit && existing) {
        await updateSession({ ...existing, ...payload }).unwrap();
        notify.success('场次已更新');
        navigate(`/shows/${existing.showId}/sessions`);
      } else {
        const created = await createSession({ ...payload, status: SessionStatus.Draft }).unwrap();
        notify.success('场次已创建');
        navigate(`/sessions/${created.id}`);
      }
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={isEdit ? '编辑场次' : '新建场次'}
        icon={CalendarPlus}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            取消
          </Button>
        }
      />
      <form className="max-w-xl space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="showId" className="flex items-center gap-1">
            <CalendarRange className="h-3.5 w-3.5" />
            演出 ID *
          </Label>
          <Input
            id="showId"
            type="number"
            placeholder="从 /shows 列表复制 ID"
            readOnly={!!presetShowId && !isEdit}
            {...register('showId')}
          />
          {errors.showId && <p className="text-xs text-destructive">{errors.showId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            场地 *
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
                  <SelectValue placeholder="请选择场地" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={String(r.id)} value={String(r.id)}>
                      {r.name}（{r.rowCount}×{r.colCount}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.roomId && <p className="text-xs text-destructive">{errors.roomId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">场次名称（可选）</Label>
          <Input id="name" placeholder="2026 上海站 晚场" {...register('name')} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="startTime">开始时间 *</Label>
            <Input id="startTime" type="datetime-local" {...register('startTime')} />
            {errors.startTime && (
              <p className="text-xs text-destructive">{errors.startTime.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">结束时间 *</Label>
            <Input id="endTime" type="datetime-local" {...register('endTime')} />
            {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="limitPerUser">每人限购 *</Label>
          <Input id="limitPerUser" type="number" min={1} max={20} {...register('limitPerUser')} />
          {errors.limitPerUser && (
            <p className="text-xs text-destructive">{errors.limitPerUser.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="extend">扩展字段（JSON）</Label>
          <textarea
            id="extend"
            rows={4}
            placeholder={'{\n  "preSaleLeadMinutes": 30,\n  "notice": "现场禁止携带食物"\n}'}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('extend')}
          />
          {errors.extend && (
            <p className="text-xs text-destructive">{errors.extend.message as string}</p>
          )}
          <p className="text-[11px] text-muted-foreground">
            约定字段：preSaleLeadMinutes（分钟）/ notice。
          </p>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isLoading} className="bg-gradient-brand hover:opacity-90">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isLoading ? '保存中...' : isEdit ? '保存' : '创建'}
          </Button>
        </div>
      </form>
    </div>
  );
}
