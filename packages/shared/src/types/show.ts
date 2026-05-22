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
  roomId?: number | string;
  name?: string;
  startTime: string;
  endTime: string;
  totalSeats?: number;
  limitPerUser: number;
  status: SessionStatus;
  rowCount?: number;
  colCount?: number;
  createTime?: string;
  updateTime?: string;
  showName?: string;
  venue?: string;
}
