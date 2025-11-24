---
sidebar_position: 4
---

# Configuración - Audit Service

Configuración completa de variables de entorno, puertos, y dependencias del Audit Service.

## Variables de Entorno

### Base de Datos

```bash
# PostgreSQL Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/audit_db
DATABASE_POOL_SIZE=50  # Mayor pool para escritura intensiva
DATABASE_MAX_OVERFLOW=100
DATABASE_ECHO=false  # Set to true for SQL debugging
```

### Puertos

```bash
# HTTP REST API
HTTP_PORT=8005
HTTP_HOST=0.0.0.0

# No gRPC Server (Audit Service solo expone REST API)

# Health Check
HEALTH_CHECK_PATH=/health
METRICS_PATH=/metrics
```

### Redis

```bash
# Redis NO es requerido para Audit Service
# Audit Service no usa cache debido a que todos los datos son históricos
```

### RabbitMQ

```bash
# RabbitMQ Connection
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_HEARTBEAT=60
RABBITMQ_CONNECTION_TIMEOUT=30

# Exchange Subscriptions (consume de TODOS los exchanges)
RABBITMQ_EXCHANGE_AUTH=auth_events
RABBITMQ_EXCHANGE_CATALOG=catalog_events
RABBITMQ_EXCHANGE_INVENTORY=inventory_events
RABBITMQ_EXCHANGE_ORDER=order_events

# Queue Configuration
RABBITMQ_QUEUE_AUDIT_CONSUMER=audit_event_consumer

# Consumer Settings
RABBITMQ_PREFETCH_COUNT=50
RABBITMQ_AUTO_ACK=false

# Routing Keys (consume todos los eventos)
RABBITMQ_ROUTING_KEY_AUTH=auth.#
RABBITMQ_ROUTING_KEY_CATALOG=catalog.#
RABBITMQ_ROUTING_KEY_INVENTORY=inventory.#
RABBITMQ_ROUTING_KEY_ORDER=order.#
```

### Lógica de Negocio

```bash
# Event Processing
BATCH_SIZE=100
BATCH_TIMEOUT_SECONDS=1  # Reducido a 1 segundo para cumplir SLA de 2 segundos
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_SECONDS=5

# Data Retention
RETENTION_POLICY_DAYS=2555  # 7 años para compliance (7 * 365 = 2555 días)
PARTITION_BY_MONTH=true
AUTO_CREATE_PARTITIONS=true
PARTITION_RETENTION_MONTHS=84  # 7 años en meses

# Idempotency
ENABLE_IDEMPOTENCY_CHECK=true
IDEMPOTENCY_CACHE_SIZE=10000  # Últimos 10k event_ids en memoria

# Performance
ENABLE_ASYNC_INSERT=true
INSERT_BATCH_SIZE=100
INSERT_FLUSH_INTERVAL_MS=500
```

### Logging

```bash
# Log Configuration
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FORMAT=json
LOG_FILE_PATH=/var/log/audit-service/app.log
LOG_MAX_BYTES=10485760  # 10MB
LOG_BACKUP_COUNT=10  # Más backups por ser servicio de auditoría

# Audit of Audit (meta-logging)
LOG_FAILED_EVENTS=true
FAILED_EVENTS_LOG_PATH=/var/log/audit-service/failed_events.log
```

### Seguridad

```bash
# Multi-tenancy
ENFORCE_ORGANIZATION_ISOLATION=true

# API Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=500  # Mayor que otros servicios (queries de compliance)
RATE_LIMIT_PER_HOUR=30000

# API Access
ENABLE_PUBLIC_API=false  # Audit API solo para usuarios autorizados
REQUIRE_ADMIN_ROLE=true
```

### Compliance

```bash
# Regulatory Compliance
ENABLE_COMPLIANCE_MODE=true
IMMUTABLE_LOGS=true  # No permite UPDATE/DELETE en audit_logs
ENABLE_ENCRYPTION_AT_REST=true

# Export Configuration
ENABLE_AUDIT_EXPORT=true
EXPORT_FORMAT=csv,json
MAX_EXPORT_ROWS=1000000
```

## Docker Compose - Audit Service

