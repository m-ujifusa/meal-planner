/**
 * Firebase Authentication module
 * Replaces Google OAuth with Firebase Authentication
 */

class FirebaseAuth {
    constructor() {
        this.user = null;
        this.auth = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Firebase Authentication
     */
    async init() {
        console.log('FirebaseAuth.init() called');

        try {
            // Wait for Firebase to be loaded
            await this.waitForFirebase();

            // Get Firebase Auth instance
            this.auth = firebase.auth();

            // Set up auth state observer
            this.auth.onAuthStateChanged((user) => {
                console.log('Auth state changed:', user ? user.email : 'signed out');
                this.user = user;

                if (user) {
                    // User is signed in
                    this.handleAuthSuccess();
                } else {
                    // User is signed out
                    console.log('No user signed in');
                }
            });

            this.isInitialized = true;
            console.log('Firebase Auth initialization complete');
            return true;
        } catch (error) {
            console.error('Firebase Auth initialization error:', error);
            this.handleAuthError(error.message);
            return false;
        }
    }

    /**
     * Wait for Firebase to be loaded
     */
    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max

            const tryLoad = () => {
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    console.log('Firebase SDK loaded');
                    resolve();
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        reject(new Error('Firebase SDK failed to load. Please check your firebase-config.js file.'));
                    } else {
                        setTimeout(tryLoad, 100);
                    }
                }
            };

            tryLoad();
        });
    }

    /**
     * Sign in with Google popup
     */
    async signInWithGoogle() {
        console.log('signInWithGoogle() called');

        if (!this.isInitialized) {
            console.error('Firebase Auth not initialized');
            this.handleAuthError('Authentication not initialized');
            return;
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();

            // Optional: Add scopes if needed
            // provider.addScope('https://www.googleapis.com/auth/userinfo.email');

            console.log('Opening Google sign-in popup...');
            const result = await this.auth.signInWithPopup(provider);

            console.log('Sign-in successful:', result.user.email);
            // onAuthStateChanged will be called automatically

        } catch (error) {
            console.error('Sign-in error:', error);

            // Handle specific error cases
            if (error.code === 'auth/popup-closed-by-user') {
                this.handleAuthError('Sign-in cancelled');
            } else if (error.code === 'auth/popup-blocked') {
                this.handleAuthError('Pop-up blocked. Please allow pop-ups for this site.');
            } else {
                this.handleAuthError(error.message);
            }
        }
    }

    /**
     * Handle successful authentication
     */
    handleAuthSuccess() {
        console.log('handleAuthSuccess() called');

        // Dispatch custom event for compatibility with existing code
        window.dispatchEvent(new CustomEvent('auth-success', {
            detail: {
                user: this.user,
                email: this.user.email,
                uid: this.user.uid
            }
        }));
    }

    /**
     * Handle authentication error
     */
    handleAuthError(error) {
        console.error('Auth error:', error);

        window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { error }
        }));
    }

    /**
     * Sign out
     */
    async signOut() {
        console.log('signOut() called');

        try {
            await this.auth.signOut();
            this.user = null;

            // Dispatch sign out event
            window.dispatchEvent(new CustomEvent('auth-signout'));

            console.log('Sign-out successful');
        } catch (error) {
            console.error('Sign-out error:', error);
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.user;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Get current user ID
     */
    getUserId() {
        return this.user ? this.user.uid : null;
    }

    /**
     * Get current user email
     */
    getUserEmail() {
        return this.user ? this.user.email : null;
    }

    /**
     * Wait for auth to be ready
     */
    async waitForAuth() {
        return new Promise((resolve) => {
            if (this.user) {
                resolve(this.user);
            } else {
                const unsubscribe = this.auth.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            }
        });
    }
}

// Export singleton instance
export const auth = new FirebaseAuth();
