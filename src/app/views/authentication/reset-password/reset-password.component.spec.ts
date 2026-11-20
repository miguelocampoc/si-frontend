import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';
import { environment } from '../../../../environments/environment';
import { iconSubset } from '../../../icons/icon-subset';
import { ResetPasswordComponent } from './reset-password.component';

const API = environment.apiUrl;

describe('ResetPasswordComponent (integration with AuthService)', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let http: HttpTestingController;

  const el = () => fixture.nativeElement as HTMLElement;
  const setValue = (id: string, value: string) => {
    const input = el().querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  };
  const submit = () => {
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  function setup(params: Record<string, string> = {}, query: Record<string, string> = {}) {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        IconSetService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(params), queryParamMap: convertToParamMap(query) }
          }
        }
      ]
    });
    TestBed.inject(IconSetService).icons = { ...iconSubset };
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('reads token and email from query params', () => {
    setup({}, { token: 'tok', email: 'ada@example.com' });
    expect(component.token).toBe('tok');
    expect(component.form.controls.email.value).toBe('ada@example.com');
    expect(el().querySelector('[data-test="missing-token"]')).toBeNull();
  });

  it('reads the token from the route param', () => {
    setup({ token: 'route-token' });
    expect(component.token).toBe('route-token');
  });

  it('warns and disables submit when the token is missing', () => {
    setup();
    expect(el().querySelector('[data-test="missing-token"]')).toBeTruthy();
    expect(el().querySelector<HTMLButtonElement>('[data-test="submit"]')!.disabled).toBe(true);
    submit();
    http.expectNone(`${API}/reset-password`);
  });

  it('shows a mismatch error and does not submit', () => {
    setup({}, { token: 'tok', email: 'ada@example.com' });
    setValue('password', 'newpassword');
    setValue('password_confirmation', 'different1');
    submit();

    expect(el().querySelector('[data-test="confirmation-error"]')?.textContent).toMatch(/do not match/i);
    http.expectNone(`${API}/reset-password`);
  });

  it('submits token, email, password and confirmation', () => {
    setup({}, { token: 'tok', email: 'ada@example.com' });
    setValue('password', 'newpassword');
    setValue('password_confirmation', 'newpassword');
    submit();

    const req = http.expectOne(`${API}/reset-password`);
    expect(req.request.body).toEqual({
      token: 'tok',
      email: 'ada@example.com',
      password: 'newpassword',
      password_confirmation: 'newpassword'
    });
    req.flush({ message: 'Your password has been reset.' });
    fixture.detectChanges();

    expect(el().querySelector('[data-test="success"]')?.textContent).toMatch(/has been reset/);
  });

  it('maps 422 errors (e.g. invalid token) to the form', () => {
    setup({}, { token: 'tok', email: 'ada@example.com' });
    setValue('password', 'newpassword');
    setValue('password_confirmation', 'newpassword');
    submit();
    http.expectOne(`${API}/reset-password`).flush(
      { message: 'invalid', errors: { email: ['This password reset token is invalid.'] } },
      { status: 422, statusText: 'Unprocessable' }
    );
    fixture.detectChanges();

    expect(el().querySelector('[data-test="email-error"]')?.textContent).toMatch(/token is invalid/);
    expect(component.loading()).toBe(false);
  });
});
