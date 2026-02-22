import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../services/task.service';
import { Task } from '../models/task.model';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskDetailComponent } from '../task-detail/task-detail.component';
import { UserManagementService } from '../../admin/services/user-management.service';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule, RouterModule, TaskFormComponent, TaskDetailComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private userManager = inject(UserManagementService);

  allTasks: Task[] = [];
  filteredTasks: Task[] = [];
  userMap: Map<string, string> = new Map();
  activeFilter: 'all' | 'todo' | 'in-progress' | 'completed' = 'all';
  viewMode: 'cards' | 'table' = 'cards';
  showTaskForm = false;
  editingTask: Task | null = null;
  selectedTask: Task | null = null;

  ngOnInit() {
    this.loadTasks();
    this.loadUsers();
  }

  loadUsers() {
    this.userManager.getAllUserProfiles().subscribe(users => {
      this.userMap.clear();
      users.forEach(user => {
        this.userMap.set(user.uid, user.displayName);
      });
    });
  }

  loadTasks() {
    this.taskService.getUserTasks().subscribe(tasks => {
      this.allTasks = tasks;
      this.applyFilter();
    });
  }

  applyFilter() {
    if (this.activeFilter === 'all') {
      this.filteredTasks = this.allTasks;
    } else {
      this.filteredTasks = this.allTasks.filter(task => task.status === this.activeFilter);
    }
  }

  setFilter(filter: 'all' | 'todo' | 'in-progress' | 'completed') {
    this.activeFilter = filter;
    this.applyFilter();
  }

  setViewMode(mode: 'cards' | 'table') {
    this.viewMode = mode;
  }

  openTaskForm(task?: Task) {
    this.editingTask = task || null;
    this.showTaskForm = true;
  }

  closeTaskForm() {
    this.showTaskForm = false;
    this.editingTask = null;
  }

  onTaskSaved() {
    this.closeTaskForm();
    this.loadTasks();
    if (this.selectedTask) {
      // Refresh selected task if it was being edited
      // We can find it in the reloaded list or just close detail
      this.selectedTask = null; // Close detail view on save for simplicity, or re-fetch
    }
  }

  openTaskDetail(task: Task) {
    this.selectedTask = task;
  }

  closeTaskDetail() {
    this.selectedTask = null;
  }

  async deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await this.taskService.deleteTask(taskId);
        this.loadTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
      }
    }
  }

  async updateTaskStatus(taskId: string, status: Task['status']) {
    try {
      await this.taskService.updateTask(taskId, { status });
      this.loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
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


  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'in-progress': return 'bg-info';
      case 'todo': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }

  getTaskDate(date: any): Date {
    if (date && typeof date.toDate === 'function') {
      return date.toDate();
    }
    return date instanceof Date ? date : new Date();
  }

  getAssignedUserNames(userIds?: string[]): string {
    if (!userIds || userIds.length === 0) return 'Unassigned';
    return userIds
      .map(id => this.userMap.get(id) || 'Unknown')
      .join(', ');
  }
}
