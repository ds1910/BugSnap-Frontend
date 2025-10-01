/**
 * Safe localStorage utilities for BugSnap application
 */

/**
 * Safely parses JSON from localStorage
 * @param {string} key - The localStorage key
 * @param {any} defaultValue - Default value to return if parsing fails
 * @returns {any} Parsed value or default value
 */
export const safeGetFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safely sets an item to localStorage
 * @param {string} key - The localStorage key
 * @param {any} value - The value to store
 * @returns {boolean} Success status
 */
export const safeSetToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
};

/**
 * Safely removes an item from localStorage
 * @param {string} key - The localStorage key
 * @returns {boolean} Success status
 */
export const safeRemoveFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
    return false;
  }
};

/**
 * Gets user teams from localStorage safely
 * @returns {Array} User teams array
 */
export const getUserTeams = () => safeGetFromStorage("userTeams", []);

/**
 * Gets active team from localStorage safely
 * @returns {Object|null} Active team object
 */
export const getActiveTeam = () => safeGetFromStorage("activeTeam", null);

/**
 * Gets selected bug from localStorage safely
 * @returns {Object|null} Selected bug object
 */
export const getSelectedBug = () => safeGetFromStorage("selectedBug", null);

/**
 * Gets user info from localStorage safely
 * @returns {Object|null} User info object
 */
export const getUserInfo = () => safeGetFromStorage("userInfo", null);

/**
 * Gets authentication status from localStorage safely
 * @returns {boolean} Authentication status
 */
export const getAuthStatus = () => safeGetFromStorage("isAuth", false);