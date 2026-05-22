import { createApi } from '@reduxjs/toolkit/query/react';
import type { MonitorDashboard } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

export const monitorApi = createApi({
  reducerPath: 'monitorApi',
  baseQuery: adminBaseQuery,
  endpoints: (build) => ({
    getDashboard: build.query<MonitorDashboard, number | string>({
      query: (sessionId) => ({
        url: '/api/admin/monitor/dashboard',
        params: { sessionId },
      }),
    }),
  }),
});

export const { useGetDashboardQuery } = monitorApi;
