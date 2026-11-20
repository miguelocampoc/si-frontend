import { Component, input, output } from '@angular/core';
import {
  AlertComponent,
  ButtonCloseDirective,
  ButtonDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  SpinnerComponent
} from '@coreui/angular';
import { User } from '../../../core/models/user.model';

/** Delete confirmation. The parent runs the request and drives `loading`/`error`. */
@Component({
  selector: 'app-user-delete-modal',
  templateUrl: './user-delete-modal.component.html',
  imports: [
    AlertComponent,
    ButtonCloseDirective,
    ButtonDirective,
    ModalBodyComponent,
    ModalComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    SpinnerComponent
  ]
})
export class UserDeleteModalComponent {
  readonly visible = input(false);
  readonly user = input<User | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly visibleChange = output<boolean>();
  readonly confirmed = output<User>();

  confirm(): void {
    const user = this.user();
    if (user && !this.loading()) {
      this.confirmed.emit(user);
    }
  }

  close(): void {
    if (!this.loading()) {
      this.visibleChange.emit(false);
    }
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.close();
    }
  }
}
