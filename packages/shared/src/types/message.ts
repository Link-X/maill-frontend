export interface Message {
  id: number;
  /** 1=订单 2=开售提醒 3=系统通知 4=互动 5=关注动态 */
  type: 1 | 2 | 3 | 4 | 5;
  title: string;
  content: string;
  /** 0=无 1=演出 2=艺人 3=资讯 4=订单 5=URL */
  linkType?: 0 | 1 | 2 | 3 | 4 | 5;
  linkTarget?: string;
  /** 0=单发 1=广播 */
  broadcast?: 0 | 1;
  createTime?: string;
  updateTime?: string;
}

export interface UserMessage {
  id: number;
  userId: number;
  messageId: number;
  isRead: 0 | 1;
  readAt?: string;
  createTime?: string;
  message?: Message;
}

export const MESSAGE_TYPE = {
  ORDER: 1,
  OPEN_SALE: 2,
  SYSTEM: 3,
  INTERACTION: 4,
  FOLLOW_FEED: 5,
} as const;

export const MESSAGE_LINK_TYPE = {
  NONE: 0,
  SHOW: 1,
  ARTIST: 2,
  ARTICLE: 3,
  ORDER: 4,
  URL: 5,
} as const;

export interface UnreadCounts {
  order: number;
  openSale: number;
  system: number;
  interaction: number;
  followFeed: number;
  total: number;
}
