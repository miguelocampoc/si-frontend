import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';
import { authGuard, guestGuard } from './auth.guard';

describe('auth guards', () => {
  let storage: TokenStorageService;
  let router: Router;

  const run = (guard: typeof authGuard, url = '/users') =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
    );

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    storage = TestBed.inject(TokenStorageService);
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('allows authenticated users', () => {
      storage.setSession('abc', null);
      expect(run(authGuard)).toBe(true);
    });

    it('redirects to login cleanly when unauthenticated', () => {
      const result = run(authGuard, '/users') as UrlTree;
      expect(result).toBeInstanceOf(UrlTree);
      expect(router.serializeUrl(result)).toBe('/');
    });
  });

  describe('guestGuard', () => {
    it('allows guests', () => {
      expect(run(guestGuard)).toBe(true);
    });

    it('redirects authenticated users to the dashboard', () => {
      storage.setSession('abc', null);
      const result = run(guestGuard) as UrlTree;
      expect(router.serializeUrl(result)).toBe('/dashboard');
    });
  });
});
