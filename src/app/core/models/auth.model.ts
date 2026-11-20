import { User } from './user.model';

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Login response. Supports both { data: { token, user } } and direct { token, user }. */
export interface LoginResponse {
  token?: string;
  access_token?: string;
  user?: User;
  data?: {
    token?: string;
    access_token?: string;
    token_type?: string;
    user?: User;
  };
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface MessageResponse {
  message?: string;
  status?: string;
}
