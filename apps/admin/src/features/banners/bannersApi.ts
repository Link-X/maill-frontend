import { createApi } from '@reduxjs/toolkit/query/react';
import type { Banner } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

interface ListArg {
  status?: 0 | 1;
}

export interface BannerSaveBody {
  id?: number;
  title?: string;
  imageUrl: string;
  linkType?: 0 | 1 | 2 | 3 | 4;
  linkTarget?: string;
  sort?: number;
  startAt?: string;
  endAt?: string;
  status?: 0 | 1;
}

export const bannersApi = createApi({
  reducerPath: 'bannersApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['Banner'],
  endpoints: (build) => ({
    listBanners: build.query<Banner[], ListArg | void>({
      query: (arg) => ({
        url: '/api/admin/banner/list',
        params: { status: arg?.status },
      }),
      providesTags: (result) => [
        'Banner',
        ...(result ?? []).map((b) => ({ type: 'Banner' as const, id: b.id })),
      ],
    }),
    saveBanner: build.mutation<Banner, BannerSaveBody>({
      query: (body) => ({ url: '/api/admin/banner/save', method: 'POST', body }),
      invalidatesTags: ['Banner'],
    }),
    updateBannerStatus: build.mutation<void, { id: number; status: 0 | 1 }>({
      query: (body) => ({ url: '/api/admin/banner/status', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Banner', id: arg.id }, 'Banner'],
    }),
    sortBanners: build.mutation<void, { orderedIds: number[] }>({
      query: (body) => ({ url: '/api/admin/banner/sort', method: 'POST', body }),
      invalidatesTags: ['Banner'],
    }),
    deleteBanner: build.mutation<void, number>({
      query: (id) => ({ url: `/api/admin/banner/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Banner'],
    }),
  }),
});

export const {
  useListBannersQuery,
  useSaveBannerMutation,
  useUpdateBannerStatusMutation,
  useSortBannersMutation,
  useDeleteBannerMutation,
} = bannersApi;
