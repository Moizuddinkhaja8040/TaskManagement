import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Task } from '../models/task.model';
import { TaskService } from '../services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-task-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ task?.title }}</h5>
      <button type="button" class="btn-close" (click)="close()" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <div class="row">
        <!-- Main Details -->
        <div class="col-md-8">
          <div class="mb-4">
            <h6 class="text-muted small text-uppercase">Description</h6>
            <p class="mb-0">{{ task?.description }}</p>
          </div>

          <!-- Attachments -->
          <div class="mb-4">
            <h6 class="text-muted small text-uppercase mb-2">Attachments</h6>
            @if (task?.attachments?.length) {
              <div class="list-group list-group-flush">
                @for (file of task?.attachments; track file.path) {
                  <a [href]="file.url" target="_blank" class="list-group-item list-group-item-action d-flex align-items-center px-0 py-2 border-0">
                    <i class="bi bi-file-earmark-text fs-4 me-3 text-primary"></i>
                    <div>
                      <div class="fw-medium">{{ file.name }}</div>
                      <small class="text-muted">Click to view/download</small>
                    </div>
                  </a>
                }
              </div>
            } @else {
              <p class="text-muted small fst-italic">No attachments.</p>
            }
          </div>

          <!-- Comments / Internal Notes -->
          <div class="mb-4">
             <h6 class="text-muted small text-uppercase mb-3">Internal Notes</h6>
             
             <!-- Comment List -->
             <div class="comments-list mb-3" style="max-height: 300px; overflow-y: auto;">
                @for (comment of comments$ | async; track comment.id) {
                    <div class="d-flex mb-3">
                        <div class="flex-shrink-0">
                           @if (comment.userPhoto) {
                             <img [src]="comment.userPhoto" class="rounded-circle" width="32" height="32" alt="...">
                           } @else {
                             <div class="avatar-sm bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                               {{ comment.userName.charAt(0).toUpperCase() }}
                             </div>
                           }
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <div class="bg-light p-2 rounded">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="fw-bold small">{{ comment.userName }}</span>
                                    <small class="text-muted" style="font-size: 0.75rem;">
                                      {{ comment.createdAt?.toDate() | date:'short' }}
                                    </small>
                                </div>
                                <p class="mb-0 small">{{ comment.content }}</p>
                            </div>
                        </div>
                    </div>
                } @empty {
                    <p class="text-center text-muted small py-3">No notes yet.</p>
                }
             </div>

             <!-- Add Comment Form -->
             <form [formGroup]="commentForm" (ngSubmit)="addComment()">
                <div class="input-group">
                    <input type="text" class="form-control" placeholder="Add an internal note..." formControlName="content">
                    <button class="btn btn-outline-primary" type="submit" [disabled]="commentForm.invalid || submittingComment">
                        <i class="bi bi-send"></i>
                    </button>
                </div>
             </form>
          </div>
        </div>

        <!-- Sidebar Details -->
        <div class="col-md-4 border-start">
             <div class="mb-3">
                <small class="text-muted d-block uppercase mb-1">Status</small>
                <span class="badge" [ngClass]="getStatusClass(task?.status || '')">{{ task?.status }}</span>
             </div>
             <div class="mb-3">
                <small class="text-muted d-block uppercase mb-1">Priority</small>
                <span class="badge" [ngClass]="getPriorityClass(task?.priority || '')">{{ task?.priority }}</span>
             </div>
             <div class="mb-3">
                <small class="text-muted d-block uppercase mb-1">Due Date</small>
                <div>{{ getTaskDate(task?.dueDate) | date:'mediumDate' }}</div>
                <small class="text-muted">{{ getTaskDate(task?.dueDate) | date:'shortTime' }}</small>
             </div>
              <div class="mb-3">
                <small class="text-muted d-block uppercase mb-1">Assigned To</small>
                 <!-- In a real app we would resolve user IDs to names, for now just showing count or logic needed -->
                <div>{{ task?.assignedUserIds?.length || 0 }} Assignees</div>
             </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-primary" (click)="edit()">Edit Task</button>
        <button type="button" class="btn btn-secondary" (click)="close()">Close</button>
    </div>
  `,
    styles: [`
    .avatar-sm { font-size: 0.8rem; }
  `]
})
export class TaskDetailComponent implements OnInit {
    @Input() task: Task | null = null;
    @Output() closeDetail = new EventEmitter<void>();
    @Output() editTask = new EventEmitter<void>();

    private taskService = inject(TaskService);
    private fb = inject(FormBuilder);

    comments$: Observable<any[]> | null = null;
    commentForm: FormGroup;
    submittingComment = false;

    constructor() {
        this.commentForm = this.fb.group({
            content: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        if (this.task && this.task.id) {
            this.comments$ = this.taskService.getComments(this.task.id);
        }
    }

    async addComment() {
        if (this.commentForm.valid && this.task?.id) {
            this.submittingComment = true;
            try {
                await this.taskService.addComment(this.task.id, this.commentForm.value.content);
                this.commentForm.reset();
            } catch (error) {
                console.error('Error adding comment:', error);
            } finally {
                this.submittingComment = false;
            }
        }
    }

    close() {
        this.closeDetail.emit();
    }

    edit() {
        this.editTask.emit();
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'completed': return 'bg-success';
            case 'in-progress': return 'bg-info';
            case 'todo': return 'bg-warning';
            default: return 'bg-secondary';
        }
    }

    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'high': return 'bg-danger';
            case 'medium': return 'bg-warning';
            case 'low': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    getTaskDate(date: any): Date {
        if (date && typeof date.toDate === 'function') {
            return date.toDate();
        }
        return date instanceof Date ? date : new Date();
    }
}
