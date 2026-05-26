import { createApi } from '@reduxjs/toolkit/query/react';
import { userBaseQuery } from '@/api/userBase';

interface SearchHit {
  [key: string]: unknown;
  _highlight?: Record<string, string>;
}
interface SearchRes {
  list: SearchHit[];
  total: number;
  page: number;
  size: number;
}
interface AllRes {
  show: SearchRes;
  artist: SearchRes;
  article: SearchRes;
}

export const searchApi = createApi({
  reducerPath: 'searchApi',
  baseQuery: userBaseQuery,
  endpoints: (build) => ({
    searchShow: build.query<SearchRes, { kw: string; page?: number; size?: number }>({
      query: (arg) => ({ url: '/api/search/show', params: arg }),
    }),
    searchArtist: build.query<SearchRes, { kw: string; page?: number; size?: number }>({
      query: (arg) => ({ url: '/api/search/artist', params: arg }),
    }),
    searchArticle: build.query<SearchRes, { kw: string; page?: number; size?: number }>({
      query: (arg) => ({ url: '/api/search/article', params: arg }),
    }),
    searchAll: build.query<AllRes, { kw: string }>({
      query: (arg) => ({ url: '/api/search/all', params: arg }),
    }),
    searchHistory: build.query<string[], void>({
      query: () => '/api/search/history',
    }),
    clearHistory: build.mutation<void, void>({
      query: () => ({ url: '/api/search/history', method: 'DELETE' }),
    }),
  }),
});

export const {
  useSearchShowQuery,
  useSearchArtistQuery,
  useSearchArticleQuery,
  useSearchAllQuery,
  useSearchHistoryQuery,
  useClearHistoryMutation,
} = searchApi;
