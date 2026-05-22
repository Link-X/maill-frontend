import type { SeatType } from './enums';

export interface Room {
  id: number | string;
  name: string;
  venue?: string;
  rows: number;
  cols: number;
  createTime?: string;
}

export interface SeatTemplate {
  roomId: number | string;
  rowNo: number;
  colNo: number;
  seatType: SeatType;
  areaId: number;
}

export interface AreaPrice {
  roomId: number | string;
  areaId: number;
  areaName?: string;
  defaultPrice: number;
  defaultOriginPrice?: number;
}
