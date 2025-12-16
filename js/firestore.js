/**
 * Firestore wrapper
 * Replaces Google Sheets API with Firestore
 */

import { auth } from './firebase-auth.js';

class FirestoreDB {
    constructor() {
        this.db = null;
        this.userId = null;
    }

    /**
     * Initialize Firestore
     */
    init() {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            throw new Error('Firebase Firestore not loaded');
        }

        this.db = firebase.firestore();
        this.userId = auth.getUserId();

        if (!this.userId) {
            throw new Error('User not authenticated');
        }

        console.log('Firestore initialized for user:', this.userId);
    }

    /**
     * Get user's collection reference
     * All data is scoped to the current user
     */
    getUserCollection(collectionName) {
        if (!this.userId) {
            this.userId = auth.getUserId();
        }
        return this.db.collection('users').doc(this.userId).collection(collectionName);
    }

    /**
     * Read all documents from a collection
     * @param {string} collectionName - Name of the collection
     * @returns {Promise<Array>} - Array of objects
     */
    async read(collectionName) {
        try {
            const snapshot = await this.getUserCollection(collectionName).get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error reading from ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Read a single document by ID
     * @param {string} collectionName - Name of the collection
     * @param {string} docId - Document ID
     * @returns {Promise<Object|null>} - Document data or null
     */
    async readOne(collectionName, docId) {
        try {
            const doc = await this.getUserCollection(collectionName).doc(docId).get();

            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error(`Error reading document ${docId} from ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Query documents with filters
     * @param {string} collectionName - Name of the collection
     * @param {Array} filters - Array of [field, operator, value] tuples
     * @returns {Promise<Array>} - Array of matching documents
     */
    async query(collectionName, filters = []) {
        try {
            let query = this.getUserCollection(collectionName);

            // Apply filters
            filters.forEach(([field, operator, value]) => {
                query = query.where(field, operator, value);
            });

            const snapshot = await query.get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error querying ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Create a new document
     * @param {string} collectionName - Name of the collection
     * @param {Object} data - Document data
     * @param {string} docId - Optional custom document ID
     * @returns {Promise<string>} - Document ID
     */
    async create(collectionName, data, docId = null) {
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const docData = {
                ...data,
                created_at: timestamp,
                updated_at: timestamp
            };

            if (docId) {
                // Use custom ID
                await this.getUserCollection(collectionName).doc(docId).set(docData);
                return docId;
            } else {
                // Auto-generate ID
                const docRef = await this.getUserCollection(collectionName).add(docData);
                return docRef.id;
            }
        } catch (error) {
            console.error(`Error creating document in ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Update a document
     * @param {string} collectionName - Name of the collection
     * @param {string} docId - Document ID
     * @param {Object} updates - Fields to update
     */
    async update(collectionName, docId, updates) {
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const updateData = {
                ...updates,
                updated_at: timestamp
            };

            await this.getUserCollection(collectionName).doc(docId).update(updateData);
        } catch (error) {
            console.error(`Error updating document ${docId} in ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Set (create or replace) a document
     * @param {string} collectionName - Name of the collection
     * @param {string} docId - Document ID
     * @param {Object} data - Document data
     */
    async set(collectionName, docId, data) {
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const docData = {
                ...data,
                updated_at: timestamp
            };

            await this.getUserCollection(collectionName).doc(docId).set(docData, { merge: true });
        } catch (error) {
            console.error(`Error setting document ${docId} in ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Delete a document
     * @param {string} collectionName - Name of the collection
     * @param {string} docId - Document ID
     */
    async delete(collectionName, docId) {
        try {
            await this.getUserCollection(collectionName).doc(docId).delete();
        } catch (error) {
            console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Delete multiple documents matching a filter
     * @param {string} collectionName - Name of the collection
     * @param {Array} filters - Array of [field, operator, value] tuples
     */
    async deleteWhere(collectionName, filters) {
        try {
            const docs = await this.query(collectionName, filters);

            // Use batch delete for efficiency
            const batch = this.db.batch();
            docs.forEach(doc => {
                batch.delete(this.getUserCollection(collectionName).doc(doc.id));
            });

            await batch.commit();
        } catch (error) {
            console.error(`Error deleting documents from ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Batch write operations
     * @param {Array} operations - Array of {type, collection, id, data} objects
     */
    async batchWrite(operations) {
        try {
            const batch = this.db.batch();
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();

            operations.forEach(op => {
                const docRef = this.getUserCollection(op.collection).doc(op.id || this.generateId());

                switch (op.type) {
                    case 'set':
                        batch.set(docRef, { ...op.data, updated_at: timestamp }, { merge: true });
                        break;
                    case 'update':
                        batch.update(docRef, { ...op.data, updated_at: timestamp });
                        break;
                    case 'delete':
                        batch.delete(docRef);
                        break;
                    default:
                        console.warn('Unknown batch operation type:', op.type);
                }
            });

            await batch.commit();
        } catch (error) {
            console.error('Error in batch write:', error);
            throw error;
        }
    }

    /**
     * Clear all documents in a collection
     * @param {string} collectionName - Name of the collection
     */
    async clear(collectionName) {
        try {
            const snapshot = await this.getUserCollection(collectionName).get();

            const batch = this.db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        } catch (error) {
            console.error(`Error clearing ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Generate a unique ID
     */
    generateId(prefix = 'doc') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get server timestamp
     */
    getServerTimestamp() {
        return firebase.firestore.FieldValue.serverTimestamp();
    }

    /**
     * Transaction helper
     * @param {Function} updateFunction - Function that receives transaction object
     */
    async runTransaction(updateFunction) {
        try {
            return await this.db.runTransaction(updateFunction);
        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const db = new FirestoreDB();
