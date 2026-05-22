import { createApi } from '@reduxjs/toolkit/query/react';
import type { Room, RoomSeat, RoomArea } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

export const roomsApi = createApi({
  reducerPath: 'roomsApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['Room', 'RoomSeat', 'RoomArea'],
  endpoints: (build) => ({
    listRooms: build.query<Room[], void>({
      query: () => '/api/admin/room/list',
      providesTags: (result) => [
        'Room',
        ...(result ?? []).map((r) => ({ type: 'Room' as const, id: r.id })),
      ],
    }),
    getRoom: build.query<Room, number | string>({
      query: (id) => `/api/admin/room/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Room', id }],
    }),
    createRoom: build.mutation<Room, Partial<Room>>({
      query: (body) => ({ url: '/api/admin/room/create', method: 'POST', body }),
      invalidatesTags: ['Room'],
    }),
    updateRoom: build.mutation<Room, Room>({
      query: (body) => ({ url: '/api/admin/room/update', method: 'PUT', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Room', id: arg.id }, 'Room'],
    }),

    listRoomSeats: build.query<RoomSeat[], number | string>({
      query: (roomId) => ({ url: '/api/admin/room/seat/list', params: { roomId } }),
      providesTags: (_r, _e, roomId) => [{ type: 'RoomSeat', id: roomId }],
    }),
    saveRoomSeats: build.mutation<unknown, { roomId: number | string; seats: RoomSeat[] }>({
      query: (body) => ({ url: '/api/admin/room/seat/batch', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'RoomSeat', id: arg.roomId }],
    }),

    listRoomAreas: build.query<RoomArea[], number | string>({
      query: (roomId) => ({ url: '/api/admin/room/area/list', params: { roomId } }),
      providesTags: (_r, _e, roomId) => [{ type: 'RoomArea', id: roomId }],
    }),
    saveRoomAreas: build.mutation<unknown, { roomId: number | string; areas: RoomArea[] }>({
      query: (body) => ({ url: '/api/admin/room/area/save', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'RoomArea', id: arg.roomId }],
    }),
  }),
});

export const {
  useListRoomsQuery,
  useGetRoomQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useListRoomSeatsQuery,
  useSaveRoomSeatsMutation,
  useListRoomAreasQuery,
  useSaveRoomAreasMutation,
} = roomsApi;
