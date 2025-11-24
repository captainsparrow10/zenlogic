---
sidebar_position: 4
---

# Configuración - Order Service

Configuración completa de variables de entorno, puertos, y dependencias del Order Service.

## Variables de Entorno

### Base de Datos

```bash
# PostgreSQL Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/order_db
DATABASE_POOL_SIZE=30
DATABASE_MAX_OVERFLOW=60
DATABASE_ECHO=false  # Set to true for SQL debugging
```

### Puertos

```bash
# HTTP REST API
HTTP_PORT=8004
HTTP_HOST=0.0.0.0

# No gRPC Server (Order Service solo consume, no expone gRPC)

# Health Check
HEALTH_CHECK_PATH=/health
METRICS_PATH=/metrics
```

### Redis Cache

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379/4
REDIS_PASSWORD=
REDIS_MAX_CONNECTIONS=100

# Cache TTL Settings
CACHE_TTL_CART=3600            # Cart cache: 1 hora
CACHE_TTL_ORDER=300            # Order cache: 5 minutos
CACHE_TTL_PRODUCT_INFO=1800    # Product info cache: 30 minutos
```

### RabbitMQ

```bash
# RabbitMQ Connection
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_HEARTBEAT=60
RABBITMQ_CONNECTION_TIMEOUT=30

# Exchange Configuration
RABBITMQ_EXCHANGE_ORDER=order_events
RABBITMQ_EXCHANGE_TYPE=topic

# Queue Configuration
RABBITMQ_QUEUE_ORDER_UPDATES=order_updates
RABBITMQ_QUEUE_PAYMENT_UPDATES=payment_updates
RABBITMQ_QUEUE_INVENTORY_CONSUMER=order_inventory_consumer
RABBITMQ_QUEUE_CATALOG_CONSUMER=order_catalog_consumer

# Consumer Settings
RABBITMQ_PREFETCH_COUNT=20
RABBITMQ_AUTO_ACK=false
```

### gRPC Clients

```bash
# Inventory Service gRPC
INVENTORY_GRPC_HOST=localhost
INVENTORY_GRPC_PORT=50053
INVENTORY_GRPC_TIMEOUT=5000  # milliseconds
INVENTORY_GRPC_MAX_RETRIES=3

# Catalog Service gRPC
CATALOG_GRPC_HOST=localhost
CATALOG_GRPC_PORT=50052
CATALOG_GRPC_TIMEOUT=3000  # milliseconds

# Auth Service gRPC
AUTH_GRPC_HOST=localhost
AUTH_GRPC_PORT=50050
AUTH_GRPC_TIMEOUT=2000  # milliseconds
```

### Payment Gateways

```bash
# Stripe
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2023-10-16

# PayPal
PAYPAL_MODE=sandbox  # sandbox or live
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_PUBLIC_KEY=...
```

### Shipping Carriers

```bash
# FedEx
FEDEX_API_KEY=...
FEDEX_SECRET_KEY=...
FEDEX_ACCOUNT_NUMBER=...
FEDEX_METER_NUMBER=...

# UPS
UPS_USERNAME=...
UPS_PASSWORD=...
UPS_ACCESS_KEY=...

# DHL
DHL_API_KEY=...
DHL_API_SECRET=...
DHL_ACCOUNT_NUMBER=...
```

### Lógica de Negocio

```bash
# Orders
ORDER_RESERVATION_TTL_MINUTES=15
MAX_ITEMS_PER_ORDER=100
MIN_ORDER_AMOUNT=10.00
ORDER_NUMBER_PREFIX=ORD
ORDER_NUMBER_PADDING=7  # ORD-2025-0000001

# Cart
CART_EXPIRY_DAYS=30
ABANDONED_CART_HOURS=24
MAX_ITEMS_PER_CART=100

# Shipping
FREE_SHIPPING_THRESHOLD=50.00
DEFAULT_SHIPPING_METHOD=standard
ENABLE_EXPRESS_SHIPPING=true
ENABLE_SAME_DAY_SHIPPING=false

# Payments
PAYMENT_RETRY_ATTEMPTS=3
PAYMENT_TIMEOUT_SECONDS=300  # 5 minutos
PAYMENT_VERIFICATION_DELAY_MS=500

# Returns
RETURN_WINDOW_DAYS=30
MAX_RETURN_ITEMS_PER_ORDER=10
RESTOCKING_FEE_PERCENTAGE=0  # 0-100

# Invoices
INVOICE_NUMBER_PREFIX=INV
ENABLE_AUTO_INVOICING=true
INVOICE_DUE_DAYS=30
```

### Notificaciones

```bash
# Email Service
EMAIL_SERVICE_ENABLED=true
EMAIL_FROM_ADDRESS=orders@example.com
EMAIL_FROM_NAME=ERP Order System

