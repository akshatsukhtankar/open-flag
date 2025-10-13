# OpenFlag 🚩

A self-hosted feature flag service with REST API, web dashboard, and SDK support. Built for developers who want full control over their feature flags without vendor lock-in.

## Why OpenFlag?

Feature flags (feature toggles) let you:
- 🚀 Deploy code without releasing features
- 🧪 Test in production safely with gradual rollouts
- 🔄 Toggle features on/off without code changes
- 🎯 Enable features for specific users or environments

**OpenFlag** gives you all this power on your own infrastructure.

## Features

- ✅ **REST API** - Full CRUD operations for feature flags
- ✅ **Type Safety** - Boolean, string, number, and JSON flag types with validation
- ✅ **Fast Reads** - In-memory caching (30s TTL)
- ✅ **Node.js SDK** - Client library with local caching and auto-refresh
- ✅ **Self-Hosted** - SQLite for dev, PostgreSQL for production
- 🚧 **Web Dashboard** - Coming soon

## Quick Start

### Using the Helper Script (Recommended)

```bash
# Install dependencies
./dev.sh install

# Run tests
./dev.sh test

# Start development server
./dev.sh dev
```

The API will be available at `http://localhost:8000`

### SDK (Node.js)

```bash
cd sdk
npm install
npm test

# Run example (requires backend running)
node example.js
```

See [sdk/README.md](./sdk/README.md) for full SDK documentation.

### Manual Backend Setup

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start server
cd backend
PYTHONPATH=$PWD uvicorn app.main:app --reload --port 8000
```

## SDK Usage

### Installation

```bash
npm install @openflag/sdk  # When published
# Or use locally: cd sdk && npm install
```

### Quick Example

```javascript
const { OpenFlagClient } = require('@openflag/sdk');

const client = new OpenFlagClient({
  apiUrl: 'http://localhost:8000',
  cacheTTL: 30000,        // Cache for 30 seconds
  refreshInterval: 60000  // Auto-refresh every 60 seconds
});

// Check if a feature is enabled
const isEnabled = await client.isEnabled('dark_mode', false);

// Get a flag value with fallback
const apiUrl = await client.getFlag('api_url', 'https://default.com');

// Get all flags
const flags = await client.getAllFlags();
```

See [sdk/README.md](./sdk/README.md) for complete documentation and examples.

## Usage

### Interactive API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API Examples

**Create a feature flag:**
```bash
curl -X POST http://localhost:8000/api/flags \
  -H "Content-Type: application/json" \
  -d '{
    "key": "dark_mode",
    "name": "Dark Mode",
    "description": "Enable dark mode UI",
    "type": "boolean",
    "value": "true"
  }'
```

**Get a flag by key:**
```bash
curl http://localhost:8000/api/flags/key/dark_mode
```

**List all flags:**
```bash
curl http://localhost:8000/api/flags
```

**Update a flag:**
```bash
curl -X PUT http://localhost:8000/api/flags/1 \
  -H "Content-Type: application/json" \
  -d '{"value": "false"}'
```

**Delete a flag:**
```bash
curl -X DELETE http://localhost:8000/api/flags/1
```

## Flag Types

OpenFlag supports four flag types with automatic validation:

- **`boolean`** - `"true"` or `"false"` strings
- **`string`** - Any text value
- **`number`** - Numeric values (stored as strings)
- **`json`** - Valid JSON objects/arrays

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/flags` | Create a new flag |
| `GET` | `/api/flags` | List all flags (supports `?skip=0&limit=100`) |
| `GET` | `/api/flags/{id}` | Get flag by ID |
| `GET` | `/api/flags/key/{key}` | Get flag by key (cached) |
| `PUT` | `/api/flags/{id}` | Update flag (partial updates supported) |
| `DELETE` | `/api/flags/{id}` | Delete flag |

## Development

### Available Commands

```bash
./dev.sh install   # Install backend dependencies
./dev.sh test      # Run backend tests (25 tests)
./dev.sh dev       # Start development server
./dev.sh format    # Format code with black
./dev.sh lint      # Lint code with flake8
./dev.sh clean     # Clean cache and temp files
```

### Running Tests

```bash
./dev.sh test
```

All 25 tests should pass:
- 8 create/validation tests
- 3 list/pagination tests
- 5 get/cache tests
- 5 update tests
- 3 delete tests
- 1 health check test

## Technology Stack

- **Backend**: FastAPI (Python 3.9+)
- **Database**: SQLite (dev) → PostgreSQL (production)
- **Testing**: pytest, pytest-asyncio
- **Code Quality**: black, flake8

## Future Improvements

- React web dashboard for managing flags
- Docker containerization for easy deployment
- PostgreSQL support for production workloads
- User authentication and authorization
- Audit logging and flag history
- Flag rollback capabilities
- Multi-environment support (dev, staging, prod)
- Flag scheduling (enable/disable at specific times)
- A/B testing and gradual rollout support
- WebSocket support for real-time flag updates

## Contributing

This is currently a learning/portfolio project in active development. Contributions, issues, and feature requests are welcome!

## License

MIT

---

**Built with ❤️ for developers who value control and simplicity.**
