import type { ShowStatus, SessionStatus } from './enums';

export interface Show {
  id: number | string;
  name: string;
  category?: string;
  venue?: string;
  posterUrl?: string;
  description?: string;
  status: ShowStatus;
  createTime?: string;
  updateTime?: string;
}

export interface ShowSession {
  id: number | string;
  showId: number | string;
  roomId: number | string;
  startTime: string;
  endTime: string;
  limitPerUser: number;
  status: SessionStatus;
  showName?: string;
  venue?: string;
}
