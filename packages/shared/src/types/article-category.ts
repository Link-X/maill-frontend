export interface ArticleCategory {
  id: number;
  name: string;
  sort?: number;
  /** 0=下架 1=上架 */
  status?: 0 | 1;
  createTime?: string;
  updateTime?: string;
}
