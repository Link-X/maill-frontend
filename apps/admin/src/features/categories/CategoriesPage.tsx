import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Plus, Edit2, Trash2, Power } from 'lucide-react';
import {
  Button,
  extractErrorMessage,
  notify,
  type Category,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/Badge';
import { formatDateTime } from '@/lib/format';
import {
  useListCategoriesQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from './categoriesApi';
import { CategoryFormDrawer } from './CategoryFormDrawer';

export default function CategoriesPage() {
  const { t } = useTranslation(['category', 'common']);
  const { data: categories = [], isLoading } = useListCategoriesQuery();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setDrawerOpen(true);
  };

  const toggleStatus = async (c: Category) => {
    const willEnable = c.status !== 1;
    try {
      await updateCategory({ ...c, status: willEnable ? 1 : 0 }).unwrap();
      notify.success(
        t(willEnable ? 'category:toggle.enabledToast' : 'category:toggle.disabledToast', {
          name: c.name,
        }),
      );
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteCategory(pendingDelete.id).unwrap();
      notify.success(t('category:delete.successToast', { name: pendingDelete.name }));
      setPendingDelete(null);
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const columns: Column<Category>[] = [
    {
      key: 'icon',
      title: t('category:table.icon'),
      width: '64px',
      render: (c) =>
        c.icon ? (
          <img src={c.icon} alt="" className="w-9 h-9 object-cover rounded-md" />
        ) : (
          <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
            <Tag className="h-4 w-4" />
          </div>
        ),
    },
    { key: 'name', title: t('category:table.name'), render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'sort', title: t('category:table.sort'), width: '80px', render: (c) => c.sort ?? 0 },
    {
      key: 'status',
      title: t('category:table.status'),
      width: '80px',
      render: (c) => (
        <Badge variant={c.status === 1 ? 'success' : 'muted'}>
          {t(c.status === 1 ? 'category:status.enabled' : 'category:status.disabled')}
        </Badge>
      ),
    },
    { key: 'createTime', title: t('category:table.createTime'), render: (c) => formatDateTime(c.createTime) },
    {
      key: 'actions',
      title: t('category:table.actions'),
      width: '260px',
      render: (c) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.edit')}
          </Button>
          <Button
            size="sm"
            variant={c.status === 1 ? 'destructive' : 'default'}
            onClick={() => toggleStatus(c)}
          >
            <Power className="h-3.5 w-3.5 mr-1" />
            {t(c.status === 1 ? 'category:action.disableShort' : 'category:action.enableShort')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPendingDelete(c)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('category:page.title')}
        subtitle={t('category:page.subtitle')}
        icon={Tag}
        actions={
          <Button onClick={openCreate} className="bg-gradient-brand hover:opacity-90">
            <Plus className="h-4 w-4 mr-1.5" />
            {t('category:action.createBtn')}
          </Button>
        }
      />
      <DataTable<Category>
        columns={columns}
        data={categories}
        rowKey={(c) => String(c.id)}
        loading={isLoading}
      />

      <CategoryFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={editing}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('category:delete.title')}
        description={
          pendingDelete && t('category:delete.desc', { name: pendingDelete.name })
        }
        destructive
        confirmText={deleting ? t('category:delete.btnDeleting') : t('category:delete.btn')}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
