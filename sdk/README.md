# OpenFlag Node.js SDK

Official Node.js SDK for [OpenFlag](https://github.com/akshatsukhtankar/open-flag) feature flag service.

## Features

- ✅ Simple API for fetching feature flags
- ✅ Local caching with configurable TTL (default 30s)
- ✅ Auto-refresh with polling support
- ✅ Fallback values when API unavailable
- ✅ Type-safe flag parsing (boolean, string, number, JSON)
- ✅ Zero dependencies (except node-fetch)

## Installation

```bash
npm install @openflag/sdk
```

## Quick Start

```javascript
const { OpenFlagClient } = require('@openflag/sdk');

// Create client
const client = new OpenFlagClient({
  apiUrl: 'http://localhost:8000'
});

// Get a flag
const darkMode = await client.getFlag('dark_mode', false);
console.log('Dark mode:', darkMode);

// Check if a boolean flag is enabled
const isEnabled = await client.isEnabled('new_feature', false);
if (isEnabled) {
  console.log('New feature is enabled!');
}
```

## Configuration

```javascript
const client = new OpenFlagClient({
  apiUrl: 'http://localhost:8000',     // Required: OpenFlag API URL
  cacheTTL: 30000,                     // Optional: Cache TTL in ms (default: 30s)
  refreshInterval: 60000,              // Optional: Auto-refresh interval (0 = disabled)
  onError: (error) => {                // Optional: Error callback
    console.error('OpenFlag error:', error);
  },
  onRefresh: () => {                   // Optional: Refresh callback
    console.log('Flags refreshed');
  }
});
```

## API

### `getFlag(key, defaultValue)`

Get a feature flag value by key.

```javascript
// Boolean flag
const enabled = await client.getFlag('feature_enabled', false);

// String flag
const apiUrl = await client.getFlag('api_url', 'https://api.example.com');

// Number flag
const maxRetries = await client.getFlag('max_retries', 3);

// JSON flag
const config = await client.getFlag('app_config', { timeout: 30 });
```

**Parameters:**
- `key` (string): Flag key
- `defaultValue` (any): Value to return if flag not found or API unavailable

**Returns:** Promise resolving to flag value or default value

### `isEnabled(key, defaultValue)`

Check if a boolean flag is enabled.

```javascript
const isFeatureEnabled = await client.isEnabled('new_feature', false);

if (isFeatureEnabled) {
  // Enable feature
}
```

**Parameters:**
- `key` (string): Flag key
- `defaultValue` (boolean): Value to return if flag not found (default: false)

**Returns:** Promise resolving to boolean

### `getAllFlags()`

Fetch all flags from the API and cache them.

```javascript
const flags = await client.getAllFlags();
console.log('Total flags:', flags.length);
```

**Returns:** Promise resolving to array of flag objects

### `refresh()`

Manually refresh all cached flags.

```javascript
await client.refresh();
```

### `clearCache()`

Clear the local cache.

```javascript
client.clearCache();
```

### `startAutoRefresh()` / `stopAutoRefresh()`

Control auto-refresh polling.

```javascript
client.startAutoRefresh();  // Start polling
client.stopAutoRefresh();   // Stop polling
```

### `destroy()`

Cleanup resources (stop auto-refresh, clear cache).

```javascript
client.destroy();
```

## Usage Examples

### Basic Usage

```javascript
const { OpenFlagClient } = require('@openflag/sdk');

const client = new OpenFlagClient({
  apiUrl: 'http://localhost:8000'
});

async function main() {
  // Check feature flags
  const darkMode = await client.isEnabled('dark_mode');
  const betaFeatures = await client.isEnabled('beta_features');
  
  console.log('Dark mode:', darkMode);
  console.log('Beta features:', betaFeatures);
}

main();
```

### With Auto-Refresh

```javascript
const client = new OpenFlagClient({
  apiUrl: 'http://localhost:8000',
  refreshInterval: 60000, // Refresh every 60 seconds
  onRefresh: () => {
    console.log('Flags updated');
  }
});

// Flags will be automatically refreshed every minute
```

### With Error Handling

```javascript
const client = new OpenFlagClient({
  apiUrl: 'http://localhost:8000',
  onError: (error) => {
    console.error('Failed to fetch flags:', error.message);
  }
});

// Fallback to default values when API is unavailable
const enabled = await client.getFlag('feature', false);
```

### Express.js Middleware

```javascript
const express = require('express');
const { OpenFlagClient } = require('@openflag/sdk');

const app = express();
const flagClient = new OpenFlagClient({
  apiUrl: 'http://localhost:8000',
  refreshInterval: 30000
});

// Add flag client to request
app.use((req, res, next) => {
  req.flags = flagClient;
  next();
});

app.get('/api/data', async (req, res) => {
  const useNewAPI = await req.flags.isEnabled('use_new_api', false);
  
  if (useNewAPI) {
    // Use new API
    res.json({ message: 'Using new API' });
  } else {
    // Use old API
    res.json({ message: 'Using old API' });
  }
});

// Cleanup on server shutdown
process.on('SIGTERM', () => {
  flagClient.destroy();
});

app.listen(3000);
```

### Caching Behavior

The SDK caches flags locally for the configured TTL (default 30 seconds):

```javascript
const client = new OpenFlagClient({
  apiUrl: 'http://localhost:8000',
  cacheTTL: 60000 // Cache for 60 seconds
});

// First call - fetches from API
const flag1 = await client.getFlag('my_flag');

// Second call within TTL - uses cache (no API call)
const flag2 = await client.getFlag('my_flag');

// After TTL expires - fetches from API again
```

## Flag Types

OpenFlag supports four flag types:

| Type | Example Value | Parsed As |
|------|--------------|-----------|
| `boolean` | `"true"` | `true` (boolean) |
| `string` | `"hello"` | `"hello"` (string) |
| `number` | `"42"` | `42` (number) |
| `json` | `'{"key":"value"}'` | `{key: "value"}` (object) |

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## License

MIT
