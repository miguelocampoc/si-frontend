import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';
import { LaravelValidationError } from '../../core/models/api-error.model';

/**
 * Maps a Laravel 422 response onto form controls (`{ server: message }`).
 * Returns messages that could not be mapped to a control (shown in a c-alert).
 * Server errors clear automatically when the user edits the field.
 */
export function applyLaravelErrors(form: FormGroup, error: unknown): string[] {
  const general: string[] = [];
  if (!(error instanceof HttpErrorResponse)) {
    return ['Unexpected error. Please try again.'];
  }

  if (error.status === 422) {
    const body = (error.error ?? {}) as LaravelValidationError;
    const errors = body.errors ?? {};
    for (const [field, messages] of Object.entries(errors)) {
      const control = form.get(field);
      if (control) {
        control.setErrors({ ...(control.errors ?? {}), server: messages[0] });
        control.markAsTouched();
      } else {
        general.push(...messages);
      }
    }
    if (!Object.keys(errors).length) {
      general.push(body.message ?? 'The given data was invalid.');
    }
    return general;
  }

  if (error.status === 0) {
    return ['Cannot reach the server. Check your connection.'];
  }
  const body = error.error as { message?: string } | null;
  return [body?.message ?? 'Unexpected error. Please try again.'];
}

/** Returns a user-facing message for the first error of a control, or null. */
export function getControlError(control: AbstractControl | null | undefined): string | null {
  if (!control || !control.errors) {
    return null;
  }
  const errors = control.errors;
  if (errors['server']) {
    return String(errors['server']);
  }
  if (!(control.touched || control.dirty)) {
    return null;
  }
  if (errors['required']) return 'This field is required.';
  if (errors['email']) return 'Enter a valid email address.';
  if (errors['minlength']) {
    return `Must be at least ${errors['minlength'].requiredLength} characters.`;
  }
  if (errors['maxlength']) {
    return `Must be at most ${errors['maxlength'].requiredLength} characters.`;
  }
  if (errors['passwordMismatch']) return 'Passwords do not match.';
  return 'Invalid value.';
}
