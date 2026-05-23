import { useState } from 'react';
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
    try {
      await updateCategory({ ...c, status: c.status === 1 ? 0 : 1 }).unwrap();
      notify.success(`已${c.status === 1 ? '禁用' : '启用'}：${c.name}`);
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteCategory(pendingDelete.id).unwrap();
      notify.success(`已删除：${pendingDelete.name}`);
      setPendingDelete(null);
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const columns: Column<Category>[] = [
    {
      key: 'icon',
      title: '图标',
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
    { key: 'name', title: '名称', render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'sort', title: '排序', width: '80px', render: (c) => c.sort ?? 0 },
    {
      key: 'status',
      title: '状态',
      width: '80px',
      render: (c) => (
        <Badge variant={c.status === 1 ? 'success' : 'muted'}>
          {c.status === 1 ? '启用' : '禁用'}
        </Badge>
      ),
    },
    { key: 'createTime', title: '创建时间', render: (c) => formatDateTime(c.createTime) },
    {
      key: 'actions',
      title: '操作',
      width: '260px',
      render: (c) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            编辑
          </Button>
          <Button
            size="sm"
            variant={c.status === 1 ? 'destructive' : 'default'}
            onClick={() => toggleStatus(c)}
          >
            <Power className="h-3.5 w-3.5 mr-1" />
            {c.status === 1 ? '禁用' : '启用'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPendingDelete(c)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="分类管理"
        subtitle="维护演出分类，用户端首页 tabs 与演出表单下拉的来源"
        icon={Tag}
        actions={
          <Button onClick={openCreate} className="bg-gradient-brand hover:opacity-90">
            <Plus className="h-4 w-4 mr-1.5" />
            新建分类
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
        title="删除分类"
        description={
          pendingDelete && (
            <span>
              确定要删除 <b>{pendingDelete.name}</b> 吗？被演出引用的分类无法删除。
            </span>
          )
        }
        destructive
        confirmText={deleting ? '删除中...' : '删除'}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
