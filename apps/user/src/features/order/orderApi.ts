import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  CancelOrderRequest,
  OrderStatusResponse,
  SubmitOrderRequest,
} from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

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
      invalidatesTags: ['Order'],
    }),
    getOrderDetails: build.query<OrderStatusResponse, string>({
      query: (orderNo) => ({ url: '/api/order/orderDetails', params: { orderNo } }),
      providesTags: (_r, _e, orderNo) => [{ type: 'Order', id: orderNo }],
    }),
  }),
});

export const {
  useSubmitOrderMutation,
  useCancelOrderMutation,
  useGetOrderDetailsQuery,
} = orderApi;
