import { Timestamp } from '@angular/fire/firestore';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    roles: string[];
    isTemporaryPassword: boolean;
    passwordChangedAt?: Date | Timestamp;
    createdAt: Date | Timestamp;
    isActive: boolean;
}
