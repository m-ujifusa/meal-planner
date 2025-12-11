# Weekly Meal Planner - Setup Guide

This guide will walk you through setting up your Weekly Meal Planner application. The setup involves creating a Google Spreadsheet and setting up Google OAuth credentials.

## Prerequisites

- A Google Account
- A GitHub account (for hosting on GitHub Pages)

## Step 1: Create Your Google Spreadsheet

1. **Create a new Google Spreadsheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Click "Blank" to create a new spreadsheet
   - Name it something like "Meal Planner Data"

2. **Create the required tabs**

   Create the following sheets (tabs) in your spreadsheet:

### Tab 1: Recipes

| id | name | cook_time_mins | servings | instructions | source |
|----|------|----------------|----------|--------------|--------|

- **id**: Auto-generated unique identifier (e.g., r_001)
- **name**: Recipe name
- **cook_time_mins**: Cooking time in minutes
- **servings**: Number of servings the recipe makes
- **instructions**: Step-by-step cooking instructions
- **source**: Optional source reference

### Tab 2: Ingredients

| recipe_id | item | quantity | unit | category |
|-----------|------|----------|------|----------|

- **recipe_id**: Links to recipe id
- **item**: Ingredient name (lowercase)
- **quantity**: Amount needed
- **unit**: Unit of measurement (tsp, cup, lb, etc.)
- **category**: Store section (produce, protein, dairy, pantry, frozen, bakery, other)

### Tab 3: Inventory

| item | status | category | typical_price |
|------|--------|----------|---------------|

- **item**: Item name (lowercase)
- **status**: have / low / out
- **category**: Store section
- **typical_price**: Optional, used for budget estimates

### Tab 4: MealPlan

| week_start | day | recipe_id |
|------------|-----|-----------|

- **week_start**: Monday of the week (YYYY-MM-DD format)
- **day**: Day name (lowercase: monday, tuesday, etc.)
- **recipe_id**: Links to recipe id

### Tab 5: ShoppingList

| week_start | item | quantity | unit | category | estimated_price | checked | manual |
|------------|------|----------|------|----------|-----------------|---------|--------|

- **week_start**: Monday of the week
- **item**: Item name
- **quantity**: Scaled quantity for 2.5 servings
- **unit**: Unit of measurement
- **category**: Store section
- **estimated_price**: Estimated cost
- **checked**: TRUE/FALSE (checked off while shopping)
- **manual**: TRUE/FALSE (manually added vs. auto-generated)

### Tab 6: PriceHistory

| date | item | price | store |
|------|------|-------|-------|

- **date**: Purchase date (YYYY-MM-DD)
- **item**: Item name
- **price**: Actual price paid
- **store**: Optional store name

3. **Copy your Spreadsheet ID**
   - Look at the URL of your spreadsheet
   - It will look like: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part - you'll need this later

## Step 2: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create a new project**
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it "Meal Planner" (or your preferred name)
   - Click "Create"

3. **Enable Google Sheets API**
   - Make sure your new project is selected
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click on it and click "Enable"

## Step 3: Create OAuth Credentials

1. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type
   - Click "Create"
   - Fill in the required fields:
     - App name: "Meal Planner"
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - On "Scopes" page, click "Save and Continue"
   - On "Test users" page, add your email as a test user
   - Click "Save and Continue"

2. **Create OAuth Client ID**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "Meal Planner Web Client"
   - Authorized JavaScript origins:
     - For local testing: `http://localhost:8000`
     - For GitHub Pages: `https://YOUR_USERNAME.github.io`
   - Click "Create"
   - Copy your Client ID - you'll need this

## Step 4: Deploy to GitHub Pages

1. **Create a GitHub repository**
   - Go to [GitHub](https://github.com)
   - Create a new repository named "meal-planner"
   - Make it public

2. **Push your code**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/meal-planner.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "main" branch
   - Click "Save"
   - Your site will be published at: `https://YOUR_USERNAME.github.io/meal-planner/`

4. **Update OAuth credentials**
   - Go back to Google Cloud Console > Credentials
   - Edit your OAuth Client ID
   - Add your GitHub Pages URL to "Authorized JavaScript origins"
   - Save

## Step 5: Use the Application

1. **Open your application**
   - Visit your GitHub Pages URL
   - Or for local testing, run: `python -m http.server 8000` and visit `http://localhost:8000`

2. **Sign in**
   - Enter your Google Spreadsheet ID
   - Enter your OAuth Client ID
   - Click "Connect to Google"
   - Authorize the application when prompted

3. **Start using the app**
   - Add your favorite recipes
   - Track your kitchen inventory
   - Plan your weekly meals
   - Generate shopping lists
   - Track your spending

## Troubleshooting

### "Access denied" error
- Make sure you've added your email as a test user in the OAuth consent screen
- Verify that the Google Sheets API is enabled
- Check that the Spreadsheet ID is correct

### "Origin not allowed" error
- Verify that your site URL is added to "Authorized JavaScript origins" in OAuth credentials
- Make sure the URL matches exactly (http vs https, trailing slash, etc.)

### Data not loading
- Check that your spreadsheet has the correct tab names (case-sensitive)
- Verify that the header rows match the expected column names
- Make sure the spreadsheet is not set to private

### Can't save data
- Ensure you granted the application permission to edit spreadsheets
- Check that you have edit access to the spreadsheet

## Security Notes

- Your OAuth Client ID can be public - it's designed to be used in client-side applications
- Your Spreadsheet ID is also safe to be public if you want to share your app
- The actual data access is controlled by Google's OAuth - only authorized users can access the spreadsheet
- For production use with sensitive data, consider implementing additional security measures

## Need Help?

If you encounter issues not covered here, please:
1. Check the browser console for error messages
2. Verify all steps were completed correctly
3. Try the application in an incognito window to rule out cache issues
4. Create an issue on the GitHub repository with details about your problem
