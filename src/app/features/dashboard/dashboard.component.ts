import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TaskService } from '../tasks/services/task.service';
import { Task } from '../tasks/models/task.model';
import { AuthService } from '../../core/services/auth.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private taskService = inject(TaskService);
  private router = inject(Router);
  public authService = inject(AuthService); // Public for template access

  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  activeFilter: 'all' | 'todo' | 'in-progress' | 'completed' = 'all';
  stats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0
  };

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getUserTasks().subscribe(tasks => {
      this.tasks = tasks;
      this.applyFilter();
      this.calculateStats();
      this.renderCharts();
    });
  }

  calculateStats() {
    this.stats.total = this.tasks.length;
    this.stats.completed = this.tasks.filter(t => t.status === 'completed').length;
    this.stats.inProgress = this.tasks.filter(t => t.status === 'in-progress').length;
    this.stats.todo = this.tasks.filter(t => t.status === 'todo').length;
  }

  renderCharts() {
    this.renderStatusChart();
    this.renderPriorityChart();
  }

  renderStatusChart() {
    const ctx = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    // Check if we have data to display
    if (this.stats.total === 0) {
      // Optional: Render an empty state or just return
      return;
    }

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: ['To Do', 'In Progress', 'Completed'],
        datasets: [{
          data: [this.stats.todo, this.stats.inProgress, this.stats.completed],
          backgroundColor: [
            '#ffc107',
            '#0dcaf0',
            '#198754'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    new Chart(ctx, config);
  }

  renderPriorityChart() {
    const ctx = document.getElementById('priorityChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    // Check if we have data
    if (this.stats.total === 0) return;

    const lowPriority = this.tasks.filter(t => t.priority === 'low').length;
    const mediumPriority = this.tasks.filter(t => t.priority === 'medium').length;
    const highPriority = this.tasks.filter(t => t.priority === 'high').length;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Low', 'Medium', 'High'],
        datasets: [{
          label: 'Tasks by Priority',
          data: [lowPriority, mediumPriority, highPriority],
          backgroundColor: [
            '#198754',
            '#ffc107',
            '#dc3545'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    };

    new Chart(ctx, config);
  }

  setFilter(filter: 'all' | 'todo' | 'in-progress' | 'completed') {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    if (this.activeFilter === 'all') {
      this.filteredTasks = this.tasks;
    } else {
      this.filteredTasks = this.tasks.filter(task => task.status === this.activeFilter);
    }
  }

  getRecentTasks(): Task[] {
    return this.filteredTasks.slice(0, 5);
  }

  async deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await this.taskService.deleteTask(taskId);
        // Reload tasks after deletion
        this.loadTasks(); // Note: Subscription in loadTasks handles updates well, but re-subscribing might be redundant if using async pipe or behavior subject. 
        // Better: userTasks$ observable pattern. But sticking to existing logic for minimal refactor.
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  }

  getTaskDate(date: any): Date {
    if (date && typeof date.toDate === 'function') {
      return date.toDate();
    }
    return date instanceof Date ? date : new Date();
  }

  navigateToTasks() {
    this.router.navigate(['/tasks']);
  }

  navigateToActivities() {
    this.router.navigate(['/activities']);
  }
}
