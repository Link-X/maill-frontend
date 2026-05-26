import { createApi } from '@reduxjs/toolkit/query/react';
import type { Article, ArticleCategory } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

interface ListRes {
  list: Article[];
  total: number;
  page: number;
  size: number;
}

export const articlesApi = createApi({
  reducerPath: 'articlesApi',
  baseQuery: userBaseQuery,
  endpoints: (build) => ({
    listArticles: build.query<ListRes, { categoryId?: number; page?: number; size?: number } | void>({
      query: (arg) => ({ url: '/api/article/list', params: arg ?? undefined }),
    }),
    getArticle: build.query<Article, number | string>({
      query: (id) => `/api/article/${id}`,
    }),
    listArticleCategories: build.query<ArticleCategory[], void>({
      query: () => '/api/article-category/list',
    }),
    listByArtist: build.query<Article[], number>({
      query: (artistId) => `/api/article/by-artist/${artistId}`,
    }),
  }),
});

export const {
  useListArticlesQuery,
  useGetArticleQuery,
  useListArticleCategoriesQuery,
  useListByArtistQuery,
} = articlesApi;
