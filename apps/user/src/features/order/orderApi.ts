import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  CancelOrderRequest,
  OrderCreateStatus,
  OrderListRequest,
  OrderStatusResponse,
  RefundTicketRequest,
  SubmitOrderRequest,
  SubmitOrderResponse,
} from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

interface OrderListResponse {
  total: number;
  list: OrderStatusResponse[];
}

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: userBaseQuery,
  tagTypes: ['Order'],
  endpoints: (build) => ({
    submitOrder: build.mutation<SubmitOrderResponse, SubmitOrderRequest>({
      query: (body) => ({ url: '/api/order/submit', method: 'POST', body }),
      invalidatesTags: ['Order'],
    }),
    /**
     * 异步建单状态轮询。submit 拿到 orderNo 后调本接口轮询,直到 state=SUCCESS/FAILED。
     * 不开启 RTK Query 缓存(每次都打实时,不需要 providesTags)。
     */
    getOrderCreateStatus: build.query<OrderCreateStatus, string>({
      query: (orderNo) => ({ url: '/api/order/createStatus', params: { orderNo } }),
    }),
    cancelOrder: build.mutation<void, CancelOrderRequest>({
      query: (body) => ({ url: '/api/order/cancel', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Order', id: arg.orderNo }, 'Order'],
    }),
    refundTicket: build.mutation<void, RefundTicketRequest>({
      query: (body) => ({ url: '/api/order/refundTicket', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Order', id: arg.orderNo }, 'Order'],
    }),
    getOrderDetails: build.query<OrderStatusResponse, string>({
      query: (orderNo) => ({ url: '/api/order/orderDetails', params: { orderNo } }),
      providesTags: (_r, _e, orderNo) => [{ type: 'Order', id: orderNo }],
    }),
    listOrders: build.query<OrderListResponse, OrderListRequest>({
      query: (body) => ({ url: '/api/order/list', method: 'POST', body }),
      providesTags: (result) => [
        'Order',
        ...(result?.list ?? []).map((o) => ({ type: 'Order' as const, id: o.orderNo })),
      ],
    }),
  }),
});

export const {
  useSubmitOrderMutation,
  useLazyGetOrderCreateStatusQuery,
  useCancelOrderMutation,
  useRefundTicketMutation,
  useGetOrderDetailsQuery,
  useListOrdersQuery,
} = orderApi;
