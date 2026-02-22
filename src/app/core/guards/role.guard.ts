import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();

    if (!user) {
        router.navigate(['/login']);
        return false;
    }

    // Get required roles from route data
    const requiredRoles = route.data['roles'] as string[];

    if (!requiredRoles || requiredRoles.length === 0) {
        return true;
    }

    // Get user roles
    const userRoles = await authService.getUserRoles(user.uid);

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
        router.navigate(['/dashboard']);
        return false;
    }

    return true;
};
