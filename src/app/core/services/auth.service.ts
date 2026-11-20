import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ForgotPasswordPayload,
  LoginCredentials,
  LoginResponse,
  MessageResponse,
  ResetPasswordPayload
} from '../models/auth.model';
import { User } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #http = inject(HttpClient);
  readonly #storage = inject(TokenStorageService);
  readonly #baseUrl = environment.apiUrl;

  readonly currentUser = this.#storage.user;
  readonly token = this.#storage.token;
  readonly isAuthenticated = computed(() => !!this.#storage.token());

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.#http.post<LoginResponse>(`${this.#baseUrl}/login`, credentials).pipe(
      tap(res => {
        const payload = res.data ?? res;
        const token = payload.token ?? payload.access_token;
        if (!token) {
          throw new Error('Login response did not include a token.');
        }
        this.#storage.setSession(token, payload.user ?? null);
      })
    );
  }

  /** Always clears the local session, even if the API call fails. */
  logout(): Observable<void> {
    return this.#http.post<unknown>(`${this.#baseUrl}/logout`, {}).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => this.#storage.clear())
    );
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<MessageResponse> {
    return this.#http.post<MessageResponse>(`${this.#baseUrl}/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<MessageResponse> {
    return this.#http.post<MessageResponse>(`${this.#baseUrl}/reset-password`, payload);
  }

  /** Clears local state without calling the API (used on 401). */
  clearSession(): void {
    this.#storage.clear();
  }

  getUser(): User | null {
    return this.#storage.user();
  }
}
