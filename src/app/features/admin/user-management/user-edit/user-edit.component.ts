import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserManagementService } from '../../services/user-management.service';
import { RoleService } from '../../services/role.service';
import { UserProfile } from '../../models/user-profile.model';
import { Role } from '../../models/role.model';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-user-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './user-edit.component.html',
    styleUrl: './user-edit.component.scss'
})
export class UserEditComponent implements OnInit {
    private fb = inject(FormBuilder);
    private userManager = inject(UserManagementService);
    private roleService = inject(RoleService);

    @Input() user: UserProfile | undefined;
    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<void>();

    userForm: FormGroup;
    roles$: Observable<Role[]> = this.roleService.getRoles();
    isSubmitting = false;

    constructor() {
        this.userForm = this.fb.group({
            displayName: ['', Validators.required],
            roles: [[] as string[], [Validators.required, Validators.minLength(1)]]
        });
    }

    ngOnInit(): void {
        if (this.user) {
            this.userForm.patchValue({
                displayName: this.user.displayName,
                roles: this.user.roles || []
            });
        }
    }

    toggleRole(roleId: string) {
        const currentRoles = this.userForm.get('roles')?.value as string[];
        if (currentRoles.includes(roleId)) {
            this.userForm.patchValue({
                roles: currentRoles.filter(r => r !== roleId)
            });
        } else {
            this.userForm.patchValue({
                roles: [...currentRoles, roleId]
            });
        }
    }

    isRoleSelected(roleId: string): boolean {
        return (this.userForm.get('roles')?.value as string[]).includes(roleId);
    }

    async onSubmit() {
        if (this.userForm.invalid || !this.user) {
            this.userForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const { displayName, roles } = this.userForm.value;

        try {
            await this.userManager.updateUserProfile(this.user.uid, { displayName, roles });
            this.saved.emit();
        } catch (error: any) {
            console.error('Error updating user profile:', error);
            alert('Failed to update user profile.');
        } finally {
            this.isSubmitting = false;
        }
    }
}
