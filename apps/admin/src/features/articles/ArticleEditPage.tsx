import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
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
} from '@maill/shared';
import { ImageUploader } from '@/components/ImageUploader';
import { useGetArticleQuery, useSaveArticleMutation } from './articlesApi';
import { useListArticleCategoriesQuery } from './articleCategoriesApi';
import { useListArtistsQuery } from '@/features/artists/artistsApi';
import { useUploadImageMutation } from '@/features/upload/uploadApi';

export default function ArticleEditPage() {
  const { t } = useTranslation(['article', 'common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const articleId = id ? Number(id) : 0;

  const { data: existing } = useGetArticleQuery(articleId, { skip: !isEdit });
  const { data: cats = [] } = useListArticleCategoriesQuery({ status: 1 });
  const { data: artists = [] } = useListArtistsQuery({ status: 1 });
  const [saveArticle, { isLoading: saving }] = useSaveArticleMutation();
  const [uploadImage] = useUploadImageMutation();

  // WangEditor 实例：保存到 state 以便工具栏绑定与组件卸载时销毁
  const [editor, setEditor] = useState<IDomEditor | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t('article:form.titleRequired')),
        categoryId: z.coerce.number().int().positive({ message: t('article:form.categoryRequired') }),
        summary: z.string().optional().or(z.literal('')),
        coverUrl: z.string().optional().or(z.literal('')),
        artistId: z
          .union([z.coerce.number().int().positive(), z.literal('')])
          .optional()
          .transform((v) => (v === '' || v == null ? undefined : Number(v))),
        author: z.string().optional().or(z.literal('')),
        status: z.coerce.number().int().min(0).max(2),
        content: z.string().min(1, t('article:form.contentRequired')),
      }),
    [t],
  );
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      title: '',
      categoryId: 0,
      summary: '',
      coverUrl: '',
      artistId: undefined,
      author: '',
      status: 0,
      content: '',
    },
  });

  const content = watch('content');

  // 编辑模式回填表单数据
  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title ?? '',
        categoryId: existing.categoryId,
        summary: existing.summary ?? '',
        coverUrl: existing.coverUrl ?? '',
        artistId: existing.artistId,
        author: existing.author ?? '',
        status: (existing.status ?? 0) as 0 | 1 | 2,
        content: existing.content ?? '',
      });
    }
  }, [existing, reset]);

  // 组件卸载时销毁编辑器,避免内存泄漏
  useEffect(
    () => () => {
      if (editor) {
        editor.destroy();
        setEditor(null);
      }
    },
    [editor],
  );

  const toolbarConfig: Partial<IToolbarConfig> = {};
  // 编辑器配置：自定义图片上传走管理端上传接口,存入 articles 目录
  const editorConfig: Partial<IEditorConfig> = useMemo(
    () => ({
      placeholder: '请输入资讯正文...',
      MENU_CONF: {
        uploadImage: {
          async customUpload(
            file: File,
            insertFn: (url: string, alt: string, href: string) => void,
          ) {
            try {
              const res = await uploadImage({ file, dir: 'articles' }).unwrap();
              insertFn(res.url, file.name, '');
            } catch (e) {
              notify.error(extractErrorMessage(e));
            }
          },
        },
      },
    }),
    [uploadImage],
  );

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveArticle({
        id: isEdit ? articleId : undefined,
        title: values.title,
        categoryId: values.categoryId,
        summary: values.summary || undefined,
        content: values.content,
        coverUrl: values.coverUrl || undefined,
        artistId: values.artistId,
        author: values.author || undefined,
        status: values.status as 0 | 1 | 2,
      }).unwrap();
      notify.success(t('article:form.savedToast'));
      navigate('/articles');
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  });

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/articles')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
        <h1 className="text-2xl font-semibold">
          {t(isEdit ? 'article:form.titleEdit' : 'article:form.titleNew')}
        </h1>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="title">{t('article:form.title')} *</Label>
          <Input id="title" {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('article:form.category')} *</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => (
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
          <div className="space-y-2">
            <Label>{t('article:form.artist')}</Label>
            <Controller
              control={control}
              name="artistId"
              render={({ field }) => (
                <Select
                  value={field.value == null ? '__none__' : String(field.value)}
                  onValueChange={(v) => field.onChange(v === '__none__' ? undefined : Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('article:form.artistUnspecified')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('article:form.artistUnspecified')}</SelectItem>
                    {artists.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.stageName || a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">{t('article:form.author')}</Label>
          <Input id="author" {...register('author')} />
        </div>

        <div className="space-y-2">
          <Label>{t('article:form.cover')}</Label>
          <Controller
            control={control}
            name="coverUrl"
            render={({ field }) => (
              <ImageUploader value={field.value} onChange={field.onChange} dir="articles" />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">{t('article:form.summary')}</Label>
          <textarea
            id="summary"
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={t('article:form.summaryPlaceholder')}
            {...register('summary')}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('article:form.content')} *</Label>
          <div className="border rounded">
            <Toolbar
              editor={editor}
              defaultConfig={toolbarConfig}
              mode="default"
              style={{ borderBottom: '1px solid #ccc' }}
            />
            <Editor
              defaultConfig={editorConfig}
              value={content}
              onCreated={setEditor}
              onChange={(e) => setValue('content', e.getHtml(), { shouldValidate: true })}
              mode="default"
              style={{ height: 500, overflowY: 'hidden' }}
            />
          </div>
          {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
        </div>

        <div className="space-y-2 max-w-xs">
          <Label>{t('article:form.status')}</Label>
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
                  <SelectItem value="0">{t('article:status.draft')}</SelectItem>
                  <SelectItem value="1">{t('article:status.published')}</SelectItem>
                  <SelectItem value="2">{t('article:status.offline')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/articles')}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" disabled={saving} className="bg-gradient-brand hover:opacity-90">
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? t('common:actions.saving') : t('common:actions.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
