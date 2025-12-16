# Firebase Migration Setup Guide

## Step 1: Create Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**

2. **Click "Add project"** (or "Create a project")

3. **Name your project**: "Meal Planner" (or any name you prefer)

4. **Google Analytics**: You can disable this (not needed for this app)

5. **Click "Create project"** and wait for it to finish

## Step 2: Set Up Authentication

1. **In your Firebase project**, click **"Authentication"** in the left sidebar

2. **Click "Get started"**

3. **Click on "Sign-in method" tab**

4. **Enable "Google"** provider:
   - Click on "Google"
   - Toggle "Enable"
   - Click "Save"

5. **Add authorized domain** (for GitHub Pages):
   - Scroll down to "Authorized domains"
   - Your domain should already be there: `YOUR_USERNAME.github.io`
   - If not, click "Add domain" and add it

## Step 3: Set Up Firestore Database

1. **Click "Firestore Database"** in the left sidebar

2. **Click "Create database"**

3. **Start in production mode** (we'll set up rules next)

4. **Choose location**: Select the region closest to you (e.g., `us-central` for US)

5. **Click "Enable"**

## Step 4: Set Up Security Rules

1. **In Firestore Database**, click on **"Rules" tab**

2. **Replace the rules with this:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. **Click "Publish"**

## Step 5: Get Your Firebase Configuration

1. **Click the gear icon** (⚙️) next to "Project Overview"

2. **Click "Project settings"**

3. **Scroll down to "Your apps"**

4. **Click the web icon** (`</>`) to add a web app

5. **Register your app**:
   - App nickname: "Meal Planner Web"
   - Don't check "Firebase Hosting"
   - Click "Register app"

6. **Copy the Firebase config object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

7. **Save this config** - you'll need it for the next step!

## Step 6: Update Your App Configuration

1. **Copy `firebase-config.example.js` to `firebase-config.js`**:
   ```bash
   cp firebase-config.example.js firebase-config.js
   ```

2. **Edit `firebase-config.js`** and replace the placeholder values with your actual Firebase config from Step 5:
   ```javascript
   const firebaseConfig = {
       apiKey: "AIza...",  // Your actual API key
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abc123"
   };
   ```

3. **Save the file** - The app will now connect to your Firebase project!

## Step 7: Migrate Existing Data (If Applicable)

If you have existing data in Google Sheets from the old version, you need to migrate it to Firebase:

1. **Open the migration tool**: Navigate to `migrate.html` in your browser

2. **Connect to Google Sheets**:
   - Enter your Google OAuth Client ID and Spreadsheet ID
   - Click "Sign in with Google (Sheets Access)" and authorize

3. **Sign in to Firebase**:
   - Click "Sign in with Google (Firebase)"
   - Use the SAME Google account you want to use for the app

4. **Start Migration**:
   - Click "Start Migration"
   - Wait for all data to be copied (this may take a minute)
   - You'll see progress logs showing what's being migrated

5. **Done!**
   - Once complete, you can start using the main app
   - Your old Google Sheets data is still intact (not deleted)

**Note**: You only need to do this migration once. After this, the app will use Firebase exclusively.

---

## Security Notes

- **Firebase Config is safe to be public** - The apiKey in Firebase config is NOT a secret
- **Security comes from Firestore rules** - Only authenticated users can access data
- **Each user's data is isolated** - Users can only access their own recipes/plans

## Cost

Firebase has a generous free tier:
- **Firestore**: 50K reads + 20K writes per day
- **Authentication**: Unlimited
- **Hosting**: 10 GB storage + 360 MB/day transfer

For a family meal planner, you'll likely use <1% of the free tier.
