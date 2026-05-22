import type { SeatStatus, SeatType } from './enums';

// /api/session/detail 返回的座位图结构
export interface SeatCell {
  rowNo: number;
  colNo: number;
  seatType: SeatType;
  areaId: number;
  status: SeatStatus;
  price: number;
  originPrice?: number;
}

export interface SeatRow {
  rowNo: number;
  seats: SeatCell[];
}

export interface SeatSection {
  areaId: number;
  areaName?: string;
  price: number;
  originPrice?: number;
}

export interface SessionDetail {
  sessionId: number | string;
  showId: number | string;
  showName: string;
  venue?: string;
  startTime: string;
  endTime: string;
  limitPerUser: number;
  rows: number;
  cols: number;
  sections: SeatSection[];
  seatRows: SeatRow[];
}
