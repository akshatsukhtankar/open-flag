const fetch = require('node-fetch');

/**
 * OpenFlag SDK Client
 * Fetches feature flags from OpenFlag API with local caching and auto-refresh
 */
class OpenFlagClient {
  /**
   * Create a new OpenFlag client
   * @param {Object} options - Configuration options
   * @param {string} options.apiUrl - Base URL of OpenFlag API (e.g., 'http://localhost:8000')
   * @param {number} [options.cacheTTL=30000] - Cache TTL in milliseconds (default: 30s)
   * @param {number} [options.refreshInterval=0] - Auto-refresh interval in milliseconds (0 = disabled)
   * @param {Function} [options.onError] - Error callback function
   * @param {Function} [options.onRefresh] - Refresh callback function
   */
  constructor(options = {}) {
    if (!options.apiUrl) {
      throw new Error('apiUrl is required');
    }

    this.apiUrl = options.apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.cacheTTL = options.cacheTTL || 30000; // 30 seconds default
    this.refreshInterval = options.refreshInterval || 0;
    this.onError = options.onError || (() => {});
    this.onRefresh = options.onRefresh || (() => {});
    
    this.cache = new Map();
    this.refreshTimer = null;
    
    // Start auto-refresh if enabled
    if (this.refreshInterval > 0) {
      this.startAutoRefresh();
    }
  }

  /**
   * Get a feature flag by key
   * @param {string} key - Flag key
   * @param {*} [defaultValue=null] - Default value if flag not found or API unavailable
   * @returns {Promise<*>} Flag value or default value
   */
  async getFlag(key, defaultValue = null) {
    if (!key) {
      throw new Error('key is required');
    }

    // Check cache first
    const cached = this._getCached(key);
    if (cached !== null) {
      return this._parseValue(cached.value);
    }

    // Fetch from API
    try {
      const flag = await this._fetchFlag(key);
      
      // Cache the result
      this._setCache(key, flag);
      
      return this._parseValue(flag);
    } catch (error) {
      this.onError(error);
      return defaultValue;
    }
  }

  /**
   * Get all feature flags
   * @returns {Promise<Array>} Array of all flags
   */
  async getAllFlags() {
    try {
      const response = await fetch(`${this.apiUrl}/api/flags`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const flags = await response.json();
      
      // Cache all flags
      flags.forEach(flag => {
        this._setCache(flag.key, flag);
      });
      
      return flags;
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  /**
   * Check if a boolean flag is enabled
   * @param {string} key - Flag key
   * @param {boolean} [defaultValue=false] - Default value if flag not found
   * @returns {Promise<boolean>} True if flag is enabled
   */
  async isEnabled(key, defaultValue = false) {
    const flag = await this.getFlag(key, null);
    
    if (flag === null) {
      return defaultValue;
    }
    
    // Handle both object and parsed value
    const value = typeof flag === 'object' ? flag.value : flag;
    
    return value === true || value === 'true';
  }

  /**
   * Refresh all cached flags
   * @returns {Promise<void>}
   */
  async refresh() {
    try {
      await this.getAllFlags();
      this.onRefresh();
    } catch (error) {
      this.onError(error);
    }
  }

  /**
   * Start auto-refresh polling
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      return; // Already running
    }
    
    this.refreshTimer = setInterval(() => {
      this.refresh();
    }, this.refreshInterval);
  }

  /**
   * Stop auto-refresh polling
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Clear the local cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Destroy the client and cleanup resources
   */
  destroy() {
    this.stopAutoRefresh();
    this.clearCache();
  }

  // Private methods

  async _fetchFlag(key) {
    const response = await fetch(`${this.apiUrl}/api/flags/key/${encodeURIComponent(key)}`);
    
    if (response.status === 404) {
      throw new Error(`Flag '${key}' not found`);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  _getCached(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }

  _setCache(key, flag) {
    this.cache.set(key, {
      value: flag,
      timestamp: Date.now()
    });
  }

  _parseValue(flag) {
    if (!flag || !flag.enabled) {
      return null;
    }
    
    const { type, value } = flag;
    
    switch (type) {
      case 'boolean':
        return value === 'true';
      
      case 'number':
        return parseFloat(value);
      
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      
      case 'string':
      default:
        return value;
    }
  }
}

module.exports = { OpenFlagClient };
