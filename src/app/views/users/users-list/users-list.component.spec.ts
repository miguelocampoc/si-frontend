import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { IconSetService } from '@coreui/icons-angular';
import { environment } from '../../../../environments/environment';
import { iconSubset } from '../../../icons/icon-subset';
import { UserFormModalComponent } from '../user-form-modal/user-form-modal.component';
import { UsersListComponent } from './users-list.component';

const URL = `${environment.apiUrl}/users`;
const U1 = { id: 1, name: 'Ada', email: 'ada@example.com' };
const U2 = { id: 2, name: 'Grace', email: 'grace@example.com' };
const META = { current_page: 1, last_page: 1, per_page: 10, total: 2 };

describe('UsersListComponent (integration with UsersService)', () => {
  let fixture: ComponentFixture<UsersListComponent>;
  let component: UsersListComponent;
  let http: HttpTestingController;

  const el = () => fixture.nativeElement as HTMLElement;
  const flushList = (body: any) => {
    http.expectOne(r => r.url === URL && r.method === 'GET').flush(body);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UsersListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), IconSetService]
    });
    TestBed.inject(IconSetService).icons = { ...iconSubset };
    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges(); // ngOnInit → GET /users
  });

  afterEach(() => http.verify());

  it('shows a spinner while loading, then renders a row per user', () => {
    expect(el().querySelector('[data-test="loading"]')).toBeTruthy();
    flushList({ data: [U1, U2], meta: META });

    expect(el().querySelector('[data-test="loading"]')).toBeNull();
    const rows = el().querySelectorAll('[data-test="user-row"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('ada@example.com');
  });

  it('supports a plain array response', () => {
    flushList([U1]);
    expect(el().querySelectorAll('[data-test="user-row"]').length).toBe(1);
    expect(component.meta()).toBeNull();
  });

  it('shows the empty state', () => {
    flushList({ data: [], meta: META });
    expect(el().querySelector('[data-test="empty"]')).toBeTruthy();
    expect(el().querySelector('table')).toBeNull();
  });

  it('shows an error alert when loading fails and can retry', async () => {
    http.expectOne(r => r.url === URL).flush({ message: 'Server down' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-test="load-error"]')?.textContent).toContain('Server down');

    el().querySelector<HTMLButtonElement>('[data-test="retry"]')!.click();
    flushList({ data: [U1], meta: META });
    expect(component.error()).toBeNull();
    await new Promise(r => setTimeout(r, 350));
    fixture.detectChanges();
    expect(el().querySelector('[data-test="load-error"]')).toBeNull();
    expect(el().querySelectorAll('[data-test="user-row"]').length).toBe(1);
  });

  it('requests another page through pagination', () => {
    flushList({ data: [U1], meta: { ...META, last_page: 3, total: 25 } });
    component.goTo(2);
    const req = http.expectOne(r => r.url === URL);
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ data: [U2], meta: { ...META, current_page: 2, last_page: 3, total: 25 } });
    expect(component.page()).toBe(2);
  });

  describe('create flow', () => {
    it('opens the modal in create mode, POSTs, then reloads the list', () => {
      flushList({ data: [U1], meta: META });

      el().querySelector<HTMLButtonElement>('[data-test="new-user"]')!.click();
      fixture.detectChanges();
      expect(component.formVisible()).toBe(true);
      expect(component.selectedUser()).toBeNull();

      component.onSaved({ id: 2, name: 'Grace', email: 'grace@example.com' });
      expect(component.success()).toContain('created');
      flushList({ data: [U1, U2], meta: META });
      expect(el().querySelectorAll('[data-test="user-row"]').length).toBe(2);
    });
  });

  describe('edit flow', () => {
    it('opens the modal in edit mode for the selected row and reloads on save', () => {
      flushList({ data: [U1, U2], meta: META });

      el().querySelectorAll<HTMLButtonElement>('[data-test="edit"]')[1].click();
      fixture.detectChanges();
      expect(component.formVisible()).toBe(true);
      expect(component.selectedUser()).toEqual(U2);

      component.onSaved({ ...U2, name: 'Grace H.' });
      expect(component.success()).toContain('updated');
      flushList({ data: [U1, { ...U2, name: 'Grace H.' }], meta: META });
      expect(el().textContent).toContain('Grace H.');
    });

    it('performs the PUT through the real modal and refreshes the list', () => {
      flushList({ data: [U1], meta: META });
      component.openEdit(U1);
      fixture.detectChanges();

      const modal = fixture.debugElement.query(By.directive(UserFormModalComponent))
        .componentInstance as UserFormModalComponent;
      modal.form.patchValue({ password: 'newsecret1', password_confirmation: 'newsecret1' });
      modal.submit();

      const put = http.expectOne(`${URL}/1`);
      expect(put.request.method).toBe('PUT');
      put.flush({ ...U1, name: 'Ada' });
      flushList({ data: [U1], meta: META });
      expect(component.success()).toContain('updated');
    });
  });

  describe('delete flow', () => {
    it('opens the confirmation, DELETEs on confirm, closes and reloads', () => {
      flushList({ data: [U1, U2], meta: META });

      el().querySelectorAll<HTMLButtonElement>('[data-test="delete"]')[0].click();
      fixture.detectChanges();
      expect(component.deleteVisible()).toBe(true);
      expect(component.userToDelete()).toEqual(U1);

      component.confirmDelete(U1);
      expect(component.deleting()).toBe(true);
      const req = http.expectOne(`${URL}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(component.deleting()).toBe(false);
      expect(component.deleteVisible()).toBe(false);
      expect(component.success()).toContain('deleted');
      flushList({ data: [U2], meta: META });
      expect(el().querySelectorAll('[data-test="user-row"]').length).toBe(1);
    });

    it('keeps the modal open and shows the error when DELETE fails', () => {
      flushList({ data: [U1], meta: META });
      component.openDelete(U1);
      component.confirmDelete(U1);
      http.expectOne(`${URL}/1`).flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

      expect(component.deleteVisible()).toBe(true);
      expect(component.deleteError()).toBe('Forbidden');
      expect(component.deleting()).toBe(false);
    });

    it('goes back one page when the last row of a page is deleted', () => {
      flushList({ data: [U1], meta: { ...META, current_page: 2, last_page: 2, total: 11 } });
      expect(component.page()).toBe(2);

      component.confirmDelete(U1);
      http.expectOne(`${URL}/1`).flush(null, { status: 204, statusText: 'No Content' });
      const reload = http.expectOne(r => r.url === URL);
      expect(reload.request.params.get('page')).toBe('1');
      reload.flush({ data: [U2], meta: META });
    });
  });
});
