import { createApi } from '@reduxjs/toolkit/query/react';
import type { AdminOrder, AdminOrderItem, OrderStatus, OrderStatusResponse } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

// POST /api/admin/order/list 入参
export interface AdminOrderListRequest {
  page: number;
  size: number;
  showId?: number | string;
  sessionId?: number | string;
  /** 精确匹配 */
  orderNo?: string;
  status?: OrderStatus;
  /** 按订单 createTime 范围筛选，ISO 字符串（如 "2026-01-01T00:00:00"） */
  startTime?: string;
  endTime?: string;
}

export interface AdminOrderListResponse {
  total: number;
  list: OrderStatusResponse[];
}

export const adminOrdersApi = createApi({
  reducerPath: 'adminOrdersApi',
  baseQuery: adminBaseQuery,
  endpoints: (build) => ({
    listAdminOrders: build.query<AdminOrderListResponse, AdminOrderListRequest>({
      query: (body) => ({ url: '/api/admin/order/list', method: 'POST', body }),
    }),
    queryOrderByNo: build.query<AdminOrder, string>({
      query: (orderNo) => ({ url: '/api/admin/order/query', params: { orderNo } }),
    }),
    getOrderItems: build.query<AdminOrderItem[], number | string>({
      query: (id) => `/api/admin/order/${id}/items`,
    }),
  }),
});

export const {
  useListAdminOrdersQuery,
  useLazyQueryOrderByNoQuery,
  useGetOrderItemsQuery,
} = adminOrdersApi;
