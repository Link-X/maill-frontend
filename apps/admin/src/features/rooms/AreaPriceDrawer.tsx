import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  // 服务器已存在的行（用于在被座位引用时锁定 areaId）
  persisted: boolean;
}

export function AreaPriceDrawer({ open, onClose, roomId, seats, areas }: Props) {
  const { t } = useTranslation(['room', 'common']);
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
        notify.error(t('room:priceDrawer.errEmptyId'));
        return;
      }
      if (ids.has(id)) {
        notify.error(t('room:priceDrawer.errDuplicateId', { id }));
        return;
      }
      ids.add(id);
      if (!row.defaultPrice || Number.isNaN(Number(row.defaultPrice))) {
        notify.error(t('room:priceDrawer.errInvalidPrice', { id }));
        return;
      }
      if (row.defaultOriginPrice && Number.isNaN(Number(row.defaultOriginPrice))) {
        notify.error(t('room:priceDrawer.errInvalidOriginPrice', { id }));
        return;
      }
    }
    for (const seatAreaId of usedAreaIds) {
      if (!ids.has(seatAreaId)) {
        notify.error(t('room:priceDrawer.errReferenced', { id: seatAreaId }));
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
      notify.success(t('room:priceDrawer.savedToast'));
      onClose();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('room:priceDrawer.title')}
      width={520}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="bg-gradient-brand hover:opacity-90"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isLoading ? t('common:actions.saving') : t('common:actions.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" />
          {t('room:priceDrawer.hint')}
        </p>

        {draft.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t('room:priceDrawer.empty')}
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
                  placeholder={t('room:priceDrawer.areaIdPlaceholder')}
                  disabled={lockId}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeRow(idx)}
                  disabled={isReferenced}
                  title={
                    isReferenced
                      ? t('room:priceDrawer.delTooltipReferenced')
                      : t('room:priceDrawer.delTooltipDefault')
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {t('room:priceDrawer.defaultPrice')}
                  </Label>
                  <Input
                    value={row.defaultPrice}
                    onChange={(e) => updateRow(idx, { defaultPrice: e.target.value })}
                    placeholder={t('room:priceDrawer.defaultPricePlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('room:priceDrawer.originPrice')}</Label>
                  <Input
                    value={row.defaultOriginPrice}
                    onChange={(e) => updateRow(idx, { defaultOriginPrice: e.target.value })}
                    placeholder={t('room:priceDrawer.originPricePlaceholder')}
                  />
                </div>
              </div>
            </Card>
          );
        })}

        <Button variant="outline" size="sm" onClick={addRow} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {t('room:priceDrawer.addBtn')}
        </Button>
      </div>
    </Drawer>
  );
}
