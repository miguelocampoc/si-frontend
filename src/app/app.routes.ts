import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public auth routes (clean URLs)
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./views/authentication/login/login.component').then(m => m.LoginComponent),
    data: { title: 'Login' }
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./views/authentication/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    data: { title: 'Forgot Password' }
  },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./views/authentication/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    data: { title: 'Reset Password' }
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./views/authentication/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    data: { title: 'Reset Password' }
  },

  // Protected application layout routes
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout').then(m => m.DefaultLayoutComponent),
    data: {
      title: 'Home'
    },
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./views/dashboard/routes').then((m) => m.routes)
      },
      {
        path: 'users',
        loadChildren: () => import('./views/users/routes').then((m) => m.routes)
      },
      {
        path: 'components',
        loadChildren: () => import('./views/components/routes').then((m) => m.routes)
      },
      {
        path: 'forms',
        loadChildren: () => import('./views/forms/routes').then((m) => m.routes)
      },
      {
        path: 'icons',
        loadChildren: () => import('./views/icons/routes').then((m) => m.routes)
      },
      {
        path: 'widgets',
        loadChildren: () => import('./views/widgets/routes').then((m) => m.routes)
      },
      {
        path: 'charts',
        loadChildren: () => import('./views/charts/routes').then((m) => m.routes)
      }
    ]
  },
  {
    path: 'error-pages',
    loadChildren: () => import('./views/error-pages/routes').then((m) => m.routes)
  },
  { path: '**', redirectTo: '' }
];
