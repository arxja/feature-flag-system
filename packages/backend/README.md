# Feature Flag Backend API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Express.js backend for the enterprise feature flag system. Handles flag evaluation, caching, real-time updates, and audit logging.

## 🏗️ Architecture

```text
backend/src/
├── config/ # Environment, database, Redis config
├── controllers/ # Route handlers (business logic)
├── middleware/ # Auth, validation, error handling, rate limiting
├── models/ # Mongoose schemas (FeatureFlag, AuditLog)
├── repositories/ # Database abstraction with optimistic locking
├── routes/ # API endpoint definitions
├── schemas/ # Joi validation schemas
├── services/ # Core logic (evaluator, cache, SSE)
├── utils/ # Helpers, logger, custom errors
```


## 🚀 API Endpoints

### Public Evaluation API (SDK uses these)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/evaluate/:flagKey` | Check single flag |
| `POST` | `/api/evaluate/batch` | Check multiple flags |
| `GET` | `/api/evaluate/:flagKey/explain` | Debug why flag is on/off |

### Admin API (Dashboard uses these)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/flags` | List all flags (paginated) |
| `POST` | `/api/admin/flags` | Create new flag |
| `GET` | `/api/admin/flags/:key` | Get single flag |
| `PATCH` | `/api/admin/flags/:key` | Update flag (with version check) |
| `POST` | `/api/admin/flags/:key/toggle` | Toggle flag on/off |
| `DELETE` | `/api/admin/flags/:key` | Soft delete flag |
| `POST` | `/api/admin/flags/bulk/toggle` | Bulk toggle multiple flags |
| `GET` | `/api/admin/flags/tags` | Get all unique tags |
| `GET` | `/api/admin/flags/:key/audit` | Get audit logs |
| `GET` | `/api/admin/stats` | System statistics |

### Real-time API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sse` | Server-Sent Events connection |
| `GET` | `/api/sse/stats` | SSE connection stats |

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health |
| `GET` | `/ready` | Readiness probe (for K8s) |
| `GET` | `/api/ping` | Simple test endpoint |

## 🔧 Environment Variables

```env
# Server
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/feature_flags

# Redis (optional - falls back to memory cache)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📝 Example Requests

```bash
curl -X POST http://localhost:3001/api/admin/flags \
  -H "Content-Type: application/json" \
  -d '{
    "key": "dark_mode",
    "name": "Dark Mode",
    "enabled": true,
    "rolloutPercentage": 50,
    "tags": ["ui", "frontend"]
  }'
```
### Evaluate a flag
```bash
curl "http://localhost:3001/api/evaluate/dark_mode?userId=user123"
```

### Batch evaluation

```bash
curl -X POST http://localhost:3001/api/evaluate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "userAttributes": {"tier": "premium"},
    "flagKeys": ["dark_mode", "new_checkout", "ai_search"]
  }'
```

### Toggle a flag

```bash
curl -X POST http://localhost:3001/api/admin/flags/dark_mode/toggle
```

## 🔒 Authentication (Coming Soon)

Currently using development auth (userId: system). Production will require JWT tokens.

## 📊 Logging

- Console (colored, human-readable)
- logs/error.log (error level only)
- logs/all.log (all levels)

## 📚 Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ODM |
| ioredis | Redis client |
| joi | Request validation |
| winston | Logging |
| jsonwebtoken | JWT auth |
| helmet | Security headers |
| cors | CORS handling |
| compression | Response compression |
| express-rate-limit | Rate limiting |