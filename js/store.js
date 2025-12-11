/**
 * Local state management
 * Caches data from Google Sheets for performance
 */

import { sheets } from './sheets.js';

class Store {
    constructor() {
        this.recipes = [];
        this.ingredients = [];
        this.inventory = [];
        this.mealPlan = [];
        this.shoppingList = [];
        this.priceHistory = [];
        this.listeners = {};
    }

    /**
     * Load all data from Google Sheets
     */
    async loadAll() {
        try {
            await Promise.all([
                this.loadRecipes(),
                this.loadIngredients(),
                this.loadInventory(),
                this.loadMealPlan(),
                this.loadShoppingList(),
                this.loadPriceHistory(),
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    /**
     * Load recipes
     */
    async loadRecipes() {
        this.recipes = await sheets.readAsObjects('Recipes');
        this.emit('recipes-updated', this.recipes);
        return this.recipes;
    }

    /**
     * Load ingredients
     */
    async loadIngredients() {
        this.ingredients = await sheets.readAsObjects('Ingredients');
        this.emit('ingredients-updated', this.ingredients);
        return this.ingredients;
    }

    /**
     * Load inventory
     */
    async loadInventory() {
        this.inventory = await sheets.readAsObjects('Inventory');
        this.emit('inventory-updated', this.inventory);
        return this.inventory;
    }

    /**
     * Load meal plan
     */
    async loadMealPlan() {
        this.mealPlan = await sheets.readAsObjects('MealPlan');
        this.emit('mealplan-updated', this.mealPlan);
        return this.mealPlan;
    }

    /**
     * Load shopping list
     */
    async loadShoppingList() {
        this.shoppingList = await sheets.readAsObjects('ShoppingList');
        this.emit('shoppinglist-updated', this.shoppingList);
        return this.shoppingList;
    }

    /**
     * Load price history
     */
    async loadPriceHistory() {
        this.priceHistory = await sheets.readAsObjects('PriceHistory');
        this.emit('pricehistory-updated', this.priceHistory);
        return this.priceHistory;
    }

    // === Recipe Methods ===

    /**
     * Get all recipes
     */
    getRecipes() {
        return this.recipes;
    }

    /**
     * Get recipe by ID
     */
    getRecipe(id) {
        return this.recipes.find(r => r.id === id);
    }

    /**
     * Add a new recipe
     */
    async addRecipe(recipe) {
        const id = sheets.generateId('r');
        const newRecipe = { id, ...recipe };

        await sheets.appendObjects('Recipes', [newRecipe]);
        await this.loadRecipes();

        return newRecipe;
    }

    /**
     * Update a recipe
     */
    async updateRecipe(id, updates) {
        await sheets.updateRow('Recipes', 'id', id, updates);
        await this.loadRecipes();
    }

    /**
     * Delete a recipe
     */
    async deleteRecipe(id) {
        // Delete recipe
        await sheets.deleteRow('Recipes', 'id', id);

        // Delete associated ingredients
        const recipeIngredients = this.ingredients.filter(i => i.recipe_id === id);
        for (const ingredient of recipeIngredients) {
            await this.deleteIngredient(ingredient.recipe_id, ingredient.item);
        }

        await this.loadRecipes();
    }

    // === Ingredient Methods ===

    /**
     * Get ingredients for a recipe
     */
    getRecipeIngredients(recipeId) {
        return this.ingredients.filter(i => i.recipe_id === recipeId);
    }

    /**
     * Add ingredient to recipe
     */
    async addIngredient(ingredient) {
        await sheets.appendObjects('Ingredients', [ingredient]);
        await this.loadIngredients();
    }

    /**
     * Update ingredient
     */
    async updateIngredient(recipeId, item, updates) {
        const ingredients = await sheets.readAsObjects('Ingredients');
        const index = ingredients.findIndex(i => i.recipe_id === recipeId && i.item === item);

        if (index === -1) {
            throw new Error('Ingredient not found');
        }

        // Update by rewriting all ingredients
        ingredients[index] = { ...ingredients[index], ...updates };
        await sheets.writeObjects('Ingredients', ingredients);
        await this.loadIngredients();
    }

    /**
     * Delete ingredient
     */
    async deleteIngredient(recipeId, item) {
        const ingredients = await sheets.readAsObjects('Ingredients');
        const filtered = ingredients.filter(i => !(i.recipe_id === recipeId && i.item === item));
        await sheets.writeObjects('Ingredients', filtered);
        await this.loadIngredients();
    }

    /**
     * Save all ingredients for a recipe (replaces existing)
     */
    async saveRecipeIngredients(recipeId, newIngredients) {
        // Remove old ingredients
        const allIngredients = await sheets.readAsObjects('Ingredients');
        const otherIngredients = allIngredients.filter(i => i.recipe_id !== recipeId);

        // Add new ingredients
        const ingredientsToSave = [...otherIngredients, ...newIngredients];

        await sheets.writeObjects('Ingredients', ingredientsToSave);
        await this.loadIngredients();
    }

    // === Inventory Methods ===

    /**
     * Get all inventory items
     */
    getInventory() {
        return this.inventory;
    }

    /**
     * Get inventory item by name
     */
    getInventoryItem(item) {
        return this.inventory.find(i => i.item.toLowerCase() === item.toLowerCase());
    }

    /**
     * Add inventory item
     */
    async addInventoryItem(item) {
        await sheets.appendObjects('Inventory', [item]);
        await this.loadInventory();
    }

    /**
     * Update inventory item
     */
    async updateInventoryItem(itemName, updates) {
        await sheets.updateRow('Inventory', 'item', itemName, updates);
        await this.loadInventory();
    }

    /**
     * Delete inventory item
     */
    async deleteInventoryItem(itemName) {
        await sheets.deleteRow('Inventory', 'item', itemName);
        await this.loadInventory();
    }

    // === Meal Plan Methods ===

    /**
     * Get meal plan for a specific week
     */
    getMealPlanForWeek(weekStart) {
        return this.mealPlan.filter(m => m.week_start === weekStart);
    }

    /**
     * Add meal to plan
     */
    async addMealToPlan(meal) {
        await sheets.appendObjects('MealPlan', [meal]);
        await this.loadMealPlan();
    }

    /**
     * Update meal in plan
     */
    async updateMealInPlan(weekStart, day, updates) {
        const meals = await sheets.readAsObjects('MealPlan');
        const index = meals.findIndex(m => m.week_start === weekStart && m.day === day);

        if (index === -1) {
            // Add new meal
            await this.addMealToPlan({ week_start: weekStart, day, ...updates });
        } else {
            // Update existing
            meals[index] = { ...meals[index], ...updates };
            await sheets.writeObjects('MealPlan', meals);
            await this.loadMealPlan();
        }
    }

    /**
     * Clear meal from plan
     */
    async clearMealFromPlan(weekStart, day) {
        const meals = await sheets.readAsObjects('MealPlan');
        const filtered = meals.filter(m => !(m.week_start === weekStart && m.day === day));
        await sheets.writeObjects('MealPlan', filtered);
        await this.loadMealPlan();
    }

    /**
     * Clear entire week
     */
    async clearWeek(weekStart) {
        const meals = await sheets.readAsObjects('MealPlan');
        const filtered = meals.filter(m => m.week_start !== weekStart);
        await sheets.writeObjects('MealPlan', filtered);
        await this.loadMealPlan();
    }

    // === Shopping List Methods ===

    /**
     * Get shopping list for a week
     */
    getShoppingListForWeek(weekStart) {
        return this.shoppingList.filter(s => s.week_start === weekStart);
    }

    /**
     * Generate shopping list for a week
     */
    async generateShoppingList(weekStart) {
        // Get meal plan for the week
        const weekMeals = this.getMealPlanForWeek(weekStart);

        if (weekMeals.length === 0) {
            throw new Error('No meals planned for this week');
        }

        // Aggregate ingredients
        const aggregated = {};

        for (const meal of weekMeals) {
            const recipe = this.getRecipe(meal.recipe_id);
            if (!recipe) continue;

            const ingredients = this.getRecipeIngredients(meal.recipe_id);
            const servings = parseFloat(recipe.servings) || 4;
            const multiplier = 2.5 / servings;

            for (const ingredient of ingredients) {
                const item = ingredient.item.toLowerCase();
                const quantity = parseFloat(ingredient.quantity) || 0;
                const scaledQuantity = quantity * multiplier;

                if (!aggregated[item]) {
                    aggregated[item] = {
                        item: ingredient.item,
                        quantity: 0,
                        unit: ingredient.unit,
                        category: ingredient.category,
                    };
                }

                aggregated[item].quantity += scaledQuantity;
            }
        }

        // Filter based on inventory
        const shoppingItems = [];

        for (const item of Object.values(aggregated)) {
            const inventoryItem = this.getInventoryItem(item.item);

            // Include if not in inventory, or if status is 'low' or 'out'
            if (!inventoryItem || inventoryItem.status === 'low' || inventoryItem.status === 'out') {
                const typical_price = inventoryItem?.typical_price || '';
                const estimated_price = typical_price ? (parseFloat(typical_price) * item.quantity).toFixed(2) : '';

                shoppingItems.push({
                    week_start: weekStart,
                    item: item.item,
                    quantity: Math.round(item.quantity * 100) / 100, // Round to 2 decimals
                    unit: item.unit,
                    category: item.category,
                    estimated_price: estimated_price,
                    checked: 'FALSE',
                    manual: 'FALSE',
                });
            }
        }

        // Clear old shopping list for this week
        const allShoppingItems = await sheets.readAsObjects('ShoppingList');
        const otherWeeks = allShoppingItems.filter(s => s.week_start !== weekStart);
        const newList = [...otherWeeks, ...shoppingItems];

        await sheets.writeObjects('ShoppingList', newList);
        await this.loadShoppingList();

        return shoppingItems;
    }

    /**
     * Update shopping list item
     */
    async updateShoppingItem(weekStart, item, updates) {
        const items = await sheets.readAsObjects('ShoppingList');
        const index = items.findIndex(s => s.week_start === weekStart && s.item === item);

        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            await sheets.writeObjects('ShoppingList', items);
            await this.loadShoppingList();
        }
    }

    /**
     * Add manual shopping item
     */
    async addManualShoppingItem(item) {
        await sheets.appendObjects('ShoppingList', [{ ...item, manual: 'TRUE' }]);
        await this.loadShoppingList();
    }

    // === Price History Methods ===

    /**
     * Log actual prices after shopping
     */
    async logPrices(weekStart, prices) {
        const today = new Date().toISOString().split('T')[0];

        const priceEntries = prices.map(p => ({
            date: today,
            item: p.item,
            price: p.price,
            store: p.store || '',
        }));

        await sheets.appendObjects('PriceHistory', priceEntries);
        await this.loadPriceHistory();
    }

    // === Event System ===

    /**
     * Subscribe to events
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Unsubscribe from events
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Emit event
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

// Export singleton instance
export const store = new Store();
