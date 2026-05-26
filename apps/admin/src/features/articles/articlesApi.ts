import { createApi } from '@reduxjs/toolkit/query/react';
import type { Article } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

interface ListArg {
  status?: 0 | 1 | 2;
  categoryId?: number;
  keyword?: string;
  page?: number;
  size?: number;
}

interface ListRes {
  list: Article[];
  total: number;
  page: number;
  size: number;
}

export interface ArticleSaveBody {
  id?: number;
  categoryId: number;
  title: string;
  summary?: string;
  content: string;
  coverUrl?: string;
  artistId?: number;
  author?: string;
  status?: 0 | 1 | 2;
}

export const articlesApi = createApi({
  reducerPath: 'articlesApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['Article'],
  endpoints: (build) => ({
    listArticles: build.query<ListRes, ListArg | void>({
      query: (arg) => ({
        url: '/api/admin/article/list',
        method: 'POST',
        body: arg ?? {},
      }),
      providesTags: (result) => [
        'Article',
        ...(result?.list ?? []).map((a) => ({ type: 'Article' as const, id: a.id })),
      ],
    }),
    getArticle: build.query<Article, number | string>({
      query: (id) => `/api/admin/article/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Article', id: Number(id) }],
    }),
    saveArticle: build.mutation<Article, ArticleSaveBody>({
      query: (body) => ({ url: '/api/admin/article/save', method: 'POST', body }),
      invalidatesTags: ['Article'],
    }),
    publishArticle: build.mutation<void, number>({
      query: (id) => ({ url: '/api/admin/article/publish', method: 'POST', body: { id } }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Article', id }, 'Article'],
    }),
    offlineArticle: build.mutation<void, number>({
      query: (id) => ({ url: '/api/admin/article/offline', method: 'POST', body: { id } }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Article', id }, 'Article'],
    }),
    deleteArticle: build.mutation<void, number>({
      query: (id) => ({ url: `/api/admin/article/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Article'],
    }),
  }),
});

export const {
  useListArticlesQuery,
  useGetArticleQuery,
  useSaveArticleMutation,
  usePublishArticleMutation,
  useOfflineArticleMutation,
  useDeleteArticleMutation,
} = articlesApi;
