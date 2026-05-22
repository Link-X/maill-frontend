import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartSeat {
  seatId: number | string;
  rowsNum: string;
  colNum: string;
  seatName: string;
  areaId: string;
  price: string;
}

interface CartState {
  sessionId: number | string | null;
  seats: CartSeat[];
}

const initialState: CartState = { sessionId: null, seats: [] };

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setSessionContext: (state, action: PayloadAction<number | string>) => {
      if (state.sessionId !== action.payload) {
        state.sessionId = action.payload;
        state.seats = [];
      }
    },
    toggleSeat: (state, action: PayloadAction<CartSeat>) => {
      const idx = state.seats.findIndex((s) => String(s.seatId) === String(action.payload.seatId));
      if (idx >= 0) state.seats.splice(idx, 1);
      else state.seats.push(action.payload);
    },
    clearCart: (state) => {
      state.seats = [];
    },
  },
});

export const { setSessionContext, toggleSeat, clearCart } = cartSlice.actions;

export const selectCartSeats = (root: { cart: CartState }) => root.cart.seats;
export const selectCartTotalPrice = (root: { cart: CartState }): number =>
  root.cart.seats.reduce((acc, s) => acc + Number(s.price || 0), 0);
