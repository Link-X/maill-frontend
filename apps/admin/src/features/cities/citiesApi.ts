import { createApi } from '@reduxjs/toolkit/query/react';
import type { City } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

interface ListArg {
  status?: 0 | 1;
  keyword?: string;
}

// admin 只暴露 list（后台只读，用于演出表单下拉）。如果后端后续加 CRUD 再补
export const citiesApi = createApi({
  reducerPath: 'citiesApi',
  baseQuery: adminBaseQuery,
  endpoints: (build) => ({
    listCities: build.query<City[], ListArg | void>({
      query: (arg) => ({
        url: '/api/admin/city/list',
        params: {
          status: arg?.status,
          keyword: arg?.keyword || undefined,
        },
      }),
    }),
  }),
});

export const { useListCitiesQuery } = citiesApi;
