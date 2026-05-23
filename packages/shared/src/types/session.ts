import type { SeatStatus, SeatType } from './enums';

// 商家端：场次内的具体座位（admin/seat/list 返回）— Plan 2 已建
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

// 商家端：场次内的价格区域 — Plan 2 已建
export interface SessionArea {
  id?: number | string;
  sessionId: number | string;
  areaId: string;
  price: string;
  originPrice?: string;
}

// 用户端 /api/session/detail 返回的 SeatColVO（一个座位单元格）
// type=0 表示占位空位（前端透明占位、不可点击），type=1/2/3 才是真座位
export interface SeatColVO {
  /** 座位数据库 ID，空位时为空字符串 */
  colId: string;
  /** 列号字符串；空位时为空字符串 */
  colNum: string;
  /** "1排01座"；空位时为 null */
  seatName: string | null;
  /** 0=空位, 1=普通, 2=情侣左, 3=情侣右 */
  type: 0 | 1 | 2 | 3;
  /** 价格区域 ID；空位时为 null */
  areaId: string | null;
  /** 0=可售 1=已锁 2=已售；type=0 时为 null */
  status: SeatStatus | null;
}

// 用户端 SeatRowVO
export interface SeatRowVO {
  rowsId: string;
  rowsNum: string;
  columns: SeatColVO[];
}

// 用户端 SeatSectionVO
export interface SeatSectionVO {
  rowCount: number;
  columnCount: number;
  seatRows: SeatRowVO[];
}

// 用户端 AreaPriceVO
export interface AreaPriceVO {
  areaId: string;
  price: string;
  originPrice?: string;
}

// /api/session/detail 整体响应
export interface SessionSeatResponseVO {
  session: import('./show').ShowSession;
  areaPriceList: AreaPriceVO[];
  seatSection: SeatSectionVO;
  // 关联演出信息（后端冗余返回，避免前端再查 /api/show/{id}）
  showId?: number | string;
  showName?: string;
  showVenue?: string;
  showAddress?: string;
  showCityCode?: string;
  showCityName?: string;
  showPosterUrl?: string;
}
