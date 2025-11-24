---
sidebar_position: 4
---

# Configuración - Inventory Service

Configuración completa de variables de entorno, puertos, y dependencias del Inventory Service.

## Variables de Entorno

### Base de Datos

```bash
# PostgreSQL Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=40
DATABASE_ECHO=false  # Set to true for SQL debugging
```

### Puertos

```bash
# HTTP REST API
HTTP_PORT=8003
HTTP_HOST=0.0.0.0

# gRPC Server
GRPC_PORT=50053
GRPC_HOST=0.0.0.0

# Health Check
HEALTH_CHECK_PATH=/health
METRICS_PATH=/metrics
```

### Redis Cache

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379/3
REDIS_PASSWORD=
REDIS_MAX_CONNECTIONS=50

# Cache TTL Settings
CACHE_TTL_STOCK=300            # Stock cache: 5 minutos
CACHE_TTL_AVAILABILITY=60      # Availability check: 1 minuto
CACHE_TTL_WAREHOUSE=3600       # Warehouse info: 1 hora
```

### RabbitMQ

```bash
# RabbitMQ Connection
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_HEARTBEAT=60
RABBITMQ_CONNECTION_TIMEOUT=30

# Exchange Configuration
RABBITMQ_EXCHANGE_INVENTORY=inventory_events
RABBITMQ_EXCHANGE_TYPE=topic

# Queue Configuration
RABBITMQ_QUEUE_CATALOG_CONSUMER=inventory_catalog_consumer
RABBITMQ_QUEUE_ORDER_CONSUMER=inventory_order_consumer

# Consumer Settings
RABBITMQ_PREFETCH_COUNT=10
RABBITMQ_AUTO_ACK=false
```

### gRPC Clients

```bash
# Catalog Service gRPC
CATALOG_GRPC_HOST=localhost
CATALOG_GRPC_PORT=50052
CATALOG_GRPC_TIMEOUT=5000  # milliseconds

# Auth Service gRPC
AUTH_GRPC_HOST=localhost
AUTH_GRPC_PORT=50050
AUTH_GRPC_TIMEOUT=3000  # milliseconds
```

### Lógica de Negocio

```bash
# Stock Management
DEFAULT_MIN_STOCK=20
DEFAULT_MAX_STOCK=1000
DEFAULT_REORDER_POINT=30
LOW_STOCK_THRESHOLD=25
CRITICAL_STOCK_THRESHOLD=10

# Reservations
RESERVATION_TTL_MINUTES=15
RESERVATION_CLEANUP_INTERVAL_MINUTES=5
MAX_RESERVATION_RETRY_ATTEMPTS=3

# Movements
MOVEMENT_BATCH_SIZE=100
MOVEMENT_RETENTION_DAYS=730  # 2 años

# Alerts
ENABLE_LOW_STOCK_ALERTS=true
ENABLE_CRITICAL_STOCK_ALERTS=true
ALERT_NOTIFICATION_DELAY_SECONDS=300  # 5 minutos entre alertas
```

### Logging

```bash
# Log Configuration
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FORMAT=json
LOG_FILE_PATH=/var/log/inventory-service/app.log
LOG_MAX_BYTES=10485760  # 10MB
LOG_BACKUP_COUNT=5
```

### Seguridad

```bash
# Multi-tenancy
ENFORCE_ORGANIZATION_ISOLATION=true

# API Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_PER_HOUR=5000
```

## Docker Compose - Inventory Service

```yaml
version: '3.8'

services:
  inventory-service:
    build:
      context: ./inventory-service
      dockerfile: Dockerfile
    container_name: erp-inventory-service
    ports:
      - "8003:8003"   # HTTP REST API
      - "50053:50053" # gRPC Server
    environment:
      # Database
      DATABASE_URL: postgresql://postgres:postgres@inventory-db:5432/inventory_db
      DATABASE_POOL_SIZE: 20
      DATABASE_MAX_OVERFLOW: 40

      # Redis
      REDIS_URL: redis://redis:6379/3
      REDIS_MAX_CONNECTIONS: 50

      # RabbitMQ
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
      RABBITMQ_EXCHANGE_INVENTORY: inventory_events
      RABBITMQ_PREFETCH_COUNT: 10

      # gRPC Clients
      CATALOG_GRPC_HOST: catalog-service
      CATALOG_GRPC_PORT: 50052
      AUTH_GRPC_HOST: auth-service
      AUTH_GRPC_PORT: 50050

      # Business Logic
      RESERVATION_TTL_MINUTES: 15
      DEFAULT_MIN_STOCK: 20
      DEFAULT_REORDER_POINT: 30

      # Logging
      LOG_LEVEL: INFO
      LOG_FORMAT: json
    depends_on:
      - inventory-db
      - redis
      - rabbitmq
      - catalog-service
      - auth-service
    networks:
      - erp-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8003/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  inventory-db:
    image: postgres:15-alpine
    container_name: erp-inventory-db
    environment:
      POSTGRES_DB: inventory_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5435:5432"  # Puerto externo diferente para no conflictuar
    volumes:
      - inventory-db-data:/var/lib/postgresql/data
      - ./inventory-service/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - erp-network
    restart: unless-stopped

