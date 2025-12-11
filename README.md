# Weekly Meal Planner

A mobile-first, client-side web application for managing weekly dinner planning, recipes, kitchen inventory, and budgeted shopping lists. Built specifically for families, with automatic serving size calculations and cross-device sync via Google Sheets.

## Features

### Recipe Management
- Store and organize your recipe collection
- Add ingredients with quantities and categories
- Search and filter recipes
- Track cooking times and serving sizes

### Meal Planning
- Plan dinners for the week
- Drag-and-drop recipe assignment to days
- View week-at-a-glance on the dashboard
- Navigate between weeks easily

### Smart Shopping Lists
- Automatically generate shopping lists from meal plans
- Ingredients are scaled for your family size (default: 2.5 servings)
- Grouped by store sections (produce, protein, dairy, etc.)
- Excludes items you already have in inventory
- Print-optimized layout for taking to the store
- Check off items as you shop

### Kitchen Inventory
- Track pantry staples and their status (have/low/out)
- Items marked "low" or "out" are automatically added to shopping lists
- Optional price tracking for budget estimates

### Budget Tracking
- Estimated costs for weekly shopping
- Compare week-over-week spending
- Track actual prices paid for better future estimates

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES Modules)
- **Styling**: Tailwind CSS
- **Data Storage**: Google Sheets API
- **Authentication**: Google Identity Services (OAuth 2.0)
- **Hosting**: GitHub Pages (static site)

## Architecture Highlights

- **Zero Infrastructure**: No backend server required
- **Free Hosting**: GitHub Pages
- **Cross-Device Sync**: Access from any device with the same Google Sheet
- **Offline-First Ready**: Can be enhanced with service workers
- **Mobile-First Design**: Responsive from phone to desktop
- **Print-Friendly**: Optimized shopping list printing

## Getting Started

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/meal-planner.git
   cd meal-planner
   ```

2. **Follow the setup guide**
   - See [Setup Guide](docs/setup-guide.md) for detailed instructions
   - You'll need to:
     - Create a Google Spreadsheet
     - Set up Google OAuth credentials
     - Deploy to GitHub Pages

3. **Start using**
   - Open your deployed site
   - Enter your Spreadsheet ID and Client ID
   - Sign in with Google
   - Start planning meals!

## Project Structure

```
meal-planner/
├── index.html              # Main application shell
├── css/
│   └── styles.css         # Custom styles and print CSS
├── js/
│   ├── main.js            # App initialization and routing
│   ├── auth.js            # Google OAuth authentication
│   ├── sheets.js          # Google Sheets API wrapper
│   ├── store.js           # State management
│   ├── views/             # View components
│   │   ├── home.js
│   │   ├── recipes.js
│   │   ├── recipe-detail.js
│   │   ├── recipe-form.js
│   │   ├── planner.js
│   │   ├── inventory.js
│   │   ├── shopping.js
│   │   └── budget.js
│   └── utils/             # Utility functions
│       ├── date.js        # Date and week calculations
│       ├── units.js       # Unit conversions and normalization
│       └── format.js      # Display formatting
├── docs/
│   └── setup-guide.md     # Detailed setup instructions
└── README.md
```

## Data Schema

The application uses a Google Spreadsheet with six tabs:

1. **Recipes**: Recipe metadata (name, cook time, servings, instructions)
2. **Ingredients**: Recipe ingredients with quantities and categories
3. **Inventory**: Kitchen pantry items and their status
4. **MealPlan**: Weekly meal assignments
5. **ShoppingList**: Generated shopping lists by week
6. **PriceHistory**: Logged actual prices for budget tracking

See the [Setup Guide](docs/setup-guide.md) for detailed schema information.

## Key Features Explained

### Serving Size Calculation
- All recipes store their base serving size
- Shopping lists automatically scale to 2.5 servings (2 adults + 1 toddler)
- Formula: `needed_quantity = (ingredient_quantity / recipe_servings) * 2.5`

### Shopping List Generation
1. Collects all recipes planned for the week
2. Aggregates ingredients across all meals
3. Scales quantities based on serving size
4. Checks inventory status
5. Excludes items marked as "have" in inventory
6. Includes items marked "low" or "out"
7. Groups by store section for easier shopping

### Cross-Device Sync
- All data stored in Google Sheets
- Access from any device with internet
- Changes sync automatically
- No manual sync required

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with ES Module support

## Development

### Local Development

1. **Start a local server**
   ```bash
   python -m http.server 8000
   ```

2. **Open in browser**
   ```
   http://localhost:8000
   ```

3. **Update OAuth credentials**
   - Add `http://localhost:8000` to authorized origins in Google Cloud Console

### Building for Production

No build step required! This is a static site that runs entirely in the browser.

Simply commit your changes and push to GitHub. If you have GitHub Pages enabled, your changes will be live within minutes.

## Future Enhancements

Potential features for future versions:

- Recipe import from URLs
- Meal suggestions based on inventory
- Multiple store support with different pricing
- Nutritional information tracking
- Recipe images
- Meal plan sharing
- Recipe tags and categories
- Batch cooking calculations
- Meal history and favorites

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this for personal or commercial projects.

## Support

For setup help, see the [Setup Guide](docs/setup-guide.md).

For issues or questions:
- Create an issue on GitHub
- Check existing issues for solutions

## Acknowledgments

Built with:
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Google Sheets API](https://developers.google.com/sheets/api) for data storage
- [Google Identity Services](https://developers.google.com/identity/gsi/web) for authentication

---

Made with love for families who want to simplify meal planning and grocery shopping.
