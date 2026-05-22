import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const schema = z.object({
  name: z.string().min(1, '请输入场地名称'),
  venue: z.string().optional(),
  rowCount: z.coerce.number().int().min(1, '至少 1 行').max(200, '最多 200 行'),
  colCount: z.coerce.number().int().min(1, '至少 1 列').max(200, '最多 200 列'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  initial: Room | null;
}

export function RoomFormDrawer({ open, onClose, initial }: Props) {
  const [createRoom, { isLoading: creating }] = useCreateRoomMutation();
  const [updateRoom, { isLoading: updating }] = useUpdateRoomMutation();
  const isEdit = !!initial;
  const isLoading = creating || updating;

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
        notify.success('场地已更新');
      } else {
        await createRoom(values).unwrap();
        notify.success('场地已创建');
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
      title={isEdit ? '编辑场地' : '新建场地'}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isLoading}
            className="bg-gradient-brand hover:opacity-90"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">名称 *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue">所属场馆</Label>
          <Input id="venue" placeholder="国家体育场" {...register('venue')} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="rowCount" className="flex items-center gap-1">
              <Rows3 className="h-3.5 w-3.5" />
              行数 *
            </Label>
            <Input id="rowCount" type="number" min={1} {...register('rowCount')} />
            {errors.rowCount && (
              <p className="text-xs text-destructive">{errors.rowCount.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="colCount" className="flex items-center gap-1">
              <Columns3 className="h-3.5 w-3.5" />
              列数 *
            </Label>
            <Input id="colCount" type="number" min={1} {...register('colCount')} />
            {errors.colCount && (
              <p className="text-xs text-destructive">{errors.colCount.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">描述</Label>
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
