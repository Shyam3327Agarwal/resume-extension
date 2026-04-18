import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
import { firebaseConfig } from './firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private auth;
  private provider = new GoogleAuthProvider();
  
  user$ = new BehaviorSubject<User | null>(null);

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
    onAuthStateChanged(this.auth, (user) => {
      this.user$.next(user);
    });
  }

  async loginWithGoogle() {
    try {
      await signInWithPopup(this.auth, this.provider);
      this.router.navigate(['/roles']);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  async getToken() {
    const user = this.auth.currentUser;
    return user ? await user.getIdToken() : null;
  }

  get currentUser() {
    return this.auth.currentUser;
  }
}
