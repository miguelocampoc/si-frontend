import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';
import { environment } from '../../../../environments/environment';
import { iconSubset } from '../../../icons/icon-subset';
import { ForgotPasswordComponent } from './forgot-password.component';

const API = environment.apiUrl;

describe('ForgotPasswordComponent (integration with AuthService)', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let http: HttpTestingController;

  const el = () => fixture.nativeElement as HTMLElement;
  const setEmail = (value: string) => {
    const input = el().querySelector<HTMLInputElement>('#email')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = () => {
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), IconSetService]
    });
    TestBed.inject(IconSetService).icons = { ...iconSubset };
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('validates the email before calling the API', () => {
    setEmail('not-an-email');
    submit();
    expect(el().querySelector('[data-test="email-error"]')?.textContent).toMatch(/valid email/i);
    http.expectNone(`${API}/forgot-password`);
  });

  it('sends the email and shows the success message', () => {
    setEmail('ada@example.com');
    submit();
    expect(component.loading()).toBe(true);

    const req = http.expectOne(`${API}/forgot-password`);
    expect(req.request.body).toEqual({ email: 'ada@example.com' });
    req.flush({ message: 'We have emailed your password reset link.' });
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(el().querySelector('[data-test="success"]')?.textContent).toMatch(/emailed/);
  });

  it('shows 422 errors from the API', () => {
    setEmail('ghost@example.com');
    submit();
    http.expectOne(`${API}/forgot-password`).flush(
      { message: 'invalid', errors: { email: ["We can't find a user with that email address."] } },
      { status: 422, statusText: 'Unprocessable' }
    );
    fixture.detectChanges();

    expect(el().querySelector('[data-test="email-error"]')?.textContent).toMatch(/can't find/);
    expect(el().querySelector('[data-test="success"]')).toBeNull();
  });

  it('shows a general alert on server errors', () => {
    setEmail('ada@example.com');
    submit();
    http.expectOne(`${API}/forgot-password`).flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('c-alert')?.textContent).toMatch(/unexpected/i);
  });
});
