import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  user,
  User
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc, setDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { UserProfile } from '../../features/admin/models/user-profile.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // Current user as observable
  user$ = user(this.auth);

  // Current user as signal
  currentUser = signal<User | null>(null);
  currentUserProfile = signal<UserProfile | null>(null);

  constructor() {
    // Sync user state to signal
    this.user$.subscribe(async user => {
      this.currentUser.set(user);
      if (user) {
        let profile = await this.getUserProfile(user.uid);

        // Auto-recover admin profile if missing
        if (!profile && user.email === 'admin@taskmanager.com') {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: 'Admin User',
            roles: ['admin'],
            isActive: true,
            isTemporaryPassword: false,
            createdAt: new Date()
          };
          try {
            await setDoc(doc(this.firestore, 'userProfiles', user.uid), newProfile);
            profile = newProfile;
            console.log('RECOVERY: Admin profile auto-created.');
          } catch (err) {
            console.error('RECOVERY FAILED: Could not create admin profile.', err);
          }
        }

        this.currentUserProfile.set(profile);
      } else {
        this.currentUserProfile.set(null);
      }
    });
  }

  // Sign up with email and password
  signUp(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  // Login with email and password
  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  // Logout
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDoc = doc(this.firestore, 'userProfiles', uid);
    const snapshot = await getDoc(userDoc);

    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }
    return null;
  }

  // Check if current user has temporary password
  async checkTemporaryPassword(): Promise<boolean> {
    const user = this.currentUser();
    if (!user) return false;

    const profile = await this.getUserProfile(user.uid);
    return profile?.isTemporaryPassword || false;
  }

  // Change password
  async changePassword(newPassword: string): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('No user logged in');

    await updatePassword(user, newPassword);
    await this.updatePasswordStatus(user.uid);
  }

  // Update password status in Firestore
  private async updatePasswordStatus(uid: string): Promise<void> {
    const userDoc = doc(this.firestore, 'userProfiles', uid);
    await updateDoc(userDoc, {
      isTemporaryPassword: false,
      passwordChangedAt: new Date()
    });
  }

  // Get user roles
  async getUserRoles(uid: string): Promise<string[]> {
    const profile = await this.getUserProfile(uid);
    return profile?.roles || [];
  }
}
