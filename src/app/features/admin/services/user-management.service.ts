import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    collectionData,
    query,
    orderBy
} from '@angular/fire/firestore';
import { Observable, map, from } from 'rxjs';
import { UserProfile } from '../models/user-profile.model';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UserManagementService {
    private firestore = inject(Firestore);
    private userProfilesCollection = collection(this.firestore, 'userProfiles');

    // Get all user profiles
    getAllUserProfiles(): Observable<UserProfile[]> {
        const q = query(this.userProfilesCollection, orderBy('email', 'asc'));
        return collectionData(q, { idField: 'uid' }) as Observable<UserProfile[]>;
    }

    // Get user profile by UID
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        const userDoc = doc(this.firestore, 'userProfiles', uid);
        const snapshot = await getDoc(userDoc);

        if (snapshot.exists()) {
            return snapshot.data() as UserProfile;
        }
        return null;
    }

    // Update user roles
    async updateUserRoles(uid: string, roles: string[]): Promise<void> {
        const userDoc = doc(this.firestore, 'userProfiles', uid);
        await updateDoc(userDoc, { roles });
    }

    // Update user profile
    async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
        const userDoc = doc(this.firestore, 'userProfiles', uid);
        await updateDoc(userDoc, updates);
    }

    // Deactivate user
    async deactivateUser(uid: string): Promise<void> {
        const userDoc = doc(this.firestore, 'userProfiles', uid);
        await updateDoc(userDoc, { isActive: false });
    }

    // Activate user
    async activateUser(uid: string): Promise<void> {
        const userDoc = doc(this.firestore, 'userProfiles', uid);
        await updateDoc(userDoc, { isActive: true });
    }

    // List users who are active and not admins
    getAssignableUsers(): Observable<UserProfile[]> {
        const q = query(this.userProfilesCollection, orderBy('displayName', 'asc'));
        return (collectionData(q, { idField: 'uid' }) as Observable<UserProfile[]>).pipe(
            map(users => users.filter(user => user.isActive && !user.roles.includes('admin')))
        );
    }

    // Create a new user with default password
    async createUser(email: string, displayName: string, roles: string[]): Promise<void> {
        // 1. Initialize a secondary Firebase App to create the user without logging out the admin
        const secondaryApp = initializeApp(environment.firebase, 'SecondaryApp');
        const secondaryAuth = getAuth(secondaryApp);

        try {
            // 2. Create the user in Authentication
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, 'Password');
            const user = userCredential.user;

            // 3. Update the user's profile (displayName)
            await updateProfile(user, { displayName });

            // 4. Create the UserProfile document in Firestore
            const newUserProfile: UserProfile = {
                uid: user.uid,
                email: email,
                displayName: displayName,
                roles: roles,
                isActive: true, // Default to active
                createdAt: new Date(),
                isTemporaryPassword: true
            };

            // manually using the firestore instance from the primary app to write to DB
            const userDoc = doc(this.firestore, 'userProfiles', user.uid);
            await setDoc(userDoc, newUserProfile);

            // 5. Sign out from the secondary app
            await signOut(secondaryAuth);

        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        } finally {
            // 6. Clean up the secondary app
            await deleteApp(secondaryApp);
        }
    }
}
