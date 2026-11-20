import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

const LOGIN_URL = `${environment.apiUrl}/login`;

/** Adds the Sanctum Bearer token to API requests and handles expired sessions (401). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);

  const token = storage.token();
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const authReq =
    token && isApiRequest ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        req.url !== LOGIN_URL
      ) {
        storage.clear();
        router.navigate(['/']);
      }
      return throwError(() => error);
    })
  );
};
