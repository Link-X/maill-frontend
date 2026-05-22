import { createApi } from '@reduxjs/toolkit/query/react';
import type { ShowSession, SessionSeatResponseVO } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

interface SessionListRequest {
  showId: number | string;
  page: number;
  size: number;
  status?: number;
  startTime?: string;
  endTime?: string;
}

interface SessionListResponse {
  total: number;
  list: ShowSession[];
}

export const sessionsApi = createApi({
  reducerPath: 'sessionsApi',
  baseQuery: userBaseQuery,
  tagTypes: ['Session', 'SessionSeats'],
  endpoints: (build) => ({
    listSessions: build.query<SessionListResponse, SessionListRequest>({
      query: (body) => ({ url: '/api/session/list', method: 'POST', body }),
      providesTags: (result, _e, arg) => [
        { type: 'Session', id: `show-${arg.showId}` },
        ...(result?.list ?? []).map((s) => ({ type: 'Session' as const, id: s.id })),
      ],
    }),
    getSessionDetail: build.query<SessionSeatResponseVO, number | string>({
      query: (sessionId) => ({
        url: '/api/session/detail',
        method: 'POST',
        body: { sessionId },
      }),
      providesTags: (_r, _e, sessionId) => [{ type: 'SessionSeats', id: sessionId }],
    }),
  }),
});

export const { useListSessionsQuery, useGetSessionDetailQuery } = sessionsApi;
