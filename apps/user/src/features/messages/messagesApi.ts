import { createApi } from '@reduxjs/toolkit/query/react';
import type { UserMessage, UnreadCounts } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

interface ListRes {
  list: UserMessage[];
  page: number;
  size: number;
}

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery: userBaseQuery,
  tagTypes: ['Message', 'Unread'],
  endpoints: (build) => ({
    listMessages: build.query<ListRes, { type?: number; page?: number; size?: number } | void>({
      query: (arg) => ({ url: '/api/message/list', params: arg ?? undefined }),
      providesTags: ['Message'],
    }),
    unreadCounts: build.query<UnreadCounts, void>({
      query: () => '/api/message/unread/count',
      providesTags: ['Unread'],
    }),
    markRead: build.mutation<number, number[]>({
      query: (ids) => ({ url: '/api/message/read', method: 'POST', body: { ids } }),
      invalidatesTags: ['Message', 'Unread'],
    }),
    markAllRead: build.mutation<number, number | undefined>({
      query: (type) => ({ url: '/api/message/read/all', method: 'POST', body: type ? { type } : {} }),
      invalidatesTags: ['Message', 'Unread'],
    }),
    deleteMessages: build.mutation<number, number[]>({
      query: (ids) => ({ url: '/api/message/delete', method: 'POST', body: { ids } }),
      invalidatesTags: ['Message', 'Unread'],
    }),
  }),
});

export const {
  useListMessagesQuery,
  useUnreadCountsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteMessagesMutation,
} = messagesApi;
