import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query';

export interface BackendResult<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface CreateBaseQueryOptions {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export const createBaseQuery = (
  options: CreateBaseQueryOptions,
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: options.baseUrl,
    prepareHeaders: (headers, api) => {
      const token = options.getToken?.();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      // 仅当 body 不是 FormData 时强制 JSON；FormData 必须让浏览器自己设
      // multipart/form-data boundary，否则后端解析 multipart 会失败。
      const arg = (api as { arg?: FetchArgs | string }).arg;
      const body = typeof arg === 'object' ? arg?.body : undefined;
      if (!(body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error) {
      // HTTP 错误（4xx/5xx 网络层）
      if (result.error.status === 401) options.onUnauthorized?.();
      return result;
    }

    // 解包业务结果
    const body = result.data as BackendResult | undefined;
    if (!body || typeof body !== 'object' || !('code' in body)) {
      return { error: { status: 'CUSTOM_ERROR', error: 'Invalid response shape' } as FetchBaseQueryError };
    }

    if (body.code !== 200) {
      if (body.code === 401) options.onUnauthorized?.();
      return {
        error: {
          status: body.code,
          data: { message: body.message ?? '请求失败' },
        } as unknown as FetchBaseQueryError,
      };
    }

    return { data: body.data };
  };
};
