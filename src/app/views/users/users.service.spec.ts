import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { UsersService } from './users.service';

const URL = `${environment.apiUrl}/users`;
const USER = { id: 1, name: 'Ada', email: 'ada@example.com' };
const PAYLOAD = {
  name: 'Ada',
  email: 'ada@example.com',
  password: 'secret123',
  password_confirmation: 'secret123'
};

describe('UsersService', () => {
  let service: UsersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(UsersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list requests the page and normalizes the paginated response', () => {
    const meta = { current_page: 2, last_page: 3, per_page: 10, total: 25 };
    let result: unknown;
    service.list(2).subscribe(r => (result = r));

    const req = http.expectOne(r => r.url === URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ data: [USER], meta, links: {} });

    expect(result).toEqual({ data: [USER], meta });
  });

  it('list falls back to a plain array without meta', () => {
    let result: unknown;
    service.list().subscribe(r => (result = r));
    http.expectOne(r => r.url === URL).flush([USER]);
    expect(result).toEqual({ data: [USER], meta: null });
  });

  it('list handles { data } without meta', () => {
    let result: unknown;
    service.list().subscribe(r => (result = r));
    http.expectOne(r => r.url === URL).flush({ data: [USER] });
    expect(result).toEqual({ data: [USER], meta: null });
  });

  it('get fetches a single user and unwraps { data }', () => {
    let result: unknown;
    service.get(1).subscribe(r => (result = r));
    const req = http.expectOne(`${URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: USER });
    expect(result).toEqual(USER);
  });

  it('create POSTs the full payload including password_confirmation', () => {
    let result: unknown;
    service.create(PAYLOAD).subscribe(r => (result = r));
    const req = http.expectOne(URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(PAYLOAD);
    req.flush(USER);
    expect(result).toEqual(USER);
  });

  it('update PUTs the full payload', () => {
    service.update(5, PAYLOAD).subscribe();
    const req = http.expectOne(`${URL}/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(PAYLOAD);
    req.flush({ data: USER });
  });

  it('delete sends DELETE', () => {
    let done = false;
    service.delete(5).subscribe(() => (done = true));
    const req = http.expectOne(`${URL}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(done).toBe(true);
  });

  it('propagates 422 validation errors', () => {
    let error: { status: number; error: unknown } | undefined;
    service.create(PAYLOAD).subscribe({ error: e => (error = e) });
    http.expectOne(URL).flush(
      { message: 'invalid', errors: { email: ['Taken.'] } },
      { status: 422, statusText: 'Unprocessable' }
    );
    expect(error?.status).toBe(422);
    expect(error?.error).toEqual({ message: 'invalid', errors: { email: ['Taken.'] } });
  });

  it('propagates 500 errors', () => {
    let status = 0;
    service.list().subscribe({ error: e => (status = e.status) });
    http.expectOne(r => r.url === URL).flush({}, { status: 500, statusText: 'Server Error' });
    expect(status).toBe(500);
  });
});
