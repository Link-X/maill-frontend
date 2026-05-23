import { useEffect, useMemo, useState } from 'react';
import { Save, Tag, DollarSign, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  extractErrorMessage,
  notify,
  type RoomArea,
  type RoomSeat,
} from '@maill/shared';
import { Drawer } from '@/components/Drawer';
import { Card } from '@/components/Card';
import { useSaveRoomAreasMutation } from './roomsApi';

// 与 SeatGridEditor / 用户端 SeatGrid 保持一致的区域配色
const AREA_PALETTE = ['bg-area-a', 'bg-area-b', 'bg-area-c', 'bg-area-d'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  roomId: number | string;
  // 由父组件（聚合接口持有方）传入，避免抽屉再独立发请求
  seats: RoomSeat[];
  areas: RoomArea[];
}

interface DraftRow {
  areaId: string;
  defaultPrice: string;
  defaultOriginPrice: string;
  // 服务器已存在的行（用于在被座位引用时锁定 areaId，防止误改导致 seats 指向丢失）
  persisted: boolean;
}

export function AreaPriceDrawer({ open, onClose, roomId, seats, areas }: Props) {
  const [saveAreas, { isLoading }] = useSaveRoomAreasMutation();
  const [draft, setDraft] = useState<DraftRow[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft(
      areas.map((a) => ({
        areaId: a.areaId,
        defaultPrice: a.defaultPrice,
        defaultOriginPrice: a.defaultOriginPrice ?? '',
        persisted: true,
      })),
    );
  }, [open, areas]);

  // 哪些 areaId 当前被座位引用 — 用于禁用删除/锁定 areaId 编辑
  const usedAreaIds = useMemo(() => new Set(seats.map((s) => s.areaId)), [seats]);

  const addRow = () =>
    setDraft((rows) => [
      ...rows,
      { areaId: '', defaultPrice: '', defaultOriginPrice: '', persisted: false },
    ]);
  const removeRow = (idx: number) =>
    setDraft((rows) => rows.filter((_, i) => i !== idx));
  const updateRow = (idx: number, patch: Partial<DraftRow>) =>
    setDraft((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const handleSave = async () => {
    const ids = new Set<string>();
    for (const row of draft) {
      const id = row.areaId.trim();
      if (!id) {
        notify.error('存在 areaId 为空的区域');
        return;
      }
      if (ids.has(id)) {
        notify.error(`areaId "${id}" 重复`);
        return;
      }
      ids.add(id);
      if (!row.defaultPrice || Number.isNaN(Number(row.defaultPrice))) {
        notify.error(`区域 ${id} 的默认价格无效`);
        return;
      }
      if (row.defaultOriginPrice && Number.isNaN(Number(row.defaultOriginPrice))) {
        notify.error(`区域 ${id} 的折扣前价格无效`);
        return;
      }
    }
    // 座位仍引用的区域不能被删除
    for (const seatAreaId of usedAreaIds) {
      if (!ids.has(seatAreaId)) {
        notify.error(`座位仍在使用区域 "${seatAreaId}"，请先在座位模板中移除该区域的座位`);
        return;
      }
    }
    const payload: RoomArea[] = draft.map((row) => ({
      roomId,
      areaId: row.areaId.trim(),
      defaultPrice: row.defaultPrice,
      defaultOriginPrice: row.defaultOriginPrice || undefined,
    }));
    try {
      await saveAreas({ roomId, areas: payload }).unwrap();
      notify.success('价格区域已保存');
      onClose();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="价格区域配置"
      width={520}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="bg-gradient-brand hover:opacity-90"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" />
          独立管理价格区域：可自由命名 areaId（如 VIP/A/楼座）；被座位引用的区域不能删除或改名。
        </p>

        {draft.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            还没有任何区域，点击下方按钮新增。
          </p>
        )}

        {draft.map((row, idx) => {
          const trimmedId = row.areaId.trim();
          const isReferenced = trimmedId !== '' && usedAreaIds.has(trimmedId);
          const lockId = row.persisted && isReferenced;
          const color = AREA_PALETTE[idx % AREA_PALETTE.length];
          return (
            <Card key={idx} className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-5 w-5 rounded shrink-0 ${color}`} aria-hidden />
                <Input
                  value={row.areaId}
                  onChange={(e) => updateRow(idx, { areaId: e.target.value })}
                  placeholder="区域 ID，如 VIP / A / 楼座"
                  disabled={lockId}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeRow(idx)}
                  disabled={isReferenced}
                  title={isReferenced ? '该区域有座位引用，无法删除' : '删除区域'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    默认价格 *
                  </Label>
                  <Input
                    value={row.defaultPrice}
                    onChange={(e) => updateRow(idx, { defaultPrice: e.target.value })}
                    placeholder="380"
                  />
                </div>
                <div className="space-y-1">
                  <Label>折扣前价格</Label>
                  <Input
                    value={row.defaultOriginPrice}
                    onChange={(e) => updateRow(idx, { defaultOriginPrice: e.target.value })}
                    placeholder="可选"
                  />
                </div>
              </div>
            </Card>
          );
        })}

        <Button variant="outline" size="sm" onClick={addRow} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          新增区域
        </Button>
      </div>
    </Drawer>
  );
}
