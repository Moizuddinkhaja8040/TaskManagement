import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RoleService } from '../../services/role.service';
import { Role } from '../../models/role.model';

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './role-form.component.html',
    styleUrl: './role-form.component.scss'
})
export class RoleFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private roleService = inject(RoleService);

    @Input() role: Role | undefined;
    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<void>();

    roleForm: FormGroup;
    isSubmitting = false;

    availablePermissions = [
        { id: 'manage_users', name: 'Manage Users', description: 'Create, edit, and deactivate user accounts' },
        { id: 'manage_roles', name: 'Manage Roles', description: 'Define roles and their permissions' },
        { id: 'view_all_tasks', name: 'View All Tasks', description: 'See tasks from all users' },
        { id: 'manage_all_tasks', name: 'Manage All Tasks', description: 'Edit or delete tasks from any user' },
        { id: 'view_activities', name: 'View Activities', description: 'Access the global activity tracker' },
        { id: 'view_own_tasks', name: 'View Own Tasks', description: 'Standard user access to own tasks' }
    ];

    constructor() {
        this.roleForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', Validators.required],
            permissions: [[] as string[], [Validators.required, Validators.minLength(1)]]
        });
    }

    ngOnInit(): void {
        if (this.role) {
            this.roleForm.patchValue({
                name: this.role.name,
                description: this.role.description,
                permissions: this.role.permissions || []
            });
        }
    }

    togglePermission(permId: string) {
        const currentPerms = this.roleForm.get('permissions')?.value as string[];
        if (currentPerms.includes(permId)) {
            this.roleForm.patchValue({
                permissions: currentPerms.filter(p => p !== permId)
            });
        } else {
            this.roleForm.patchValue({
                permissions: [...currentPerms, permId]
            });
        }
    }

    isPermissionSelected(permId: string): boolean {
        return (this.roleForm.get('permissions')?.value as string[]).includes(permId);
    }

    async onSubmit() {
        if (this.roleForm.invalid) {
            this.roleForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const roleData = this.roleForm.value;

        try {
            if (this.role?.id) {
                await this.roleService.updateRole(this.role.id, roleData);
            } else {
                await this.roleService.createRole(roleData);
            }
            this.saved.emit();
        } catch (error: any) {
            console.error('Error saving role:', error);
            alert('Failed to save role.');
        } finally {
            this.isSubmitting = false;
        }
    }
}
