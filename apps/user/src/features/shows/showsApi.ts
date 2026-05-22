import { createApi } from '@reduxjs/toolkit/query/react';
import type { Show } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

interface ShowListRequest {
  page: number;
  size: number;
  name?: string;
  category?: string;
  venue?: string;
}

interface ShowListResponse {
  total: number;
  list: Show[];
}

export const showsApi = createApi({
  reducerPath: 'showsApi',
  baseQuery: userBaseQuery,
  tagTypes: ['Show'],
  endpoints: (build) => ({
    listShows: build.query<ShowListResponse, ShowListRequest>({
      query: (body) => ({ url: '/api/show/list', method: 'POST', body }),
      providesTags: (result) => [
        'Show',
        ...(result?.list ?? []).map((s) => ({ type: 'Show' as const, id: s.id })),
      ],
    }),
    getShow: build.query<Show, number | string>({
      query: (id) => `/api/show/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Show', id }],
    }),
  }),
});

export const { useListShowsQuery, useGetShowQuery } = showsApi;
