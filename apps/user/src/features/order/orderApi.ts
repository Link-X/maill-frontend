import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  CancelOrderRequest,
  OrderListRequest,
  OrderStatusResponse,
  RefundTicketRequest,
  SubmitOrderRequest,
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
    submitOrder: build.mutation<OrderStatusResponse, SubmitOrderRequest>({
      query: (body) => ({ url: '/api/order/submit', method: 'POST', body }),
      invalidatesTags: ['Order'],
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
  useCancelOrderMutation,
  useRefundTicketMutation,
  useGetOrderDetailsQuery,
  useListOrdersQuery,
} = orderApi;
