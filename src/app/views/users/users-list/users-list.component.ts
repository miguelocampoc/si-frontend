import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  AlertComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  PageItemDirective,
  PageLinkDirective,
  PaginationComponent,
  RowComponent,
  SpinnerComponent,
  TableDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { PaginationMeta, User } from '../../../core/models/user.model';
import { UserDeleteModalComponent } from '../user-delete-modal/user-delete-modal.component';
import { UserFormModalComponent } from '../user-form-modal/user-form-modal.component';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  imports: [
    AlertComponent,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    ContainerComponent,
    IconDirective,
    PageItemDirective,
    PageLinkDirective,
    PaginationComponent,
    RowComponent,
    SpinnerComponent,
    TableDirective,
    UserDeleteModalComponent,
    UserFormModalComponent
  ]
})
export class UsersListComponent implements OnInit {
  readonly #users = inject(UsersService);

  readonly users = signal<User[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly formVisible = signal(false);
  readonly selectedUser = signal<User | null>(null);

  readonly deleteVisible = signal(false);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly userToDelete = signal<User | null>(null);

  readonly pages = computed(() => {
    const last = this.meta()?.last_page ?? 1;
    return Array.from({ length: last }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.#users.list(page).subscribe({
      next: res => {
        this.users.set(res.data);
        this.meta.set(res.meta);
        this.page.set(res.meta?.current_page ?? page);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(this.#message(err, 'Could not load users.'));
      }
    });
  }

  goTo(page: number): void {
    const last = this.meta()?.last_page ?? 1;
    if (page >= 1 && page <= last && page !== this.page()) {
      this.load(page);
    }
  }

  // --- Create / Edit ---
  openCreate(): void {
    this.selectedUser.set(null);
    this.formVisible.set(true);
  }

  openEdit(user: User): void {
    this.selectedUser.set(user);
    this.formVisible.set(true);
  }

  onFormVisibleChange(visible: boolean): void {
    this.formVisible.set(visible);
  }

  onSaved(saved: User): void {
    const wasEdit = !!this.selectedUser();
    this.success.set(wasEdit ? `User "${saved.name}" updated.` : `User "${saved.name}" created.`);
    this.load();
  }

  // --- Delete ---
  openDelete(user: User): void {
    this.userToDelete.set(user);
    this.deleteError.set(null);
    this.deleteVisible.set(true);
  }

  onDeleteVisibleChange(visible: boolean): void {
    this.deleteVisible.set(visible);
  }

  confirmDelete(user: User): void {
    this.deleting.set(true);
    this.deleteError.set(null);
    this.#users.delete(user.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteVisible.set(false);
        this.success.set(`User "${user.name}" deleted.`);
        const goBack = this.users().length === 1 && this.page() > 1;
        this.load(goBack ? this.page() - 1 : this.page());
      },
      error: err => {
        this.deleting.set(false);
        this.deleteError.set(this.#message(err, 'Could not delete the user.'));
      }
    });
  }

  #message(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error as { message?: string } | null)?.message ?? fallback;
    }
    return fallback;
  }
}
