import { createApi } from '@reduxjs/toolkit/query/react';
import type { Artist } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

interface ListRes {
  list: Artist[];
  total: number;
  page: number;
  size: number;
}

export const artistsApi = createApi({
  reducerPath: 'artistsApi',
  baseQuery: userBaseQuery,
  tagTypes: ['Artist', 'Follow'],
  endpoints: (build) => ({
    listArtists: build.query<ListRes, { page?: number; size?: number } | void>({
      query: (arg) => ({ url: '/api/artist/list', params: arg ?? undefined }),
    }),
    getArtist: build.query<Artist, number | string>({
      query: (id) => `/api/artist/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Artist', id: Number(id) }],
    }),
    followArtist: build.mutation<boolean, number>({
      query: (artistId) => ({ url: '/api/artist/follow', method: 'POST', body: { artistId } }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Artist', id }, 'Follow'],
    }),
    unfollowArtist: build.mutation<boolean, number>({
      query: (artistId) => ({ url: '/api/artist/unfollow', method: 'POST', body: { artistId } }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Artist', id }, 'Follow'],
    }),
    checkFollow: build.query<boolean, number>({
      query: (artistId) => ({ url: '/api/artist/follow/check', params: { artistId } }),
      providesTags: (_r, _e, id) => [{ type: 'Follow' as const, id }],
    }),
    listFollows: build.query<Artist[], { page?: number; size?: number } | void>({
      query: (arg) => ({ url: '/api/artist/follow/list', params: arg ?? undefined }),
      providesTags: ['Follow'],
    }),
  }),
});

export const {
  useListArtistsQuery,
  useGetArtistQuery,
  useFollowArtistMutation,
  useUnfollowArtistMutation,
  useCheckFollowQuery,
  useListFollowsQuery,
} = artistsApi;
