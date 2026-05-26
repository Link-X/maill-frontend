import { createApi } from '@reduxjs/toolkit/query/react';
import { userBaseQuery } from './userBase';

// 上传成功返回结构
export interface UploadImageResult {
  url: string;
}

/**
 * 用户端上传 API：当前仅用于评价晒图。
 * 后端会校验 dir 白名单，前端通过类型约束 'reviews' 进一步收敛。
 */
export const uploadApi = createApi({
  reducerPath: 'uploadApi',
  baseQuery: userBaseQuery,
  endpoints: (build) => ({
    uploadImage: build.mutation<UploadImageResult, { file: File; dir?: 'reviews' }>({
      query: ({ file, dir }) => {
        const form = new FormData();
        form.append('file', file);
        if (dir) form.append('dir', dir);
        return { url: '/api/upload/image', method: 'POST', body: form };
      },
    }),
  }),
});

export const { useUploadImageMutation } = uploadApi;
