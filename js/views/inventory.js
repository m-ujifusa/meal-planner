/**
 * Kitchen Inventory View
 * Track pantry staples and their status
 */

import { store } from '../store.js';
import { getCategories, getCategoryColor } from '../utils/units.js';
import { formatCurrency, showLoading, hideLoading, showSuccess, showError } from '../utils/format.js';

export class InventoryView {
    constructor(params) {
        this.params = params;
        this.container = null;
        this.showingAddForm = false;
    }

    render(container) {
        this.container = container;
        this.renderContent();
    }

    renderContent() {
        if (!this.container) return;

        const inventory = store.getInventory();

        // Group by category
        const grouped = {};
        getCategories().forEach(cat => {
            grouped[cat] = [];
        });

        inventory.forEach(item => {
            const category = item.category || 'other';
            if (grouped[category]) {
                grouped[category].push(item);
            }
        });

        this.container.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-6 md:ml-64">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <h1 class="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Kitchen Inventory</h1>
                    <button
                        id="add-item-btn"
                        class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Add Item
                    </button>
                </div>

                <!-- Add Item Form -->
                <div id="add-form" class="${this.showingAddForm ? '' : 'hidden'} bg-white rounded-lg shadow p-6 mb-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Add Inventory Item</h2>

                    <form id="inventory-form" class="space-y-4">
                        <div>
                            <label for="item-name" class="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                            <input
                                type="text"
                                id="item-name"
                                required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="item-category" class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select
                                    id="item-category"
                                    required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select category</option>
                                    ${getCategories().map(cat => `
                                        <option value="${cat}">${cat}</option>
                                    `).join('')}
                                </select>
                            </div>

                            <div>
                                <label for="item-status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    id="item-status"
                                    required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="have">Have</option>
                                    <option value="low">Low</option>
                                    <option value="out">Out</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label for="item-price" class="block text-sm font-medium text-gray-700 mb-2">Typical Price (optional)</label>
                            <input
                                type="number"
                                id="item-price"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                        </div>

                        <div class="flex gap-3">
                            <button
                                type="submit"
                                class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Add Item
                            </button>
                            <button
                                type="button"
                                id="cancel-add"
                                class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Inventory List -->
                ${inventory.length === 0 ? `
                    <div class="bg-white rounded-lg shadow p-12 text-center">
                        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                        <p class="text-gray-500 mb-4">No inventory items yet</p>
                        <button
                            class="text-blue-600 hover:underline add-first-item"
                        >
                            Add your first item
                        </button>
                    </div>
                ` : `
                    <div class="space-y-6">
                        ${getCategories().map(category => {
                            const items = grouped[category];
                            if (items.length === 0) return '';

                            return `
                                <div class="bg-white rounded-lg shadow">
                                    <div class="px-6 py-4 border-b border-gray-200">
                                        <h2 class="text-lg font-semibold text-gray-900 capitalize">${category}</h2>
                                    </div>

                                    <div class="divide-y divide-gray-200">
                                        ${items.map(item => this.renderInventoryItem(item)).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;

        this.setupEventListeners();
    }

    renderInventoryItem(item) {
        const statusColors = {
            'have': 'bg-green-100 text-green-800',
            'low': 'bg-yellow-100 text-yellow-800',
            'out': 'bg-red-100 text-red-800',
        };

        return `
            <div class="p-6 flex items-center justify-between">
                <div class="flex-1">
                    <h3 class="font-medium text-gray-900">${item.item}</h3>
                    ${item.typical_price ? `
                        <p class="text-sm text-gray-500 mt-1">${formatCurrency(item.typical_price)}</p>
                    ` : ''}
                </div>

                <div class="flex items-center gap-4">
                    <select
                        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent status-select"
                        data-item="${item.item}"
                    >
                        <option value="have" ${item.status === 'have' ? 'selected' : ''}>Have</option>
                        <option value="low" ${item.status === 'low' ? 'selected' : ''}>Low</option>
                        <option value="out" ${item.status === 'out' ? 'selected' : ''}>Out</option>
                    </select>

                    <span class="px-3 py-1 text-xs rounded-full ${statusColors[item.status] || statusColors['out']}">${item.status}</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        if (!this.container) return;

        // Add item button
        const addButton = this.container.querySelector('#add-item-btn');
        if (addButton) {
            addButton.addEventListener('click', () => {
                this.showingAddForm = true;
                this.renderContent();
            });
        }

        // Add first item button
        const addFirstButton = this.container.querySelector('.add-first-item');
        if (addFirstButton) {
            addFirstButton.addEventListener('click', () => {
                this.showingAddForm = true;
                this.renderContent();
            });
        }

        // Cancel add
        const cancelButton = this.container.querySelector('#cancel-add');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.showingAddForm = false;
                this.renderContent();
            });
        }

        // Form submission
        const form = this.container.querySelector('#inventory-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddItem();
            });
        }

        // Status changes (delegated)
        this.container.addEventListener('change', async (e) => {
            if (e.target.classList.contains('status-select')) {
                const itemName = e.target.dataset.item;
                const newStatus = e.target.value;

                try {
                    await store.updateInventoryItem(itemName, { status: newStatus });
                    showSuccess('Status updated');
                    this.renderContent();
                } catch (error) {
                    console.error('Error updating status:', error);
                    showError('Failed to update status');
                }
            }
        });
    }

    async handleAddItem() {
        const name = document.getElementById('item-name').value.trim().toLowerCase();
        const category = document.getElementById('item-category').value;
        const status = document.getElementById('item-status').value;
        const price = document.getElementById('item-price').value;

        const item = {
            item: name,
            category: category,
            status: status,
            typical_price: price || '',
        };

        try {
            showLoading();
            await store.addInventoryItem(item);
            showSuccess('Item added successfully');
            this.showingAddForm = false;
            this.renderContent();
        } catch (error) {
            console.error('Error adding item:', error);
            showError('Failed to add item');
        } finally {
            hideLoading();
        }
    }

    destroy() {
        // Cleanup if needed
    }
}
