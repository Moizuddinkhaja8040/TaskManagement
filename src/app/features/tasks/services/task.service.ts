import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  collectionData,
  DocumentReference,
  getDoc,
  or
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityService } from '../../activities/services/activity.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore = inject(Firestore);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private activityService = inject(ActivityService);
  private tasksCollection = collection(this.firestore, 'tasks');

  // Get all tasks for current user (owned or assigned)
  getUserTasks(): Observable<Task[]> {
    const user = this.authService.currentUserProfile();
    const userId = user?.uid;

    if (!userId) return new Observable(observer => observer.next([]));

    let constraints: any[] = [orderBy('createdAt', 'desc')];
    const isAdmin = user?.roles?.includes('admin');

    if (!isAdmin) {
      constraints = [
        or(
          where('userId', '==', userId),
          where('assignedUserIds', 'array-contains', userId)
        ),
        ...constraints
      ];
    }

    const q = query(this.tasksCollection, ...constraints);
    return collectionData(q, { idField: 'id' }) as Observable<Task[]>;
  }

  // Get tasks by status (owned or assigned)
  getTasksByStatus(status: string): Observable<Task[]> {
    const user = this.authService.currentUserProfile();
    const userId = user?.uid;

    if (!userId) return new Observable(observer => observer.next([]));

    let constraints: any[] = [
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    ];
    const isAdmin = user?.roles?.includes('admin');

    if (!isAdmin) {
      constraints = [
        or(
          where('userId', '==', userId),
          where('assignedUserIds', 'array-contains', userId)
        ),
        ...constraints
      ];
    }

    const q = query(this.tasksCollection, ...constraints);
    return collectionData(q, { idField: 'id' }) as Observable<Task[]>;
  }

  // Create a new task
  async createTask(task: Omit<Task, 'createdAt' | 'updatedAt' | 'userId'>): Promise<DocumentReference> {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) throw new Error('User not authenticated');

    const newTask = {
      ...task,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return addDoc(this.tasksCollection, newTask);
  }

  // Update a task
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const taskDoc = doc(this.firestore, 'tasks', taskId);

    // Get the old task data to compare changes
    const taskSnapshot = await getDoc(taskDoc);
    const oldTask = taskSnapshot.data() as Task;

    // Update the task
    await updateDoc(taskDoc, {
      ...updates,
      updatedAt: new Date()
    });

    // Generate unique updateId for this update operation
    const updateId = `${taskId}_${Date.now()}`;

    // Log activities for each changed field
    const activities = [];

    // Status change
    if (updates.status && oldTask.status !== updates.status) {
      activities.push({
        taskId,
        taskTitle: oldTask.title,
        changeType: 'status' as const,
        fieldName: 'Status',
        from: oldTask.status,
        to: updates.status,
        updateId
      });
    }

    // Title change
    if (updates.title && oldTask.title !== updates.title) {
      activities.push({
        taskId,
        taskTitle: oldTask.title,
        changeType: 'title' as const,
        fieldName: 'Title',
        from: oldTask.title,
        to: updates.title,
        updateId
      });
    }

    // Description change
    if (updates.description !== undefined && oldTask.description !== updates.description) {
      activities.push({
        taskId,
        taskTitle: oldTask.title,
        changeType: 'description' as const,
        fieldName: 'Description',
        from: oldTask.description || '(empty)',
        to: updates.description || '(empty)',
        updateId
      });
    }

    // Priority change
    if (updates.priority && oldTask.priority !== updates.priority) {
      activities.push({
        taskId,
        taskTitle: oldTask.title,
        changeType: 'priority' as const,
        fieldName: 'Priority',
        from: oldTask.priority,
        to: updates.priority,
        updateId
      });
    }

    // Due date change
    if (updates.dueDate) {
      const oldDate = oldTask.dueDate instanceof Date
        ? oldTask.dueDate
        : (oldTask.dueDate as any)?.toDate?.();
      const newDate = updates.dueDate instanceof Date
        ? updates.dueDate
        : (updates.dueDate as any)?.toDate?.();

      if (oldDate && newDate && oldDate.getTime() !== newDate.getTime()) {
        activities.push({
          taskId,
          taskTitle: oldTask.title,
          changeType: 'dueDate' as const,
          fieldName: 'Due Date',
          from: oldDate.toLocaleDateString(),
          to: newDate.toLocaleDateString(),
          updateId
        });
      }
    }

    // Log all activities
    for (const activity of activities) {
      await this.activityService.logActivity(activity);
    }
  }

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    const taskDoc = doc(this.firestore, 'tasks', taskId);
    return deleteDoc(taskDoc);
  }

  // File Upload
  async uploadFile(file: File, path: string): Promise<string> {
    const url = await this.supabaseService.uploadFile(file, path);
    if (!url) {
      throw new Error('Failed to upload file');
    }
    return url;
  }

  async deleteFile(path: string): Promise<void> {
    return this.supabaseService.deleteFile(path);
  }

  // Comments (Internal Notes)
  getComments(taskId: string): Observable<any[]> {
    const commentsRef = collection(this.firestore, `tasks/${taskId}/comments`);
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' });
  }

  async addComment(taskId: string, content: string): Promise<DocumentReference> {
    const userId = this.authService.currentUser()?.uid;
    const user = this.authService.currentUser();

    if (!userId) throw new Error('User not authenticated');

    const commentsRef = collection(this.firestore, `tasks/${taskId}/comments`);
    return addDoc(commentsRef, {
      content,
      userId,
      userName: user?.displayName || 'Unknown',
      userPhoto: user?.photoURL || null,
      createdAt: new Date()
    });
  }
}
