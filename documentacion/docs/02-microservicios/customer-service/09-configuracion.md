---
sidebar_position: 10
---

# Configuración

Configuración completa del Customer Service.

## Variables de Entorno

```bash
# .env

# Service Info
SERVICE_NAME=customer-service
SERVICE_VERSION=1.0.0
PORT=8007
GRPC_PORT=50007

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/customer_db
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10

# Redis Cache
REDIS_URL=redis://localhost:6379/7
CACHE_DEFAULT_TTL=900

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE=customer_events

# Auth Service
AUTH_SERVICE_URL=http://localhost:8000
JWT_SECRET_KEY=your-secret-key-here

# gRPC Clients
ORDER_SERVICE_GRPC=localhost:50003

# Business Rules
LOYALTY_POINTS_RATE=1.0  # 1 punto por $1
LOYALTY_POINTS_TO_CURRENCY=0.01  # $1 por 100 puntos
BRONZE_TIER_THRESHOLD=0
SILVER_TIER_THRESHOLD=500
GOLD_TIER_THRESHOLD=1000
PLATINUM_TIER_THRESHOLD=5000

# Credit
DEFAULT_PAYMENT_TERM_DAYS=30
MIN_CREDIT_LIMIT=1000.00
MAX_CREDIT_LIMIT=100000.00

# Logging
LOG_LEVEL=INFO
SENTRY_DSN=
```

## Configuración de FastAPI

```python
# config/settings.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Service
    service_name: str = "customer-service"
    service_version: str = "1.0.0"
    port: int = 8007
    grpc_port: int = 50007

    # Database
    database_url: str
    db_pool_size: int = 20
    db_max_overflow: int = 10

    # Redis
    redis_url: str
    cache_default_ttl: int = 900

    # RabbitMQ
    rabbitmq_url: str
    rabbitmq_exchange: str = "customer_events"

    # Auth
    auth_service_url: str
    jwt_secret_key: str

    # gRPC
    order_service_grpc: str

    # Business Rules - Loyalty
    loyalty_points_rate: float = 1.0
    loyalty_points_to_currency: float = 0.01
    bronze_tier_threshold: int = 0
    silver_tier_threshold: int = 500
    gold_tier_threshold: int = 1000
    platinum_tier_threshold: int = 5000

    # Business Rules - Credit
    default_payment_term_days: int = 30
    min_credit_limit: float = 1000.00
    max_credit_limit: float = 100000.00

    class Config:
        env_file = ".env"

settings = Settings()
```

## Docker Compose

```yaml
version: '3.8'

services:
  customer-service:
    build: .
    container_name: customer-service
    ports:
      - "8007:8007"
      - "50007:50007"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/customer_db
      - REDIS_URL=redis://redis:6379/7
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
      - ORDER_SERVICE_GRPC=order-service:50003
      - AUTH_SERVICE_URL=http://auth-service:8000
    depends_on:
      - postgres
      - redis
      - rabbitmq
    networks:
      - erp-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=customer_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - customer_db_data:/var/lib/postgresql/data
    networks:
      - erp-network

volumes:
  customer_db_data:

networks:
  erp-network:
    external: true
```

## Próximos Pasos

- [Overview](./00-overview.md)
- [API de Clientes](./03-api-customers.md)
