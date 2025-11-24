---
sidebar_position: 11
---

# Configuración

Configuración completa del POS Service.

## Variables de Entorno

```bash
# .env

# Service Info
SERVICE_NAME=pos-service
SERVICE_VERSION=1.0.0
PORT=8006

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/pos_db
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_ECHO=false

# Redis Cache
REDIS_URL=redis://localhost:6379/6
REDIS_PASSWORD=
REDIS_MAX_CONNECTIONS=50
CACHE_DEFAULT_TTL=900  # 15 minutos

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE=pos_events
RABBITMQ_PREFETCH_COUNT=10

# Auth Service
AUTH_SERVICE_URL=http://localhost:8000
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=RS256
JWT_PUBLIC_KEY_PATH=/keys/public.pem

# gRPC Clients
CATALOG_SERVICE_GRPC=localhost:50001
INVENTORY_SERVICE_GRPC=localhost:50002
PRICING_SERVICE_GRPC=localhost:50008
CUSTOMER_SERVICE_GRPC=localhost:50007

# Business Rules
MAX_DISCOUNT_WITHOUT_AUTH=5.0  # Porcentaje
MAX_ITEMS_PER_TRANSACTION=100
VOID_SAME_DAY_ONLY=true
LOYALTY_POINTS_RATE=1  # 1 punto por cada $1

# Offline Mode
OFFLINE_SYNC_BATCH_SIZE=50
OFFLINE_MAX_RETRY_ATTEMPTS=3
OFFLINE_RETRY_DELAY_SECONDS=60

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
SENTRY_DSN=

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Configuración de FastAPI

```python
# config/settings.py

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Service
    service_name: str = "pos-service"
    service_version: str = "1.0.0"
    port: int = 8006
    debug: bool = False

    # Database
    database_url: str
    db_pool_size: int = 20
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_echo: bool = False

    # Redis
    redis_url: str
    redis_password: Optional[str] = None
    redis_max_connections: int = 50
    cache_default_ttl: int = 900

    # RabbitMQ
    rabbitmq_url: str
    rabbitmq_exchange: str = "pos_events"
    rabbitmq_prefetch_count: int = 10

    # Auth
    auth_service_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "RS256"
    jwt_public_key_path: str

    # gRPC Clients
    catalog_service_grpc: str
    inventory_service_grpc: str
    pricing_service_grpc: str
    customer_service_grpc: str

    # Business Rules
    max_discount_without_auth: float = 5.0
    max_items_per_transaction: int = 100
    void_same_day_only: bool = True
    loyalty_points_rate: int = 1

    # Offline
    offline_sync_batch_size: int = 50
    offline_max_retry_attempts: int = 3
    offline_retry_delay_seconds: int = 60

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    sentry_dsn: Optional[str] = None

    # Monitoring
    enable_metrics: bool = True
    metrics_port: int = 9090

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

## Inicialización de la Aplicación

```python
# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config.settings import settings
from config.database import engine, create_tables
from config.redis import init_redis_pool, close_redis_pool
from config.rabbitmq import init_rabbitmq, close_rabbitmq
from routers import transactions, products, payments, sync
from middleware import AuthMiddleware, LoggingMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 Starting {settings.service_name} v{settings.service_version}")

    # Database
    await create_tables()
    print("✅ Database tables created")

    # Redis
    await init_redis_pool()
    print("✅ Redis connection pool initialized")

    # RabbitMQ
    await init_rabbitmq()
    print("✅ RabbitMQ connection established")

    yield

    # Shutdown
    print("🛑 Shutting down gracefully...")

    await close_redis_pool()
    await close_rabbitmq()
    await engine.dispose()

    print("✅ Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="POS Service",
    description="Point of Sale service for retail operations",
    version=settings.service_version,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware
app.add_middleware(AuthMiddleware)
app.add_middleware(LoggingMiddleware)

# Routers
app.include_router(transactions.router, prefix="/api/v1/pos", tags=["Transactions"])
app.include_router(products.router, prefix="/api/v1/pos", tags=["Products"])
app.include_router(payments.router, prefix="/api/v1/pos", tags=["Payments"])
app.include_router(sync.router, prefix="/api/v1/pos", tags=["Sync"])

# Health Check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.service_name,
        "version": settings.service_version
    }

@app.get("/ready")
async def readiness_check():
    # Check dependencies
    checks = {
        "database": await check_database(),
        "redis": await check_redis(),
        "rabbitmq": await check_rabbitmq()
    }

    all_healthy = all(checks.values())

    return {
        "ready": all_healthy,
        "checks": checks
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
```

