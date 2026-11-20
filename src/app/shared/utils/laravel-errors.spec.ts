import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { applyLaravelErrors, getControlError } from './laravel-errors';

const makeForm = () =>
  new FormGroup({
    name: new FormControl(''),
    email: new FormControl('')
  });

const err = (status: number, error: unknown) =>
  new HttpErrorResponse({ status, error, statusText: 'x' });

describe('applyLaravelErrors', () => {
  it('maps 422 field errors onto controls', () => {
    const form = makeForm();
    const general = applyLaravelErrors(
      form,
      err(422, { message: 'invalid', errors: { email: ['Taken.', 'Other'], name: ['Required.'] } })
    );

    expect(general).toEqual([]);
    expect(form.controls.email.errors).toEqual({ server: 'Taken.' });
    expect(form.controls.email.touched).toBe(true);
    expect(form.controls.name.errors).toEqual({ server: 'Required.' });
  });

  it('returns messages for unknown fields as general errors', () => {
    const general = applyLaravelErrors(makeForm(), err(422, { errors: { token: ['Bad token.'] } }));
    expect(general).toEqual(['Bad token.']);
  });

  it('uses the body message when a 422 has no errors', () => {
    expect(applyLaravelErrors(makeForm(), err(422, { message: 'Nope' }))).toEqual(['Nope']);
  });

  it('clears the server error when the field value changes', () => {
    const form = makeForm();
    applyLaravelErrors(form, err(422, { errors: { email: ['Taken.'] } }));
    form.controls.email.setValue('new@example.com');
    expect(form.controls.email.errors).toBeNull();
  });

  it('handles network and server errors', () => {
    expect(applyLaravelErrors(makeForm(), err(0, null))[0]).toMatch(/Cannot reach/);
    expect(applyLaravelErrors(makeForm(), err(500, { message: 'Boom' }))).toEqual(['Boom']);
    expect(applyLaravelErrors(makeForm(), err(500, null))[0]).toMatch(/Unexpected/);
    expect(applyLaravelErrors(makeForm(), new Error('x'))[0]).toMatch(/Unexpected/);
  });
});

describe('getControlError', () => {
  it('returns null for valid or missing controls', () => {
    expect(getControlError(null)).toBeNull();
    expect(getControlError(new FormControl('ok'))).toBeNull();
  });

  it('hides validation errors until the control is touched', () => {
    const control = new FormControl('', Validators.required);
    expect(getControlError(control)).toBeNull();
    control.markAsTouched();
    expect(getControlError(control)).toBe('This field is required.');
  });

  it('describes email, minlength and mismatch errors', () => {
    const email = new FormControl('bad', Validators.email);
    email.markAsTouched();
    expect(getControlError(email)).toMatch(/valid email/);

    const min = new FormControl('abc', Validators.minLength(8));
    min.markAsTouched();
    expect(getControlError(min)).toBe('Must be at least 8 characters.');

    const confirm = new FormControl('x');
    confirm.setErrors({ passwordMismatch: true });
    confirm.markAsTouched();
    expect(getControlError(confirm)).toBe('Passwords do not match.');
  });

  it('shows server errors immediately', () => {
    const control = new FormControl('');
    control.setErrors({ server: 'Taken.' });
    expect(getControlError(control)).toBe('Taken.');
  });
});
