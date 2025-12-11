/**
 * Configuration file for Meal Planner
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file and rename it to 'config.js'
 * 2. Fill in your Google OAuth Client ID and Spreadsheet ID
 * 3. The config.js file is gitignored and won't be committed
 */

window.APP_CONFIG = {
    // Your Google OAuth Client ID from Google Cloud Console
    // Get this from: https://console.cloud.google.com/apis/credentials
    clientId: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',

    // Your Google Spreadsheet ID
    // This is the long string in your spreadsheet URL after /d/
    // Example: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
    spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE',
};
