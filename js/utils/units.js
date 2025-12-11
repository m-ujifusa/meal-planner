/**
 * Unit normalization utilities
 */

/**
 * Common unit abbreviations and their standard forms
 */
const unitMap = {
    // Volume
    'tsp': 'tsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'tbsp': 'tbsp',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'cup': 'cup',
    'cups': 'cup',
    'c': 'cup',
    'fl oz': 'fl oz',
    'fluid ounce': 'fl oz',
    'fluid ounces': 'fl oz',
    'pt': 'pt',
    'pint': 'pt',
    'pints': 'pt',
    'qt': 'qt',
    'quart': 'qt',
    'quarts': 'qt',
    'gal': 'gal',
    'gallon': 'gal',
    'gallons': 'gal',
    'ml': 'ml',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'l': 'l',
    'liter': 'l',
    'liters': 'l',

    // Weight
    'oz': 'oz',
    'ounce': 'oz',
    'ounces': 'oz',
    'lb': 'lb',
    'lbs': 'lb',
    'pound': 'lb',
    'pounds': 'lb',
    'g': 'g',
    'gram': 'g',
    'grams': 'g',
    'kg': 'kg',
    'kilogram': 'kg',
    'kilograms': 'kg',

    // Count
    'piece': 'piece',
    'pieces': 'piece',
    'whole': 'whole',
    'count': 'count',
    'each': 'each',

    // Other
    'clove': 'clove',
    'cloves': 'clove',
    'can': 'can',
    'cans': 'can',
    'package': 'package',
    'packages': 'package',
    'bunch': 'bunch',
    'bunches': 'bunch',
};

/**
 * Normalize a unit to its standard form
 * @param {string} unit
 * @returns {string}
 */
export function normalizeUnit(unit) {
    if (!unit) return '';
    const normalized = unit.toLowerCase().trim();
    return unitMap[normalized] || normalized;
}

/**
 * Parse a quantity string (e.g., "1/2", "1.5", "2 1/4")
 * @param {string} quantityStr
 * @returns {number}
 */
export function parseQuantity(quantityStr) {
    if (typeof quantityStr === 'number') {
        return quantityStr;
    }

    if (!quantityStr) return 0;

    const str = quantityStr.toString().trim();

    // Handle fractions like "1/2" or mixed numbers like "1 1/2"
    const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
        const whole = parseInt(mixedMatch[1]);
        const numerator = parseInt(mixedMatch[2]);
        const denominator = parseInt(mixedMatch[3]);
        return whole + (numerator / denominator);
    }

    const fractionMatch = str.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
        const numerator = parseInt(fractionMatch[1]);
        const denominator = parseInt(fractionMatch[2]);
        return numerator / denominator;
    }

    // Handle decimal numbers
    return parseFloat(str) || 0;
}

/**
 * Format a quantity for display (round to practical amounts)
 * @param {number} quantity
 * @returns {string}
 */
export function formatQuantity(quantity) {
    if (!quantity) return '0';

    // Round to 2 decimal places
    const rounded = Math.round(quantity * 100) / 100;

    // Remove trailing zeros
    return rounded.toString().replace(/\.?0+$/, '');
}

/**
 * Get category color for styling
 * @param {string} category
 * @returns {string}
 */
export function getCategoryColor(category) {
    const colors = {
        'produce': 'bg-green-100 text-green-800',
        'protein': 'bg-red-100 text-red-800',
        'dairy': 'bg-blue-100 text-blue-800',
        'pantry': 'bg-yellow-100 text-yellow-800',
        'frozen': 'bg-cyan-100 text-cyan-800',
        'bakery': 'bg-orange-100 text-orange-800',
        'other': 'bg-gray-100 text-gray-800',
    };

    return colors[category.toLowerCase()] || colors['other'];
}

/**
 * Get categories list
 * @returns {Array<string>}
 */
export function getCategories() {
    return ['produce', 'protein', 'dairy', 'pantry', 'frozen', 'bakery', 'other'];
}

/**
 * Normalize item name (lowercase, trim)
 * @param {string} item
 * @returns {string}
 */
export function normalizeItemName(item) {
    return item.toLowerCase().trim();
}
