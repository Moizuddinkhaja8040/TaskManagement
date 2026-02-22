import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../services/role.service';
import { Role } from '../../models/role.model';
import { Observable } from 'rxjs';
import { RoleFormComponent } from '../role-form/role-form.component';
import { AdminNavComponent } from '../../components/admin-nav/admin-nav.component';

@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [CommonModule, RoleFormComponent, AdminNavComponent],
    templateUrl: './role-list.component.html',
    styleUrl: './role-list.component.scss'
})
export class RoleListComponent implements OnInit {
    private roleService = inject(RoleService);

    roles$: Observable<Role[]> = this.roleService.getRoles();
    showModal = false;
    selectedRole: Role | undefined;

    ngOnInit(): void { }

    openRoleForm(role?: Role) {
        this.selectedRole = role ? { ...role } : undefined;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.selectedRole = undefined;
    }

    async deleteRole(id: string) {
        if (confirm('Are you sure you want to delete this role?')) {
            try {
                await this.roleService.deleteRole(id);
            } catch (error: any) {
                console.error('Error deleting role:', error);
                alert('Failed to delete role.');
            }
        }
    }
}
