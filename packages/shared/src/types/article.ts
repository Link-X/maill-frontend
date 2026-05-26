import type { ArticleCategory } from './article-category';
import type { Artist } from './artist';

export interface Article {
  id: number;
  categoryId: number;
  title: string;
  summary?: string;
  content: string;
  coverUrl?: string;
  artistId?: number;
  author?: string;
  viewCount?: number;
  /** 0=草稿 1=已发布 2=已下架 */
  status?: 0 | 1 | 2;
  publishedAt?: string;
  createTime?: string;
  updateTime?: string;
  category?: ArticleCategory;
  artist?: Artist;
}

export const ARTICLE_STATUS = {
  DRAFT: 0,
  PUBLISHED: 1,
  OFFLINE: 2,
} as const;
