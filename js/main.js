/**
 * Main application entry point
 * Handles routing, initialization, and authentication flow
 */

import { auth } from './auth.js';
import { sheets } from './sheets.js';
import { store } from './store.js';
import { showLoading, hideLoading, showError } from './utils/format.js';

// Import views (will be created)
import { HomeView } from './views/home.js';
import { RecipesView } from './views/recipes.js';
import { RecipeDetailView } from './views/recipe-detail.js';
import { RecipeFormView } from './views/recipe-form.js';
import { PlannerView } from './views/planner.js';
import { InventoryView } from './views/inventory.js';
import { ShoppingView } from './views/shopping.js';
import { BudgetView } from './views/budget.js';

class App {
    constructor() {
        this.currentView = null;
        this.routes = {
            '/': HomeView,
            '/recipes': RecipesView,
            '/recipes/new': RecipeFormView,
            '/recipes/:id': RecipeDetailView,
            '/recipes/:id/edit': RecipeFormView,
            '/planner': PlannerView,
            '/inventory': InventoryView,
            '/shopping': ShoppingView,
            '/budget': BudgetView,
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        // Set up authentication event listeners
        this.setupAuthListeners();

        // Set up navigation
        this.setupNavigation();

        // Check for credentials in config.js first, then localStorage
        let credentials = { clientId: null, spreadsheetId: null };

        // Priority 1: config.js (if exists)
        if (window.APP_CONFIG && window.APP_CONFIG.clientId && window.APP_CONFIG.spreadsheetId) {
            console.log('Using credentials from config.js');
            credentials.clientId = window.APP_CONFIG.clientId;
            credentials.spreadsheetId = window.APP_CONFIG.spreadsheetId;
        } else {
            // Priority 2: localStorage (from previous login)
            const stored = auth.getStoredCredentials();
            if (stored.clientId && stored.spreadsheetId) {
                console.log('Using credentials from localStorage');
                credentials = stored;
            }
        }

        if (credentials.clientId && credentials.spreadsheetId) {
            // Hide auth screen immediately since we have credentials
            document.getElementById('auth-screen').style.display = 'none';

            // Pre-fill the form (in case user signs out and returns)
            document.getElementById('client-id').value = credentials.clientId;
            document.getElementById('spreadsheet-id').value = credentials.spreadsheetId;

            // Try to auto-authenticate
            try {
                console.log('Auto-authenticating...');
                showLoading();
                const initialized = await auth.init(credentials.clientId, credentials.spreadsheetId);

                if (initialized) {
                    auth.requestAccessToken();
                } else {
                    // Failed to initialize, show auth screen again
                    document.getElementById('auth-screen').style.display = 'flex';
                    hideLoading();
                    showError('Failed to initialize. Please try again.');
                }
            } catch (error) {
                console.error('Auto-auth failed:', error);
                // Show auth screen again on error
                document.getElementById('auth-screen').style.display = 'flex';
                hideLoading();
                showError('Auto-authentication failed. Please sign in manually.');
            }
        } else {
            console.log('No credentials found. Please enter them manually.');
        }


        // Set up sign-in button
        document.getElementById('signin-button').addEventListener('click', async () => {
            console.log('Sign-in button clicked');
            const clientId = document.getElementById('client-id').value.trim();
            const spreadsheetId = document.getElementById('spreadsheet-id').value.trim();

            console.log('Client ID:', clientId ? 'provided' : 'missing');
            console.log('Spreadsheet ID:', spreadsheetId ? 'provided' : 'missing');

            if (!clientId || !spreadsheetId) {
                showError('Please enter both Client ID and Spreadsheet ID');
                return;
            }

            try {
                console.log('Starting authentication initialization...');
                showLoading();
                const initialized = await auth.init(clientId, spreadsheetId);

                console.log('Authentication initialized:', initialized);

                if (initialized) {
                    console.log('Requesting access token...');
                    auth.requestAccessToken();
                } else {
                    showError('Failed to initialize authentication');
                }
            } catch (error) {
                console.error('Authentication error:', error);
                showError('Authentication error: ' + error.message);
            } finally {
                hideLoading();
            }
        });

        // Set up sign-out button
        document.getElementById('signout-button').addEventListener('click', () => {
            auth.signOut();
        });
    }

    /**
     * Set up authentication event listeners
     */
    setupAuthListeners() {
        window.addEventListener('auth-success', async (e) => {
            try {
                showLoading();

                // Initialize sheets API
                sheets.init(e.detail.spreadsheetId);

                // Load all data
                await store.loadAll();

                // Hide auth screen, show app
                document.getElementById('auth-screen').classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');

                // Navigate to home
                window.location.hash = '#/';
                this.handleRoute();

                hideLoading();
            } catch (error) {
                console.error('Error loading data:', error);
                showError('Failed to load data from Google Sheets. Please check your spreadsheet setup.');
                auth.signOut();
                hideLoading();
            }
        });

        window.addEventListener('auth-error', (e) => {
            hideLoading();
            showError('Authentication failed: ' + e.detail.error);
        });

        window.addEventListener('auth-signout', () => {
            // Show auth screen, hide app
            document.getElementById('auth-screen').classList.remove('hidden');
            document.getElementById('app').classList.add('hidden');

            // Clear the content
            document.getElementById('content').innerHTML = '';
        });
    }

    /**
     * Set up navigation (hash-based routing)
     */
    setupNavigation() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });

        // Handle initial route
        if (!window.location.hash) {
            window.location.hash = '#/';
        }

        this.handleRoute();
    }

    /**
     * Handle route changes
     */
    handleRoute() {
        // Only route if authenticated
        if (!auth.isAuthenticated()) {
            return;
        }

        const hash = window.location.hash.slice(1) || '/';
        const { route, params } = this.matchRoute(hash);

        if (route && this.routes[route]) {
            // Clear current view
            if (this.currentView && this.currentView.destroy) {
                this.currentView.destroy();
            }

            // Create new view
            const ViewClass = this.routes[route];
            this.currentView = new ViewClass(params);

            // Render view
            const content = document.getElementById('content');
            content.innerHTML = '';
            this.currentView.render(content);

            // Update navigation active states
            this.updateNavigation(hash);
        } else {
            // 404 - redirect to home
            window.location.hash = '#/';
        }
    }

    /**
     * Match route with parameters
     */
    matchRoute(path) {
        // Exact match first
        if (this.routes[path]) {
            return { route: path, params: {} };
        }

        // Try to match routes with parameters
        for (const route in this.routes) {
            const pattern = route.replace(/:[^/]+/g, '([^/]+)');
            const regex = new RegExp(`^${pattern}$`);
            const match = path.match(regex);

            if (match) {
                // Extract parameter names
                const paramNames = (route.match(/:[^/]+/g) || []).map(p => p.slice(1));

                // Build params object
                const params = {};
                paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });

                return { route, params };
            }
        }

        return { route: null, params: {} };
    }

    /**
     * Update navigation active states
     */
    updateNavigation(currentPath) {
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href').slice(1);

            // Check if this link matches current path
            if (linkPath === currentPath || currentPath.startsWith(linkPath + '/')) {
                link.classList.add('text-blue-600');
                if (link.classList.contains('flex-col')) {
                    // Mobile nav
                    link.classList.add('text-blue-600');
                } else {
                    // Desktop nav
                    link.classList.add('bg-blue-50', 'text-blue-600');
                    link.classList.remove('text-gray-700');
                }
            } else {
                link.classList.remove('text-blue-600', 'bg-blue-50');
                if (!link.classList.contains('flex-col')) {
                    link.classList.add('text-gray-700');
                }
            }
        });
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}
