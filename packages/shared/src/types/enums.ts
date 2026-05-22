// 与后端枚举一一对应

export const OrderStatus = {
  PendingPayment: 0,
  Paid: 1,
  Cancelled: 2,
  Refunding: 3,
  Refunded: 4,
  PartialRefund: 5,
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const SeatStatus = {
  Available: 0,
  Locked: 1,
  Sold: 2,
} as const;
export type SeatStatus = (typeof SeatStatus)[keyof typeof SeatStatus];

export const TicketStatus = {
  Unverified: 0,
  Verified: 1,
  Voided: 2,
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const SeatType = {
  Normal: 1,
  CoupleLeft: 2,
  CoupleRight: 3,
} as const;
export type SeatType = (typeof SeatType)[keyof typeof SeatType];

export const ShowStatus = {
  Draft: 0,
  OnSale: 1,
  OffShelf: 2,
} as const;
export type ShowStatus = (typeof ShowStatus)[keyof typeof ShowStatus];

export const SessionStatus = {
  Draft: 0,
  Published: 1,
  Ended: 2,
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];
