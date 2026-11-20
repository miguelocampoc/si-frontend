export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

/** Payload for POST /users and PUT /users/:id (both require all four fields). */
export interface UserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Laravel paginated response. `meta` may be absent; the API may also return a bare array. */
export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
  links?: Record<string, string | null>;
}

/** Normalized list result used by the UI. `meta` is null when the API is not paginated. */
export interface UserListResult {
  data: User[];
  meta: PaginationMeta | null;
}
