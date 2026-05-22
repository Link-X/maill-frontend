import type { SeatStatus, SeatType } from './enums';

// /api/session/detail 返回的座位图结构（用户端选座用）
export interface SeatCell {
  rowNo: number;
  colNo: number;
  seatType: SeatType;
  areaId: string;
  status: SeatStatus;
  price: string;
  originPrice?: string;
}

export interface SeatRow {
  rowNo: number;
  seats: SeatCell[];
}

export interface SeatSection {
  areaId: string;
  areaName?: string;
  price: string;
  originPrice?: string;
}

// 用户端 /api/session/detail 响应
export interface SessionDetail {
  sessionId: number | string;
  showId: number | string;
  showName: string;
  venue?: string;
  startTime: string;
  endTime: string;
  limitPerUser: number;
  rowCount: number;
  colCount: number;
  sections: SeatSection[];
  seatRows: SeatRow[];
}

// 商家端：场次内的具体座位（admin/seat/list 返回）
export interface AdminSeat {
  id?: number | string;
  sessionId: number | string;
  rowNo: number;
  colNo: number;
  type: SeatType;
  areaId: string;
  seatName?: string;
  pairSeatId?: number | string;
  status: SeatStatus;
  createTime?: string;
}

// 商家端：场次内的价格区域
export interface SessionArea {
  id?: number | string;
  sessionId: number | string;
  areaId: string;
  price: string;
  originPrice?: string;
}
