import type { OrderStatus, TicketStatus } from './enums';

export interface OrderItem {
  id: number | string;
  orderId: number | string;
  rowNo: number;
  colNo: number;
  areaId: number;
  price: number;
}

export interface Ticket {
  id: number | string;
  orderId: number | string;
  orderItemId?: number | string;
  ticketNo: string;
  status: TicketStatus;
  qrCode?: string;
  rowNo?: number;
  colNo?: number;
}

export interface Order {
  id: number | string;
  orderNo: string;
  userId: number | string;
  sessionId: number | string;
  showName?: string;
  startTime?: string;
  venue?: string;
  totalAmount: number;
  status: OrderStatus;
  expireTime?: string;
  createTime: string;
  payTime?: string;
  items?: OrderItem[];
  tickets?: Ticket[];
}
