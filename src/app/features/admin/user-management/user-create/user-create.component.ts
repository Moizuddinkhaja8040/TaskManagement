import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserManagementService } from '../../services/user-management.service';
import { RoleService } from '../../services/role.service';
import { Role } from '../../models/role.model';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-user-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './user-create.component.html',
    styleUrl: './user-create.component.scss'
})
export class UserCreateComponent {
    private fb = inject(FormBuilder);
    private userManager = inject(UserManagementService);
    private roleService = inject(RoleService);

    @Output() close = new EventEmitter<void>();
    @Output() created = new EventEmitter<void>();

    createUserForm: FormGroup;
    roles$: Observable<Role[]> = this.roleService.getRoles();
    isSubmitting = false;

    constructor() {
        this.createUserForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            displayName: ['', Validators.required],
            roles: [[] as string[], [Validators.required, Validators.minLength(1)]]
        });
    }

    toggleRole(roleId: string) {
        const currentRoles = this.createUserForm.get('roles')?.value as string[];
        if (currentRoles.includes(roleId)) {
            this.createUserForm.patchValue({
                roles: currentRoles.filter(r => r !== roleId)
            });
        } else {
            this.createUserForm.patchValue({
                roles: [...currentRoles, roleId]
            });
        }
    }

    isRoleSelected(roleId: string): boolean {
        return (this.createUserForm.get('roles')?.value as string[]).includes(roleId);
    }

    async onSubmit() {
        if (this.createUserForm.invalid) {
            this.createUserForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const { email, displayName, roles } = this.createUserForm.value;

        try {
            await this.userManager.createUser(email, displayName, roles);
            this.created.emit();
            this.createUserForm.reset();
        } catch (error: any) {
            console.error('Error creating user:', error);
            // Handle specific firebase auth errors if needed
            let errorMessage = 'Failed to create user.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'The email address is already in use by another account.';
            }
            alert(errorMessage);
        } finally {
            this.isSubmitting = false;
        }
    }
}
