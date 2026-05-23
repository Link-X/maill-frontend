import type { ShowStatus, SessionStatus } from './enums';

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
