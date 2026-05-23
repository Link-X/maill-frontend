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

// 仅返回 i18n key segment（draft / onSale / offShelf），由调用方拼成 t('show:status.xxx')
export const showStatusKey = (status: ShowStatus): string => {
  switch (status) {
    case SS.Draft:
      return 'draft';
    case SS.OnSale:
      return 'onSale';
    case SS.OffShelf:
      return 'offShelf';
    default:
      return String(status);
  }
};

export const sessionStatusKey = (status: SessionStatus): string => {
  switch (status) {
    case SSS.Draft:
      return 'draft';
    case SSS.Published:
      return 'published';
    case SSS.Ended:
      return 'ended';
    default:
      return String(status);
  }
};
