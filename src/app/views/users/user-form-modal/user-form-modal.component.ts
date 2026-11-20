import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertComponent,
  ButtonCloseDirective,
  ButtonDirective,
  FormControlDirective,
  FormDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  SpinnerComponent
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { User } from '../../../core/models/user.model';
import { passwordMatchValidator } from '../../../core/validators/password-match.validator';
import { applyLaravelErrors, getControlError } from '../../../shared/utils/laravel-errors';
import { UsersService } from '../users.service';

/** Reusable Create/Edit modal. `user` = null → create mode; otherwise edit mode. */
@Component({
  selector: 'app-user-form-modal',
  templateUrl: './user-form-modal.component.html',
  imports: [
    ReactiveFormsModule,
    AlertComponent,
    ButtonCloseDirective,
    ButtonDirective,
    FormControlDirective,
    FormDirective,
    IconDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    ModalBodyComponent,
    ModalComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    SpinnerComponent
  ]
})
export class UserFormModalComponent {
  readonly #users = inject(UsersService);

  readonly visible = input(false);
  readonly user = input<User | null>(null);

  readonly visibleChange = output<boolean>();
  readonly saved = output<User>();

  readonly isEdit = computed(() => !!this.user());
  readonly title = computed(() => (this.isEdit() ? 'Edit user' : 'New user'));

  readonly saving = signal(false);
  readonly errors = signal<string[]>([]);

  readonly form = new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(255)]
      }),
      email: new FormControl('', {
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

  constructor() {
    // Reset/prefill every time the modal is opened or the target user changes.
    effect(() => {
      const visible = this.visible();
      const user = this.user();
      if (visible) {
        untracked(() => this.resetForm(user));
      }
    });
  }

  resetForm(user: User | null): void {
    this.form.reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      password_confirmation: ''
    });
    this.errors.set([]);
    this.saving.set(false);
  }

  submit(): void {
    if (this.saving()) return;
    this.errors.set([]);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    const current = this.user();
    const request$ = current
      ? this.#users.update(current.id, payload)
      : this.#users.create(payload);

    this.saving.set(true);
    request$.subscribe({
      next: saved => {
        this.saving.set(false);
        this.saved.emit(saved);
        this.visibleChange.emit(false);
      },
      error: err => {
        this.saving.set(false);
        this.errors.set(applyLaravelErrors(this.form, err));
      }
    });
  }

  close(): void {
    if (!this.saving()) {
      this.visibleChange.emit(false);
    }
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.close();
    }
  }
}
