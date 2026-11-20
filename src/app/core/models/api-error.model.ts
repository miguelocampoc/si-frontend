/** Laravel 422 validation error body. */
export interface LaravelValidationError {
  message?: string;
  errors?: Record<string, string[]>;
}
