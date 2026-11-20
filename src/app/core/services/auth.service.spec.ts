import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

const API = environment.apiUrl;
const USER = { id: 1, name: 'Ada', email: 'ada@example.com' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let storage: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(TokenStorageService);
  });

  afterEach(() => http.verify());

  it('login POSTs credentials and stores token and user', () => {
    let result: unknown;
    service.login({ email: 'ada@example.com', password: 'secret123' }).subscribe(r => (result = r));

    const req = http.expectOne(`${API}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ada@example.com', password: 'secret123' });
    req.flush({ token: 'abc', user: USER });

    expect(result).toEqual({ token: 'abc', user: USER });
    expect(storage.token()).toBe('abc');
    expect(service.currentUser()).toEqual(USER);
    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('auth_token')).toBe('abc');
  });

  it('login supports Laravel { data: { token, user } } response', () => {
    service.login({ email: 'admin@test.com', password: 'password123' }).subscribe();
    http.expectOne(`${API}/login`).flush({ data: { token: 'laravel-token', user: USER } });
    expect(storage.token()).toBe('laravel-token');
    expect(service.currentUser()).toEqual(USER);
  });

  it('login falls back to access_token', () => {
    service.login({ email: 'a@b.com', password: 'x' }).subscribe();
    http.expectOne(`${API}/login`).flush({ access_token: 'fallback', user: USER });
    expect(storage.token()).toBe('fallback');
  });

  it('login errors when the response has no token', () => {
    let error: unknown;
    service.login({ email: 'a@b.com', password: 'x' }).subscribe({ error: e => (error = e) });
    http.expectOne(`${API}/login`).flush({ user: USER });
    expect(error).toBeInstanceOf(Error);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('login does not store a session on 401', () => {
    let status = 0;
    service.login({ email: 'a@b.com', password: 'bad' }).subscribe({ error: e => (status = e.status) });
    http.expectOne(`${API}/login`).flush({ message: 'Invalid' }, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('logout POSTs and clears the session', () => {
    storage.setSession('abc', USER);
    let completed = false;
    service.logout().subscribe({ complete: () => (completed = true) });

    const req = http.expectOne(`${API}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(completed).toBe(true);
    expect(storage.token()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('logout clears the session even when the API fails', () => {
    storage.setSession('abc', USER);
    let completed = false;
    service.logout().subscribe({ complete: () => (completed = true) });
    http.expectOne(`${API}/logout`).flush({}, { status: 500, statusText: 'Server Error' });

    expect(completed).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('forgotPassword POSTs the email', () => {
    service.forgotPassword({ email: 'ada@example.com' }).subscribe();
    const req = http.expectOne(`${API}/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ada@example.com' });
    req.flush({ message: 'sent' });
  });

  it('resetPassword POSTs token, email, password and confirmation', () => {
    const payload = {
      token: 't0k3n',
      email: 'ada@example.com',
      password: 'newpassword',
      password_confirmation: 'newpassword'
    };
    service.resetPassword(payload).subscribe();
    const req = http.expectOne(`${API}/reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ message: 'ok' });
  });
});
