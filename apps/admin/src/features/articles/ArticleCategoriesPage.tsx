import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderTree, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  Button,
  extractErrorMessage,
  notify,
  type ArticleCategory,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/Badge';
import {
  useListArticleCategoriesQuery,
  useDeleteArticleCategoryMutation,
} from './articleCategoriesApi';
import { ArticleCategoryFormDrawer } from './ArticleCategoryFormDrawer';

export default function ArticleCategoriesPage() {
  const { t } = useTranslation(['articleCategory', 'common']);
  const { data: categories = [], isLoading } = useListArticleCategoriesQuery();
  const [deleteCat, { isLoading: deleting }] = useDeleteArticleCategoryMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ArticleCategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ArticleCategory | null>(null);

  const openCreate = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (c: ArticleCategory) => { setEditing(c); setDrawerOpen(true); };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteCat(pendingDelete.id).unwrap();
      notify.success(t('articleCategory:delete.successToast'));
      setPendingDelete(null);
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const columns: Column<ArticleCategory>[] = [
    { key: 'name', title: t('articleCategory:table.name'), render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'sort', title: t('articleCategory:table.sort'), width: '80px', render: (c) => c.sort ?? 0 },
    {
      key: 'status',
      title: t('articleCategory:table.status'),
      width: '80px',
      render: (c) => (
        <Badge variant={c.status === 1 ? 'success' : 'muted'}>
          {t(c.status === 1 ? 'articleCategory:status.enabled' : 'articleCategory:status.disabled')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: t('articleCategory:table.actions'),
      width: '200px',
      render: (c) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.edit')}
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
        title={t('articleCategory:page.title')}
        subtitle={t('articleCategory:page.subtitle')}
        icon={FolderTree}
        actions={
          <Button onClick={openCreate} className="bg-gradient-brand hover:opacity-90">
            <Plus className="h-4 w-4 mr-1.5" />
            {t('articleCategory:page.addBtn')}
          </Button>
        }
      />
      <DataTable<ArticleCategory>
        columns={columns}
        data={categories}
        rowKey={(c) => String(c.id)}
        loading={isLoading}
      />

      <ArticleCategoryFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={editing}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('articleCategory:delete.title')}
        description={pendingDelete ? t('articleCategory:delete.desc', { name: pendingDelete.name }) : ''}
        destructive
        confirmText={deleting ? t('articleCategory:delete.btnDeleting') : t('articleCategory:delete.btn')}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
