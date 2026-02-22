import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    collectionData
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Activity } from '../models/activity.model';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class ActivityService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private activitiesCollection = collection(this.firestore, 'activities');

    // Log a new activity
    async logActivity(activity: Omit<Activity, 'timestamp' | 'userId' | 'by'> & { changeType?: string; fieldName?: string }): Promise<void> {
        const user = this.authService.currentUser();
        if (!user) return;

        const profile = this.authService.currentUserProfile();
        const newActivity: Omit<Activity, 'id'> = {
            ...activity,
            by: profile?.displayName || user.email || 'Unknown',
            userId: user.uid,
            timestamp: new Date()
        };

        await addDoc(this.activitiesCollection, newActivity);
    }

    // Get all activities for current user
    getUserActivities(): Observable<Activity[]> {
        const user = this.authService.currentUserProfile();
        const userId = user?.uid;

        if (!userId) return new Observable(observer => observer.next([]));

        let constraints: any[] = [orderBy('timestamp', 'desc')];
        const isAdmin = user?.roles?.includes('admin');

        if (!isAdmin) {
            constraints = [
                where('userId', '==', userId),
                ...constraints
            ];
        }

        const q = query(this.activitiesCollection, ...constraints);
        return collectionData(q, { idField: 'id' }) as Observable<Activity[]>;
    }

    // Get activities for a specific task
    getTaskActivities(taskId: string): Observable<Activity[]> {
        const userId = this.authService.currentUser()?.uid;
        if (!userId) return new Observable(observer => observer.next([]));

        const q = query(
            this.activitiesCollection,
            where('userId', '==', userId),
            where('taskId', '==', taskId),
            orderBy('timestamp', 'desc')
        );

        return collectionData(q, { idField: 'id' }) as Observable<Activity[]>;
    }
}
