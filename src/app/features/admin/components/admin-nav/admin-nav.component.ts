import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-admin-nav',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <ul class="nav nav-pills mb-4 gap-2">
      <li class="nav-item">
        <a class="nav-link" routerLink="/admin/users" routerLinkActive="active">
            <i class="bi bi-people me-2"></i>Users
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" routerLink="/admin/roles" routerLinkActive="active">
            <i class="bi bi-shield-lock me-2"></i>Roles
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" routerLink="/admin/reports" routerLinkActive="active">
            <i class="bi bi-graph-up me-2"></i>Reports
        </a>
      </li>
    </ul>
  `,
    styles: [`
    .nav-link {
        color: #6c757d;
        background-color: transparent;
        border: 1px solid transparent;
        transition: all 0.2s;
    }
    .nav-link:hover {
        background-color: #f8f9fa;
        color: #0d6efd;
    }
    .nav-link.active {
        background-color: #0d6efd;
        color: white;
    }
  `]
})
export class AdminNavComponent { }
