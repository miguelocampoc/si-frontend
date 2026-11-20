import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';
import { environment } from '../../../../environments/environment';
import { iconSubset } from '../../../icons/icon-subset';
import { LoginComponent } from './login.component';

const API = environment.apiUrl;

describe('LoginComponent (integration with AuthService)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let http: HttpTestingController;
  let router: Router;

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

  function setup() {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        IconSetService
      ]
    });
    TestBed.inject(IconSetService).icons = { ...iconSubset };
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('renders the form without a sign-up link', () => {
    setup();
    expect(el().querySelector('#email')).toBeTruthy();
    expect(el().querySelector('#password')).toBeTruthy();
    expect(el().querySelector('a[href*="register"]')).toBeNull();
    expect(el().textContent).not.toMatch(/sign up/i);
    expect(el().querySelector('a[href*="forgot-password"]')).toBeTruthy();
  });

  it('shows validation errors and does not call the API when invalid', () => {
    setup();
    submit();
    expect(el().querySelector('[data-test="email-error"]')?.textContent).toMatch(/required/i);
    expect(el().querySelector('[data-test="password-error"]')).toBeTruthy();
    http.expectNone(`${API}/login`);
  });

  it('logs in, shows the spinner while pending, and navigates to the dashboard', () => {
    setup();
    setValue('email', 'ada@example.com');
    setValue('password', 'secret123');
    submit();

    expect(component.loading()).toBe(true);
    expect(el().querySelector('c-spinner')).toBeTruthy();
    expect(el().querySelector<HTMLButtonElement>('[data-test="submit"]')!.disabled).toBe(true);

    const req = http.expectOne(`${API}/login`);
    expect(req.request.body).toEqual({ email: 'ada@example.com', password: 'secret123' });
    req.flush({ token: 'abc', user: { id: 1, name: 'Ada', email: 'ada@example.com' } });

    expect(component.loading()).toBe(false);
    expect(localStorage.getItem('auth_token')).toBe('abc');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('shows an alert on 401', () => {
    setup();
    setValue('email', 'ada@example.com');
    setValue('password', 'wrongpass');
    submit();
    http.expectOne(`${API}/login`).flush({ message: 'Unauthenticated' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(el().querySelector('c-alert')?.textContent).toMatch(/invalid credentials/i);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('maps Laravel 422 errors onto the email field', () => {
    setup();
    setValue('email', 'ada@example.com');
    setValue('password', 'secret123');
    submit();
    http.expectOne(`${API}/login`).flush(
      { message: 'invalid', errors: { email: ['These credentials do not match our records.'] } },
      { status: 422, statusText: 'Unprocessable' }
    );
    fixture.detectChanges();

    expect(el().querySelector('[data-test="email-error"]')?.textContent).toMatch(/do not match/);
  });

  it('toggles password visibility', () => {
    setup();
    const input = el().querySelector<HTMLInputElement>('#password')!;
    expect(input.type).toBe('password');
    el().querySelector<HTMLButtonElement>('[data-test="toggle-password"]')!.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
  });
});