# Notification Events
NOTIFY_ORDER_CONFIRMED=true
NOTIFY_ORDER_SHIPPED=true
NOTIFY_ORDER_DELIVERED=true
NOTIFY_PAYMENT_FAILED=true
NOTIFY_CART_ABANDONED=true
```

### Logging

```bash
# Log Configuration
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FORMAT=json
LOG_FILE_PATH=/var/log/order-service/app.log
LOG_MAX_BYTES=10485760  # 10MB
LOG_BACKUP_COUNT=5

# Audit Logging
AUDIT_LOG_ENABLED=true
AUDIT_LOG_LEVEL=INFO
```

### Seguridad

```bash
# Multi-tenancy
ENFORCE_ORGANIZATION_ISOLATION=true

# API Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=200
RATE_LIMIT_PER_HOUR=10000

# Fraud Detection
ENABLE_FRAUD_DETECTION=true
MAX_ORDER_AMOUNT_WITHOUT_REVIEW=5000.00
```

## Docker Compose - Order Service

```yaml
version: '3.8'

services:
  order-service:
    build:
      context: ./order-service
      dockerfile: Dockerfile
    container_name: erp-order-service
    ports:
      - "8004:8004"   # HTTP REST API only (no gRPC server)
    environment:
      # Database
      DATABASE_URL: postgresql://postgres:postgres@order-db:5432/order_db
      DATABASE_POOL_SIZE: 30
      DATABASE_MAX_OVERFLOW: 60

      # Redis
      REDIS_URL: redis://redis:6379/4
      REDIS_MAX_CONNECTIONS: 100

      # RabbitMQ
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
      RABBITMQ_EXCHANGE_ORDER: order_events
      RABBITMQ_PREFETCH_COUNT: 20

      # gRPC Clients (Order consumes pero no expone gRPC)
      INVENTORY_GRPC_HOST: inventory-service
      INVENTORY_GRPC_PORT: 50053
      CATALOG_GRPC_HOST: catalog-service
      CATALOG_GRPC_PORT: 50052
      AUTH_GRPC_HOST: auth-service
      AUTH_GRPC_PORT: 50050

      # Payment Gateways
      STRIPE_API_KEY: ${STRIPE_API_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      PAYPAL_CLIENT_ID: ${PAYPAL_CLIENT_ID}
      PAYPAL_CLIENT_SECRET: ${PAYPAL_CLIENT_SECRET}

      # Business Logic
      ORDER_RESERVATION_TTL_MINUTES: 15
      CART_EXPIRY_DAYS: 30
      ABANDONED_CART_HOURS: 24
      FREE_SHIPPING_THRESHOLD: 50.00
      PAYMENT_RETRY_ATTEMPTS: 3
      RETURN_WINDOW_DAYS: 30

      # Logging
      LOG_LEVEL: INFO
      LOG_FORMAT: json
    depends_on:
      - order-db
      - redis
      - rabbitmq
      - inventory-service
      - catalog-service
      - auth-service
    networks:
      - erp-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8004/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  order-db:
    image: postgres:15-alpine
    container_name: erp-order-db
    environment:
      POSTGRES_DB: order_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5436:5432"  # Puerto externo diferente
    volumes:
      - order-db-data:/var/lib/postgresql/data
      - ./order-service/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - erp-network
    restart: unless-stopped

volumes:
  order-db-data:
    driver: local

networks:
  erp-network:
    external: true
```

## Archivo .env de Ejemplo

```bash
# .env.order-service

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/order_db
DATABASE_POOL_SIZE=30

# Ports
HTTP_PORT=8004

# Redis
REDIS_URL=redis://localhost:6379/4
CACHE_TTL_CART=3600
CACHE_TTL_ORDER=300

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE_ORDER=order_events
RABBITMQ_PREFETCH_COUNT=20

# gRPC Clients
INVENTORY_GRPC_HOST=localhost
INVENTORY_GRPC_PORT=50053
CATALOG_GRPC_HOST=localhost
CATALOG_GRPC_PORT=50052
AUTH_GRPC_HOST=localhost
AUTH_GRPC_PORT=50050

# Payment Gateways
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Business Rules
ORDER_RESERVATION_TTL_MINUTES=15
CART_EXPIRY_DAYS=30
FREE_SHIPPING_THRESHOLD=50.00
MIN_ORDER_AMOUNT=10.00
PAYMENT_RETRY_ATTEMPTS=3
RETURN_WINDOW_DAYS=30

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

## Configuración por Ambiente

### Development

```bash
DATABASE_URL=postgresql://dev:dev@localhost:5432/order_db_dev
LOG_LEVEL=DEBUG
DATABASE_ECHO=true
RATE_LIMIT_ENABLED=false
STRIPE_API_KEY=sk_test_...
PAYPAL_MODE=sandbox
ENABLE_FRAUD_DETECTION=false
```

### Staging

```bash
DATABASE_URL=postgresql://staging_user:staging_pass@staging-db:5432/order_db_staging
LOG_LEVEL=INFO
RATE_LIMIT_ENABLED=true
STRIPE_API_KEY=sk_test_...
PAYPAL_MODE=sandbox
ENABLE_FRAUD_DETECTION=true
NOTIFY_CART_ABANDONED=true
```

### Production

```bash
DATABASE_URL=postgresql://prod_user:secure_password@prod-db:5432/order_db
LOG_LEVEL=WARNING
DATABASE_ECHO=false
RATE_LIMIT_ENABLED=true
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=...
ENABLE_FRAUD_DETECTION=true
NOTIFY_CART_ABANDONED=true
MAX_ORDER_AMOUNT_WITHOUT_REVIEW=5000.00
```

## Validación de Configuración

```python
from pydantic import BaseSettings, Field, validator
from typing import Literal

class Settings(BaseSettings):
    """Order Service Configuration."""

    # Database
    database_url: str = Field(..., env='DATABASE_URL')
    database_pool_size: int = Field(30, env='DATABASE_POOL_SIZE')

    # Ports
    http_port: int = Field(8004, env='HTTP_PORT')

    # Redis
    redis_url: str = Field(..., env='REDIS_URL')
    cache_ttl_cart: int = Field(3600, env='CACHE_TTL_CART')
    cache_ttl_order: int = Field(300, env='CACHE_TTL_ORDER')

    # RabbitMQ
    rabbitmq_url: str = Field(..., env='RABBITMQ_URL')
    rabbitmq_exchange_order: str = Field('order_events', env='RABBITMQ_EXCHANGE_ORDER')
    rabbitmq_prefetch_count: int = Field(20, env='RABBITMQ_PREFETCH_COUNT')

    # gRPC Clients
    inventory_grpc_host: str = Field('localhost', env='INVENTORY_GRPC_HOST')
    inventory_grpc_port: int = Field(50053, env='INVENTORY_GRPC_PORT')
    catalog_grpc_host: str = Field('localhost', env='CATALOG_GRPC_HOST')
    catalog_grpc_port: int = Field(50052, env='CATALOG_GRPC_PORT')
    auth_grpc_host: str = Field('localhost', env='AUTH_GRPC_HOST')
    auth_grpc_port: int = Field(50050, env='AUTH_GRPC_PORT')

    # Payment Gateways
    stripe_api_key: str = Field(..., env='STRIPE_API_KEY')
    stripe_webhook_secret: str = Field(..., env='STRIPE_WEBHOOK_SECRET')
    paypal_mode: Literal['sandbox', 'live'] = Field('sandbox', env='PAYPAL_MODE')
    paypal_client_id: str = Field(None, env='PAYPAL_CLIENT_ID')
    paypal_client_secret: str = Field(None, env='PAYPAL_CLIENT_SECRET')

    # Business Logic
    order_reservation_ttl_minutes: int = Field(15, env='ORDER_RESERVATION_TTL_MINUTES')
    cart_expiry_days: int = Field(30, env='CART_EXPIRY_DAYS')
    abandoned_cart_hours: int = Field(24, env='ABANDONED_CART_HOURS')
    free_shipping_threshold: float = Field(50.00, env='FREE_SHIPPING_THRESHOLD')
    min_order_amount: float = Field(10.00, env='MIN_ORDER_AMOUNT')
    payment_retry_attempts: int = Field(3, env='PAYMENT_RETRY_ATTEMPTS')
    return_window_days: int = Field(30, env='RETURN_WINDOW_DAYS')

    # Logging
    log_level: str = Field('INFO', env='LOG_LEVEL')
    log_format: str = Field('json', env='LOG_FORMAT')

    @validator('http_port')
    def validate_http_port(cls, v):
        if v != 8004:
            raise ValueError('HTTP port must be 8004 for Order Service')
        return v

    @validator('order_reservation_ttl_minutes')
    def validate_reservation_ttl(cls, v):
        if v < 5 or v > 60:
            raise ValueError('Reservation TTL must be between 5 and 60 minutes')
        return v

    @validator('payment_retry_attempts')
    def validate_payment_retries(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Payment retry attempts must be between 1 and 5')
        return v

    @validator('return_window_days')
    def validate_return_window(cls, v):
        if v < 7 or v > 90:
            raise ValueError('Return window must be between 7 and 90 days')
        return v

    class Config:
        env_file = '.env'
        case_sensitive = False

# Usage
settings = Settings()
```

## Próximos Pasos

- [Modelo de Datos](./modelo-datos)
- [API: Orders](./api-orders)
- [API: Cart](./api-cart)
- [API: Payments](./api-payments)
- [Eventos Publicados](./eventos-publicados)
- [Eventos Consumidos](./eventos-consumidos)
