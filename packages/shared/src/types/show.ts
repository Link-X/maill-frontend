import type { ShowStatus, SessionStatus } from './enums';
import type { Artist } from './artist';

export interface Show {
  id: number | string;
  name: string;
  // 关联 category 表（后端 ShowVO 同时返回 categoryName 避免前端再查）
  categoryId?: number;
  categoryName?: string;
  // 关联 city 表（用 GB/T 行政区划码 cityCode，不是 city.id；后端 ShowVO 同时返回 cityName）
  cityCode?: string;
  cityName?: string;
  /** 详细地址，与 venue 互补：venue=场馆名（"国家体育场"），address=详细地址 */
  address?: string;
  venue?: string;
  posterUrl?: string;
  description?: string;
  status: ShowStatus;
  /** 扩展字段：后端原 JSON 字符串，前端用 parseExtend() 解析。约定字段见 ShowExtend */
  extend?: string;
  createTime?: string;
  updateTime?: string;
  /** 0=无评价 1=所有可评 2=仅已观看 */
  reviewMode?: 0 | 1 | 2;
  avgRating?: number;
  reviewCount?: number;
  artists?: Artist[];
}

export interface ShowSession {
  id: number | string;
  showId: number | string;
  roomId?: number | string;
  name?: string;
  startTime: string;
  endTime: string;
  /** 开售时间;NULL 表示创建后立即可被定时任务流转为销售中 */
  openSaleTime?: string;
  totalSeats?: number;
  limitPerUser: number;
  status: SessionStatus;
  rowCount?: number;
  colCount?: number;
  /** 扩展字段：后端原 JSON 字符串，前端用 parseExtend() 解析。约定字段见 SessionExtend */
  extend?: string;
  createTime?: string;
  updateTime?: string;
  showName?: string;
  venue?: string;
}

// 演出 extend 约定字段（后端只存原串、不参与 WHERE / 不建索引）
export interface ShowExtend {
  /** 时长（分钟） */
  duration?: number;
  /** 年龄限制，如 "6+" / "12+" */
  ageLimit?: string;
  /** 退票规则文案 */
  refundRule?: string;
  /** 允许任意其它键 */
  [key: string]: unknown;
}

// 场次 extend 约定字段
export interface SessionExtend {
  /** 提前进场分钟数 */
  preSaleLeadMinutes?: number;
  /** 现场须知文案 */
  notice?: string;
  [key: string]: unknown;
}
