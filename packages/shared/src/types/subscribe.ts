import type { Show } from './show';

// 演出开售订阅
export interface ShowSubscribe {
  id: number;
  userId?: number;
  showId: number;
  notifyBeforeMinutes?: number;
  notifiedPre?: 0 | 1;
  notifiedOpen?: 0 | 1;
  createTime?: string;
  show?: Pick<Show, 'id' | 'name' | 'posterUrl' | 'venue'>;
}
