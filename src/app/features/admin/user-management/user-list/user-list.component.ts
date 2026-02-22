import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManagementService } from '../../services/user-management.service';
import { UserProfile } from '../../models/user-profile.model';
import { Observable } from 'rxjs';
import { UserEditComponent } from '../user-edit/user-edit.component';
import { UserCreateComponent } from '../user-create/user-create.component';
import { AdminNavComponent } from '../../components/admin-nav/admin-nav.component';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, UserEditComponent, UserCreateComponent, AdminNavComponent],
    templateUrl: './user-list.component.html',
    styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
    private userManager = inject(UserManagementService);

    users$: Observable<UserProfile[]> = this.userManager.getAllUserProfiles();
    showModal = false;
    showCreateModal = false;
    selectedUser: UserProfile | undefined;

    ngOnInit(): void { }

    openEditUser(user: UserProfile) {
        this.selectedUser = { ...user };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.selectedUser = undefined;
    }

    openCreateUser() {
        this.showCreateModal = true;
    }

    closeCreateModal() {
        this.showCreateModal = false;
    }

    async toggleUserStatus(user: UserProfile) {
        try {
            if (user.isActive) {
                await this.userManager.deactivateUser(user.uid);
            } else {
                await this.userManager.activateUser(user.uid);
            }
        } catch (error: any) {
            console.error('Error toggling user status:', error);
            alert('Failed to update user status.');
        }
    }

    getRoleBadgeClass(role: string): string {
        switch (role.toLowerCase()) {
            case 'admin': return 'bg-danger-subtle text-danger border-danger-subtle';
            case 'manager': return 'bg-warning-subtle text-warning border-warning-subtle';
            case 'viewer': return 'bg-primary-subtle text-primary border-primary-subtle';
            default: return 'bg-secondary-subtle text-secondary border-secondary-subtle';
        }
    }
}