volumes:
  inventory-db-data:
    driver: local

networks:
  erp-network:
    external: true
```

## Archivo .env de Ejemplo

```bash
# .env.inventory-service

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db
DATABASE_POOL_SIZE=20

# Ports
HTTP_PORT=8003
GRPC_PORT=50053

# Redis
REDIS_URL=redis://localhost:6379/3

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE_INVENTORY=inventory_events
RABBITMQ_PREFETCH_COUNT=10

# gRPC Clients
CATALOG_GRPC_HOST=localhost
CATALOG_GRPC_PORT=50052
AUTH_GRPC_HOST=localhost
AUTH_GRPC_PORT=50050

# Business Rules
RESERVATION_TTL_MINUTES=15
DEFAULT_MIN_STOCK=20
DEFAULT_REORDER_POINT=30
LOW_STOCK_THRESHOLD=25

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

## Configuración por Ambiente

### Development

```bash
DATABASE_URL=postgresql://dev:dev@localhost:5432/inventory_db_dev
LOG_LEVEL=DEBUG
DATABASE_ECHO=true
RATE_LIMIT_ENABLED=false
```

### Staging

```bash
DATABASE_URL=postgresql://staging_user:staging_pass@staging-db:5432/inventory_db_staging
LOG_LEVEL=INFO
RATE_LIMIT_ENABLED=true
ENABLE_LOW_STOCK_ALERTS=true
```

### Production

```bash
DATABASE_URL=postgresql://prod_user:secure_password@prod-db:5432/inventory_db
LOG_LEVEL=WARNING
DATABASE_ECHO=false
RATE_LIMIT_ENABLED=true
ENABLE_LOW_STOCK_ALERTS=true
ENABLE_CRITICAL_STOCK_ALERTS=true
```

## Validación de Configuración

```python
from pydantic import BaseSettings, Field, validator

class Settings(BaseSettings):
    """Inventory Service Configuration."""

    # Database
    database_url: str = Field(..., env='DATABASE_URL')
    database_pool_size: int = Field(20, env='DATABASE_POOL_SIZE')

    # Ports
    http_port: int = Field(8003, env='HTTP_PORT')
    grpc_port: int = Field(50053, env='GRPC_PORT')

    # Redis
    redis_url: str = Field(..., env='REDIS_URL')
    cache_ttl_stock: int = Field(300, env='CACHE_TTL_STOCK')

    # RabbitMQ
    rabbitmq_url: str = Field(..., env='RABBITMQ_URL')
    rabbitmq_exchange_inventory: str = Field('inventory_events', env='RABBITMQ_EXCHANGE_INVENTORY')
    rabbitmq_prefetch_count: int = Field(10, env='RABBITMQ_PREFETCH_COUNT')

    # gRPC Clients
    catalog_grpc_host: str = Field('localhost', env='CATALOG_GRPC_HOST')
    catalog_grpc_port: int = Field(50052, env='CATALOG_GRPC_PORT')
    auth_grpc_host: str = Field('localhost', env='AUTH_GRPC_HOST')
    auth_grpc_port: int = Field(50050, env='AUTH_GRPC_PORT')

    # Business Logic
    reservation_ttl_minutes: int = Field(15, env='RESERVATION_TTL_MINUTES')
    default_min_stock: int = Field(20, env='DEFAULT_MIN_STOCK')
    default_reorder_point: int = Field(30, env='DEFAULT_REORDER_POINT')

    # Logging
    log_level: str = Field('INFO', env='LOG_LEVEL')
    log_format: str = Field('json', env='LOG_FORMAT')

    @validator('http_port')
    def validate_http_port(cls, v):
        if v != 8003:
            raise ValueError('HTTP port must be 8003 for Inventory Service')
        return v

    @validator('grpc_port')
    def validate_grpc_port(cls, v):
        if v != 50053:
            raise ValueError('gRPC port must be 50053 for Inventory Service')
        return v

    @validator('reservation_ttl_minutes')
    def validate_reservation_ttl(cls, v):
        if v < 5 or v > 60:
            raise ValueError('Reservation TTL must be between 5 and 60 minutes')
        return v

    class Config:
        env_file = '.env'
        case_sensitive = False

# Usage
settings = Settings()
```

## Próximos Pasos

- [Modelo de Datos](./modelo-datos)
- [Eventos Publicados](./eventos-publicados)
- [Eventos Consumidos](./eventos-consumidos)
- [gRPC Server](./grpc-server)
