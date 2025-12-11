/**
 * Home Dashboard View
 * Week-at-a-glance with summary
 */

import { store } from '../store.js';
import { getWeekStart, getWeekLabel, getDaysOfWeek, getDayLabel } from '../utils/date.js';
import { formatCurrency } from '../utils/format.js';

export class HomeView {
    constructor(params) {
        this.params = params;
        this.weekStart = getWeekStart();
    }

    render(container) {
        const weekLabel = getWeekLabel(this.weekStart);
        const meals = store.getMealPlanForWeek(this.weekStart);
        const shoppingItems = store.getShoppingListForWeek(this.weekStart);

        // Calculate estimated total
        let estimatedTotal = 0;
        shoppingItems.forEach(item => {
            if (item.estimated_price) {
                estimatedTotal += parseFloat(item.estimated_price);
            }
        });

        const mealsCount = meals.filter(m => m.recipe_id).length;

        container.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-6 md:ml-64">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <!-- Meals Planned -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm text-gray-600">Meals Planned</p>
                                <p class="text-2xl font-bold text-gray-900">${mealsCount} / 7</p>
                            </div>
                        </div>
                    </div>

                    <!-- Shopping Items -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 bg-green-100 rounded-lg p-3">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm text-gray-600">Shopping Items</p>
                                <p class="text-2xl font-bold text-gray-900">${shoppingItems.length}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Estimated Cost -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm text-gray-600">Estimated Cost</p>
                                <p class="text-2xl font-bold text-gray-900">${formatCurrency(estimatedTotal)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Week View -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-xl font-semibold text-gray-900">${weekLabel}</h2>
                    </div>

                    <div class="p-6">
                        <div class="space-y-3">
                            ${this.renderWeekDays(meals)}
                        </div>

                        <!-- Action Buttons -->
                        <div class="mt-6 flex flex-col sm:flex-row gap-3">
                            <a href="#/planner" class="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                Plan This Week
                            </a>
                            ${mealsCount > 0 ? `
                                <a href="#/shopping" class="flex-1 bg-green-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                                    View Shopping List
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Quick Links -->
                <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <a href="#/recipes" class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                        <div class="flex items-center">
                            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                            <div class="ml-4">
                                <h3 class="text-lg font-semibold text-gray-900">Recipe Collection</h3>
                                <p class="text-gray-600">${store.getRecipes().length} recipes</p>
                            </div>
                        </div>
                    </a>

                    <a href="#/inventory" class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                        <div class="flex items-center">
                            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                            </svg>
                            <div class="ml-4">
                                <h3 class="text-lg font-semibold text-gray-900">Kitchen Inventory</h3>
                                <p class="text-gray-600">${store.getInventory().length} items tracked</p>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        `;
    }

    renderWeekDays(meals) {
        const days = getDaysOfWeek();
        const mealsByDay = {};

        meals.forEach(meal => {
            mealsByDay[meal.day] = meal;
        });

        return days.map(day => {
            const meal = mealsByDay[day];
            const recipe = meal?.recipe_id ? store.getRecipe(meal.recipe_id) : null;

            return `
                <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div class="flex items-center">
                        <span class="font-semibold text-gray-700 w-24">${getDayLabel(day)}</span>
                        ${recipe ? `
                            <span class="text-gray-900">${recipe.name}</span>
                            ${recipe.cook_time_mins ? `
                                <span class="ml-2 text-sm text-gray-500">(${recipe.cook_time_mins} min)</span>
                            ` : ''}
                        ` : `
                            <span class="text-gray-400 italic">Not planned</span>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    destroy() {
        // Cleanup if needed
    }
}
