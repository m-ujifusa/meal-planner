/**
 * Shopping List View
 * Generated list for grocery shopping with print support
 */

import { store } from '../store.js';
import { getWeekStart, getWeekLabel, getPreviousWeek, getNextWeek, isCurrentWeek } from '../utils/date.js';
import { formatCurrency, formatQuantity } from '../utils/format.js';
import { getCategoryColor } from '../utils/units.js';
import { showLoading, hideLoading, showSuccess, showError } from '../utils/format.js';

export class ShoppingView {
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
        const items = store.getShoppingListForWeek(this.weekStart);

        // Group by category
        const grouped = {};
        items.forEach(item => {
            const category = item.category || 'other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(item);
        });

        // Sort items within categories - unchecked first
        Object.keys(grouped).forEach(category => {
            grouped[category].sort((a, b) => {
                if (a.checked === b.checked) return 0;
                return a.checked === 'TRUE' ? 1 : -1;
            });
        });

        // Calculate total
        let estimatedTotal = 0;
        items.forEach(item => {
            if (item.estimated_price) {
                estimatedTotal += parseFloat(item.estimated_price);
            }
        });

        this.container.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-6 md:ml-64">
                <!-- Header (hide on print) -->
                <div class="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <h1 class="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Shopping List</h1>

                    <div class="flex gap-2">
                        <button
                            id="print-button"
                            class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Print List
                        </button>
                        <button
                            id="regenerate-button"
                            class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Regenerate
                        </button>
                    </div>
                </div>

                <!-- Week Selector (hide on print) -->
                <div class="no-print bg-white rounded-lg shadow mb-6">
                    <div class="px-6 py-4 flex items-center justify-between">
                        <button id="prev-week" class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                        </button>

                        <div class="text-center">
                            <h2 class="text-xl font-semibold text-gray-900">${weekLabel}</h2>
                            ${isCurrentWeek(this.weekStart) ? '<span class="text-sm text-blue-600">Current Week</span>' : ''}
                        </div>

                        <button id="next-week" class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </div>
                </div>

                ${items.length === 0 ? `
                    <div class="no-print bg-white rounded-lg shadow p-12 text-center">
                        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        <p class="text-gray-500 mb-4">No shopping list for this week</p>
                        <a href="#/planner" class="text-blue-600 hover:underline">Plan meals and generate list</a>
                    </div>
                ` : `
                    <!-- Print Header (show only on print) -->
                    <div class="print-only">
                        <h1 class="print-title">Shopping List</h1>
                        <p class="print-subtitle">${weekLabel}</p>
                    </div>

                    <!-- Shopping List -->
                    <div class="space-y-6">
                        ${Object.keys(grouped).sort().map(category => `
                            <div class="bg-white rounded-lg shadow print-section">
                                <div class="px-6 py-4 border-b border-gray-200">
                                    <h2 class="text-lg font-semibold text-gray-900 capitalize">${category}</h2>
                                </div>

                                <div class="divide-y divide-gray-200">
                                    ${grouped[category].map(item => this.renderShoppingItem(item)).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Total -->
                    <div class="bg-white rounded-lg shadow mt-6 print-section">
                        <div class="px-6 py-4 flex items-center justify-between">
                            <span class="text-lg font-semibold text-gray-900">Estimated Total</span>
                            <span class="text-2xl font-bold text-gray-900">${formatCurrency(estimatedTotal)}</span>
                        </div>
                    </div>
                `}
            </div>
        `;

        this.setupEventListeners();
    }

    renderShoppingItem(item) {
        const isChecked = item.checked === 'TRUE';

        return `
            <div class="p-4 flex items-center gap-4 print-item">
                <input
                    type="checkbox"
                    ${isChecked ? 'checked' : ''}
                    class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 no-print item-checkbox"
                    data-item="${item.item}"
                >
                <div class="print-checkbox"></div>

                <div class="flex-1 ${isChecked ? 'opacity-50' : ''}">
                    <p class="font-medium text-gray-900 ${isChecked ? 'line-through' : ''}">
                        ${item.item}
                    </p>
                    <p class="text-sm text-gray-600">
                        ${formatQuantity(item.quantity)} ${item.unit}
                    </p>
                </div>

                ${item.estimated_price ? `
                    <div class="text-right ${isChecked ? 'opacity-50' : ''}">
                        <p class="font-medium text-gray-900">${formatCurrency(item.estimated_price)}</p>
                    </div>
                ` : ''}
            </div>
        `;
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

        // Print button
        const printButton = this.container.querySelector('#print-button');
        if (printButton) {
            printButton.addEventListener('click', () => {
                window.print();
            });
        }

        // Regenerate button
        const regenerateButton = this.container.querySelector('#regenerate-button');
        if (regenerateButton) {
            regenerateButton.addEventListener('click', async () => {
                try {
                    showLoading();
                    await store.generateShoppingList(this.weekStart);
                    showSuccess('Shopping list regenerated');
                    this.renderContent();
                } catch (error) {
                    console.error('Error regenerating shopping list:', error);
                    showError(error.message || 'Failed to regenerate shopping list');
                } finally {
                    hideLoading();
                }
            });
        }

        // Checkbox changes (delegated)
        this.container.addEventListener('change', async (e) => {
            if (e.target.classList.contains('item-checkbox')) {
                const itemName = e.target.dataset.item;
                const checked = e.target.checked ? 'TRUE' : 'FALSE';

                try {
                    await store.updateShoppingItem(this.weekStart, itemName, { checked });
                    this.renderContent();
                } catch (error) {
                    console.error('Error updating item:', error);
                    showError('Failed to update item');
                }
            }
        });
    }

    destroy() {
        // Cleanup if needed
    }
}
