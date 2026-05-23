import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  ShowStatus,
  extractErrorMessage,
  notify,
  type Show,
} from '@maill/shared';
import { Drawer } from '@/components/Drawer';
import { ImageUploader } from '@/components/ImageUploader';
import { useCreateShowMutation, useUpdateShowMutation } from './showsApi';
import { useListCategoriesQuery } from '@/features/categories/categoriesApi';

const schema = z.object({
  name: z.string().min(1, '请输入演出名称'),
  // categoryId 可为空（草稿允许不挑分类）；空串 → undefined
  categoryId: z
    .union([z.coerce.number().int().positive(), z.literal('')])
    .optional()
    .transform((v) => (v === '' || v == null ? undefined : Number(v))),
  venue: z.string().optional(),
  posterUrl: z.string().url('海报链接需为合法 URL').optional().or(z.literal('')),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  initial: Show | null;
}

export function ShowFormDrawer({ open, onClose, initial }: Props) {
  const [createShow, { isLoading: creating }] = useCreateShowMutation();
  const [updateShow, { isLoading: updating }] = useUpdateShowMutation();
  // 仅启用的分类供下拉
  const { data: categories = [] } = useListCategoriesQuery({ status: 1 });
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
    defaultValues: { name: '', categoryId: undefined, venue: '', posterUrl: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        categoryId: initial?.categoryId,
        venue: initial?.venue ?? '',
        posterUrl: initial?.posterUrl ?? '',
        description: initial?.description ?? '',
      });
    }
  }, [open, initial, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload = { ...values, posterUrl: values.posterUrl || undefined };
    try {
      if (isEdit && initial) {
        await updateShow({ ...initial, ...payload }).unwrap();
        notify.success('演出已更新');
      } else {
        await createShow({ ...payload, status: ShowStatus.Draft }).unwrap();
        notify.success('演出已创建');
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
      title={isEdit ? '编辑演出' : '新建演出'}
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
          <Label htmlFor="categoryId">分类</Label>
          <select
            id="categoryId"
            {...register('categoryId')}
            className="h-9 w-full border border-input bg-background px-3 text-sm rounded-md"
          >
            <option value="">未分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-xs text-destructive">{errors.categoryId.message as string}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue">场地</Label>
          <Input id="venue" placeholder="国家体育场" {...register('venue')} />
        </div>
        <div className="space-y-2">
          <Label>海报</Label>
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
          <Label htmlFor="description">描述</Label>
          <textarea
            id="description"
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('description')}
          />
        </div>
      </form>
    </Drawer>
  );
}
