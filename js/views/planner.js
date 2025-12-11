/**
 * Meal Planner View
 * Assign recipes to days of the week
 */

import { store } from '../store.js';
import {
    getWeekStart,
    getWeekLabel,
    getPreviousWeek,
    getNextWeek,
    getDaysOfWeek,
    getDayLabel,
    isCurrentWeek
} from '../utils/date.js';
import { formatCookTime, showLoading, hideLoading, showSuccess, showError, confirm } from '../utils/format.js';

export class PlannerView {
    constructor(params) {
        this.params = params;
        this.weekStart = getWeekStart();
        this.container = null;
    }

    render(container) {
        this.container = container;
        this.renderContent();
    }

    renderContent() {
        if (!this.container) return;

        const weekLabel = getWeekLabel(this.weekStart);
        const meals = store.getMealPlanForWeek(this.weekStart);
        const recipes = store.getRecipes();

        const mealsByDay = {};
        meals.forEach(meal => {
            mealsByDay[meal.day] = meal;
        });

        this.container.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-6 md:ml-64">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <h1 class="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Meal Planner</h1>
                </div>

                <!-- Week Selector -->
                <div class="bg-white rounded-lg shadow mb-6">
                    <div class="px-6 py-4 flex items-center justify-between">
                        <button id="prev-week" class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                        </button>

                        <div class="text-center">
                            <h2 class="text-xl font-semibold text-gray-900">${weekLabel}</h2>
                            ${isCurrentWeek(this.weekStart) ?
                                '<span class="text-sm text-blue-600">Current Week</span>' :
                                ''
                            }
                        </div>

                        <button id="next-week" class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Days List -->
                <div class="bg-white rounded-lg shadow mb-6">
                    <div class="divide-y divide-gray-200">
                        ${this.renderDays(mealsByDay, recipes)}
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row gap-3">
                    <button
                        id="generate-shopping"
                        class="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        Generate Shopping List
                    </button>
                    <button
                        id="clear-week"
                        class="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        Clear Week
                    </button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderDays(mealsByDay, recipes) {
        const days = getDaysOfWeek();

        return days.map(day => {
            const meal = mealsByDay[day];
            const recipe = meal?.recipe_id ? store.getRecipe(meal.recipe_id) : null;

            return `
                <div class="p-6">
                    <div class="flex flex-col md:flex-row md:items-center gap-4">
                        <div class="md:w-32">
                            <span class="font-semibold text-gray-700">${getDayLabel(day)}</span>
                        </div>

                        <div class="flex-1">
                            <select
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent recipe-select"
                                data-day="${day}"
                            >
                                <option value="">Select a recipe...</option>
                                ${recipes.map(r => `
                                    <option value="${r.id}" ${recipe?.id === r.id ? 'selected' : ''}>
                                        ${r.name} ${r.cook_time_mins ? `(${r.cook_time_mins} min)` : ''}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        ${recipe ? `
                            <div class="flex items-center gap-2">
                                ${recipe.cook_time_mins ? `
                                    <span class="text-sm text-gray-600">${formatCookTime(recipe.cook_time_mins)}</span>
                                ` : ''}
                                <button
                                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors clear-day"
                                    data-day="${day}"
                                >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        if (!this.container) return;

        // Week navigation
        const prevButton = this.container.querySelector('#prev-week');
        const nextButton = this.container.querySelector('#next-week');

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.weekStart = getPreviousWeek(this.weekStart);
                this.renderContent();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.weekStart = getNextWeek(this.weekStart);
                this.renderContent();
            });
        }

        // Recipe selection (delegated)
        this.container.addEventListener('change', async (e) => {
            if (e.target.classList.contains('recipe-select')) {
                const day = e.target.dataset.day;
                const recipeId = e.target.value;

                try {
                    showLoading();

                    if (recipeId) {
                        await store.updateMealInPlan(this.weekStart, day, { recipe_id: recipeId });
                        showSuccess('Meal updated');
                    } else {
                        await store.clearMealFromPlan(this.weekStart, day);
                        showSuccess('Meal cleared');
                    }

                    this.renderContent();
                } catch (error) {
                    console.error('Error updating meal plan:', error);
                    showError('Failed to update meal plan');
                } finally {
                    hideLoading();
                }
            }
        });

        // Clear day buttons (delegated)
        this.container.addEventListener('click', async (e) => {
            const clearButton = e.target.closest('.clear-day');
            if (clearButton) {
                const day = clearButton.dataset.day;

                try {
                    showLoading();
                    await store.clearMealFromPlan(this.weekStart, day);
                    showSuccess('Meal cleared');
                    this.renderContent();
                } catch (error) {
                    console.error('Error clearing meal:', error);
                    showError('Failed to clear meal');
                } finally {
                    hideLoading();
                }
            }
        });

        // Generate shopping list
        const generateButton = this.container.querySelector('#generate-shopping');
        if (generateButton) {
            generateButton.addEventListener('click', async () => {
                try {
                    showLoading();
                    await store.generateShoppingList(this.weekStart);
                    showSuccess('Shopping list generated');
                    window.location.hash = '#/shopping';
                } catch (error) {
                    console.error('Error generating shopping list:', error);
                    showError(error.message || 'Failed to generate shopping list');
                } finally {
                    hideLoading();
                }
            });
        }

        // Clear week
        const clearButton = this.container.querySelector('#clear-week');
        if (clearButton) {
            clearButton.addEventListener('click', async () => {
                const confirmed = await confirm('Are you sure you want to clear all meals for this week?');

                if (!confirmed) return;

                try {
                    showLoading();
                    await store.clearWeek(this.weekStart);
                    showSuccess('Week cleared');
                    this.renderContent();
                } catch (error) {
                    console.error('Error clearing week:', error);
                    showError('Failed to clear week');
                } finally {
                    hideLoading();
                }
            });
        }
    }

    destroy() {
        // Cleanup if needed
    }
}
