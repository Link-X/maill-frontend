import { createApi } from '@reduxjs/toolkit/query/react';
import type { AdminOrder, AdminOrderItem } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

export const adminOrdersApi = createApi({
  reducerPath: 'adminOrdersApi',
  baseQuery: adminBaseQuery,
  endpoints: (build) => ({
    queryOrderByNo: build.query<AdminOrder, string>({
      query: (orderNo) => ({ url: '/api/admin/order/query', params: { orderNo } }),
    }),
    getOrderItems: build.query<AdminOrderItem[], number | string>({
      query: (id) => `/api/admin/order/${id}/items`,
    }),
  }),
});

export const { useLazyQueryOrderByNoQuery, useGetOrderItemsQuery } = adminOrdersApi;
