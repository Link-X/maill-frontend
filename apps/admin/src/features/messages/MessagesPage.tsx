import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageSquare, Send } from 'lucide-react';
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
  type Message,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { formatDateTime } from '@/lib/format';
import {
  useListMessagesQuery,
  useBroadcastMessageMutation,
  useSendMessageMutation,
} from './messagesApi';

const schema = z.object({
  type: z.coerce.number().int().min(1).max(5),
  title: z.string().min(1, '请输入标题'),
  content: z.string().min(1, '请输入内容'),
  linkType: z.coerce.number().int().min(0).max(5),
  linkTarget: z.string().optional().or(z.literal('')),
  mode: z.enum(['broadcast', 'send']),
  userIds: z.string().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export default function MessagesPage() {
  const { t } = useTranslation(['message', 'common']);
  const [page] = useState(1);
  const { data, isLoading } = useListMessagesQuery({ page, size: 20 });
  const list = data?.list ?? [];

  const [broadcastMessage, { isLoading: broadcasting }] = useBroadcastMessageMutation();
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 3, title: '', content: '', linkType: 0, linkTarget: '', mode: 'broadcast', userIds: '' },
  });
  const mode = watch('mode');

  const onSubmit = handleSubmit(async (values) => {
    try {
      const body = {
        type: values.type as 1 | 2 | 3 | 4 | 5,
        title: values.title,
        content: values.content,
        linkType: values.linkType as 0,
        linkTarget: values.linkTarget || undefined,
      };
      if (values.mode === 'broadcast') {
        await broadcastMessage(body).unwrap();
        notify.success(t('message:form.broadcastToast'));
      } else {
        const ids = (values.userIds ?? '')
          .split(',').map((s) => s.trim()).filter(Boolean).map(Number);
        if (ids.length === 0) {
          notify.error('请填写至少一个 user id');
          return;
        }
        await sendMessage({ ...body, userIds: ids }).unwrap();
        notify.success(t('message:form.sentToast'));
      }
      reset();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  });

  const typeLabel = (n?: number) => {
    const map = ['', 'order', 'openSale', 'system', 'interaction', 'followFeed'];
    return n ? t(`message:type.${map[n]}`) : '-';
  };

  const columns: Column<Message>[] = [
    { key: 'type', title: t('message:table.type'), width: '110px', render: (m) => typeLabel(m.type) },
    { key: 'title', title: t('message:table.title'), render: (m) => <span className="font-medium">{m.title}</span> },
    {
      key: 'broadcast', title: t('message:table.broadcast'), width: '80px',
      render: (m) => m.broadcast === 1
        ? <Badge variant="brand">广播</Badge>
        : <Badge variant="muted">单发</Badge>,
    },
    { key: 'createTime', title: t('message:table.createTime'), render: (m) => m.createTime ? formatDateTime(m.createTime) : '-' },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader title={t('message:page.broadcastTitle')} icon={MessageSquare} />

      <form className="grid grid-cols-2 gap-4 max-w-3xl bg-card border rounded-lg p-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label>{t('message:form.type')}</Label>
          <Controller control={control} name="type" render={({ field }) => (
            <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('message:type.order')}</SelectItem>
                <SelectItem value="2">{t('message:type.openSale')}</SelectItem>
                <SelectItem value="3">{t('message:type.system')}</SelectItem>
                <SelectItem value="4">{t('message:type.interaction')}</SelectItem>
                <SelectItem value="5">{t('message:type.followFeed')}</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-2">
          <Label>模式</Label>
          <Controller control={control} name="mode" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="broadcast">{t('message:form.broadcastBtn')}</SelectItem>
                <SelectItem value="send">{t('message:form.sendBtn')}</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>

        <div className="col-span-2 space-y-2">
          <Label>{t('message:form.title')}</Label>
          <Input {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="col-span-2 space-y-2">
          <Label>{t('message:form.content')}</Label>
          <textarea
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('content')}
          />
          {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t('message:form.linkType')}</Label>
          <Controller control={control} name="linkType" render={({ field }) => (
            <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t('message:linkType.none')}</SelectItem>
                <SelectItem value="1">{t('message:linkType.show')}</SelectItem>
                <SelectItem value="2">{t('message:linkType.artist')}</SelectItem>
                <SelectItem value="3">{t('message:linkType.article')}</SelectItem>
                <SelectItem value="4">{t('message:linkType.order')}</SelectItem>
                <SelectItem value="5">{t('message:linkType.url')}</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-2">
          <Label>{t('message:form.linkTarget')}</Label>
          <Input {...register('linkTarget')} placeholder="ID 或 URL" />
        </div>

        {mode === 'send' && (
          <div className="col-span-2 space-y-2">
            <Label>{t('message:form.userIds')}</Label>
            <Input {...register('userIds')} placeholder={t('message:form.userIdsPlaceholder')} />
          </div>
        )}

        <div className="col-span-2">
          <Button onClick={onSubmit} disabled={broadcasting || sending} className="bg-gradient-brand hover:opacity-90">
            <Send className="h-4 w-4 mr-1.5" />
            {mode === 'broadcast' ? t('message:form.broadcastBtn') : t('message:form.sendBtn')}
          </Button>
        </div>
      </form>

      <h2 className="text-lg font-semibold">已发消息</h2>
      <DataTable<Message> columns={columns} data={list} rowKey={(m) => String(m.id)} loading={isLoading} />
      <p className="text-xs text-muted-foreground">{`第 ${page} 页,共 ${data?.total ?? 0} 条`}</p>
    </div>
  );
}
