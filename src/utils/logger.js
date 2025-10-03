/**
 * =====================================================
 * FRONTEND PRODUCTION LOGGER UTILITY
 * =====================================================
 * 
 * Environment-aware logging for React frontend
 * Use this instead of console.log in production code
 * =====================================================
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Development-only logging
   * Will only log in development environment
   */
  dev: (...args) => {
    if (isDevelopment) {
      console.log('[DEV]', ...args);
    }
  },

  /**
   * Error logging (always active)
   * Critical errors should always be logged
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Warning logging (always active)
   * Important warnings should always be logged
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Info logging (production safe)
   * Important information that's safe for production
   */
  info: (...args) => {
    console.log('[INFO]', ...args);
  },

  /**
   * Debug logging (development only)
   * Detailed debugging information
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  }
};

export default logger;