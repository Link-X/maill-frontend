// 城市（与后端 com.ticket.core.domain.entity.City 对齐）
// code 是 GB/T 行政区划码（如 110000 北京），Show.cityCode 通过 code 关联，不是 id
export interface City {
  id: number;
  code: string;
  name: string;
  sort?: number;
  /** 0=禁用 1=启用 */
  status?: 0 | 1;
  createTime?: string;
  updateTime?: string;
}
