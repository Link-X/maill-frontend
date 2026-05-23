import { createApi } from '@reduxjs/toolkit/query/react';
import type { Category } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

interface ListArg {
  status?: 0 | 1;
  keyword?: string;
}

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['Category'],
  endpoints: (build) => ({
    listCategories: build.query<Category[], ListArg | void>({
      query: (arg) => ({
        url: '/api/admin/category/list',
        params: {
          status: arg?.status,
          keyword: arg?.keyword || undefined,
        },
      }),
      providesTags: (result) => [
        'Category',
        ...(result ?? []).map((c) => ({ type: 'Category' as const, id: c.id })),
      ],
    }),
    createCategory: build.mutation<Category, Partial<Category>>({
      query: (body) => ({ url: '/api/admin/category/create', method: 'POST', body }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: build.mutation<Category, Category>({
      query: (body) => ({ url: '/api/admin/category/update', method: 'PUT', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Category', id: arg.id }, 'Category'],
    }),
    deleteCategory: build.mutation<void, number>({
      query: (id) => ({ url: `/api/admin/category/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
