/**
 * Display formatting utilities
 */

/**
 * Format currency
 * @param {number|string} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
    if (!amount || amount === '') return '$0.00';

    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(num)) return '$0.00';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(num);
}

/**
 * Format time in minutes to readable format
 * @param {number|string} minutes
 * @returns {string}
 */
export function formatCookTime(minutes) {
    if (!minutes) return '';

    const num = typeof minutes === 'string' ? parseInt(minutes) : minutes;

    if (num < 60) {
        return `${num} min`;
    }

    const hours = Math.floor(num / 60);
    const mins = num % 60;

    if (mins === 0) {
        return `${hours} hr`;
    }

    return `${hours} hr ${mins} min`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 100) {
    if (!text) return '';

    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
    if (!text) return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Convert newlines to <br> tags
 * @param {string} text
 * @returns {string}
 */
export function nl2br(text) {
    if (!text) return '';

    return escapeHtml(text).replace(/\n/g, '<br>');
}

/**
 * Pluralize a word based on count
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
export function pluralize(count, singular, plural = null) {
    if (count === 1) {
        return singular;
    }

    return plural || (singular + 's');
}

/**
 * Get status badge HTML
 * @param {string} status
 * @returns {string}
 */
export function getStatusBadge(status) {
    const badges = {
        'have': '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Have</span>',
        'low': '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Low</span>',
        'out': '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Out</span>',
    };

    return badges[status.toLowerCase()] || badges['out'];
}

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show loading indicator
 */
export function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('hidden');
    }
}

/**
 * Hide loading indicator
 */
export function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

/**
 * Show error message
 * @param {string} message
 */
export function showError(message) {
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
    toast.innerHTML = `
        <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>${escapeHtml(message)}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

/**
 * Show success message
 * @param {string} message
 */
export function showSuccess(message) {
    // Create success toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
    toast.innerHTML = `
        <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>${escapeHtml(message)}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Confirm dialog
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export function confirm(message) {
    return new Promise((resolve) => {
        const result = window.confirm(message);
        resolve(result);
    });
}
