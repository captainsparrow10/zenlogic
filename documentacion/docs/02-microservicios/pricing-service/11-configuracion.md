---
sidebar_position: 12
---

# Configuración

## Variables de Entorno

```bash
# Service
SERVICE_NAME=pricing-service
PORT=8008
GRPC_PORT=50008

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/pricing_db

# Redis
REDIS_URL=redis://localhost:6379/8
CACHE_TTL_PRICES=900
CACHE_TTL_PROMOTIONS=1800

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE=pricing_events

# gRPC Clients
CATALOG_SERVICE_GRPC=localhost:50001
CUSTOMER_SERVICE_GRPC=localhost:50007

# Business Rules
DEFAULT_CURRENCY=USD
ALLOW_NEGATIVE_MARGINS=false
MAX_DISCOUNT_PERCENTAGE=90.0
PROMOTION_MAX_DURATION_DAYS=365
```

## Docker Compose

```yaml
version: '3.8'

services:
  pricing-service:
    build: .
    ports:
      - "8008:8008"
      - "50008:50008"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/pricing_db
      - REDIS_URL=redis://redis:6379/8
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
    networks:
      - erp-network

networks:
  erp-network:
    external: true
```

## Próximos Pasos

- [Overview](./00-overview.md)
- [API Price Lists](./03-api-price-lists.md)
