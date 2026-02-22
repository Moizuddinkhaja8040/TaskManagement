import { Timestamp } from '@angular/fire/firestore';

export interface Role {
    id?: string;
    name: string;
    description: string;
    permissions: string[];
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}
