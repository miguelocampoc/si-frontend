import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: '/', pathMatch: 'full' },
      {
        path: 'login',
        redirectTo: '/'
      },
      {
        path: 'forgot-password',
        redirectTo: '/forgot-password'
      },
      {
        path: 'reset-password/:token',
        redirectTo: '/reset-password/:token'
      },
      {
        path: 'reset-password',
        redirectTo: '/reset-password'
      }
    ]
  }
];
