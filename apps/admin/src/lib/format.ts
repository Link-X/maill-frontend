import { format, parseISO } from 'date-fns';
import type { ShowStatus, SessionStatus } from '@maill/shared';
import { ShowStatus as SS, SessionStatus as SSS } from '@maill/shared';

export const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  try {
    return format(parseISO(iso), 'yyyy-MM-dd HH:mm');
  } catch {
    return iso;
  }
};

export const formatMoney = (raw?: string | number) => {
  if (raw === undefined || raw === null || raw === '') return '-';
  const num = typeof raw === 'string' ? Number(raw) : raw;
  if (Number.isNaN(num)) return String(raw);
  return `¥${num.toFixed(2)}`;
};

export const showStatusLabel = (status: ShowStatus): string => {
  switch (status) {
    case SS.Draft:
      return '草稿';
    case SS.OnSale:
      return '已上架';
    case SS.OffShelf:
      return '已下架';
    default:
      return String(status);
  }
};

export const sessionStatusLabel = (status: SessionStatus): string => {
  switch (status) {
    case SSS.Draft:
      return '草稿';
    case SSS.Published:
      return '已开售';
    case SSS.Ended:
      return '已结束';
    default:
      return String(status);
  }
};
