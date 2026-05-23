import { createApi } from '@reduxjs/toolkit/query/react';
import { adminBaseQuery } from '@/api/adminBase';

export type RangePreset = '1d' | '7d' | '30d' | '90d';

export interface RangeArg {
  range?: RangePreset;
  /** ISO 8601，例 "2026-05-01T00:00:00" */
  startTime?: string;
  endTime?: string;
}

export type TimeseriesDim = 'day' | 'hour' | 'month';

// ---------------- 第一档 ----------------
export interface OverviewResp {
  revenue: number;
  orderCount: number;
  pendingOrderCount: number;
  refundAmount: number;
  refundCount: number;
  ticketSoldCount: number;
  ticketVerifiedCount: number;
  verifyRate: number;
  revenueDeltaPct: number;
  orderCountDeltaPct: number;
}

export interface TimeseriesPoint {
  /** dim=day:"YYYY-MM-DD"  dim=hour:"YYYY-MM-DDTHH"  dim=month:"YYYY-MM" */
  date: string;
  orderCount: number;
  revenue: number;
  refundAmount: number;
}

// ---------------- 第二档 ----------------
export type SortByShow = 'revenue' | 'tickets' | 'orderCount';

export interface ByShowItem {
  showId: number;
  showName: string;
  categoryName: string | null;
  cityName: string | null;
  orderCount: number;
  ticketCount: number;
  revenue: number;
  refundAmount: number;
}

export interface ByCategoryItem {
  categoryId: number | null;
  categoryName: string | null;
  orderCount: number;
  ticketCount: number;
  revenue: number;
}

export interface ByCityItem {
  cityCode: string | null;
  cityName: string | null;
  orderCount: number;
  ticketCount: number;
  revenue: number;
}

export interface StatusDistributionItem {
  status: 0 | 1 | 2 | 3 | 4 | 5;
  count: number;
  totalAmountSum: number;
}

export interface HourDistributionItem {
  hour: number; // 0..23
  orderCount: number;
}

// ---------------- 第三档 ----------------
export type SortBySession = 'fillRate' | 'revenue' | 'startTime';

export interface BySessionItem {
  sessionId: number;
  showName: string;
  sessionName: string;
  startTime: string;
  totalSeats: number;
  soldSeats: number;
  fillRate: number;
  revenue: number;
}

export interface UserStatsResp {
  totalBuyers: number;
  repeatBuyers: number;
  repeatRate: number;
  avgOrderValue: number;
  avgSeatsPerOrder: number;
}

export interface RefundStatsResp {
  totalRevenue: number;
  refundAmount: number;
  refundRate: number;
  fullRefundCount: number;
  partialRefundCount: number;
  refundingCount: number;
}

export interface CancellationStatsResp {
  createdCount: number;
  expiredCancelledCount: number;
  userCancelledCount: number;
  cancelRate: number;
}

// 把入参转 fetchBaseQuery 的 params（去掉 undefined / 空串字段）
const toParams = (arg: object): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(arg)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
};

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: adminBaseQuery,
  endpoints: (build) => ({
    overview: build.query<OverviewResp, RangeArg>({
      query: (arg) => ({ url: '/api/admin/report/overview', params: toParams(arg) }),
    }),
    timeseries: build.query<TimeseriesPoint[], RangeArg & { dim?: TimeseriesDim }>({
      query: (arg) => ({ url: '/api/admin/report/timeseries', params: toParams(arg) }),
    }),
    byShow: build.query<ByShowItem[], RangeArg & { limit?: number; sort?: SortByShow }>({
      query: (arg) => ({ url: '/api/admin/report/by-show', params: toParams(arg) }),
    }),
    byCategory: build.query<ByCategoryItem[], RangeArg>({
      query: (arg) => ({ url: '/api/admin/report/by-category', params: toParams(arg) }),
    }),
    byCity: build.query<ByCityItem[], RangeArg>({
      query: (arg) => ({ url: '/api/admin/report/by-city', params: toParams(arg) }),
    }),
    statusDistribution: build.query<StatusDistributionItem[], RangeArg>({
      query: (arg) => ({ url: '/api/admin/report/status-distribution', params: toParams(arg) }),
    }),
    hourDistribution: build.query<HourDistributionItem[], RangeArg>({
      query: (arg) => ({ url: '/api/admin/report/hour-distribution', params: toParams(arg) }),
    }),
    bySession: build.query<
      BySessionItem[],
      RangeArg & { showId?: number; limit?: number; sort?: SortBySession }
    >({
      query: (arg) => ({ url: '/api/admin/report/by-session', params: toParams(arg) }),
    }),
    userStats: build.query<UserStatsResp, RangeArg>({
      query: (arg) => ({ url: '/api/admin/report/user-stats', params: toParams(arg) }),
    }),
    refundStats: build.query<RefundStatsResp, RangeArg>({
      query: (arg) => ({ url: '/api/admin/report/refund-stats', params: toParams(arg) }),
    }),
    cancellationStats: build.query<CancellationStatsResp, RangeArg>({
      query: (arg) => ({ url: '/api/admin/report/cancellation-stats', params: toParams(arg) }),
    }),
  }),
});

export const {
  useOverviewQuery,
  useTimeseriesQuery,
  useByShowQuery,
  useByCategoryQuery,
  useByCityQuery,
  useStatusDistributionQuery,
  useHourDistributionQuery,
  useBySessionQuery,
  useUserStatsQuery,
  useRefundStatsQuery,
  useCancellationStatsQuery,
} = reportsApi;
