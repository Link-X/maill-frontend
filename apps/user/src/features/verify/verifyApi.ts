import { createApi } from '@reduxjs/toolkit/query/react';
import type { VerifyResult } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

export const verifyApi = createApi({
  reducerPath: 'verifyApi',
  baseQuery: userBaseQuery,
  endpoints: (build) => ({
    verifyByTicketNo: build.mutation<VerifyResult, { ticketNo: string }>({
      query: (body) => ({ url: '/api/verify/ticket', method: 'POST', body }),
    }),
    verifyByQr: build.mutation<VerifyResult, { qrCode: string }>({
      query: (body) => ({ url: '/api/verify/qr', method: 'POST', body }),
    }),
  }),
});

export const { useVerifyByTicketNoMutation, useVerifyByQrMutation } = verifyApi;
