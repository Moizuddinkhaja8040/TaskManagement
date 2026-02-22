import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-change-password',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './change-password.component.html',
    styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    passwordForm: FormGroup;
    errorMessage = '';
    isSubmitting = false;
    showPassword = false;
    showConfirmPassword = false;

    constructor() {
        this.passwordForm = this.fb.group({
            newPassword: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/)
            ]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    // Custom validator to check if passwords match
    passwordMatchValidator(form: FormGroup) {
        const newPassword = form.get('newPassword')?.value;
        const confirmPassword = form.get('confirmPassword')?.value;
        return newPassword === confirmPassword ? null : { passwordMismatch: true };
    }

    // Get password strength
    getPasswordStrength(): number {
        const password = this.passwordForm.get('newPassword')?.value || '';
        let strength = 0;

        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 10;
        if (/[a-z]/.test(password)) strength += 20;
        if (/[A-Z]/.test(password)) strength += 20;
        if (/\d/.test(password)) strength += 15;
        if (/[!@#$%^&*]/.test(password)) strength += 15;

        return Math.min(strength, 100);
    }

    // Get strength label
    getStrengthLabel(): string {
        const strength = this.getPasswordStrength();
        if (strength < 40) return 'Weak';
        if (strength < 70) return 'Medium';
        return 'Strong';
    }

    // Get strength color
    getStrengthColor(): string {
        const strength = this.getPasswordStrength();
        if (strength < 40) return 'danger';
        if (strength < 70) return 'warning';
        return 'success';
    }

    // Check individual requirements
    hasMinLength(): boolean {
        return (this.passwordForm.get('newPassword')?.value || '').length >= 8;
    }

    hasUpperCase(): boolean {
        return /[A-Z]/.test(this.passwordForm.get('newPassword')?.value || '');
    }

    hasLowerCase(): boolean {
        return /[a-z]/.test(this.passwordForm.get('newPassword')?.value || '');
    }

    hasNumber(): boolean {
        return /\d/.test(this.passwordForm.get('newPassword')?.value || '');
    }

    hasSpecialChar(): boolean {
        return /[!@#$%^&*]/.test(this.passwordForm.get('newPassword')?.value || '');
    }

    // Toggle password visibility
    togglePasswordVisibility(field: 'new' | 'confirm') {
        if (field === 'new') {
            this.showPassword = !this.showPassword;
        } else {
            this.showConfirmPassword = !this.showConfirmPassword;
        }
    }

    // Submit form
    async onSubmit() {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = '';

        try {
            const newPassword = this.passwordForm.get('newPassword')?.value;
            await this.authService.changePassword(newPassword);

            // Navigate to dashboard after successful password change
            this.router.navigate(['/dashboard']);
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to change password. Please try again.';
            this.isSubmitting = false;
        }
    }
}
