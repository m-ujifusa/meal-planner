/**
 * Recipe Form View
 * Add/Edit recipe with ingredients
 */

import { store } from '../store.js';
import { showLoading, hideLoading, showSuccess, showError } from '../utils/format.js';
import { getCategories, normalizeItemName } from '../utils/units.js';

export class RecipeFormView {
    constructor(params) {
        this.params = params;
        this.recipeId = params.id;
        this.isEditing = !!this.recipeId;
        this.ingredients = [];
        this.container = null;
    }

    render(container) {
        this.container = container;

        const recipe = this.isEditing ? store.getRecipe(this.recipeId) : null;

        if (this.isEditing && !recipe) {
            container.innerHTML = `
                <div class="max-w-7xl mx-auto px-4 py-6 md:ml-64">
                    <div class="text-center py-12">
                        <p class="text-gray-500 mb-4">Recipe not found</p>
                        <a href="#/recipes" class="text-blue-600 hover:underline">Back to recipes</a>
                    </div>
                </div>
            `;
            return;
        }

        // Initialize ingredients from existing recipe
        if (this.isEditing) {
            this.ingredients = store.getRecipeIngredients(this.recipeId);
        }

        container.innerHTML = `
            <div class="max-w-4xl mx-auto px-4 py-6 md:ml-64">
                <!-- Back Button -->
                <a href="${this.isEditing ? `#/recipes/${this.recipeId}` : '#/recipes'}" class="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    Back
                </a>

                <!-- Header -->
                <h1 class="text-3xl font-bold text-gray-900 mb-6">
                    ${this.isEditing ? 'Edit Recipe' : 'Add New Recipe'}
                </h1>

                <!-- Form -->
                <form id="recipe-form" class="space-y-6">
                    <!-- Basic Info -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

                        <div class="space-y-4">
                            <div>
                                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                                    Recipe Name <span class="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    value="${recipe?.name || ''}"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="cook_time_mins" class="block text-sm font-medium text-gray-700 mb-2">
                                        Cook Time (minutes) <span class="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="cook_time_mins"
                                        name="cook_time_mins"
                                        required
                                        min="1"
                                        value="${recipe?.cook_time_mins || ''}"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                </div>

                                <div>
                                    <label for="servings" class="block text-sm font-medium text-gray-700 mb-2">
                                        Servings <span class="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="servings"
                                        name="servings"
                                        required
                                        min="1"
                                        step="0.5"
                                        value="${recipe?.servings || 4}"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                </div>
                            </div>

                            <div>
                                <label for="source" class="block text-sm font-medium text-gray-700 mb-2">
                                    Source (optional)
                                </label>
                                <input
                                    type="text"
                                    id="source"
                                    name="source"
                                    value="${recipe?.source || ''}"
                                    placeholder="e.g., Mom's cookbook, Food Network"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                            </div>

                            <div>
                                <label for="instructions" class="block text-sm font-medium text-gray-700 mb-2">
                                    Instructions <span class="text-red-600">*</span>
                                </label>
                                <textarea
                                    id="instructions"
                                    name="instructions"
                                    required
                                    rows="8"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >${recipe?.instructions || ''}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Ingredients -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>

                        <div id="ingredients-list" class="space-y-3 mb-4">
                            ${this.renderIngredients()}
                        </div>

                        <button
                            type="button"
                            id="add-ingredient"
                            class="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                        >
                            <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                            Add Ingredient
                        </button>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3">
                        <button
                            type="submit"
                            class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            ${this.isEditing ? 'Update Recipe' : 'Save Recipe'}
                        </button>
                        <a
                            href="${this.isEditing ? `#/recipes/${this.recipeId}` : '#/recipes'}"
                            class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        `;

        // Set up event listeners
        this.setupEventListeners();
    }

    renderIngredients() {
        if (this.ingredients.length === 0) {
            return '<p class="text-gray-500">No ingredients added yet</p>';
        }

        return this.ingredients.map((ing, index) => `
            <div class="grid grid-cols-12 gap-2 items-start ingredient-row">
                <div class="col-span-12 md:col-span-4">
                    <input
                        type="text"
                        placeholder="Item name"
                        value="${ing.item || ''}"
                        data-index="${index}"
                        data-field="item"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ingredient-input"
                    >
                </div>
                <div class="col-span-6 md:col-span-2">
                    <input
                        type="text"
                        placeholder="Qty"
                        value="${ing.quantity || ''}"
                        data-index="${index}"
                        data-field="quantity"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ingredient-input"
                    >
                </div>
                <div class="col-span-6 md:col-span-2">
                    <input
                        type="text"
                        placeholder="Unit"
                        value="${ing.unit || ''}"
                        data-index="${index}"
                        data-field="unit"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ingredient-input"
                    >
                </div>
                <div class="col-span-10 md:col-span-3">
                    <select
                        data-index="${index}"
                        data-field="category"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ingredient-input"
                    >
                        <option value="">Category</option>
                        ${getCategories().map(cat => `
                            <option value="${cat}" ${ing.category === cat ? 'selected' : ''}>${cat}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="col-span-2 md:col-span-1">
                    <button
                        type="button"
                        class="w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors remove-ingredient"
                        data-index="${index}"
                    >
                        <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        if (!this.container) return;

        // Add ingredient button
        const addButton = this.container.querySelector('#add-ingredient');
        if (addButton) {
            addButton.addEventListener('click', () => {
                this.ingredients.push({
                    item: '',
                    quantity: '',
                    unit: '',
                    category: '',
                });
                this.updateIngredientsList();
            });
        }

        // Ingredient inputs (delegated)
        this.container.addEventListener('input', (e) => {
            if (e.target.classList.contains('ingredient-input')) {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                this.ingredients[index][field] = e.target.value;
            }
        });

        // Remove ingredient buttons (delegated)
        this.container.addEventListener('click', (e) => {
            const removeButton = e.target.closest('.remove-ingredient');
            if (removeButton) {
                const index = parseInt(removeButton.dataset.index);
                this.ingredients.splice(index, 1);
                this.updateIngredientsList();
            }
        });

        // Form submission
        const form = this.container.querySelector('#recipe-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }
    }

    updateIngredientsList() {
        const listContainer = this.container?.querySelector('#ingredients-list');
        if (listContainer) {
            listContainer.innerHTML = this.renderIngredients();
        }
    }

    async handleSubmit() {
        const form = this.container.querySelector('#recipe-form');
        const formData = new FormData(form);

        const recipeData = {
            name: formData.get('name'),
            cook_time_mins: formData.get('cook_time_mins'),
            servings: formData.get('servings'),
            source: formData.get('source') || '',
            instructions: formData.get('instructions'),
        };

        // Validate ingredients
        const validIngredients = this.ingredients.filter(ing =>
            ing.item && ing.quantity && ing.unit && ing.category
        );

        if (validIngredients.length === 0) {
            showError('Please add at least one complete ingredient');
            return;
        }

        try {
            showLoading();

            if (this.isEditing) {
                // Update recipe
                await store.updateRecipe(this.recipeId, recipeData);

                // Update ingredients
                const ingredientsWithRecipeId = validIngredients.map(ing => ({
                    recipe_id: this.recipeId,
                    item: normalizeItemName(ing.item),
                    quantity: ing.quantity,
                    unit: ing.unit,
                    category: ing.category,
                }));

                await store.saveRecipeIngredients(this.recipeId, ingredientsWithRecipeId);

                showSuccess('Recipe updated successfully');
                window.location.hash = `#/recipes/${this.recipeId}`;
            } else {
                // Create new recipe
                const newRecipe = await store.addRecipe(recipeData);

                // Add ingredients
                const ingredientsWithRecipeId = validIngredients.map(ing => ({
                    recipe_id: newRecipe.id,
                    item: normalizeItemName(ing.item),
                    quantity: ing.quantity,
                    unit: ing.unit,
                    category: ing.category,
                }));

                await store.saveRecipeIngredients(newRecipe.id, ingredientsWithRecipeId);

                showSuccess('Recipe added successfully');
                window.location.hash = `#/recipes/${newRecipe.id}`;
            }
        } catch (error) {
            console.error('Error saving recipe:', error);
            showError('Failed to save recipe');
        } finally {
            hideLoading();
        }
    }

    destroy() {
        // Cleanup if needed
    }
}
