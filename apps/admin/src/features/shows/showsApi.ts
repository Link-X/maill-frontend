import { createApi } from '@reduxjs/toolkit/query/react';
import type { Show } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

export const showsApi = createApi({
  reducerPath: 'showsApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['Show'],
  endpoints: (build) => ({
    listShows: build.query<Show[], { status?: number } | void>({
      query: (params) => ({
        url: '/api/admin/show/list',
        params: params?.status !== undefined ? { status: params.status } : undefined,
      }),
      providesTags: (result) => [
        'Show',
        ...(result ?? []).map((s) => ({ type: 'Show' as const, id: s.id })),
      ],
    }),
    getShow: build.query<Show, number | string>({
      query: (id) => `/api/admin/show/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Show', id }],
    }),
    createShow: build.mutation<Show, Partial<Show>>({
      query: (body) => ({ url: '/api/admin/show/create', method: 'POST', body }),
      invalidatesTags: ['Show'],
    }),
    updateShow: build.mutation<Show, Show>({
      query: (body) => ({ url: '/api/admin/show/update', method: 'PUT', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Show', id: arg.id }, 'Show'],
    }),
  }),
});

export const {
  useListShowsQuery,
  useGetShowQuery,
  useCreateShowMutation,
  useUpdateShowMutation,
} = showsApi;