```yaml
version: '3.8'

services:
  audit-service:
    build:
      context: ./audit-service
      dockerfile: Dockerfile
    container_name: erp-audit-service
    ports:
      - "8005:8005"   # HTTP REST API only
    environment:
      # Database
      DATABASE_URL: postgresql://postgres:postgres@audit-db:5432/audit_db
      DATABASE_POOL_SIZE: 50
      DATABASE_MAX_OVERFLOW: 100

      # No Redis (Audit Service no usa cache)

      # RabbitMQ - Consume de TODOS los exchanges
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
      RABBITMQ_EXCHANGE_AUTH: auth_events
      RABBITMQ_EXCHANGE_CATALOG: catalog_events
      RABBITMQ_EXCHANGE_INVENTORY: inventory_events
      RABBITMQ_EXCHANGE_ORDER: order_events
      RABBITMQ_PREFETCH_COUNT: 50

      # Event Processing
      BATCH_SIZE: 100
      BATCH_TIMEOUT_SECONDS: 1
      MAX_RETRY_ATTEMPTS: 3

      # Data Retention
      RETENTION_POLICY_DAYS: 2555  # 7 años
      PARTITION_BY_MONTH: true
      AUTO_CREATE_PARTITIONS: true

      # Compliance
      ENABLE_COMPLIANCE_MODE: true
      IMMUTABLE_LOGS: true

      # Logging
      LOG_LEVEL: INFO
      LOG_FORMAT: json
      LOG_FAILED_EVENTS: true
    depends_on:
      - audit-db
      - rabbitmq
    networks:
      - erp-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8005/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - audit-logs:/var/log/audit-service

  audit-db:
    image: postgres:15-alpine
    container_name: erp-audit-db
    environment:
      POSTGRES_DB: audit_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5437:5432"  # Puerto externo diferente
    volumes:
      - audit-db-data:/var/lib/postgresql/data
      - ./audit-service/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - erp-network
    restart: unless-stopped
    # Configuración especial para audit DB (mayor capacidad)
    command: >
      postgres
      -c max_connections=200
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100

volumes:
  audit-db-data:
    driver: local
  audit-logs:
    driver: local

networks:
  erp-network:
    external: true
```

## Archivo .env de Ejemplo

```bash
# .env.audit-service

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/audit_db
DATABASE_POOL_SIZE=50

# Ports
HTTP_PORT=8005

# RabbitMQ - Consume de TODOS los exchanges
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE_AUTH=auth_events
RABBITMQ_EXCHANGE_CATALOG=catalog_events
RABBITMQ_EXCHANGE_INVENTORY=inventory_events
RABBITMQ_EXCHANGE_ORDER=order_events
RABBITMQ_PREFETCH_COUNT=50

# Event Processing
BATCH_SIZE=100
BATCH_TIMEOUT_SECONDS=1
MAX_RETRY_ATTEMPTS=3
ENABLE_IDEMPOTENCY_CHECK=true

# Data Retention
RETENTION_POLICY_DAYS=2555  # 7 años
PARTITION_BY_MONTH=true
AUTO_CREATE_PARTITIONS=true

# Compliance
ENABLE_COMPLIANCE_MODE=true
IMMUTABLE_LOGS=true
REQUIRE_ADMIN_ROLE=true

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FAILED_EVENTS=true
```

## Configuración por Ambiente

### Development

```bash
DATABASE_URL=postgresql://dev:dev@localhost:5432/audit_db_dev
LOG_LEVEL=DEBUG
DATABASE_ECHO=true
RATE_LIMIT_ENABLED=false
RETENTION_POLICY_DAYS=30  # Solo 30 días en dev
ENABLE_COMPLIANCE_MODE=false
IMMUTABLE_LOGS=false
```

### Staging

```bash
DATABASE_URL=postgresql://staging_user:staging_pass@staging-db:5432/audit_db_staging
LOG_LEVEL=INFO
RATE_LIMIT_ENABLED=true
RETENTION_POLICY_DAYS=365  # 1 año en staging
ENABLE_COMPLIANCE_MODE=true
IMMUTABLE_LOGS=true
```

### Production

```bash
DATABASE_URL=postgresql://prod_user:secure_password@prod-db:5432/audit_db
LOG_LEVEL=WARNING
DATABASE_ECHO=false
RATE_LIMIT_ENABLED=true
RETENTION_POLICY_DAYS=2555  # 7 años en producción
ENABLE_COMPLIANCE_MODE=true
IMMUTABLE_LOGS=true
REQUIRE_ADMIN_ROLE=true
ENABLE_ENCRYPTION_AT_REST=true
```

## Validación de Configuración

