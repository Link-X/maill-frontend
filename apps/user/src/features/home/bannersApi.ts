import { createApi } from '@reduxjs/toolkit/query/react';
import type { Banner } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

export const bannersApi = createApi({
  reducerPath: 'bannersApi',
  baseQuery: userBaseQuery,
  endpoints: (build) => ({
    listEffectiveBanners: build.query<Banner[], void>({
      query: () => ({ url: '/api/banner/list' }),
    }),
  }),
});

export const { useListEffectiveBannersQuery } = bannersApi;
