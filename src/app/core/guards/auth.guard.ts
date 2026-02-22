import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    switchMap(user => {
      if (!user) {
        router.navigate(['/login']);
        return of(false);
      }

      // Skip temp password check for change-password route
      if (state.url === '/change-password') {
        return of(true);
      }

      // Check if user has temporary password
      return from(authService.checkTemporaryPassword()).pipe(
        map(hasTempPassword => {
          if (hasTempPassword) {
            router.navigate(['/change-password']);
            return false;
          }
          return true;
        })
      );
    })
  );
};
