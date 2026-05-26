import { createApi } from '@reduxjs/toolkit/query/react';
import { adminBaseQuery } from '@/api/adminBase';

// 后端 /api/admin/upload/image 返回 { url }，经 baseQuery 解包业务结果后直接拿到
export interface UploadImageResult {
  url: string;
}

// 后端支持的目录前缀（MinIO 分类存储），与 UploadController dir 参数对应
// 后端 dir 是字符串，未做白名单校验，前端在此处约束以避免拼写漂移
export type UploadDir = 'posters' | 'avatars' | 'rooms' | 'categories' | 'banners' | 'artists' | 'articles' | 'reviews' | 'misc';

export interface UploadImageArg {
  file: File;
  dir?: UploadDir;
}

export const uploadApi = createApi({
  reducerPath: 'uploadApi',
  baseQuery: adminBaseQuery,
  endpoints: (build) => ({
    uploadImage: build.mutation<UploadImageResult, UploadImageArg>({
      query: ({ file, dir }) => {
        const form = new FormData();
        form.append('file', file);
        if (dir) form.append('dir', dir);
        return { url: '/api/admin/upload/image', method: 'POST', body: form };
      },
    }),
  }),
});

export const { useUploadImageMutation } = uploadApi;
