/**
 * Recipes List View
 * Browse and search recipes
 */

import { store } from '../store.js';
import { formatCookTime } from '../utils/format.js';
import { debounce } from '../utils/format.js';

export class RecipesView {
    constructor(params) {
        this.params = params;
        this.searchTerm = '';
        this.container = null;
    }

    render(container) {
        this.container = container;

        container.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-6 md:ml-64">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <h1 class="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Recipes</h1>
                    <a href="#/recipes/new" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center">
                        Add Recipe
                    </a>
                </div>

                <!-- Search -->
                <div class="mb-6">
                    <div class="relative">
                        <input
                            type="text"
                            id="recipe-search"
                            placeholder="Search recipes..."
                            class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                        <svg class="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                </div>

                <!-- Recipe List -->
                <div id="recipe-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${this.renderRecipes()}
                </div>
            </div>
        `;

        // Set up search
        const searchInput = container.querySelector('#recipe-search');
        searchInput.addEventListener('input', debounce((e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.updateRecipeList();
        }, 300));
    }

    renderRecipes() {
        const recipes = store.getRecipes();

        if (recipes.length === 0) {
            return `
                <div class="col-span-full text-center py-12">
                    <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    <p class="text-gray-500 mb-4">No recipes yet</p>
                    <a href="#/recipes/new" class="text-blue-600 hover:underline">Add your first recipe</a>
                </div>
            `;
        }

        const filteredRecipes = this.searchTerm
            ? recipes.filter(r => r.name.toLowerCase().includes(this.searchTerm))
            : recipes;

        if (filteredRecipes.length === 0) {
            return `
                <div class="col-span-full text-center py-12">
                    <p class="text-gray-500">No recipes found matching "${this.searchTerm}"</p>
                </div>
            `;
        }

        return filteredRecipes.map(recipe => `
            <a href="#/recipes/${recipe.id}" class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 block">
                <h3 class="text-xl font-semibold text-gray-900 mb-2">${recipe.name}</h3>

                <div class="flex items-center text-sm text-gray-600 mb-3">
                    ${recipe.cook_time_mins ? `
                        <div class="flex items-center mr-4">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            ${formatCookTime(recipe.cook_time_mins)}
                        </div>
                    ` : ''}

                    ${recipe.servings ? `
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                            ${recipe.servings} servings
                        </div>
                    ` : ''}
                </div>

                ${recipe.source ? `
                    <p class="text-sm text-gray-500">Source: ${recipe.source}</p>
                ` : ''}

                <div class="mt-4 flex items-center text-blue-600 hover:text-blue-700">
                    <span class="text-sm font-medium">View Recipe</span>
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </div>
            </a>
        `).join('');
    }

    updateRecipeList() {
        if (!this.container) return;

        const listContainer = this.container.querySelector('#recipe-list');
        if (listContainer) {
            listContainer.innerHTML = this.renderRecipes();
        }
    }

    destroy() {
        // Cleanup if needed
    }
}
