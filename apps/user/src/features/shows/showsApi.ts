import { createApi } from '@reduxjs/toolkit/query/react';
import type { Show } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

interface ShowListRequest {
  page: number;
  size: number;
  name?: string;
  categoryId?: number;
  cityCode?: string;
  venue?: string;
}

interface ShowListResponse {
  total: number;
  list: Show[];
}

interface ShowsByArtistRequest {
  artistId: number | string;
  page?: number;
  size?: number;
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
    // GET /api/show/by-artist/{artistId} — 公开接口，按 show_artist 关联 id DESC 排
    listShowsByArtist: build.query<ShowListResponse, ShowsByArtistRequest>({
      query: ({ artistId, page = 1, size = 20 }) => ({
        url: `/api/show/by-artist/${artistId}`,
        method: 'GET',
        params: { page, size },
      }),
      providesTags: (result, _e, arg) => [
        { type: 'Show', id: `artist-${arg.artistId}` },
        ...(result?.list ?? []).map((s) => ({ type: 'Show' as const, id: s.id })),
      ],
    }),
  }),
});

export const { useListShowsQuery, useGetShowQuery, useListShowsByArtistQuery } = showsApi;
