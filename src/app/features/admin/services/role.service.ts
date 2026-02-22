import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    collectionData,
    query,
    orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Role } from '../models/role.model';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private firestore = inject(Firestore);
    private rolesCollection = collection(this.firestore, 'roles');

    // Get all roles
    getRoles(): Observable<Role[]> {
        const q = query(this.rolesCollection, orderBy('name', 'asc'));
        return collectionData(q, { idField: 'id' }) as Observable<Role[]>;
    }

    // Get role by ID
    async getRoleById(id: string): Promise<Role | null> {
        const roleDoc = doc(this.firestore, 'roles', id);
        const snapshot = await getDoc(roleDoc);

        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as Role;
        }
        return null;
    }

    // Create role
    async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const newRole = {
            ...role,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await addDoc(this.rolesCollection, newRole);
        return docRef.id;
    }

    // Update role
    async updateRole(id: string, role: Partial<Role>): Promise<void> {
        const roleDoc = doc(this.firestore, 'roles', id);
        await updateDoc(roleDoc, {
            ...role,
            updatedAt: new Date()
        });
    }

    // Delete role
    async deleteRole(id: string): Promise<void> {
        const roleDoc = doc(this.firestore, 'roles', id);
        await deleteDoc(roleDoc);
    }
}
