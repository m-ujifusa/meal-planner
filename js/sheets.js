/**
 * Google Sheets API wrapper
 */

import { auth } from './auth.js';

class SheetsAPI {
    constructor() {
        this.spreadsheetId = null;
    }

    /**
     * Initialize with spreadsheet ID
     */
    init(spreadsheetId) {
        this.spreadsheetId = spreadsheetId;
    }

    /**
     * Read data from a tab
     * @param {string} tabName - Name of the sheet tab
     * @param {string} range - Optional range (e.g., 'A1:D10')
     * @returns {Promise<Array>} - 2D array of values
     */
    async read(tabName, range = '') {
        try {
            const fullRange = range ? `${tabName}!${range}` : tabName;
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: fullRange,
            });

            return response.result.values || [];
        } catch (error) {
            console.error(`Error reading from ${tabName}:`, error);
            throw error;
        }
    }

    /**
     * Write data to a tab (overwrites existing data)
     * @param {string} tabName - Name of the sheet tab
     * @param {string} range - Range to write to (e.g., 'A1')
     * @param {Array} values - 2D array of values
     */
    async write(tabName, range, values) {
        try {
            const fullRange = `${tabName}!${range}`;
            const response = await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: fullRange,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: values,
                },
            });

            return response.result;
        } catch (error) {
            console.error(`Error writing to ${tabName}:`, error);
            throw error;
        }
    }

    /**
     * Append data to a tab
     * @param {string} tabName - Name of the sheet tab
     * @param {Array} values - 2D array of values
     */
    async append(tabName, values) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: tabName,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: values,
                },
            });

            return response.result;
        } catch (error) {
            console.error(`Error appending to ${tabName}:`, error);
            throw error;
        }
    }

    /**
     * Clear a range in a tab
     * @param {string} tabName - Name of the sheet tab
     * @param {string} range - Optional range to clear (clears all if not specified)
     */
    async clear(tabName, range = '') {
        try {
            const fullRange = range ? `${tabName}!${range}` : tabName;
            const response = await gapi.client.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: fullRange,
            });

            return response.result;
        } catch (error) {
            console.error(`Error clearing ${tabName}:`, error);
            throw error;
        }
    }

    /**
     * Batch update multiple ranges
     * @param {Array} data - Array of {range, values} objects
     */
    async batchUpdate(data) {
        try {
            const batchData = data.map(item => ({
                range: item.range,
                values: item.values,
            }));

            const response = await gapi.client.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    valueInputOption: 'USER_ENTERED',
                    data: batchData,
                },
            });

            return response.result;
        } catch (error) {
            console.error('Error in batch update:', error);
            throw error;
        }
    }

    /**
     * Read data and parse as objects with headers
     * @param {string} tabName - Name of the sheet tab
     * @returns {Promise<Array>} - Array of objects
     */
    async readAsObjects(tabName) {
        try {
            const data = await this.read(tabName);

            if (data.length === 0) {
                return [];
            }

            const headers = data[0];
            const rows = data.slice(1);

            return rows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });
        } catch (error) {
            console.error(`Error reading objects from ${tabName}:`, error);
            throw error;
        }
    }

    /**
     * Write objects to a tab (with headers)
     * @param {string} tabName - Name of the sheet tab
     * @param {Array} objects - Array of objects
     * @param {Array} headers - Optional custom headers (uses object keys if not provided)
     */
    async writeObjects(tabName, objects, headers = null) {
        try {
            if (objects.length === 0) {
                return;
            }

            // Use provided headers or extract from first object
            const headerRow = headers || Object.keys(objects[0]);

            // Convert objects to 2D array
            const rows = objects.map(obj =>
                headerRow.map(key => obj[key] !== undefined ? obj[key] : '')
            );

            // Combine headers and rows
            const values = [headerRow, ...rows];

            // Clear the tab first
            await this.clear(tabName);

            // Write the data
            return await this.write(tabName, 'A1', values);
        } catch (error) {
            console.error(`Error writing objects to ${tabName}:`, error);
            throw error;
        }
    }

    /**
     * Append objects to a tab
     * @param {string} tabName - Name of the sheet tab
     * @param {Array} objects - Array of objects
     */
    async appendObjects(tabName, objects) {
        try {
            if (objects.length === 0) {
                return;
            }

            // Read existing data to get headers
            const existingData = await this.read(tabName);

            if (existingData.length === 0) {
                // No data exists, write with headers
                return await this.writeObjects(tabName, objects);
            }

            const headers = existingData[0];

            // Convert objects to 2D array
            const rows = objects.map(obj =>
                headers.map(key => obj[key] !== undefined ? obj[key] : '')
            );

            return await this.append(tabName, rows);
        } catch (error) {
            console.error(`Error appending objects to ${tabName}:`, error);
            throw error;
        }
    }

    /**
     * Update a specific row by matching a column value
     * @param {string} tabName - Name of the sheet tab
     * @param {string} matchColumn - Column to match (e.g., 'id')
     * @param {any} matchValue - Value to match
     * @param {Object} updates - Object with updates
     */
    async updateRow(tabName, matchColumn, matchValue, updates) {
        try {
            const objects = await this.readAsObjects(tabName);
            const rowIndex = objects.findIndex(obj => obj[matchColumn] == matchValue);

            if (rowIndex === -1) {
                throw new Error(`Row with ${matchColumn}=${matchValue} not found`);
            }

            // Update the object
            const updatedObject = { ...objects[rowIndex], ...updates };

            // Get headers
            const data = await this.read(tabName);
            const headers = data[0];

            // Convert to row array
            const updatedRow = headers.map(key => updatedObject[key] || '');

            // Update the specific row (add 2 to account for header and 0-based index)
            const range = `A${rowIndex + 2}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 2}`;

            return await this.write(tabName, range, [updatedRow]);
        } catch (error) {
            console.error(`Error updating row in ${tabName}:`, error);
            throw error;
        }
    }

    /**
     * Delete a specific row by matching a column value
     * @param {string} tabName - Name of the sheet tab
     * @param {string} matchColumn - Column to match (e.g., 'id')
     * @param {any} matchValue - Value to match
     */
    async deleteRow(tabName, matchColumn, matchValue) {
        try {
            const objects = await this.readAsObjects(tabName);
            const filteredObjects = objects.filter(obj => obj[matchColumn] != matchValue);

            if (filteredObjects.length === objects.length) {
                throw new Error(`Row with ${matchColumn}=${matchValue} not found`);
            }

            return await this.writeObjects(tabName, filteredObjects);
        } catch (error) {
            console.error(`Error deleting row from ${tabName}:`, error);
            throw error;
        }
    }

    /**
     * Generate a unique ID
     */
    generateId(prefix = 'r') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export singleton instance
export const sheets = new SheetsAPI();
