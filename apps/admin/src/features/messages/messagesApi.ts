import { createApi } from '@reduxjs/toolkit/query/react';
import type { Message } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

interface ListArg {
  type?: 1 | 2 | 3 | 4 | 5;
  broadcast?: 0 | 1;
  page?: number;
  size?: number;
}
interface ListRes { list: Message[]; total: number; page: number; size: number; }

export interface BroadcastBody {
  type: 1 | 2 | 3 | 4 | 5;
  title: string;
  content: string;
  linkType?: 0 | 1 | 2 | 3 | 4 | 5;
  linkTarget?: string;
}
export interface SendBody extends BroadcastBody {
  userIds: number[];
}

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['Message'],
  endpoints: (build) => ({
    listMessages: build.query<ListRes, ListArg | void>({
      query: (arg) => ({ url: '/api/admin/message/list', method: 'POST', body: arg ?? {} }),
      providesTags: ['Message'],
    }),
    broadcastMessage: build.mutation<Message, BroadcastBody>({
      query: (body) => ({ url: '/api/admin/message/broadcast', method: 'POST', body }),
      invalidatesTags: ['Message'],
    }),
    sendMessage: build.mutation<Message, SendBody>({
      query: (body) => ({ url: '/api/admin/message/send', method: 'POST', body }),
      invalidatesTags: ['Message'],
    }),
  }),
});

export const {
  useListMessagesQuery,
  useBroadcastMessageMutation,
  useSendMessageMutation,
} = messagesApi;
