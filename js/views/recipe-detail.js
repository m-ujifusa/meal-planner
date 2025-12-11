/**
 * Recipe Detail View
 * Shows full recipe with ingredients and instructions
 */

import { store } from '../store.js';
import { formatCookTime, nl2br, confirm, showLoading, hideLoading, showSuccess, showError } from '../utils/format.js';
import { formatQuantity } from '../utils/units.js';

export class RecipeDetailView {
    constructor(params) {
        this.params = params;
        this.recipeId = params.id;
    }

    render(container) {
        const recipe = store.getRecipe(this.recipeId);

        if (!recipe) {
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

        const ingredients = store.getRecipeIngredients(this.recipeId);

        container.innerHTML = `
            <div class="max-w-4xl mx-auto px-4 py-6 md:ml-64">
                <!-- Back Button -->
                <a href="#/recipes" class="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    Back to recipes
                </a>

                <!-- Recipe Header -->
                <div class="bg-white rounded-lg shadow mb-6">
                    <div class="p-6">
                        <div class="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                            <div class="flex-1">
                                <h1 class="text-3xl font-bold text-gray-900 mb-3">${recipe.name}</h1>

                                <div class="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                                    ${recipe.cook_time_mins ? `
                                        <div class="flex items-center">
                                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                            ${formatCookTime(recipe.cook_time_mins)}
                                        </div>
                                    ` : ''}

                                    ${recipe.servings ? `
                                        <div class="flex items-center">
                                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                            </svg>
                                            ${recipe.servings} servings
                                        </div>
                                    ` : ''}
                                </div>

                                ${recipe.source ? `
                                    ${recipe.source.startsWith('http') ? `
                                        <a href="${recipe.source}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
                                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                            </svg>
                                            View Original Recipe
                                        </a>
                                    ` : `
                                        <p class="text-sm text-gray-500">Source: ${recipe.source}</p>
                                    `}
                                ` : ''}
                            </div>

                            <div class="flex gap-2 mt-4 md:mt-0">
                                <a href="#/recipes/${recipe.id}/edit" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                    Edit
                                </a>
                                <button id="delete-recipe" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ingredients -->
                <div class="bg-white rounded-lg shadow mb-6">
                    <div class="p-6">
                        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Ingredients</h2>

                        ${ingredients.length > 0 ? `
                            <ul class="space-y-2">
                                ${ingredients.map(ing => `
                                    <li class="flex items-start">
                                        <span class="text-blue-600 mr-2">•</span>
                                        <span class="text-gray-700">
                                            ${formatQuantity(ing.quantity)} ${ing.unit} ${ing.item}
                                            ${ing.category ? `<span class="text-sm text-gray-500">(${ing.category})</span>` : ''}
                                        </span>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : `
                            <p class="text-gray-500">No ingredients listed</p>
                        `}
                    </div>
                </div>

                <!-- Instructions -->
                <div class="bg-white rounded-lg shadow mb-6">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-2xl font-semibold text-gray-900">Instructions</h2>
                            ${recipe.source && recipe.source.startsWith('http') ? `
                                <a href="${recipe.source}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                    </svg>
                                    View Original
                                </a>
                            ` : ''}
                        </div>

                        ${recipe.instructions ? `
                            <div class="text-gray-700 whitespace-pre-wrap">${nl2br(recipe.instructions)}</div>
                        ` : `
                            <p class="text-gray-500">No instructions provided</p>
                        `}
                    </div>
                </div>

                <!-- Add to Week Button -->
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <a href="#/planner" class="block bg-green-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                            Add to Meal Plan
                        </a>
                    </div>
                </div>
            </div>
        `;

        // Set up delete button
        const deleteButton = container.querySelector('#delete-recipe');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => this.handleDelete());
        }
    }

    async handleDelete() {
        const confirmed = await confirm('Are you sure you want to delete this recipe? This action cannot be undone.');

        if (!confirmed) return;

        try {
            showLoading();
            await store.deleteRecipe(this.recipeId);
            showSuccess('Recipe deleted successfully');
            window.location.hash = '#/recipes';
        } catch (error) {
            console.error('Error deleting recipe:', error);
            showError('Failed to delete recipe');
        } finally {
            hideLoading();
        }
    }

    destroy() {
        // Cleanup if needed
    }
}
