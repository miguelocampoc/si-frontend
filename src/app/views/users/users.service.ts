import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, User, UserListResult, UserPayload } from '../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  readonly #http = inject(HttpClient);
  readonly #url = `${environment.apiUrl}/users`;

  /** Supports Laravel's `{ data, meta }` response with a fallback to a plain array. */
  list(page = 1): Observable<UserListResult> {
    const params = new HttpParams().set('page', page);
    return this.#http.get<PaginatedResponse<User> | User[]>(this.#url, { params }).pipe(
      map(res =>
        Array.isArray(res)
          ? { data: res, meta: null }
          : { data: res.data ?? [], meta: res.meta ?? null }
      )
    );
  }

  get(id: number): Observable<User> {
    return this.#http.get<User | { data: User }>(`${this.#url}/${id}`).pipe(map(unwrap));
  }

  create(payload: UserPayload): Observable<User> {
    return this.#http.post<User | { data: User }>(this.#url, payload).pipe(map(unwrap));
  }

  update(id: number, payload: UserPayload): Observable<User> {
    return this.#http.put<User | { data: User }>(`${this.#url}/${id}`, payload).pipe(map(unwrap));
  }

  delete(id: number): Observable<void> {
    return this.#http.delete<void>(`${this.#url}/${id}`);
  }
}

function unwrap(res: User | { data: User }): User {
  return 'data' in res ? res.data : res;
}