## Configuración de Database

```python
# config/database.py

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from config.settings import settings

# Engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.db_echo,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_pre_ping=True
)

# Session factory
async_session_maker = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        yield session

async def create_tables():
    from models import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

## Configuración de Redis

```python
# config/redis.py

from redis.asyncio import Redis
from redis.asyncio.connection import ConnectionPool

from config.settings import settings

redis_pool: ConnectionPool = None
redis_client: Redis = None

async def init_redis_pool():
    global redis_pool, redis_client

    redis_pool = ConnectionPool.from_url(
        settings.redis_url,
        password=settings.redis_password,
        max_connections=settings.redis_max_connections,
        decode_responses=True
    )

    redis_client = Redis(connection_pool=redis_pool)

async def close_redis_pool():
    if redis_client:
        await redis_client.close()

    if redis_pool:
        await redis_pool.disconnect()

async def get_redis() -> Redis:
    return redis_client
```

## Configuración de RabbitMQ

```python
# config/rabbitmq.py

import aio_pika
from aio_pika import Channel, Connection, Exchange

from config.settings import settings

connection: Connection = None
channel: Channel = None
exchange: Exchange = None

async def init_rabbitmq():
    global connection, channel, exchange

    connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    channel = await connection.channel()

    await channel.set_qos(prefetch_count=settings.rabbitmq_prefetch_count)

    exchange = await channel.declare_exchange(
        settings.rabbitmq_exchange,
        aio_pika.ExchangeType.TOPIC,
        durable=True
    )

async def close_rabbitmq():
    if channel:
        await channel.close()

    if connection:
        await connection.close()

async def get_channel() -> Channel:
    return channel

async def get_exchange() -> Exchange:
    return exchange
```

## Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  pos-service:
    build: .
    container_name: pos-service
    ports:
      - "8006:8006"
      - "9090:9090"  # Metrics
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/pos_db
      - REDIS_URL=redis://redis:6379/6
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
      - CATALOG_SERVICE_GRPC=catalog-service:50001
      - INVENTORY_SERVICE_GRPC=inventory-service:50002
      - PRICING_SERVICE_GRPC=pricing-service:50008
      - CUSTOMER_SERVICE_GRPC=customer-service:50007
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
      - POSTGRES_DB=pos_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - pos_db_data:/var/lib/postgresql/data
    networks:
      - erp-network

  redis:
    image: redis:7-alpine
    networks:
      - erp-network

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    ports:
      - "15672:15672"  # Management UI
    networks:
      - erp-network

volumes:
  pos_db_data:

networks:
  erp-network:
    external: true
```

## Dockerfile

```dockerfile
# Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose ports
EXPOSE 8006 9090

# Run application
CMD ["python", "main.py"]
```

## Requirements

```txt
# requirements.txt

fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0

# Database
sqlalchemy==2.0.23
asyncpg==0.29.0
alembic==1.12.1

# Redis
redis[asyncio]==5.0.1

# RabbitMQ
aio-pika==9.3.0

# gRPC
grpcio==1.59.3
grpcio-tools==1.59.3

# HTTP Client
httpx==0.25.2

# Circuit Breaker
circuitbreaker==1.4.0

# Retry
tenacity==8.2.3

# Monitoring
prometheus-client==0.19.0
sentry-sdk==1.38.0

# Logging
structlog==23.2.0

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
```

## Próximos Pasos

- [Overview](./00-overview.md)
- [API de Transacciones](./03-api-transactions.md)
