import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

/** Protects routes: redirects to login ('/') when no token is stored. */
export const authGuard: CanActivateFn = () => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);
  return storage.token() ? true : router.createUrlTree(['/']);
};

/** Keeps authenticated users away from public auth pages. */
export const guestGuard: CanActivateFn = () => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);
  return storage.token() ? router.createUrlTree(['/dashboard']) : true;
};
