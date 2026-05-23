// ============================================================
// ⚠️ 报表接口目前使用 mock 数据（reportsApi.mock.ts）
// 后端接口上线后回滚步骤：
//   1) 删 reportsApi.mock.ts
//   2) 把每个 endpoint 的 `queryFn: ...` 改回下面注释里的 `query: ...` 形式
//   3) 移除文件顶部对 mock 的 import
// ============================================================

import { createApi } from '@reduxjs/toolkit/query/react';
import { adminBaseQuery } from '@/api/adminBase';
import {
  mockOverview,
  mockTimeseries,
  mockByShow,
  mockByCategory,
  mockByCity,
  mockStatusDistribution,
  mockHourDistribution,
  mockBySession,
  mockUserStats,
  mockRefundStats,
  mockCancellationStats,
  mockDelay,
} from './reportsApi.mock';

export type RangePreset = '1d' | '7d' | '30d' | '90d';

export interface RangeArg {
  range?: RangePreset;
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
  hour: number;
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

// 真实接口回滚时用到，先保留 helper
// const toParams = (arg: object): Record<string, unknown> => {
//   const out: Record<string, unknown> = {};
//   for (const [k, v] of Object.entries(arg)) {
//     if (v !== undefined && v !== null && v !== '') out[k] = v;
//   }
//   return out;
// };

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: adminBaseQuery,
  endpoints: (build) => ({
    // 真实：query: (arg) => ({ url: '/api/admin/report/overview', params: toParams(arg) }),
    overview: build.query<OverviewResp, RangeArg>({
      queryFn: async () => ({ data: await mockDelay(mockOverview) }),
    }),
    // 真实：query: (arg) => ({ url: '/api/admin/report/timeseries', params: toParams(arg) }),
    timeseries: build.query<TimeseriesPoint[], RangeArg & { dim?: TimeseriesDim }>({
      queryFn: async () => ({ data: await mockDelay(mockTimeseries) }),
    }),
    // 真实：query: (arg) => ({ url: '/api/admin/report/by-show', params: toParams(arg) }),
    byShow: build.query<ByShowItem[], RangeArg & { limit?: number; sort?: SortByShow }>({
      queryFn: async (arg) => {
        const sorted = [...mockByShow].sort((a, b) => {
          if (arg.sort === 'tickets') return b.ticketCount - a.ticketCount;
          if (arg.sort === 'orderCount') return b.orderCount - a.orderCount;
          return b.revenue - a.revenue;
        });
        return { data: await mockDelay(sorted.slice(0, arg.limit ?? 10)) };
      },
    }),
    // 真实：query: (arg) => ({ url: '/api/admin/report/by-category', params: toParams(arg) }),
    byCategory: build.query<ByCategoryItem[], RangeArg>({
      queryFn: async () => ({ data: await mockDelay(mockByCategory) }),
    }),
    // 真实：query: (arg) => ({ url: '/api/admin/report/by-city', params: toParams(arg) }),
    byCity: build.query<ByCityItem[], RangeArg>({
      queryFn: async () => ({ data: await mockDelay(mockByCity) }),
    }),
    // 真实：query: (arg) => ({ url: '/api/admin/report/status-distribution', params: toParams(arg) }),
    statusDistribution: build.query<StatusDistributionItem[], RangeArg>({
      queryFn: async () => ({ data: await mockDelay(mockStatusDistribution) }),
    }),
    // 真实：query: (arg) => ({ url: '/api/admin/report/hour-distribution', params: toParams(arg) }),
    hourDistribution: build.query<HourDistributionItem[], RangeArg>({
      queryFn: async () => ({ data: await mockDelay(mockHourDistribution) }),
    }),
    // 真实：query: (arg) => ({ url: '/api/admin/report/by-session', params: toParams(arg) }),
    bySession: build.query<
      BySessionItem[],
      RangeArg & { showId?: number; limit?: number; sort?: SortBySession }
    >({
      queryFn: async (arg) => ({ data: await mockDelay(mockBySession.slice(0, arg.limit ?? 20)) }),
    }),
    // 真实：query: (arg) => ({ url: '/api/admin/report/user-stats', params: toParams(arg) }),
    userStats: build.query<UserStatsResp, RangeArg>({
      queryFn: async () => ({ data: await mockDelay(mockUserStats) }),
    }),
    // 真实：query: (arg) => ({ url: '/api/admin/report/refund-stats', params: toParams(arg) }),
    refundStats: build.query<RefundStatsResp, RangeArg>({
      queryFn: async () => ({ data: await mockDelay(mockRefundStats) }),
    }),
    // 真实：query: (arg) => ({ url: '/api/admin/report/cancellation-stats', params: toParams(arg) }),
    cancellationStats: build.query<CancellationStatsResp, RangeArg>({
      queryFn: async () => ({ data: await mockDelay(mockCancellationStats) }),
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
