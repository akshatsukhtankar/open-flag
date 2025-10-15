# OpenFlag Deployment Guide

This guide covers deploying OpenFlag using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 2GB RAM
- 10GB disk space

## Quick Start (Production)

1. **Clone the repository**
   ```bash
   git clone https://github.com/akshatsukhtankar/open-flag.git
   cd open-flag
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and set strong passwords
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Development Setup

For local development with hot-reload:

1. **Start infrastructure services only**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Run backend locally**
   ```bash
   cd backend
   source ../.venv/bin/activate
   export DATABASE_URL="postgresql://openflag:openflag_dev_password@localhost:5432/openflag_dev"
   export REDIS_URL="redis://localhost:6379"
   uvicorn app.main:app --reload
   ```

3. **Run frontend locally**
   ```bash
   cd frontend
   npm run dev
   ```

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Nginx     │─────▶│   Backend   │─────▶│  PostgreSQL  │
│  (Frontend) │      │   (FastAPI) │      │              │
└─────────────┘      └─────────────┘      └──────────────┘
                            │
                            │
                            ▼
                     ┌──────────────┐
                     │    Redis     │
                     │   (Cache)    │
                     └──────────────┘
```

## Services

### Frontend (Port 80)
- Nginx serving React SPA
- Proxies API requests to backend
- Static asset caching
- Gzip compression

### Backend (Port 8000)
- FastAPI REST API
- SQLModel ORM
- Redis caching layer
- Health checks

### PostgreSQL (Port 5432)
- Primary data store
- Persistent volumes
- Connection pooling

### Redis (Port 6379)
- Distributed cache
- 30-second TTL
- Automatic key expiration

## Configuration

### Environment Variables

Create `.env` file from `.env.example`:

```bash
# Database
POSTGRES_DB=openflag
POSTGRES_USER=openflag
POSTGRES_PASSWORD=<strong-password-here>

# Application
ENVIRONMENT=production
LOG_LEVEL=info

# Optional: Custom Redis settings
# REDIS_URL=redis://redis:6379
```

### Security Recommendations

1. **Change default passwords** in `.env`
2. **Use secrets management** for production (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **Enable HTTPS** with reverse proxy (nginx, Traefik, Caddy)
4. **Set up firewall rules** to restrict access
5. **Regular backups** of PostgreSQL data

## Docker Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart a service
```bash
docker-compose restart backend
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Stop and remove volumes (⚠️ deletes data)
```bash
docker-compose down -v
```

## Health Checks

Check service health:

```bash
# Backend health
curl http://localhost:8000/health

# Frontend (should return HTML)
curl http://localhost/

# PostgreSQL
docker-compose exec postgres pg_isready -U openflag

# Redis
docker-compose exec redis redis-cli ping
```

## Database Management

### Backup database
```bash
docker-compose exec postgres pg_dump -U openflag openflag > backup.sql
```

### Restore database
```bash
cat backup.sql | docker-compose exec -T postgres psql -U openflag openflag
```

### Access PostgreSQL shell
```bash
docker-compose exec postgres psql -U openflag openflag
```

### Access Redis CLI
```bash
docker-compose exec redis redis-cli
```

## Scaling

For production deployments:

1. **Use managed databases**
   - AWS RDS, Google Cloud SQL, Azure Database
   - Better performance, automatic backups, high availability

2. **Use managed Redis**
   - AWS ElastiCache, Google Memorystore, Azure Cache for Redis
   - Automatic failover, clustering support

3. **Scale backend horizontally**
   ```bash
   docker-compose up -d --scale backend=3
   ```

4. **Add load balancer**
   - nginx, HAProxy, or cloud load balancer
   - Distribute traffic across backend instances

5. **Enable monitoring**
   - Prometheus + Grafana
   - Datadog, New Relic, or similar APM tools

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait for postgres health check
# 2. Port already in use - change ports in docker-compose.yml
# 3. Missing environment variables - check .env file
```

### Frontend 404 errors
```bash
# Check nginx logs
docker-compose logs frontend

# Verify backend is running
curl http://localhost:8000/health

# Check nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

### Database connection errors
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U openflag -d openflag -c "SELECT 1;"

# Check DATABASE_URL in backend
docker-compose exec backend env | grep DATABASE_URL
```

### Redis connection errors
```bash
# Verify Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping

# App will fall back to in-memory cache if Redis fails
```

## Production Checklist

- [ ] Changed all default passwords
- [ ] Configured HTTPS/TLS
- [ ] Set up regular database backups
- [ ] Configured log aggregation
- [ ] Set up monitoring and alerts
- [ ] Configured firewall rules
- [ ] Tested disaster recovery procedures
- [ ] Set resource limits in docker-compose.yml
- [ ] Configured automatic restarts
- [ ] Documented runbook for operations

## Performance Tuning

### PostgreSQL
```yaml
# Add to postgres service in docker-compose.yml
command: >
  postgres
  -c shared_buffers=256MB
  -c max_connections=200
  -c effective_cache_size=1GB
```

### Redis
```yaml
# Add to redis service in docker-compose.yml
command: >
  redis-server
  --maxmemory 256mb
  --maxmemory-policy allkeys-lru
  --appendonly yes
```

### Backend
```yaml
# Add to backend service in docker-compose.yml
environment:
  CACHE_TTL: 60  # Increase cache duration
  WORKERS: 4     # Number of uvicorn workers
```

## Support

For issues, questions, or contributions:
- GitHub: https://github.com/akshatsukhtankar/open-flag
- Issues: https://github.com/akshatsukhtankar/open-flag/issues
