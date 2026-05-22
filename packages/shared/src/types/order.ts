import type { OrderStatus, TicketStatus } from './enums';

// 票券（OrderStatusResponse.TicketInfo）
export interface TicketInfo {
  ticketNo: string;
  qrCode?: string;
  status: TicketStatus;
  verifyTime?: string;
}

// 订单状态响应 — /api/order/submit、/api/order/orderDetails 都返这个
export interface OrderStatusResponse {
  orderId: number | string;
  orderNo: string;
  status: OrderStatus;
  totalAmount: string;
  createTime: string;
  payTime?: string;
  expireTime?: string;
  /** 座位字符串列表，如 ["1排01座", "1排02座"] */
  seatInfos: string[];
  /** 票券列表，支付成功后异步生成 */
  tickets?: TicketInfo[];
  showName?: string;
  showVenue?: string;
  sessionName?: string;
  sessionStartTime?: string;
}

// 兼容 Plan 1 类型名 — Plan 4 订单列表 / 详情仍可用 Order 这个别名
export type Order = OrderStatusResponse;

// 票券 alias for backward compat
export type Ticket = TicketInfo;

// 用户端订单列表 / 下单 / 取消请求
export interface OrderListRequest {
  page: number;
  size: number;
  status?: OrderStatus;
  startTime?: string;
  endTime?: string;
}

export interface SubmitOrderRequest {
  sessionId: number | string;
  seatIds: Array<number | string>;
}

export interface CancelOrderRequest {
  orderNo: string;
}

export interface RefundTicketRequest {
  orderNo: string;
  ticketNo: string;
}

// 用户端 /api/payment/create
export interface PaymentRequest {
  orderNo: string;
  channel?: string;
}
export interface PaymentResponse {
  status: 'PAID';
  paymentNo: string;
}

// 核销响应（VerifyService 返回 Ticket entity）
export interface VerifyResult {
  id?: number | string;
  orderId?: number | string;
  orderItemId?: number | string;
  ticketNo: string;
  qrCode?: string;
  status: import('./enums').TicketStatus;
  verifyTime?: string;
}

// 商家端监控看板响应
export interface MonitorDashboard {
  sessionId: number | string;
  totalSeats: number;
  availableCount: number;
  soldCount: number;
}

// 商家端订单查询响应 — 订单 entity（基本字段）
export interface AdminOrder {
  id: number | string;
  orderNo: string;
  userId: number | string;
  sessionId: number | string;
  totalAmount: string;
  status: import('./enums').OrderStatus;
  expireTime?: string;
  createTime: string;
  payTime?: string;
}

// admin /api/admin/order/{id}/items 返回项（OrderItem entity）
export interface AdminOrderItem {
  id: number | string;
  orderId: number | string;
  seatId: number | string;
  price: string;
  seatInfo: string;
}
