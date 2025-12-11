/**
 * Authentication module for Google OAuth 2.0
 */

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

class Auth {
    constructor() {
        this.tokenClient = null;
        this.accessToken = null;
        this.gapiInited = false;
        this.gisInited = false;
        this.clientId = null;
        this.spreadsheetId = null;
    }

    /**
     * Initialize Google API and Identity Services
     */
    async init(clientId, spreadsheetId) {
        console.log('Auth.init() called');
        this.clientId = clientId;
        this.spreadsheetId = spreadsheetId;

        // Save credentials to localStorage
        localStorage.setItem('clientId', clientId);
        localStorage.setItem('spreadsheetId', spreadsheetId);

        console.log('Loading Google APIs...');
        // Load gapi
        await this.loadGapi();
        await this.loadGis();

        const success = this.gapiInited && this.gisInited;
        console.log('Auth initialization complete. Success:', success);
        return success;
    }

    /**
     * Load Google API client
     */
    async loadGapi() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max

            const tryLoad = () => {
                if (typeof gapi !== 'undefined') {
                    console.log('gapi loaded, initializing client...');
                    gapi.load('client', async () => {
                        try {
                            await gapi.client.init({
                                discoveryDocs: [DISCOVERY_DOC],
                            });
                            this.gapiInited = true;
                            console.log('gapi client initialized');
                            resolve();
                        } catch (error) {
                            console.error('Error initializing gapi client:', error);
                            reject(error);
                        }
                    });
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        const error = new Error('Google API library failed to load. Please refresh and try again.');
                        console.error(error);
                        reject(error);
                    } else {
                        // Retry after a short delay
                        setTimeout(tryLoad, 100);
                    }
                }
            };

            tryLoad();
        });
    }

    /**
     * Load Google Identity Services
     */
    async loadGis() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max

            const tryLoad = () => {
                if (typeof google !== 'undefined' && google.accounts) {
                    console.log('Google Identity Services loaded, initializing token client...');
                    try {
                        this.tokenClient = google.accounts.oauth2.initTokenClient({
                            client_id: this.clientId,
                            scope: SCOPES,
                            callback: (response) => {
                                if (response.error) {
                                    console.error('Token error:', response.error);
                                    this.handleAuthError(response.error);
                                    return;
                                }
                                this.accessToken = response.access_token;
                                sessionStorage.setItem('access_token', this.accessToken);
                                this.handleAuthSuccess();
                            },
                        });
                        this.gisInited = true;
                        console.log('Google Identity Services initialized');
                        resolve();
                    } catch (error) {
                        console.error('Error initializing Google Identity Services:', error);
                        reject(error);
                    }
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        const error = new Error('Google Identity Services failed to load. Please refresh and try again.');
                        console.error(error);
                        reject(error);
                    } else {
                        // Retry after a short delay
                        setTimeout(tryLoad, 100);
                    }
                }
            };

            tryLoad();
        });
    }

    /**
     * Request access token
     */
    requestAccessToken() {
        console.log('requestAccessToken() called');

        if (!this.tokenClient) {
            console.error('Token client not initialized');
            return;
        }

        // Check if we already have a valid token in session storage
        const storedToken = sessionStorage.getItem('access_token');
        if (storedToken) {
            console.log('Found stored token, verifying...');
            this.accessToken = storedToken;
            gapi.client.setToken({ access_token: storedToken });
            // Verify token is still valid
            this.verifyToken().then(valid => {
                if (valid) {
                    console.log('Stored token is valid');
                    this.handleAuthSuccess();
                } else {
                    console.log('Stored token expired, requesting new one');
                    // Token expired, request new one
                    this.tokenClient.requestAccessToken({ prompt: '' });
                }
            });
        } else {
            console.log('No stored token, requesting new one');
            // Request new token
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        }
    }

    /**
     * Verify if current token is valid
     */
    async verifyToken() {
        try {
            gapi.client.setToken({ access_token: this.accessToken });
            await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId,
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Handle successful authentication
     */
    handleAuthSuccess() {
        // Set the token in gapi
        gapi.client.setToken({ access_token: this.accessToken });

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('auth-success', {
            detail: {
                spreadsheetId: this.spreadsheetId
            }
        }));
    }

    /**
     * Handle authentication error
     */
    handleAuthError(error) {
        window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { error }
        }));
    }

    /**
     * Sign out
     */
    signOut() {
        if (this.accessToken) {
            google.accounts.oauth2.revoke(this.accessToken, () => {
                console.log('Token revoked');
            });
        }

        this.accessToken = null;
        sessionStorage.removeItem('access_token');
        gapi.client.setToken(null);

        // Dispatch sign out event
        window.dispatchEvent(new CustomEvent('auth-signout'));
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.accessToken;
    }

    /**
     * Get stored credentials
     */
    getStoredCredentials() {
        return {
            clientId: localStorage.getItem('clientId'),
            spreadsheetId: localStorage.getItem('spreadsheetId')
        };
    }

    /**
     * Get spreadsheet ID
     */
    getSpreadsheetId() {
        return this.spreadsheetId;
    }
}

// Export singleton instance
export const auth = new Auth();
