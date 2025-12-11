/**
 * Date utility functions for week calculations
 */

/**
 * Get the Monday of the current week
 * @param {Date} date - Optional date (defaults to today)
 * @returns {Date} - Monday of the week
 */
export function getMonday(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

/**
 * Get week start in ISO format (YYYY-MM-DD)
 * @param {Date} date - Optional date (defaults to today)
 * @returns {string} - ISO format date string
 */
export function getWeekStart(date = new Date()) {
    const monday = getMonday(date);
    return formatDate(monday);
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse ISO date string to Date object
 * @param {string} dateStr - ISO format date string
 * @returns {Date}
 */
export function parseDate(dateStr) {
    return new Date(dateStr + 'T00:00:00');
}

/**
 * Get week label (e.g., "Week of Jan 15")
 * @param {string} weekStart - ISO format date string
 * @returns {string}
 */
export function getWeekLabel(weekStart) {
    const date = parseDate(weekStart);
    const options = { month: 'short', day: 'numeric' };
    return `Week of ${date.toLocaleDateString('en-US', options)}`;
}

/**
 * Get previous week start
 * @param {string} weekStart - ISO format date string
 * @returns {string}
 */
export function getPreviousWeek(weekStart) {
    const date = parseDate(weekStart);
    date.setDate(date.getDate() - 7);
    return formatDate(date);
}

/**
 * Get next week start
 * @param {string} weekStart - ISO format date string
 * @returns {string}
 */
export function getNextWeek(weekStart) {
    const date = parseDate(weekStart);
    date.setDate(date.getDate() + 7);
    return formatDate(date);
}

/**
 * Get array of days for a week
 * @returns {Array<string>}
 */
export function getDaysOfWeek() {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
}

/**
 * Get day label
 * @param {string} day - Lowercase day name
 * @returns {string}
 */
export function getDayLabel(day) {
    return day.charAt(0).toUpperCase() + day.slice(1);
}

/**
 * Check if week is current week
 * @param {string} weekStart - ISO format date string
 * @returns {boolean}
 */
export function isCurrentWeek(weekStart) {
    return weekStart === getWeekStart();
}
