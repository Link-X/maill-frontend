import { createApi } from '@reduxjs/toolkit/query/react';
import type { ShowSession, AdminSeat, SessionArea } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

export const sessionsApi = createApi({
  reducerPath: 'sessionsApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['Session', 'SessionSeat', 'SessionArea'],
  endpoints: (build) => ({
    listSessions: build.query<ShowSession[], number | string>({
      query: (showId) => ({ url: '/api/admin/session/list', params: { showId } }),
      providesTags: (result, _e, showId) => [
        { type: 'Session', id: `show-${showId}` },
        ...(result ?? []).map((s) => ({ type: 'Session' as const, id: s.id })),
      ],
    }),
    getSession: build.query<ShowSession, number | string>({
      query: (id) => `/api/admin/session/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Session', id }],
    }),
    createSession: build.mutation<ShowSession, Partial<ShowSession>>({
      query: (body) => ({ url: '/api/admin/session/create', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Session', id: `show-${arg.showId}` },
        'Session',
      ],
    }),
    updateSession: build.mutation<ShowSession, ShowSession>({
      query: (body) => ({ url: '/api/admin/session/update', method: 'PUT', body }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Session', id: arg.id },
        { type: 'Session', id: `show-${arg.showId}` },
      ],
    }),
    publishSession: build.mutation<unknown, number | string>({
      query: (id) => ({ url: `/api/admin/session/${id}/publish`, method: 'PUT' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Session', id }, 'Session'],
    }),

    listSessionSeats: build.query<AdminSeat[], number | string>({
      query: (sessionId) => ({ url: '/api/admin/seat/list', params: { sessionId } }),
      providesTags: (_r, _e, sessionId) => [{ type: 'SessionSeat', id: sessionId }],
    }),
    saveSessionSeats: build.mutation<
      AdminSeat[],
      { sessionId: number | string; seats: AdminSeat[] }
    >({
      query: (body) => ({ url: '/api/admin/seat/batch', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'SessionSeat', id: arg.sessionId }],
    }),

    listSessionAreas: build.query<SessionArea[], number | string>({
      query: (sessionId) => ({ url: '/api/admin/seat/area/list', params: { sessionId } }),
      providesTags: (_r, _e, sessionId) => [{ type: 'SessionArea', id: sessionId }],
    }),
    saveSessionAreas: build.mutation<
      unknown,
      { sessionId: number | string; areas: SessionArea[] }
    >({
      query: (body) => ({ url: '/api/admin/seat/area/save', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'SessionArea', id: arg.sessionId }],
    }),

    warmupSession: build.mutation<unknown, number | string>({
      query: (sessionId) => ({
        url: `/api/admin/seat/warmup/${sessionId}`,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useListSessionsQuery,
  useGetSessionQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  usePublishSessionMutation,
  useListSessionSeatsQuery,
  useSaveSessionSeatsMutation,
  useListSessionAreasQuery,
  useSaveSessionAreasMutation,
  useWarmupSessionMutation,
} = sessionsApi;
