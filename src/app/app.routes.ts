import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'signup',
        loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
    },
    {
        path: 'change-password',
        loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent),
        canActivate: [authGuard]
    },
    {
        path: '',
        loadComponent: () => import('./shared/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'tasks',
                loadComponent: () => import('./features/tasks/task-list/task-list.component').then(m => m.TaskListComponent)
            },
            {
                path: 'activities',
                loadComponent: () => import('./features/activities/activity-tracker/activity-tracker.component').then(m => m.ActivityTrackerComponent)
            },
            {
                path: 'admin',
                canActivate: [roleGuard],
                data: { roles: ['admin'] },
                children: [
                    {
                        path: 'users',
                        loadComponent: () => import('./features/admin/user-management/user-list/user-list.component').then(m => m.UserListComponent)
                    },
                    {
                        path: 'roles',
                        loadComponent: () => import('./features/admin/role-management/role-list/role-list.component').then(m => m.RoleListComponent)
                    },
                    {
                        path: 'reports',
                        loadComponent: () => import('./features/admin/reporting/reporting.component').then(m => m.ReportingComponent)
                    }
                ]
            }
        ]
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];

