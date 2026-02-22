import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  currentUserProfile = this.authService.currentUserProfile;
  sidebarCollapsed = false;
  dropdownOpen = false;
  isAdmin = signal(false);

  constructor() {
    // Check roles when profile changes
    this.authService.user$.subscribe(async user => {
      if (user) {
        const roles = await this.authService.getUserRoles(user.uid);
        this.isAdmin.set(roles.includes('admin'));
      } else {
        this.isAdmin.set(false);
      }
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.dropdown');

    // Close dropdown if clicking outside
    if (!dropdown && this.dropdownOpen) {
      this.dropdownOpen = false;
    }
  }

  logout() {
    this.dropdownOpen = false;
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
