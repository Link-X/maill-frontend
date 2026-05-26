import type { Show } from './show';

// 用户收藏分组
export interface FavoriteGroup {
  id: number;
  userId?: number;
  name: string;
  sort?: number;
  createTime?: string;
  updateTime?: string;
}

// 用户收藏记录
export interface UserFavorite {
  id: number;
  userId?: number;
  showId: number;
  groupId?: number;
  createTime?: string;
  show?: Show & { categoryName?: string; cityName?: string };
}
