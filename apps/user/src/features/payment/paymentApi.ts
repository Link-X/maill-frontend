import { createApi } from '@reduxjs/toolkit/query/react';
import type { PaymentRequest, PaymentResponse } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: userBaseQuery,
  endpoints: (build) => ({
    createPayment: build.mutation<PaymentResponse, PaymentRequest>({
      query: (body) => ({ url: '/api/payment/create', method: 'POST', body }),
    }),
  }),
});

export const { useCreatePaymentMutation } = paymentApi;
