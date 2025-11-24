---
sidebar_position: 10
---

# Configuración

## Variables de Entorno

```bash
# Service
SERVICE_NAME=procurement-service
PORT=8009
GRPC_PORT=50009

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/procurement_db

# Redis
REDIS_URL=redis://localhost:6379/9

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE=procurement_events

# gRPC Clients
INVENTORY_SERVICE_GRPC=localhost:50002
CATALOG_SERVICE_GRPC=localhost:50001

# Business Rules
PO_APPROVAL_THRESHOLD=10000.00
DEFAULT_PAYMENT_TERM_DAYS=30
AUTO_APPROVE_BELOW_THRESHOLD=true
```

## Docker Compose

```yaml
version: '3.8'

services:
  procurement-service:
    build: .
    ports:
      - "8009:8009"
      - "50009:50009"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/procurement_db
      - REDIS_URL=redis://redis:6379/9
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
      - INVENTORY_SERVICE_GRPC=inventory-service:50002
    networks:
      - erp-network

networks:
  erp-network:
    external: true
```

## Próximos Pasos

- [Overview](./00-overview.md)
- [API Suppliers](./03-api-suppliers.md)
