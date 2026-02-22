import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../models/activity.model';
import { Observable, map } from 'rxjs';

export interface ActivityGroup {
    updateId: string;
    taskTitle: string;
    activities: Activity[];
    timestamp: any;
    by: string;
    isExpanded: boolean;
}

@Component({
    selector: 'app-activity-tracker',
    imports: [CommonModule],
    templateUrl: './activity-tracker.component.html',
    styleUrl: './activity-tracker.component.scss'
})
export class ActivityTrackerComponent implements OnInit {
    private activityService = inject(ActivityService);

    activityGroups$!: Observable<ActivityGroup[]>;

    ngOnInit() {
        this.activityGroups$ = this.activityService.getUserActivities().pipe(
            map(activities => this.groupActivities(activities))
        );
    }

    // Group activities by updateId
    groupActivities(activities: Activity[]): ActivityGroup[] {
        const groupMap = new Map<string, ActivityGroup>();

        activities.forEach(activity => {
            if (!groupMap.has(activity.updateId)) {
                groupMap.set(activity.updateId, {
                    updateId: activity.updateId,
                    taskTitle: activity.taskTitle,
                    activities: [],
                    timestamp: activity.timestamp,
                    by: activity.by,
                    isExpanded: false
                });
            }
            groupMap.get(activity.updateId)!.activities.push(activity);
        });

        return Array.from(groupMap.values());
    }

    // Toggle accordion
    toggleAccordion(group: ActivityGroup) {
        group.isExpanded = !group.isExpanded;
    }

    // Format status for display
    formatStatus(status: string): string {
        return status.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    // Format priority for display
    formatPriority(priority: string): string {
        return priority.charAt(0).toUpperCase() + priority.slice(1);
    }

    // Format value based on change type
    formatValue(value: string, changeType: string): string {
        if (changeType === 'status') {
            return this.formatStatus(value);
        } else if (changeType === 'priority') {
            return this.formatPriority(value);
        }
        return value;
    }

    // Get badge class based on status
    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'todo':
                return 'bg-primary';
            case 'in-progress':
                return 'bg-warning text-dark';
            case 'completed':
                return 'bg-success';
            default:
                return 'bg-secondary';
        }
    }

    // Get badge class based on priority
    getPriorityBadgeClass(priority: string): string {
        switch (priority) {
            case 'low':
                return 'bg-info';
            case 'medium':
                return 'bg-warning text-dark';
            case 'high':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    }

    // Get badge class based on change type and value
    getBadgeClass(value: string, changeType: string): string {
        if (changeType === 'status') {
            return this.getStatusBadgeClass(value);
        } else if (changeType === 'priority') {
            return this.getPriorityBadgeClass(value);
        }
        return 'bg-secondary';
    }

    // Check if value should be displayed as badge
    shouldShowBadge(changeType: string): boolean {
        return changeType === 'status' || changeType === 'priority';
    }

    // Format timestamp
    formatTimestamp(timestamp: any): string {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
}
