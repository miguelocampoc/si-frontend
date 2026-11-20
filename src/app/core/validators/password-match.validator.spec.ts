import { FormControl, FormGroup } from '@angular/forms';
import { passwordMatchValidator } from './password-match.validator';

function createForm() {
  return new FormGroup(
    {
      password: new FormControl('', { nonNullable: true }),
      password_confirmation: new FormControl('', { nonNullable: true })
    },
    { validators: passwordMatchValidator() }
  );
}

describe('passwordMatchValidator', () => {
  it('is valid when both fields match', () => {
    const form = createForm();
    form.setValue({ password: 'secret123', password_confirmation: 'secret123' });
    expect(form.errors).toBeNull();
    expect(form.controls.password_confirmation.errors).toBeNull();
  });

  it('flags a mismatch on the group and the confirmation control', () => {
    const form = createForm();
    form.setValue({ password: 'secret123', password_confirmation: 'different' });
    expect(form.errors).toEqual({ passwordMismatch: true });
    expect(form.controls.password_confirmation.hasError('passwordMismatch')).toBe(true);
  });

  it('does not flag a mismatch while either field is empty', () => {
    const form = createForm();
    form.patchValue({ password: 'secret123' });
    expect(form.errors).toBeNull();
  });

  it('revalidates when the password changes after the confirmation', () => {
    const form = createForm();
    form.setValue({ password: 'aaaaaaaa', password_confirmation: 'bbbbbbbb' });
    expect(form.invalid).toBe(true);

    form.controls.password.setValue('bbbbbbbb');
    expect(form.errors).toBeNull();
    expect(form.controls.password_confirmation.hasError('passwordMismatch')).toBe(false);
  });

  it('preserves other errors on the confirmation control', () => {
    const form = new FormGroup(
      {
        password: new FormControl('abcdefgh', { nonNullable: true }),
        password_confirmation: new FormControl('x', {
          nonNullable: true,
          validators: [(c) => (c.value === 'x' ? { custom: true } : null)]
        })
      },
      { validators: passwordMatchValidator() }
    );
    form.controls.password_confirmation.updateValueAndValidity();
    const errors = form.controls.password_confirmation.errors;
    expect(errors).toEqual({ custom: true, passwordMismatch: true });
  });
});
