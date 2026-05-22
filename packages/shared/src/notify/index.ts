import { toast } from 'sonner';

export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast(msg),
  warn: (msg: string) => toast.warning(msg),
};

// RTK Query 错误中提取消息
export const extractErrorMessage = (error: unknown, fallback = '请求失败'): string => {
  if (!error || typeof error !== 'object') return fallback;
  const data = (error as { data?: { message?: string } }).data;
  return data?.message ?? fallback;
};
