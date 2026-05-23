// 演出分类（与后端 com.ticket.core.domain.entity.Category 对齐）
export interface Category {
  id: number;
  name: string;
  sort?: number;
  icon?: string;
  /** 0=禁用 1=启用 */
  status?: 0 | 1;
  createTime?: string;
  updateTime?: string;
}
