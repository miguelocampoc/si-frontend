import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconSetService } from '@coreui/icons-angular';
import { environment } from '../../../../environments/environment';
import { User } from '../../../core/models/user.model';
import { iconSubset } from '../../../icons/icon-subset';
import { UserFormModalComponent } from './user-form-modal.component';

const URL = `${environment.apiUrl}/users`;
const EXISTING: User = { id: 7, name: 'Grace', email: 'grace@example.com' };

describe('UserFormModalComponent', () => {
  let fixture: ComponentFixture<UserFormModalComponent>;
  let component: UserFormModalComponent;
  let http: HttpTestingController;

  const open = (user: User | null = null) => {
    fixture.componentRef.setInput('user', user);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  };
  const fill = (password = 'secret123', confirmation = 'secret123') =>
    component.form.patchValue({
      name: 'Ada',
      email: 'ada@example.com',
      password,
      password_confirmation: confirmation
    });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserFormModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), IconSetService]
    });
    TestBed.inject(IconSetService).icons = { ...iconSubset };
    fixture = TestBed.createComponent(UserFormModalComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  describe('modal states', () => {
    it('is in create mode with an empty form', () => {
      open(null);
      expect(component.isEdit()).toBe(false);
      expect(component.title()).toBe('New user');
      expect(component.form.getRawValue()).toEqual({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
      });
    });

    it('is in edit mode with prefilled name/email and empty passwords', () => {
      open(EXISTING);
      expect(component.isEdit()).toBe(true);
      expect(component.title()).toBe('Edit user');
      expect(component.form.getRawValue()).toEqual({
        name: 'Grace',
        email: 'grace@example.com',
        password: '',
        password_confirmation: ''
      });
    });

    it('resets the form and errors when reopened', () => {
      open(null);
      fill();
      component.errors.set(['old error']);

      fixture.componentRef.setInput('visible', false);
      fixture.detectChanges();
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      expect(component.form.getRawValue().name).toBe('');
      expect(component.errors()).toEqual([]);
    });

    it('emits visibleChange(false) on close but not while saving', () => {
      open(null);
      const spy = vi.fn();
      component.visibleChange.subscribe(spy);

      component.saving.set(true);
      component.close();
      expect(spy).not.toHaveBeenCalled();

      component.saving.set(false);
      component.close();
      expect(spy).toHaveBeenCalledWith(false);
    });
  });

  describe('validation', () => {
    it('requires all four fields', () => {
      open(null);
      component.submit();
      http.expectNone(URL);
      const { controls } = component.form;
      expect(controls.name.hasError('required')).toBe(true);
      expect(controls.email.hasError('required')).toBe(true);
      expect(controls.password.hasError('required')).toBe(true);
      expect(controls.password_confirmation.hasError('required')).toBe(true);
    });

    it('flags a password / confirmation mismatch', () => {
      open(null);
      fill('secret123', 'different');
      expect(component.form.controls.password_confirmation.hasError('passwordMismatch')).toBe(true);
      component.submit();
      http.expectNone(URL);
    });

    it('clears the mismatch when passwords match again', () => {
      open(null);
      fill('secret123', 'different');
      component.form.controls.password_confirmation.setValue('secret123');
      expect(component.form.valid).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', () => {
      open(null);
      fill('short', 'short');
      expect(component.form.controls.password.hasError('minlength')).toBe(true);
    });
  });

  describe('submit', () => {
    it('creates a user with POST and emits saved + close', () => {
      open(null);
      const saved = vi.fn();
      const visible = vi.fn();
      component.saved.subscribe(saved);
      component.visibleChange.subscribe(visible);
      fill();
      component.submit();

      expect(component.saving()).toBe(true);
      const req = http.expectOne(URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret123',
        password_confirmation: 'secret123'
      });
      req.flush({ data: { id: 1, name: 'Ada', email: 'ada@example.com' } });

      expect(component.saving()).toBe(false);
      expect(saved).toHaveBeenCalledWith({ id: 1, name: 'Ada', email: 'ada@example.com' });
      expect(visible).toHaveBeenCalledWith(false);
    });

    it('updates an existing user with PUT', () => {
      open(EXISTING);
      component.form.patchValue({ password: 'newsecret1', password_confirmation: 'newsecret1' });
      component.submit();

      const req = http.expectOne(`${URL}/7`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.password_confirmation).toBe('newsecret1');
      req.flush({ id: 7, name: 'Grace', email: 'grace@example.com' });
    });

    it('maps Laravel 422 errors onto the controls and keeps the modal open', () => {
      open(null);
      const visible = vi.fn();
      component.visibleChange.subscribe(visible);
      fill();
      component.submit();

      http.expectOne(URL).flush(
        {
          message: 'invalid',
          errors: {
            email: ['The email has already been taken.'],
            password: ['The password field confirmation does not match.']
          }
        },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
      fixture.detectChanges();

      expect(component.saving()).toBe(false);
      expect(component.form.controls.email.errors).toEqual({ server: 'The email has already been taken.' });
      expect(component.form.controls.password.hasError('server')).toBe(true);
      expect(visible).not.toHaveBeenCalled();
      expect(component.errors()).toEqual([]);
    });

    it('shows unmapped 422 errors and server failures as general alerts', () => {
      open(null);
      fill();
      component.submit();
      http.expectOne(URL).flush(
        { errors: { other: ['Something else.'] } },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
      expect(component.errors()).toEqual(['Something else.']);

      component.submit();
      http.expectOne(URL).flush({ message: 'Boom' }, { status: 500, statusText: 'Server Error' });
      expect(component.errors()).toEqual(['Boom']);
    });

    it('ignores a second submit while saving', () => {
      open(null);
      fill();
      component.submit();
      component.submit();
      http.expectOne(URL).flush({ id: 1, name: 'Ada', email: 'ada@example.com' });
    });
  });
});
