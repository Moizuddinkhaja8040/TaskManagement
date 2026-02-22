import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../services/task.service';
import { Task } from '../models/task.model';
import { UserManagementService } from '../../admin/services/user-management.service';
import { UserProfile } from '../../admin/models/user-profile.model';
import { AuthService } from '../../../core/services/auth.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private userService = inject(UserManagementService); // Renamed for consistency with diff
  private authService = inject(AuthService); // Inject AuthService

  @Input() task: Task | null = null;
  @Output() taskSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  taskForm!: FormGroup;
  loading = false;
  errorMessage = '';
  assignableUsers$: Observable<UserProfile[]> | null = null;
  selectedFiles: File[] = [];
  existingAttachments: { name: string, url: string, path: string }[] = [];

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      status: ['todo', [Validators.required]],
      priority: ['medium', [Validators.required]],
      dueDate: ['', [Validators.required]],
      assignedUserIds: [[] as string[]],
      attachments: [[]] // Added attachments form control
    });
    this.assignableUsers$ = this.userService.getAssignableUsers(); // Initialize here
  }

  ngOnInit() {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description,
        status: this.task.status,
        priority: this.task.priority,
        dueDate: this.task?.dueDate ? this.formatDate(this.task.dueDate) : '', // Use new formatDate
        assignedUserIds: this.task?.assignedUserIds || []
      });

      if (this.task?.attachments) {
        this.existingAttachments = [...this.task.attachments];
      }
    }
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  toggleUserAssignment(userId: string) {
    const currentAssignments = this.taskForm.get('assignedUserIds')?.value as string[];
    if (currentAssignments.includes(userId)) {
      this.taskForm.patchValue({
        assignedUserIds: currentAssignments.filter(id => id !== userId)
      });
    } else {
      this.taskForm.patchValue({
        assignedUserIds: [...currentAssignments, userId]
      });
    }
  }

  isUserAssigned(userId: string): boolean {
    return (this.taskForm.get('assignedUserIds')?.value as string[]).includes(userId);
  }

  async onSubmit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const formValue = this.taskForm.value;
      const taskData: any = {
        title: formValue.title,
        description: formValue.description,
        status: formValue.status,
        priority: formValue.priority,
        dueDate: new Date(formValue.dueDate),
        assignedUserIds: formValue.assignedUserIds,
        // Keep existing attachments, new ones will be added after upload
        attachments: this.existingAttachments
      };

      // Upload new files
      if (this.selectedFiles.length > 0) {
        const newAttachments: { name: string, url: string, path: string }[] = [];

        for (const file of this.selectedFiles) {
          const path = `${Date.now()}_${file.name}`;
          const url = await this.taskService.uploadFile(file, path);
          newAttachments.push({ name: file.name, url, path });
        }

        taskData.attachments = [...(taskData.attachments || []), ...newAttachments];
      }

      if (this.task && this.task.id) {
        await this.taskService.updateTask(this.task.id, taskData);
      } else {
        await this.taskService.createTask(taskData);
      }
      this.taskSaved.emit();
    } catch (error: any) {
      console.error('Error saving task:', error);
      this.errorMessage = error.message || 'Failed to save task';
    } finally {
      this.loading = false;
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.selectedFiles.push(files[i]);
      }
    }
  }

  removeSelectedFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  async removeExistingAttachment(index: number) {
    // Ideally, we should ask for confirmation and delete from storage
    // For now, let's just remove from the list and it will be updated on save
    // To truly delete from storage, we'd need to do it here or track deleted items

    // Simple approach: remove from array, update task on save.
    // Storage cleanup can be a background process or immediate if we want.
    // Let's keep it simple: just remove from UI list for now.

    this.existingAttachments.splice(index, 1);
  }

  formatDate(date: any): string {
    let d: Date;
    if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date); // Attempt to parse if it's a string
    }
    return this.formatDateForInput(d);
  }

  cancel() {
    this.cancelled.emit();
  }
}
