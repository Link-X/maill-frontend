import { useEffect, useState } from 'react';
import { Save, Tag, DollarSign } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  extractErrorMessage,
  notify,
  type RoomArea,
} from '@maill/shared';
import { Drawer } from '@/components/Drawer';
import { Card } from '@/components/Card';
import {
  useListRoomAreasQuery,
  useListRoomSeatsQuery,
  useSaveRoomAreasMutation,
} from './roomsApi';

interface Props {
  open: boolean;
  onClose: () => void;
  roomId: number | string;
}

interface DraftRow {
  areaId: string;
  defaultPrice: string;
  defaultOriginPrice: string;
}

const AREA_BG: Record<string, string> = {
  A: 'bg-area-a',
  B: 'bg-area-b',
  C: 'bg-area-c',
  D: 'bg-area-d',
};

export function AreaPriceDrawer({ open, onClose, roomId }: Props) {
  const { data: areas = [] } = useListRoomAreasQuery(roomId, { skip: !open });
  const { data: seats = [] } = useListRoomSeatsQuery(roomId, { skip: !open });
  const [saveAreas, { isLoading }] = useSaveRoomAreasMutation();
  const [draft, setDraft] = useState<DraftRow[]>([]);

  useEffect(() => {
    if (!open) return;
    const usedAreaIds = Array.from(new Set(seats.map((s) => s.areaId))).sort();
    const priceMap = new Map<string, RoomArea>();
    areas.forEach((a) => priceMap.set(a.areaId, a));
    const next: DraftRow[] = usedAreaIds.map((areaId) => {
      const existing = priceMap.get(areaId);
      return {
        areaId,
        defaultPrice: existing?.defaultPrice ?? '',
        defaultOriginPrice: existing?.defaultOriginPrice ?? '',
      };
    });
    setDraft(next);
  }, [open, seats, areas]);

  const updateRow = (idx: number, patch: Partial<DraftRow>) => {
    setDraft((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    for (const row of draft) {
      if (!row.defaultPrice || Number.isNaN(Number(row.defaultPrice))) {
        notify.error(`区域 ${row.areaId} 的默认价格无效`);
        return;
      }
      if (row.defaultOriginPrice && Number.isNaN(Number(row.defaultOriginPrice))) {
        notify.error(`区域 ${row.areaId} 的折扣前价格无效`);
        return;
      }
    }
    const payload: RoomArea[] = draft.map((row) => ({
      roomId,
      areaId: row.areaId,
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
            disabled={isLoading || draft.length === 0}
            className="bg-gradient-brand hover:opacity-90"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </>
      }
    >
      {draft.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          请先在座位模板中放置至少一个座位（区域 A/B/C/D），保存后再来设置价格。
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            为每个使用中的区域设定默认价格。场次创建后会以此为基准，可在场次详情中单独覆盖。
          </p>
          {draft.map((row, idx) => (
            <Card key={row.areaId} className="p-4 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <span
                  className={`inline-block h-5 w-5 rounded ${AREA_BG[row.areaId] ?? 'bg-muted'}`}
                  aria-hidden
                />
                区域 {row.areaId}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`price-${row.areaId}`} className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    默认价格 *
                  </Label>
                  <Input
                    id={`price-${row.areaId}`}
                    value={row.defaultPrice}
                    onChange={(e) => updateRow(idx, { defaultPrice: e.target.value })}
                    placeholder="380"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`origin-${row.areaId}`}>折扣前价格</Label>
                  <Input
                    id={`origin-${row.areaId}`}
                    value={row.defaultOriginPrice}
                    onChange={(e) => updateRow(idx, { defaultOriginPrice: e.target.value })}
                    placeholder="可选"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Drawer>
  );
}
