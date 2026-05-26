import { createApi } from '@reduxjs/toolkit/query/react';
import type { ShowSubscribe } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

// 订阅列表查询参数
interface ListArg { page?: number; size?: number; }
// 订阅列表响应
interface ListRes { list: ShowSubscribe[]; total: number; page: number; size: number; }

export const subscribeApi = createApi({
  reducerPath: 'subscribeApi',
  baseQuery: userBaseQuery,
  tagTypes: ['Subscribe'],
  endpoints: (build) => ({
    // 新增开售订阅
    addSubscribe: build.mutation<boolean, { showId: number; notifyBeforeMinutes?: number }>({
      query: (body) => ({ url: '/api/subscribe/add', method: 'POST', body }),
      invalidatesTags: ['Subscribe'],
    }),
    // 取消订阅
    removeSubscribe: build.mutation<boolean, number>({
      query: (showId) => ({ url: '/api/subscribe/remove', method: 'POST', body: { showId } }),
      invalidatesTags: ['Subscribe'],
    }),
    // 检查是否已订阅
    checkSubscribe: build.query<boolean, number>({
      query: (showId) => ({ url: '/api/subscribe/check', params: { showId } }),
      providesTags: (_r, _e, id) => [{ type: 'Subscribe' as const, id }],
    }),
    // 订阅列表
    listSubscribes: build.query<ListRes, ListArg | void>({
      query: (arg) => ({ url: '/api/subscribe/list', params: arg ?? undefined }),
      providesTags: ['Subscribe'],
    }),
  }),
});

export const {
  useAddSubscribeMutation,
  useRemoveSubscribeMutation,
  useCheckSubscribeQuery,
  useListSubscribesQuery,
} = subscribeApi;
