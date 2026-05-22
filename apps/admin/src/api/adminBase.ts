import { createBaseQuery } from '@maill/shared';

// admin 后端 (8081) 不需要 token
export const adminBaseQuery = createBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE,
});
