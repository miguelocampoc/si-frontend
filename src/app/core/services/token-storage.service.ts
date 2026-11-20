import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/** Persists the Sanctum token/user in localStorage and exposes them as signals. */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  readonly #token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly #user = signal<User | null>(this.#readUser());

  readonly token = this.#token.asReadonly();
  readonly user = this.#user.asReadonly();

  setSession(token: string, user: User | null): void {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
    this.#token.set(token);
    this.#user.set(user);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.#token.set(null);
    this.#user.set(null);
  }

  #readUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
