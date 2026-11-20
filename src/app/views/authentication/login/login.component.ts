import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
import { applyLaravelErrors, getControlError } from '../../../shared/utils/laravel-errors';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
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
export class LoginComponent {
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);

  readonly loading = signal(false);
  readonly errors = signal<string[]>([]);
  readonly showPassword = signal(false);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  readonly error = getControlError;

  submit(): void {
    if (this.loading()) return;
    this.errors.set([]);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.#auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.#router.navigateByUrl('/dashboard');
      },
      error: err => {
        this.loading.set(false);
        const messages = applyLaravelErrors(this.form, err);
        this.errors.set(err?.status === 401 ? ['Invalid credentials.'] : messages);
      }
    });
  }
}
