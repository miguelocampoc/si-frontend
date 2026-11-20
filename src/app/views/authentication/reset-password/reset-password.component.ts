import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AlertComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  RowComponent,
  SpinnerComponent
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { AuthService } from '../../../core/services/auth.service';
import { passwordMatchValidator } from '../../../core/validators/password-match.validator';
import { applyLaravelErrors, getControlError } from '../../../shared/utils/laravel-errors';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  host: {
    class: 'bg-body-tertiary min-vh-100 d-flex flex-row align-items-center'
  },
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AlertComponent,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    ColComponent,
    ContainerComponent,
    FormControlDirective,
    FormDirective,
    IconDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    RowComponent,
    SpinnerComponent
  ]
})
export class ResetPasswordComponent {
  readonly #auth = inject(AuthService);
  readonly #route = inject(ActivatedRoute);

  /** Token comes from `/reset-password/:token` or `?token=`; email from `?email=`. */
  readonly token =
    this.#route.snapshot.paramMap.get('token') ?? this.#route.snapshot.queryParamMap.get('token');

  readonly loading = signal(false);
  readonly errors = signal<string[]>([]);
  readonly success = signal<string | null>(null);

  readonly form = new FormGroup(
    {
      email: new FormControl(this.#route.snapshot.queryParamMap.get('email') ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.email]
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)]
      }),
      password_confirmation: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      })
    },
    { validators: passwordMatchValidator() }
  );

  readonly error = getControlError;

  submit(): void {
    if (this.loading() || !this.token) return;
    this.errors.set([]);
    this.success.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.#auth.resetPassword({ token: this.token, ...this.form.getRawValue() }).subscribe({
      next: res => {
        this.loading.set(false);
        this.success.set(res?.message ?? res?.status ?? 'Your password has been reset.');
        this.form.reset();
      },
      error: err => {
        this.loading.set(false);
        this.errors.set(applyLaravelErrors(this.form, err));
      }
    });
  }
}
