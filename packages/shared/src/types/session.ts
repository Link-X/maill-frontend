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

// 售卖模式:1=用户选座, 2=系统派座
export type AreaSaleMode = 1 | 2;
// 派座策略(saleMode=2 生效):1=连坐优先, 2=分散, 3=任意
export type AllocateStrategy = 1 | 2 | 3;
// 派座票种:1=单座, 2=情侣对
export type AllocateTicketType = 1 | 2;

// 商家端:场次内的价格区域 — Plan 2 已建,新增售卖模式相关字段
export interface SessionArea {
  id?: number | string;
  sessionId: number | string;
  areaId: string;
  price: string;
  originPrice?: string;
  /** 售卖模式 — 1=用户选座, 2=系统派座;默认 1 */
  saleMode?: AreaSaleMode;
  /** 区域内单座总数(type=1),后端按 seat 表统计回写,前端只读 */
  singleTotal?: number;
  /** 区域内情侣对总数(type=2+3 成对),后端按 seat 表统计回写,前端只读 */
  coupleTotal?: number;
  /** 派座策略(saleMode=2 生效):1=连坐优先 2=分散 3=任意 */
  allocateStrategy?: AllocateStrategy;
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

// 用户端 /api/session/{id}/myLimit — 当前用户在场次的限购状态
export interface SessionPurchaseLimit {
  /** 场次配置的每用户限购张数 */
  limitPerUser: number;
  /** 当前已购张数(含未支付锁定 + 已支付) */
  purchased: number;
  /** 剩余可购张数 = max(0, limitPerUser - purchased) */
  remaining: number;
}

// 用户端 AreaPriceVO — 新增售卖模式字段(用户端按此决定渲染选座图或派座卡片)
export interface AreaPriceVO {
  areaId: string;
  price: string;
  originPrice?: string;
  /** 售卖模式 — 1=用户选座 2=系统派座;前端按此分流 UI */
  saleMode?: AreaSaleMode;
  /** 单座剩余数(派座区前端展示用);后端走 Redis area:stock:single */
  singleStock?: number;
  /** 情侣对剩余数 */
  coupleStock?: number;
  /** 区域单座总数(派座区展示"剩余 X / Y" 用) */
  singleTotal?: number;
  /** 区域情侣对总数 */
  coupleTotal?: number;
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
