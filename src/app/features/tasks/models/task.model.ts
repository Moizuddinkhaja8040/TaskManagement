import { Timestamp } from '@angular/fire/firestore';

export interface Task {
    id?: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate: Timestamp | Date;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    userId: string;
    assignedUserIds?: string[];
    attachments?: { name: string, url: string, path: string }[];
}
