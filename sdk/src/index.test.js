const nock = require('nock');
const { OpenFlagClient } = require('../src/index');

describe('OpenFlagClient', () => {
  const API_URL = 'http://localhost:8000';
  let client;

  beforeEach(() => {
    nock.cleanAll();
    client = new OpenFlagClient({ apiUrl: API_URL, cacheTTL: 1000 });
  });

  afterEach(() => {
    if (client) {
      client.destroy();
    }
  });

  describe('constructor', () => {
    it('should throw error if apiUrl is not provided', () => {
      expect(() => new OpenFlagClient({})).toThrow('apiUrl is required');
    });

    it('should create client with default options', () => {
      const client = new OpenFlagClient({ apiUrl: API_URL });
      expect(client.apiUrl).toBe(API_URL);
      expect(client.cacheTTL).toBe(30000);
      expect(client.refreshInterval).toBe(0);
      client.destroy();
    });

    it('should strip trailing slash from apiUrl', () => {
      const client = new OpenFlagClient({ apiUrl: 'http://localhost:8000/' });
      expect(client.apiUrl).toBe('http://localhost:8000');
      client.destroy();
    });

    it('should start auto-refresh if interval is set', () => {
      const client = new OpenFlagClient({ 
        apiUrl: API_URL, 
        refreshInterval: 5000 
      });
      expect(client.refreshTimer).not.toBeNull();
      client.destroy();
    });
  });

  describe('getFlag', () => {
    it('should fetch and return a boolean flag', async () => {
      const mockFlag = {
        id: 1,
        key: 'test_flag',
        name: 'Test Flag',
        type: 'boolean',
        value: 'true',
        enabled: true
      };

      nock(API_URL)
        .get('/api/flags/key/test_flag')
        .reply(200, mockFlag);

      const result = await client.getFlag('test_flag');
      expect(result).toBe(true);
    });

    it('should fetch and return a string flag', async () => {
      const mockFlag = {
        id: 1,
        key: 'api_url',
        name: 'API URL',
        type: 'string',
        value: 'https://api.example.com',
        enabled: true
      };

      nock(API_URL)
        .get('/api/flags/key/api_url')
        .reply(200, mockFlag);

      const result = await client.getFlag('api_url');
      expect(result).toBe('https://api.example.com');
    });

    it('should fetch and return a number flag', async () => {
      const mockFlag = {
        id: 1,
        key: 'max_retries',
        name: 'Max Retries',
        type: 'number',
        value: '3',
        enabled: true
      };

      nock(API_URL)
        .get('/api/flags/key/max_retries')
        .reply(200, mockFlag);

      const result = await client.getFlag('max_retries');
      expect(result).toBe(3);
    });

    it('should fetch and return a JSON flag', async () => {
      const mockFlag = {
        id: 1,
        key: 'config',
        name: 'Config',
        type: 'json',
        value: '{"timeout": 30, "retries": 3}',
        enabled: true
      };

      nock(API_URL)
        .get('/api/flags/key/config')
        .reply(200, mockFlag);

      const result = await client.getFlag('config');
      expect(result).toEqual({ timeout: 30, retries: 3 });
    });

    it('should return null for disabled flags', async () => {
      const mockFlag = {
        id: 1,
        key: 'disabled_flag',
        name: 'Disabled Flag',
        type: 'boolean',
        value: 'true',
        enabled: false
      };

      nock(API_URL)
        .get('/api/flags/key/disabled_flag')
        .reply(200, mockFlag);

      const result = await client.getFlag('disabled_flag');
      expect(result).toBeNull();
    });

    it('should return default value when flag not found', async () => {
      nock(API_URL)
        .get('/api/flags/key/nonexistent')
        .reply(404, { detail: 'Flag not found' });

      const result = await client.getFlag('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should return default value when API is unavailable', async () => {
      nock(API_URL)
        .get('/api/flags/key/test')
        .replyWithError('Network error');

      const result = await client.getFlag('test', 'fallback');
      expect(result).toBe('fallback');
    });

    it('should throw error if key is not provided', async () => {
      await expect(client.getFlag()).rejects.toThrow('key is required');
    });

    it('should use cached value on second request', async () => {
      const mockFlag = {
        id: 1,
        key: 'cached_flag',
        name: 'Cached Flag',
        type: 'boolean',
        value: 'true',
        enabled: true
      };

      nock(API_URL)
        .get('/api/flags/key/cached_flag')
        .reply(200, mockFlag);

      // First request - should hit API
      const result1 = await client.getFlag('cached_flag');
      expect(result1).toBe(true);

      // Second request - should use cache (no nock setup, would fail if it hits API)
      const result2 = await client.getFlag('cached_flag');
      expect(result2).toBe(true);
    });

    it('should fetch fresh value after cache expires', async () => {
      const client = new OpenFlagClient({ apiUrl: API_URL, cacheTTL: 100 });
      
      const mockFlag = {
        id: 1,
        key: 'expiring_flag',
        name: 'Expiring Flag',
        type: 'boolean',
        value: 'true',
        enabled: true
      };

      nock(API_URL)
        .get('/api/flags/key/expiring_flag')
        .times(2)
        .reply(200, mockFlag);

      // First request
      await client.getFlag('expiring_flag');

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second request - should fetch again
      const result = await client.getFlag('expiring_flag');
      expect(result).toBe(true);
      
      client.destroy();
    });
  });

  describe('getAllFlags', () => {
    it('should fetch and cache all flags', async () => {
      const mockFlags = [
        {
          id: 1,
          key: 'flag1',
          name: 'Flag 1',
          type: 'boolean',
          value: 'true',
          enabled: true
        },
        {
          id: 2,
          key: 'flag2',
          name: 'Flag 2',
          type: 'string',
          value: 'test',
          enabled: true
        }
      ];

      nock(API_URL)
        .get('/api/flags')
        .reply(200, mockFlags);

      const result = await client.getAllFlags();
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('flag1');
      expect(result[1].key).toBe('flag2');

      // Verify flags are cached (no API call)
      const flag1 = await client.getFlag('flag1');
      expect(flag1).toBe(true);
    });

    it('should throw error when API call fails', async () => {
      nock(API_URL)
        .get('/api/flags')
        .reply(500, { detail: 'Internal server error' });

      await expect(client.getAllFlags()).rejects.toThrow('HTTP 500');
    });
  });

  describe('isEnabled', () => {
    it('should return true for enabled boolean flag', async () => {
      const mockFlag = {
        id: 1,
        key: 'feature',
        name: 'Feature',
        type: 'boolean',
        value: 'true',
        enabled: true
      };

      nock(API_URL)
        .get('/api/flags/key/feature')
        .reply(200, mockFlag);

      const result = await client.isEnabled('feature');
      expect(result).toBe(true);
    });

    it('should return false for disabled boolean flag', async () => {
      const mockFlag = {
        id: 1,
        key: 'feature',
        name: 'Feature',
        type: 'boolean',
        value: 'false',
        enabled: true
      };

      nock(API_URL)
        .get('/api/flags/key/feature')
        .reply(200, mockFlag);

      const result = await client.isEnabled('feature');
      expect(result).toBe(false);
    });

    it('should return default value when flag not found', async () => {
      nock(API_URL)
        .get('/api/flags/key/nonexistent')
        .reply(404);

      const result = await client.isEnabled('nonexistent', true);
      expect(result).toBe(true);
    });

    it('should return false by default when flag not found', async () => {
      nock(API_URL)
        .get('/api/flags/key/nonexistent')
        .reply(404);

      const result = await client.isEnabled('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('refresh', () => {
    it('should refresh all flags', async () => {
      const mockFlags = [
        {
          id: 1,
          key: 'flag1',
          name: 'Flag 1',
          type: 'boolean',
          value: 'true',
          enabled: true
        }
      ];

      nock(API_URL)
        .get('/api/flags')
        .reply(200, mockFlags);

      await client.refresh();

      // Verify flag is cached
      const flag = await client.getFlag('flag1');
      expect(flag).toBe(true);
    });

    it('should call onRefresh callback on successful refresh', async () => {
      const onRefresh = jest.fn();
      const client = new OpenFlagClient({ 
        apiUrl: API_URL, 
        onRefresh 
      });

      nock(API_URL)
        .get('/api/flags')
        .reply(200, []);

      await client.refresh();
      expect(onRefresh).toHaveBeenCalled();
      
      client.destroy();
    });

    it('should call onError callback on failed refresh', async () => {
      const onError = jest.fn();
      const client = new OpenFlagClient({ 
        apiUrl: API_URL, 
        onError 
      });

      nock(API_URL)
        .get('/api/flags')
        .replyWithError('Network error');

      await client.refresh();
      expect(onError).toHaveBeenCalled();
      
      client.destroy();
    });
  });

  describe('auto-refresh', () => {
    it('should auto-refresh at specified interval', async () => {
      jest.useFakeTimers();
      
      const mockFlags = [
        {
          id: 1,
          key: 'flag1',
          name: 'Flag 1',
          type: 'boolean',
          value: 'true',
          enabled: true
        }
      ];

      nock(API_URL)
        .get('/api/flags')
        .times(3)
        .reply(200, mockFlags);

      const client = new OpenFlagClient({ 
        apiUrl: API_URL, 
        refreshInterval: 1000 
      });

      // Wait for 3 intervals
      jest.advanceTimersByTime(3000);
      
      // Flush all promises
      await Promise.resolve();

      client.destroy();
      jest.useRealTimers();
    });

    it('should stop auto-refresh when stopAutoRefresh is called', () => {
      const client = new OpenFlagClient({ 
        apiUrl: API_URL, 
        refreshInterval: 1000 
      });

      expect(client.refreshTimer).not.toBeNull();
      
      client.stopAutoRefresh();
      
      expect(client.refreshTimer).toBeNull();
      
      client.destroy();
    });
  });

  describe('clearCache', () => {
    it('should clear all cached flags', async () => {
      const mockFlag = {
        id: 1,
        key: 'test',
        name: 'Test',
        type: 'boolean',
        value: 'true',
        enabled: true
      };

      nock(API_URL)
        .get('/api/flags/key/test')
        .times(2)
        .reply(200, mockFlag);

      // First request - cache it
      await client.getFlag('test');
      
      // Clear cache
      client.clearCache();
      
      // Second request - should fetch again (not from cache)
      await client.getFlag('test');
      
      expect(nock.isDone()).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should stop auto-refresh and clear cache', () => {
      const client = new OpenFlagClient({ 
        apiUrl: API_URL, 
        refreshInterval: 1000 
      });

      client.destroy();
      
      expect(client.refreshTimer).toBeNull();
      expect(client.cache.size).toBe(0);
    });
  });
});
