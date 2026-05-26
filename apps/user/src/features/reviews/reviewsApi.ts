import { createApi } from '@reduxjs/toolkit/query/react';
import type { ShowReview, ShowReviewReport } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

interface ListRes {
  list: ShowReview[];
  total?: number;
  page?: number;
  size?: number;
}

export interface PublishBody {
  showId: number;
  orderId?: number;
  rating: number;
  content: string;
  images?: string[];
}

export interface ReplyBody {
  parentId: number;
  replyToUserId?: number;
  content: string;
  images?: string[];
}

export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery: userBaseQuery,
  tagTypes: ['Review', 'Replies'],
  endpoints: (build) => ({
    // 评价列表
    listReviews: build.query<
      ListRes,
      { showId: number; sort?: 'latest' | 'hottest'; page?: number; size?: number }
    >({
      query: (arg) => ({ url: '/api/review/list', params: arg }),
      providesTags: ['Review'],
    }),
    // 回复列表
    listReplies: build.query<ListRes, { parentId: number; page?: number; size?: number }>({
      query: (arg) => ({ url: '/api/review/replies', params: arg }),
      providesTags: (_r, _e, arg) => [{ type: 'Replies' as const, id: arg.parentId }],
    }),
    // 详情
    getReview: build.query<ShowReview, number>({
      query: (id) => `/api/review/detail/${id}`,
    }),
    // 发布评价
    publishReview: build.mutation<ShowReview, PublishBody>({
      query: (body) => ({ url: '/api/review/publish', method: 'POST', body }),
      invalidatesTags: ['Review'],
    }),
    // 回复评价
    replyReview: build.mutation<ShowReview, ReplyBody>({
      query: (body) => ({ url: '/api/review/reply', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => ['Review', { type: 'Replies' as const, id: arg.parentId }],
    }),
    // 点赞
    likeReview: build.mutation<boolean, number>({
      query: (reviewId) => ({ url: '/api/review/like', method: 'POST', body: { reviewId } }),
      invalidatesTags: ['Review'],
    }),
    // 取消点赞
    unlikeReview: build.mutation<boolean, number>({
      query: (reviewId) => ({ url: '/api/review/unlike', method: 'POST', body: { reviewId } }),
      invalidatesTags: ['Review'],
    }),
    // 举报
    reportReview: build.mutation<ShowReviewReport, { reviewId: number; reason: string }>({
      query: (body) => ({ url: '/api/review/report', method: 'POST', body }),
    }),
    // 删除自己的评价
    deleteReview: build.mutation<void, number>({
      query: (reviewId) => ({ url: '/api/review/delete', method: 'POST', body: { reviewId } }),
      invalidatesTags: ['Review'],
    }),
    // 我的评价
    myReviews: build.query<ListRes, { page?: number; size?: number } | void>({
      query: (arg) => ({ url: '/api/review/my', params: arg ?? undefined }),
    }),
    // 检查发布权限
    checkPermission: build.query<boolean, { showId: number; orderId?: number }>({
      query: (arg) => ({ url: '/api/review/check-permission', params: arg }),
    }),
  }),
});

export const {
  useListReviewsQuery,
  useListRepliesQuery,
  useGetReviewQuery,
  usePublishReviewMutation,
  useReplyReviewMutation,
  useLikeReviewMutation,
  useUnlikeReviewMutation,
  useReportReviewMutation,
  useDeleteReviewMutation,
  useMyReviewsQuery,
  useCheckPermissionQuery,
} = reviewsApi;
