// 艺人（与后端 com.ticket.core.domain.entity.Artist 对齐）
export interface Artist {
  id: number;
  name: string;
  stageName?: string;
  avatarUrl?: string;
  /** 0=保密 1=男 2=女 */
  gender?: 0 | 1 | 2;
  nationality?: string;
  /** 逗号分隔标签 */
  tags?: string;
  /** 简介短文本 */
  bio?: string;
  /** 富文本详介 */
  description?: string;
  /** JSON 字符串,如 {"weibo":"","instagram":"","x":""} */
  socialLinks?: string;
  followCount?: number;
  showCount?: number;
  /** 0=下架 1=上架 */
  status?: 0 | 1;
  createTime?: string;
  updateTime?: string;
}
