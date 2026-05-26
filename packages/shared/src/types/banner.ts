// 首页 Banner（与后端 com.ticket.core.domain.entity.Banner 对齐）
export interface Banner {
  id: number;
  title?: string;
  imageUrl: string;
  /** 0=无 1=演出 2=艺人 3=资讯 4=外链 */
  linkType?: 0 | 1 | 2 | 3 | 4;
  linkTarget?: string;
  sort?: number;
  startAt?: string;
  endAt?: string;
  /** 0=下架 1=上架 */
  status?: 0 | 1;
  createTime?: string;
  updateTime?: string;
}

export const BANNER_LINK_TYPE = {
  NONE: 0,
  SHOW: 1,
  ARTIST: 2,
  ARTICLE: 3,
  URL: 4,
} as const;
