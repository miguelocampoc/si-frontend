import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';
import { authInterceptor } from './auth.interceptor';

const API = environment.apiUrl;

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let storage: TokenStorageService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: vi.fn() } }
      ]
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(TokenStorageService);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  it('adds the Bearer token to API requests', () => {
    storage.setSession('abc', null);
    client.get(`${API}/users`).subscribe();
    const req = http.expectOne(`${API}/users`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush([]);
  });

  it('does not add a header when there is no token', () => {
    client.get(`${API}/users`).subscribe();
    const req = http.expectOne(`${API}/users`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('does not add the token to foreign URLs', () => {
    storage.setSession('abc', null);
    client.get('https://example.com/data').subscribe();
    const req = http.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('clears the session and redirects to login on 401', () => {
    storage.setSession('abc', null);
    client.get(`${API}/users`).subscribe({ error: () => undefined });
    http.expectOne(`${API}/users`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(storage.token()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('does not redirect on 401 from the login endpoint', () => {
    client.post(`${API}/login`, {}).subscribe({ error: () => undefined });
    http.expectOne(`${API}/login`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('keeps the session on non-401 errors and rethrows', () => {
    storage.setSession('abc', null);
    let status = 0;
    client.get(`${API}/users`).subscribe({ error: e => (status = e.status) });
    http.expectOne(`${API}/users`).flush({}, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
    expect(storage.token()).toBe('abc');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
