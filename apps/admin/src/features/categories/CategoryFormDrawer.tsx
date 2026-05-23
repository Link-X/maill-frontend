import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const schema = z.object({
  name: z.string().min(1, '请输入分类名'),
  sort: z.coerce.number().int().min(0).default(0),
  icon: z.string().url('图标需为合法 URL').optional().or(z.literal('')),
  status: z.coerce.number().int().min(0).max(1),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  initial: Category | null;
}

export function CategoryFormDrawer({ open, onClose, initial }: Props) {
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const isEdit = !!initial;
  const isLoading = creating || updating;

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
        notify.success('分类已更新');
      } else {
        await createCategory(payload).unwrap();
        notify.success('分类已创建');
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
      title={isEdit ? '编辑分类' : '新建分类'}
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
          <Input id="name" {...register('name')} placeholder="演唱会 / 话剧 / 脱口秀..." />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort">排序</Label>
          <Input id="sort" type="number" {...register('sort')} placeholder="数字小的靠前" />
          {errors.sort && <p className="text-xs text-destructive">{errors.sort.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>图标</Label>
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
          <Label>状态</Label>
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
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}
