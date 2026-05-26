import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button, Input, extractErrorMessage, notify } from '@maill/shared';
import {
  useListGroupsQuery,
  useCreateGroupMutation,
  useRenameGroupMutation,
  useDeleteGroupMutation,
} from './favoritesApi';

export default function FavoriteGroupsPage() {
  const navigate = useNavigate();
  const { data: groups = [] } = useListGroupsQuery();
  const [createGroup, { isLoading: creating }] = useCreateGroupMutation();
  const [renameGroup] = useRenameGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();
  const [newName, setNewName] = useState('');

  // 创建分组
  const handleCreate = async () => {
    const n = newName.trim();
    if (!n) return;
    try {
      await createGroup(n).unwrap();
      setNewName('');
      notify.success('已创建');
    } catch (e) { notify.error(extractErrorMessage(e)); }
  };

  // 重命名分组
  const handleRename = async (id: number, currentName: string) => {
    const name = prompt('修改分组名', currentName);
    if (!name || name.trim() === '' || name === currentName) return;
    try {
      await renameGroup({ id, name: name.trim() }).unwrap();
      notify.success('已更新');
    } catch (e) { notify.error(extractErrorMessage(e)); }
  };

  // 删除分组
  const handleDelete = async (id: number) => {
    if (!confirm('删除分组?该分组下的收藏将变为未分组,不会被删除。')) return;
    try {
      await deleteGroup(id).unwrap();
      notify.success('已删除');
    } catch (e) { notify.error(extractErrorMessage(e)); }
  };

  return (
    <div className="px-4 py-3 space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">分组管理</h1>
      </div>

      <div className="flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="新分组名" />
        <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
          <Plus className="h-4 w-4 mr-1" />新建
        </Button>
      </div>

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
            <span className="font-medium">{g.name}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleRename(g.id, g.name)} className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => handleDelete(g.id)} className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          </div>
        ))}
        {groups.length === 0 && <p className="text-sm text-muted-foreground text-center mt-8">还没有自定义分组</p>}
      </div>
    </div>
  );
}
