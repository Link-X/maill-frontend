import { createApi } from '@reduxjs/toolkit/query/react';
import type { Category } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: userBaseQuery,
  endpoints: (build) => ({
    // 后端 /api/category/list：仅启用状态，按 sort,id 排序
    listCategories: build.query<Category[], void>({
      query: () => '/api/category/list',
    }),
  }),
});

export const { useListCategoriesQuery } = categoriesApi;
