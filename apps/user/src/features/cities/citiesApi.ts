import { createApi } from '@reduxjs/toolkit/query/react';
import type { City } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

export const citiesApi = createApi({
  reducerPath: 'citiesApi',
  baseQuery: userBaseQuery,
  endpoints: (build) => ({
    // 后端 /api/city/list：仅启用城市，按 sort,id 排序
    listCities: build.query<City[], void>({
      query: () => '/api/city/list',
    }),
  }),
});

export const { useListCitiesQuery } = citiesApi;
