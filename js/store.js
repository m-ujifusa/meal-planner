/**
 * Local state management
 * Caches data from Firestore for performance
 */

import { db } from './firestore.js';

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
     * Load all data from Firestore
     */
    async loadAll() {
        try {
            // Initialize Firestore
            db.init();

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
        this.recipes = await db.read('recipes');
        this.emit('recipes-updated', this.recipes);
        return this.recipes;
    }

    /**
     * Load ingredients
     */
    async loadIngredients() {
        this.ingredients = await db.read('ingredients');
        this.emit('ingredients-updated', this.ingredients);
        return this.ingredients;
    }

    /**
     * Load inventory
     */
    async loadInventory() {
        this.inventory = await db.read('inventory');
        this.emit('inventory-updated', this.inventory);
        return this.inventory;
    }

    /**
     * Load meal plan
     */
    async loadMealPlan() {
        this.mealPlan = await db.read('meal_plans');
        this.emit('mealplan-updated', this.mealPlan);
        return this.mealPlan;
    }

    /**
     * Load shopping list
     */
    async loadShoppingList() {
        this.shoppingList = await db.read('shopping_list');
        this.emit('shoppinglist-updated', this.shoppingList);
        return this.shoppingList;
    }

    /**
     * Load price history
     */
    async loadPriceHistory() {
        this.priceHistory = await db.read('price_history');
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
        const id = db.generateId('r');
        const newRecipe = { ...recipe };

        await db.create('recipes', newRecipe, id);
        await this.loadRecipes();

        return { id, ...newRecipe };
    }

    /**
     * Update a recipe
     */
    async updateRecipe(id, updates) {
        await db.update('recipes', id, updates);
        await this.loadRecipes();
    }

    /**
     * Delete a recipe
     */
    async deleteRecipe(id) {
        // Delete recipe
        await db.delete('recipes', id);

        // Delete associated ingredients
        await db.deleteWhere('ingredients', [['recipe_id', '==', id]]);

        await this.loadRecipes();
        await this.loadIngredients();
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
        const id = db.generateId('ing');
        await db.create('ingredients', ingredient, id);
        await this.loadIngredients();
    }

    /**
     * Update ingredient
     */
    async updateIngredient(recipeId, item, updates) {
        const ingredients = await db.query('ingredients', [
            ['recipe_id', '==', recipeId],
            ['item', '==', item]
        ]);

        if (ingredients.length === 0) {
            throw new Error('Ingredient not found');
        }

        await db.update('ingredients', ingredients[0].id, updates);
        await this.loadIngredients();
    }

    /**
     * Delete ingredient
     */
    async deleteIngredient(recipeId, item) {
        await db.deleteWhere('ingredients', [
            ['recipe_id', '==', recipeId],
            ['item', '==', item]
        ]);
        await this.loadIngredients();
    }

    /**
     * Save all ingredients for a recipe (replaces existing)
     */
    async saveRecipeIngredients(recipeId, newIngredients) {
        // Remove old ingredients
        await db.deleteWhere('ingredients', [['recipe_id', '==', recipeId]]);

        // Add new ingredients
        const operations = newIngredients.map(ingredient => ({
            type: 'set',
            collection: 'ingredients',
            id: db.generateId('ing'),
            data: ingredient
        }));

        if (operations.length > 0) {
            await db.batchWrite(operations);
        }

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
        const id = db.generateId('inv');
        await db.create('inventory', item, id);
        await this.loadInventory();
    }

    /**
     * Update inventory item
     */
    async updateInventoryItem(itemName, updates) {
        const items = await db.query('inventory', [['item', '==', itemName]]);

        if (items.length > 0) {
            await db.update('inventory', items[0].id, updates);
            await this.loadInventory();
        }
    }

    /**
     * Delete inventory item
     */
    async deleteInventoryItem(itemName) {
        await db.deleteWhere('inventory', [['item', '==', itemName]]);
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
        const id = db.generateId('meal');
        await db.create('meal_plans', meal, id);
        await this.loadMealPlan();
    }

    /**
     * Update meal in plan
     */
    async updateMealInPlan(weekStart, day, updates) {
        const meals = await db.query('meal_plans', [
            ['week_start', '==', weekStart],
            ['day', '==', day]
        ]);

        if (meals.length === 0) {
            // Add new meal
            await this.addMealToPlan({ week_start: weekStart, day, ...updates });
        } else {
            // Update existing
            await db.update('meal_plans', meals[0].id, updates);
            await this.loadMealPlan();
        }
    }

    /**
     * Clear meal from plan
     */
    async clearMealFromPlan(weekStart, day) {
        await db.deleteWhere('meal_plans', [
            ['week_start', '==', weekStart],
            ['day', '==', day]
        ]);
        await this.loadMealPlan();
    }

    /**
     * Clear entire week
     */
    async clearWeek(weekStart) {
        await db.deleteWhere('meal_plans', [['week_start', '==', weekStart]]);
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
        await db.deleteWhere('shopping_list', [['week_start', '==', weekStart]]);

        // Add new shopping items
        const operations = shoppingItems.map(item => ({
            type: 'set',
            collection: 'shopping_list',
            id: db.generateId('shop'),
            data: item
        }));

        if (operations.length > 0) {
            await db.batchWrite(operations);
        }

        await this.loadShoppingList();

        return shoppingItems;
    }

    /**
     * Update shopping list item
     */
    async updateShoppingItem(weekStart, item, updates) {
        const items = await db.query('shopping_list', [
            ['week_start', '==', weekStart],
            ['item', '==', item]
        ]);

        if (items.length > 0) {
            await db.update('shopping_list', items[0].id, updates);
            await this.loadShoppingList();
        }
    }

    /**
     * Add manual shopping item
     */
    async addManualShoppingItem(item) {
        const id = db.generateId('shop');
        await db.create('shopping_list', { ...item, manual: 'TRUE' }, id);
        await this.loadShoppingList();
    }

    // === Price History Methods ===

    /**
     * Log actual prices after shopping
     */
    async logPrices(weekStart, prices) {
        const today = new Date().toISOString().split('T')[0];

        const operations = prices.map(p => ({
            type: 'set',
            collection: 'price_history',
            id: db.generateId('price'),
            data: {
                date: today,
                item: p.item,
                price: p.price,
                store: p.store || ''
            }
        }));

        if (operations.length > 0) {
            await db.batchWrite(operations);
        }

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
