import { format, parseISO, differenceInSeconds } from 'date-fns';
import type { OrderStatus, TicketStatus } from '@maill/shared';
import { OrderStatus as OS, TicketStatus as TS } from '@maill/shared';

export const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  try {
    return format(parseISO(iso), 'yyyy-MM-dd HH:mm');
  } catch {
    return iso;
  }
};

export const formatTime = (iso?: string) => {
  if (!iso) return '-';
  try {
    return format(parseISO(iso), 'HH:mm');
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

export const moneyValue = (raw?: string | number): number => {
  if (raw === undefined || raw === null || raw === '') return 0;
  const num = typeof raw === 'string' ? Number(raw) : raw;
  return Number.isNaN(num) ? 0 : num;
};

export const orderStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case OS.PendingPayment: return '待支付';
    case OS.Paid: return '已支付';
    case OS.Cancelled: return '已取消';
    case OS.Refunding: return '退款中';
    case OS.Refunded: return '已退款';
    case OS.PartialRefund: return '部分退款';
    default: return String(status);
  }
};

export const ticketStatusLabel = (status: TicketStatus): string => {
  switch (status) {
    case TS.Unverified: return '未核销';
    case TS.Verified: return '已核销';
    case TS.Voided: return '已作废';
    default: return String(status);
  }
};

export const remainingSeconds = (expireIso?: string): number => {
  if (!expireIso) return 0;
  try {
    const diff = differenceInSeconds(parseISO(expireIso), new Date());
    return Math.max(0, diff);
  } catch {
    return 0;
  }
};

export const formatMMSS = (secs: number): string => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};
