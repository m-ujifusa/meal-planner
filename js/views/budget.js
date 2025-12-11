/**
 * Budget Summary View
 * Simple spending visibility and price history
 */

import { store } from '../store.js';
import { getWeekStart, getWeekLabel, getPreviousWeek } from '../utils/date.js';
import { formatCurrency } from '../utils/format.js';

export class BudgetView {
    constructor(params) {
        this.params = params;
    }

    render(container) {
        const currentWeekStart = getWeekStart();
        const lastWeekStart = getPreviousWeek(currentWeekStart);

        const currentShoppingList = store.getShoppingListForWeek(currentWeekStart);
        const priceHistory = store.priceHistory;

        // Calculate current week estimate
        let currentEstimate = 0;
        currentShoppingList.forEach(item => {
            if (item.estimated_price) {
                currentEstimate += parseFloat(item.estimated_price);
            }
        });

        // Calculate last week actual from price history
        const lastWeekPrices = priceHistory.filter(p => {
            if (!p.date) return false;
            const priceDate = new Date(p.date);
            const weekStart = new Date(lastWeekStart);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return priceDate >= weekStart && priceDate < weekEnd;
        });

        let lastWeekActual = 0;
        lastWeekPrices.forEach(p => {
            if (p.price) {
                lastWeekActual += parseFloat(p.price);
            }
        });

        // Get recent price history (last 10 entries)
        const recentHistory = [...priceHistory]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        container.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-6 md:ml-64">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">Budget Summary</h1>

                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <!-- This Week Estimate -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-2">This Week</h2>
                        <p class="text-sm text-gray-600 mb-4">${getWeekLabel(currentWeekStart)}</p>
                        <p class="text-4xl font-bold text-blue-600">${formatCurrency(currentEstimate)}</p>
                        <p class="text-sm text-gray-500 mt-2">Estimated</p>
                    </div>

                    <!-- Last Week Actual -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-2">Last Week</h2>
                        <p class="text-sm text-gray-600 mb-4">${getWeekLabel(lastWeekStart)}</p>
                        <p class="text-4xl font-bold text-green-600">${formatCurrency(lastWeekActual)}</p>
                        <p class="text-sm text-gray-500 mt-2">Actual Spent</p>
                    </div>
                </div>

                <!-- Comparison -->
                ${lastWeekActual > 0 ? `
                    <div class="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">Week-over-Week Comparison</h2>

                        <div class="flex items-center gap-4">
                            <div class="flex-1">
                                <div class="h-8 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        class="h-full bg-blue-600"
                                        style="width: ${Math.min(100, (currentEstimate / Math.max(currentEstimate, lastWeekActual)) * 100)}%"
                                    ></div>
                                </div>
                                <p class="text-sm text-gray-600 mt-2">This Week (Estimated)</p>
                            </div>

                            <div class="flex-1">
                                <div class="h-8 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        class="h-full bg-green-600"
                                        style="width: ${Math.min(100, (lastWeekActual / Math.max(currentEstimate, lastWeekActual)) * 100)}%"
                                    ></div>
                                </div>
                                <p class="text-sm text-gray-600 mt-2">Last Week (Actual)</p>
                            </div>
                        </div>

                        ${currentEstimate > lastWeekActual ? `
                            <p class="mt-4 text-orange-600">
                                This week's estimate is ${formatCurrency(currentEstimate - lastWeekActual)} higher than last week
                            </p>
                        ` : currentEstimate < lastWeekActual ? `
                            <p class="mt-4 text-green-600">
                                This week's estimate is ${formatCurrency(lastWeekActual - currentEstimate)} lower than last week
                            </p>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- Recent Price History -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-xl font-semibold text-gray-900">Recent Price History</h2>
                    </div>

                    ${recentHistory.length > 0 ? `
                        <div class="divide-y divide-gray-200">
                            ${recentHistory.map(entry => `
                                <div class="p-4 flex items-center justify-between">
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-900">${entry.item}</p>
                                        <div class="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <span>${entry.date || 'N/A'}</span>
                                            ${entry.store ? `<span>•</span><span>${entry.store}</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-semibold text-gray-900">${formatCurrency(entry.price)}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="p-12 text-center">
                            <p class="text-gray-500">No price history yet</p>
                            <p class="text-sm text-gray-400 mt-2">Prices will appear here after you log them from shopping trips</p>
                        </div>
                    `}
                </div>

                <!-- Info Box -->
                <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div class="flex">
                        <svg class="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div>
                            <h3 class="text-sm font-semibold text-blue-900 mb-1">How to track prices</h3>
                            <p class="text-sm text-blue-800">
                                After shopping, go to the Shopping List view and use the "Log Actual Prices" feature
                                to record what you actually paid. This will help improve future estimates and track
                                your spending over time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    destroy() {
        // Cleanup if needed
    }
}
