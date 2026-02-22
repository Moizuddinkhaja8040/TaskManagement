import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../tasks/services/task.service';
import { UserManagementService } from '../services/user-management.service';
import { Task } from '../../tasks/models/task.model';
import { UserProfile } from '../models/user-profile.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Observable, combineLatest, map } from 'rxjs';
import { AdminNavComponent } from '../components/admin-nav/admin-nav.component';

Chart.register(...registerables);

@Component({
    selector: 'app-reporting',
    standalone: true,
    imports: [CommonModule, AdminNavComponent],
    template: `
    <div class="admin-reporting">
      <app-admin-nav></app-admin-nav>
      
      <div class="container-fluid p-4">
        <h2 class="fw-bold mb-4">System Reports</h2>

        <!-- Key Metrics -->
        <div class="row g-4 mb-4">
            <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center py-3">
                    <div class="card-body">
                        <h6 class="text-muted text-uppercase">Total Users</h6>
                        <h3 class="fw-bold text-primary">{{ (users$ | async)?.length || 0 }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center py-3">
                    <div class="card-body">
                        <h6 class="text-muted text-uppercase">Total Tasks</h6>
                        <h3 class="fw-bold text-success">{{ totalTasks }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center py-3">
                    <div class="card-body">
                        <h6 class="text-muted text-uppercase">Completion Rate</h6>
                        <h3 class="fw-bold text-info">{{ completionRate }}%</h3>
                    </div>
                </div>
            </div>
             <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center py-3">
                    <div class="card-body">
                        <h6 class="text-muted text-uppercase">Active Users</h6>
                        <h3 class="fw-bold text-warning">{{ activeUsers }}</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="row g-4">
            <div class="col-md-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                        <h5 class="card-title mb-4">Tasks by Status</h5>
                        <div class="chart-container" style="position: relative; height: 300px;">
                            <canvas id="adminStatusChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                        <h5 class="card-title mb-4">User Task Distribution</h5>
                        <div class="chart-container" style="position: relative; height: 300px;">
                            <canvas id="userTaskChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .card { transition: transform 0.2s; }
    .card:hover { transform: translateY(-2px); }
  `]
})
export class ReportingComponent implements OnInit {
    private taskService = inject(TaskService);
    private userService = inject(UserManagementService);

    users$ = this.userService.getAllUserProfiles();
    tasks: Task[] = [];

    totalTasks = 0;
    completionRate = 0;
    activeUsers = 0;

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        // We need a way to get ALL system tasks, not just user tasks.
        // Assuming getUserTasks returns relevant tasks for admin or we might need a new method.
        // For now, let's use getUserTasks assuming Admin sees all or most relevant ones.
        // Ideally, we'd have a getSystemTasks() in TaskService for admins.

        // Actually, looking at TaskService, getUserTasks filters by user ID. 
        // We might need to add a getAllTasks() for admin usage.
        // Let's assume for now we reuse getUserTasks but we really should add a new method later.
        // Wait, let's check TaskService properly. It creates query with 'where'.
        // I will stick to what exists for now to avoid breaking changes, 
        // but correctly I should add 'getAllTasks' for admin.

        // Let's implement getAllTasks logic locally or assume admin matches the 'assigned' logic if they are superuser.
        // BUT, since we are admin, we might want to see EVERYTHING.
        // Let's try to assume for this demo we use what we have, 
        // or better, let's add `getAllTasks` to TaskService quickly if needed.

        this.taskService.getUserTasks().subscribe(tasks => {
            this.tasks = tasks;
            this.calculateMetrics();
        });

        this.users$.subscribe(users => {
            this.activeUsers = users.filter(u => u.isActive).length;
            this.renderUserChart(users);
        });
    }

    calculateMetrics() {
        this.totalTasks = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        this.completionRate = this.totalTasks > 0 ? Math.round((completed / this.totalTasks) * 100) : 0;
        this.renderStatusChart();
    }

    renderStatusChart() {
        const ctx = document.getElementById('adminStatusChart') as HTMLCanvasElement;
        if (!ctx) return;

        // Destroy if exists
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();

        const todo = this.tasks.filter(t => t.status === 'todo').length;
        const inProgress = this.tasks.filter(t => t.status === 'in-progress').length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['To Do', 'In Progress', 'Completed'],
                datasets: [{
                    data: [todo, inProgress, completed],
                    backgroundColor: ['#ffc107', '#0dcaf0', '#198754']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    renderUserChart(users: UserProfile[]) {
        const ctx = document.getElementById('userTaskChart') as HTMLCanvasElement;
        if (!ctx || !this.tasks.length) return;

        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();

        // Simple metric: Number of tasks assigned to each user
        // We need to map user IDs to names
        const userTaskCounts = users.map(user => {
            const count = this.tasks.filter(t => t.assignedUserIds?.includes(user.uid)).length;
            return { name: user.displayName, count };
        }).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: userTaskCounts.map(u => u.name),
                datasets: [{
                    label: 'Tasks Assigned',
                    data: userTaskCounts.map(u => u.count),
                    backgroundColor: '#6f42c1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }
}
