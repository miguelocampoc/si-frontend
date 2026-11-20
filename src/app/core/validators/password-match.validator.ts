import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Group-level validator: `confirmKey` must equal `passwordKey`.
 * Sets `passwordMismatch` on the confirmation control (preserving its other errors)
 * and also returns it on the group.
 */
export function passwordMatchValidator(
  passwordKey = 'password',
  confirmKey = 'password_confirmation'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey);
    const confirm = group.get(confirmKey);
    if (!password || !confirm) {
      return null;
    }

    const mismatch = !!password.value && !!confirm.value && password.value !== confirm.value;
    const { passwordMismatch: _removed, ...rest } = confirm.errors ?? {};

    if (mismatch) {
      confirm.setErrors({ ...rest, passwordMismatch: true });
      return { passwordMismatch: true };
    }
    confirm.setErrors(Object.keys(rest).length ? rest : null);
    return null;
  };
}
