// Firebase service for Eden - AI Sustainability Counter
import { auth, db, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, doc, setDoc, getDoc, updateDoc, collection, addDoc } from './firebase-config.js';

class FirebaseService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.setupAuthListener();
  }

  // Set up authentication state listener
  setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.isAuthenticated = !!user;
      console.log('Auth state changed:', user ? 'Signed in' : 'Signed out');
      
      // Notify other parts of the extension about auth state change
      chrome.runtime.sendMessage({
        action: 'authStateChanged',
        isAuthenticated: this.isAuthenticated,
        user: user ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        } : null
      });
    });
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Signed in with Google:', result.user);
      return result.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  // Save user data to Firestore
  async saveUserData(data) {
    if (!this.isAuthenticated) {
      throw new Error('User must be authenticated to save data');
    }

    try {
      const userRef = doc(db, 'users', this.user.uid);
      await setDoc(userRef, {
        ...data,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      console.log('User data saved successfully');
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  // Get user data from Firestore
  async getUserData() {
    if (!this.isAuthenticated) {
      throw new Error('User must be authenticated to get data');
    }

    try {
      const userRef = doc(db, 'users', this.user.uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // Return default data structure
        return {
          totalTokens: 0,
          totalEnergy: 0,
          totalCarbon: 0,
          totalWater: 0,
          dailyUsage: {},
          settings: {
            monitoringEnabled: false,
            modelClass: 'Large'
          }
        };
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  // Add token usage record
  async addTokenUsage(tokens, energy, carbon, water) {
    if (!this.isAuthenticated) {
      throw new Error('User must be authenticated to add usage');
    }

    try {
      const usageRef = collection(db, 'users', this.user.uid, 'usage');
      await addDoc(usageRef, {
        tokens,
        energy,
        carbon,
        water,
        timestamp: new Date().toISOString()
      });
      console.log('Token usage recorded successfully');
    } catch (error) {
      console.error('Error recording token usage:', error);
      throw error;
    }
  }

  // Get usage history
  async getUsageHistory(limit = 100) {
    if (!this.isAuthenticated) {
      throw new Error('User must be authenticated to get usage history');
    }

    try {
      const usageRef = collection(db, 'users', this.user.uid, 'usage');
      // Note: In a real implementation, you'd use query() with orderBy and limit
      // For now, we'll return empty array as this requires more complex setup
      return [];
    } catch (error) {
      console.error('Error getting usage history:', error);
      throw error;
    }
  }
}

// Create singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
