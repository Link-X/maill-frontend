import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Grid3x3, Save, DollarSign, ArrowLeft } from 'lucide-react';
import {
  Button,
  extractErrorMessage,
  notify,
  type RoomSeat,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import {
  useGetRoomTemplateQuery,
  useSaveRoomSeatsMutation,
} from './roomsApi';
import { SeatGridEditor } from './SeatGridEditor';
import { AreaPriceDrawer } from './AreaPriceDrawer';

export default function RoomDetailPage() {
  const { t } = useTranslation(['room', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const roomId = id ?? '';

  // 聚合接口：一次拿全 { room, seats, areas }
  const { data, isLoading } = useGetRoomTemplateQuery(roomId, { skip: !roomId });
  const room = data?.room;
  const serverSeats = data?.seats ?? [];
  const serverAreas = data?.areas ?? [];

  const [saveSeats, { isLoading: savingSeats }] = useSaveRoomSeatsMutation();

  const [draftSeats, setDraftSeats] = useState<RoomSeat[]>([]);
  const [priceDrawerOpen, setPriceDrawerOpen] = useState(false);

  useEffect(() => {
    setDraftSeats(serverSeats);
  }, [serverSeats]);

  const handleSaveSeats = async () => {
    if (!room) return;
    try {
      await saveSeats({ roomId: room.id, seats: draftSeats }).unwrap();
      notify.success(t('room:detail.saveSeatsToast', { n: draftSeats.length }));
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">{t('common:states.loading')}</div>;
  }
  if (!room) {
    return <div className="p-6 text-muted-foreground">{t('room:detail.notFound')}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={room.name}
        subtitle={t('room:detail.subtitle', {
          venue: room.venue ?? '-',
          rows: room.rowCount,
          cols: room.colCount,
        })}
        icon={Grid3x3}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/rooms')}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {t('room:detail.backToList')}
            </Button>
            <Button variant="outline" onClick={() => setPriceDrawerOpen(true)}>
              <DollarSign className="h-3.5 w-3.5 mr-1" />
              {t('room:detail.priceArea')}
            </Button>
            <Button
              onClick={handleSaveSeats}
              disabled={savingSeats}
              className="bg-gradient-brand hover:opacity-90"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {savingSeats
                ? t('room:detail.savingSeats')
                : t('room:detail.saveSeats', { n: draftSeats.length })}
            </Button>
          </>
        }
      />

      <SeatGridEditor
        rowCount={room.rowCount}
        colCount={room.colCount}
        seats={draftSeats}
        areas={serverAreas}
        onChange={setDraftSeats}
        roomId={room.id}
      />

      <AreaPriceDrawer
        open={priceDrawerOpen}
        onClose={() => setPriceDrawerOpen(false)}
        roomId={room.id}
        seats={serverSeats}
        areas={serverAreas}
      />
    </div>
  );
}
