import type { SeatType } from './enums';

// 场地（座位模板的载体）
export interface Room {
  id: number | string;
  name: string;
  venue?: string;
  rowCount: number;
  colCount: number;
  description?: string;
  createTime?: string;
  updateTime?: string;
}

// 后端 RoomSeat（场地座位模板）
export interface RoomSeat {
  id?: number | string;
  roomId: number | string;
  rowNo: number;
  colNo: number;
  type: SeatType;
  areaId: string;
  seatName?: string;
  pairSeatId?: number | string;
}

// 兼容 Plan 1 类型名（前端代码仍用 SeatTemplate 引用座位模板）
export type SeatTemplate = RoomSeat;

// 场地默认价格区域
export interface RoomArea {
  id?: number | string;
  roomId: number | string;
  areaId: string;
  defaultPrice: string; // 后端 BigDecimal，前端用 string 承载（避免精度丢失）
  defaultOriginPrice?: string;
}

// 兼容 Plan 1 类型名
export type AreaPrice = RoomArea;

// 后端聚合接口 /api/admin/room/template?roomId= 返回值：一次拿全场地基础信息、座位模板、价格区域
export interface RoomTemplateVO {
  room: Room;
  seats: RoomSeat[];
  areas: RoomArea[];
}