```python
from pydantic import BaseSettings, Field, validator

class Settings(BaseSettings):
    """Audit Service Configuration."""

    # Database
    database_url: str = Field(..., env='DATABASE_URL')
    database_pool_size: int = Field(50, env='DATABASE_POOL_SIZE')

    # Ports
    http_port: int = Field(8005, env='HTTP_PORT')

    # RabbitMQ - Todos los exchanges
    rabbitmq_url: str = Field(..., env='RABBITMQ_URL')
    rabbitmq_exchange_auth: str = Field('auth_events', env='RABBITMQ_EXCHANGE_AUTH')
    rabbitmq_exchange_catalog: str = Field('catalog_events', env='RABBITMQ_EXCHANGE_CATALOG')
    rabbitmq_exchange_inventory: str = Field('inventory_events', env='RABBITMQ_EXCHANGE_INVENTORY')
    rabbitmq_exchange_order: str = Field('order_events', env='RABBITMQ_EXCHANGE_ORDER')
    rabbitmq_prefetch_count: int = Field(50, env='RABBITMQ_PREFETCH_COUNT')

    # Event Processing
    batch_size: int = Field(100, env='BATCH_SIZE')
    batch_timeout_seconds: int = Field(1, env='BATCH_TIMEOUT_SECONDS')
    max_retry_attempts: int = Field(3, env='MAX_RETRY_ATTEMPTS')
    enable_idempotency_check: bool = Field(True, env='ENABLE_IDEMPOTENCY_CHECK')

    # Data Retention
    retention_policy_days: int = Field(2555, env='RETENTION_POLICY_DAYS')
    partition_by_month: bool = Field(True, env='PARTITION_BY_MONTH')
    auto_create_partitions: bool = Field(True, env='AUTO_CREATE_PARTITIONS')

    # Compliance
    enable_compliance_mode: bool = Field(True, env='ENABLE_COMPLIANCE_MODE')
    immutable_logs: bool = Field(True, env='IMMUTABLE_LOGS')
    require_admin_role: bool = Field(True, env='REQUIRE_ADMIN_ROLE')

    # Logging
    log_level: str = Field('INFO', env='LOG_LEVEL')
    log_format: str = Field('json', env='LOG_FORMAT')
    log_failed_events: bool = Field(True, env='LOG_FAILED_EVENTS')

    @validator('http_port')
    def validate_http_port(cls, v):
        if v != 8005:
            raise ValueError('HTTP port must be 8005 for Audit Service')
        return v

    @validator('batch_timeout_seconds')
    def validate_batch_timeout(cls, v):
        if v > 2:
            raise ValueError('Batch timeout must be <= 2 seconds to meet SLA')
        return v

    @validator('retention_policy_days')
    def validate_retention(cls, v):
        if v < 365:
            raise ValueError('Retention policy must be at least 1 year for compliance')
        return v

    @validator('rabbitmq_prefetch_count')
    def validate_prefetch_count(cls, v):
        if v != 50:
            raise ValueError('Prefetch count should be 50 for Audit Service')
        return v

    class Config:
        env_file = '.env'
        case_sensitive = False

# Usage
settings = Settings()
```

## Event Consumer Configuration

```python
# Configuración de bindings para consumir de todos los exchanges

EVENT_CONSUMER_CONFIG = {
    'exchanges': [
        {
            'name': 'auth_events',
            'type': 'topic',
            'routing_keys': ['auth.#']  # Todos los eventos de auth
        },
        {
            'name': 'catalog_events',
            'type': 'topic',
            'routing_keys': ['catalog.#']  # Todos los eventos de catalog
        },
        {
            'name': 'inventory_events',
            'type': 'topic',
            'routing_keys': ['inventory.#']  # Todos los eventos de inventory
        },
        {
            'name': 'order_events',
            'type': 'topic',
            'routing_keys': ['order.#']  # Todos los eventos de order
        }
    ],
    'queue': 'audit_event_consumer',
    'prefetch_count': 50,
    'auto_ack': False
}
```

## Partition Management Script

```bash
#!/bin/bash
# create_audit_partitions.sh

# Crea particiones para los próximos 12 meses

YEAR=$(date +%Y)
MONTH=$(date +%m)

for i in {0..12}; do
    PARTITION_DATE=$(date -d "$YEAR-$MONTH-01 +$i months" +%Y-%m)
    PARTITION_NAME="audit_logs_${PARTITION_DATE//-/_}"
    RANGE_START="${PARTITION_DATE}-01"
    RANGE_END=$(date -d "$RANGE_START +1 month" +%Y-%m-%d)

    psql -U postgres -d audit_db -c "
    CREATE TABLE IF NOT EXISTS ${PARTITION_NAME}
    PARTITION OF audit_logs
    FOR VALUES FROM ('${RANGE_START}') TO ('${RANGE_END}');
    "
done
```

## Monitoring Configuration

```bash
# Prometheus Metrics
ENABLE_PROMETHEUS=true
PROMETHEUS_PORT=9090

# Metrics to track
METRIC_EVENTS_PROCESSED_TOTAL=true
METRIC_EVENTS_FAILED_TOTAL=true
METRIC_PROCESSING_DURATION_SECONDS=true
METRIC_BATCH_SIZE_CURRENT=true
METRIC_QUEUE_SIZE_CURRENT=true
```

## Próximos Pasos

- [Modelo de Datos](./modelo-datos)
- [Event Consumer](./event-consumer)
- [API: Audit Logs](./api-logs)
- [Arquitectura](./arquitectura)
