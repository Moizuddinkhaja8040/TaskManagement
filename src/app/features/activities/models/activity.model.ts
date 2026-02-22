import { Timestamp } from '@angular/fire/firestore';

export type ActivityType = 'status' | 'title' | 'description' | 'priority' | 'dueDate';

export interface Activity {
    id?: string;
    taskId: string;
    taskTitle: string;
    changeType: ActivityType;
    fieldName: string;      // Display name of the field changed
    from: string;
    to: string;
    by: string;
    userId: string;
    updateId: string;       // Groups activities from the same update
    timestamp: Timestamp | Date;
}
