import { createApi } from '@reduxjs/toolkit/query/react';
import type { Artist } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

interface ListArg {
  status?: 0 | 1;
  keyword?: string;
}

export interface ArtistSaveBody {
  id?: number;
  name: string;
  stageName?: string;
  avatarUrl?: string;
  gender?: 0 | 1 | 2;
  nationality?: string;
  tags?: string;
  bio?: string;
  description?: string;
  socialLinks?: string;
  status?: 0 | 1;
}

export const artistsApi = createApi({
  reducerPath: 'artistsApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['Artist'],
  endpoints: (build) => ({
    listArtists: build.query<Artist[], ListArg | void>({
      query: (arg) => ({
        url: '/api/admin/artist/list',
        params: { status: arg?.status, keyword: arg?.keyword || undefined },
      }),
      providesTags: (result) => [
        'Artist',
        ...(result ?? []).map((a) => ({ type: 'Artist' as const, id: a.id })),
      ],
    }),
    getArtist: build.query<Artist, number | string>({
      query: (id) => `/api/admin/artist/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Artist', id: Number(id) }],
    }),
    saveArtist: build.mutation<Artist, ArtistSaveBody>({
      query: (body) => ({ url: '/api/admin/artist/save', method: 'POST', body }),
      invalidatesTags: ['Artist'],
    }),
    updateArtistStatus: build.mutation<void, { id: number; status: 0 | 1 }>({
      query: (body) => ({ url: '/api/admin/artist/status', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Artist', id: arg.id }, 'Artist'],
    }),
    deleteArtist: build.mutation<void, number>({
      query: (id) => ({ url: `/api/admin/artist/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Artist'],
    }),
  }),
});

export const {
  useListArtistsQuery,
  useGetArtistQuery,
  useSaveArtistMutation,
  useUpdateArtistStatusMutation,
  useDeleteArtistMutation,
} = artistsApi;
