import { createApi } from '@reduxjs/toolkit/query/react';
import type { ShowReview, ShowReviewReport } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

interface ListRes {
  list: ShowReview[];
  total: number;
  page: number;
  size: number;
}

interface ReportListRes {
  list: ShowReviewReport[];
  total: number;
}

export const reviewsApi = createApi({
  reducerPath: 'adminReviewsApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['Review', 'Report'],
  endpoints: (build) => ({
    // 评价列表
    listReviews: build.query<
      ListRes,
      { showId?: number; status?: 0 | 1 | 2; keyword?: string; page?: number; size?: number }
    >({
      query: (body) => ({ url: '/api/admin/review/list', method: 'POST', body }),
      providesTags: ['Review'],
    }),
    // 隐藏
    hideReview: build.mutation<void, number>({
      query: (reviewId) => ({ url: '/api/admin/review/hide', method: 'POST', body: { reviewId } }),
      invalidatesTags: ['Review'],
    }),
    // 恢复
    restoreReview: build.mutation<void, number>({
      query: (reviewId) => ({ url: '/api/admin/review/restore', method: 'POST', body: { reviewId } }),
      invalidatesTags: ['Review'],
    }),
    // 删除
    deleteReview: build.mutation<void, number>({
      query: (reviewId) => ({ url: '/api/admin/review/delete', method: 'POST', body: { reviewId } }),
      invalidatesTags: ['Review'],
    }),
    // 举报列表
    listReports: build.query<ReportListRes, { status?: 0 | 1 | 2; page?: number; size?: number } | void>({
      query: (arg) => ({ url: '/api/admin/review/report/list', params: arg ?? undefined }),
      providesTags: ['Report'],
    }),
    // 处理举报
    handleReport: build.mutation<void, { reportId: number; action: 'keep' | 'delete' }>({
      query: (body) => ({ url: '/api/admin/review/report/handle', method: 'POST', body }),
      invalidatesTags: ['Report', 'Review'],
    }),
  }),
});

export const {
  useListReviewsQuery: useAdminListReviewsQuery,
  useHideReviewMutation,
  useRestoreReviewMutation,
  useDeleteReviewMutation: useAdminDeleteReviewMutation,
  useListReportsQuery,
  useHandleReportMutation,
} = reviewsApi;
