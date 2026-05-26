import { createApi } from '@reduxjs/toolkit/query/react';
import type { FavoriteGroup, UserFavorite } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

// 收藏列表查询参数
interface ListArg { groupId?: number; unset?: boolean; page?: number; size?: number; }
// 收藏列表响应
interface ListRes { list: UserFavorite[]; total: number; page: number; size: number; }

export const favoritesApi = createApi({
  reducerPath: 'favoritesApi',
  baseQuery: userBaseQuery,
  tagTypes: ['Favorite', 'Group'],
  endpoints: (build) => ({
    // 新增收藏
    addFavorite: build.mutation<boolean, { showId: number; groupId?: number }>({
      query: (body) => ({ url: '/api/favorite/add', method: 'POST', body }),
      invalidatesTags: ['Favorite'],
    }),
    // 取消收藏
    removeFavorite: build.mutation<boolean, number>({
      query: (showId) => ({ url: '/api/favorite/remove', method: 'POST', body: { showId } }),
      invalidatesTags: ['Favorite'],
    }),
    // 移动收藏到其它分组
    moveFavorite: build.mutation<void, { showId: number; groupId?: number }>({
      query: (body) => ({ url: '/api/favorite/move', method: 'POST', body }),
      invalidatesTags: ['Favorite'],
    }),
    // 检查是否已收藏
    checkFavorite: build.query<boolean, number>({
      query: (showId) => ({ url: '/api/favorite/check', params: { showId } }),
      providesTags: (_r, _e, id) => [{ type: 'Favorite' as const, id }],
    }),
    // 收藏列表
    listFavorites: build.query<ListRes, ListArg | void>({
      query: (arg) => ({ url: '/api/favorite/list', params: arg ?? undefined }),
      providesTags: ['Favorite'],
    }),
    // 分组列表
    listGroups: build.query<FavoriteGroup[], void>({
      query: () => '/api/favorite/group/list',
      providesTags: ['Group'],
    }),
    // 创建分组
    createGroup: build.mutation<FavoriteGroup, string>({
      query: (name) => ({ url: '/api/favorite/group/create', method: 'POST', body: { name } }),
      invalidatesTags: ['Group'],
    }),
    // 重命名分组
    renameGroup: build.mutation<FavoriteGroup, { id: number; name: string }>({
      query: (body) => ({ url: '/api/favorite/group/rename', method: 'POST', body }),
      invalidatesTags: ['Group'],
    }),
    // 删除分组
    deleteGroup: build.mutation<void, number>({
      query: (id) => ({ url: '/api/favorite/group/delete', method: 'POST', body: { id } }),
      invalidatesTags: ['Group', 'Favorite'],
    }),
  }),
});

export const {
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useMoveFavoriteMutation,
  useCheckFavoriteQuery,
  useListFavoritesQuery,
  useListGroupsQuery,
  useCreateGroupMutation,
  useRenameGroupMutation,
  useDeleteGroupMutation,
} = favoritesApi;
