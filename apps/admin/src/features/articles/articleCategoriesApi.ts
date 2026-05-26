import { createApi } from '@reduxjs/toolkit/query/react';
import type { ArticleCategory } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

interface ListArg { status?: 0 | 1; }

export const articleCategoriesApi = createApi({
  reducerPath: 'articleCategoriesApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['ArticleCategory'],
  endpoints: (build) => ({
    listArticleCategories: build.query<ArticleCategory[], ListArg | void>({
      query: (arg) => ({ url: '/api/admin/article-category/list', params: { status: arg?.status } }),
      providesTags: (result) => [
        'ArticleCategory',
        ...(result ?? []).map((c) => ({ type: 'ArticleCategory' as const, id: c.id })),
      ],
    }),
    createArticleCategory: build.mutation<ArticleCategory, Partial<ArticleCategory>>({
      query: (body) => ({ url: '/api/admin/article-category/create', method: 'POST', body }),
      invalidatesTags: ['ArticleCategory'],
    }),
    updateArticleCategory: build.mutation<ArticleCategory, ArticleCategory>({
      query: (body) => ({ url: '/api/admin/article-category/update', method: 'PUT', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'ArticleCategory', id: arg.id }, 'ArticleCategory'],
    }),
    deleteArticleCategory: build.mutation<void, number>({
      query: (id) => ({ url: `/api/admin/article-category/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ArticleCategory'],
    }),
  }),
});

export const {
  useListArticleCategoriesQuery,
  useCreateArticleCategoryMutation,
  useUpdateArticleCategoryMutation,
  useDeleteArticleCategoryMutation,
} = articleCategoriesApi;
