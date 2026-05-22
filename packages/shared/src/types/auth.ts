export interface User {
  userId: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  userId: string | number;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  phone?: string;
  email?: string;
}
