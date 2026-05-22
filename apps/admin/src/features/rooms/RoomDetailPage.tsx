import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Grid3x3, Save, DollarSign, ArrowLeft } from 'lucide-react';
import {
  Button,
  extractErrorMessage,
  notify,
  type RoomSeat,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import {
  useGetRoomQuery,
  useListRoomSeatsQuery,
  useSaveRoomSeatsMutation,
} from './roomsApi';
import { SeatGridEditor } from './SeatGridEditor';
import { AreaPriceDrawer } from './AreaPriceDrawer';

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const roomId = id ?? '';
  const { data: room, isLoading: loadingRoom } = useGetRoomQuery(roomId, { skip: !roomId });
  const { data: serverSeats = [] } = useListRoomSeatsQuery(roomId, { skip: !roomId });
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
      notify.success(`座位模板已保存（${draftSeats.length} 个座位）`);
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  if (loadingRoom) {
    return <div className="p-6 text-muted-foreground">加载中...</div>;
  }
  if (!room) {
    return <div className="p-6 text-muted-foreground">场地不存在</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={room.name}
        subtitle={`${room.venue ?? '-'} · ${room.rowCount} 行 × ${room.colCount} 列`}
        icon={Grid3x3}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/rooms')}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              返回列表
            </Button>
            <Button variant="outline" onClick={() => setPriceDrawerOpen(true)}>
              <DollarSign className="h-3.5 w-3.5 mr-1" />
              价格区域
            </Button>
            <Button
              onClick={handleSaveSeats}
              disabled={savingSeats}
              className="bg-gradient-brand hover:opacity-90"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {savingSeats ? '保存中...' : `保存座位模板（${draftSeats.length}）`}
            </Button>
          </>
        }
      />

      <SeatGridEditor
        rowCount={room.rowCount}
        colCount={room.colCount}
        seats={draftSeats}
        onChange={setDraftSeats}
        roomId={room.id}
      />

      <AreaPriceDrawer
        open={priceDrawerOpen}
        onClose={() => setPriceDrawerOpen(false)}
        roomId={room.id}
      />
    </div>
  );
}
