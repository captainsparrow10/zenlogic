---
sidebar_position: 5
---

# Configuración

Variables de entorno y configuración del Catalog Service.

## Variables de Entorno

### Base de Datos

```bash
# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=catalog_db
DATABASE_USER=catalog_user
DATABASE_PASSWORD=secure_password

# Pool de conexiones
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
DATABASE_POOL_TIMEOUT=30
DATABASE_POOL_RECYCLE=3600
```

### Redis Cache

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=1
REDIS_PASSWORD=
REDIS_MAX_CONNECTIONS=50

# Cache TTL (segundos)
CACHE_TTL_DEFAULT=300        # 5 minutos
CACHE_TTL_PRODUCTS=600       # 10 minutos
CACHE_TTL_VARIANTS=600       # 10 minutos
CACHE_TTL_OPTIONS=1800       # 30 minutos (cambian poco)
CACHE_TTL_LOCALS=3600        # 1 hora
```

### RabbitMQ

```bash
# RabbitMQ Connection
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/

# Exchanges
RABBITMQ_EXCHANGE_CATALOG=catalog_events
RABBITMQ_EXCHANGE_AUTH=auth_events

# Queues
RABBITMQ_QUEUE_CATALOG=catalog_service_queue
RABBITMQ_QUEUE_AUTH_EVENTS=catalog_auth_events_queue

# Prefetch
RABBITMQ_PREFETCH_COUNT=10
```

### Auth Service (gRPC)

```bash
# gRPC Client
AUTH_GRPC_HOST=localhost
AUTH_GRPC_PORT=50051
AUTH_GRPC_TIMEOUT=5          # segundos
AUTH_GRPC_MAX_RETRIES=3
AUTH_GRPC_RETRY_DELAY=1      # segundos

# Fallback REST
AUTH_REST_URL=http://localhost:8001
AUTH_REST_TIMEOUT=10         # segundos

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60   # segundos
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=30
```

### API Server

```bash
# FastAPI
SERVICE_NAME=catalog-service
SERVICE_VERSION=1.0.0
API_HOST=0.0.0.0
API_PORT=8002
API_WORKERS=4

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_ALLOW_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60         # segundos
```

### Logging

```bash
# Logging
LOG_LEVEL=INFO               # DEBUG, INFO, WARNING, ERROR
LOG_FORMAT=json              # json, text
LOG_FILE=/var/log/catalog-service/app.log
LOG_MAX_BYTES=10485760       # 10 MB
LOG_BACKUP_COUNT=5
```

### Seguridad

```bash
# JWT (mismas claves que Auth Service)
JWT_PUBLIC_KEY_PATH=/app/keys/jwt_public.pem
JWT_ALGORITHM=RS256

# Multi-tenancy
TENANT_HEADER_NAME=X-Tenant-ID
ENFORCE_TENANT_ISOLATION=true
```

### Paginación

```bash
# Cursor Pagination
PAGINATION_DEFAULT_LIMIT=20
PAGINATION_MAX_LIMIT=100
PAGINATION_MIN_LIMIT=1
```

## Archivo de Configuración

### `config/settings.py`

```python
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import Optional
import os

class Settings(BaseSettings):
    """Configuración del Catalog Service."""

    # Service
    service_name: str = "catalog-service"
    service_version: str = "1.0.0"
    environment: str = Field(default="development", env="ENVIRONMENT")

    # API
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8002, env="API_PORT")
    api_workers: int = Field(default=4, env="API_WORKERS")

    # Database
    database_host: str = Field(..., env="DATABASE_HOST")
    database_port: int = Field(default=5432, env="DATABASE_PORT")
    database_name: str = Field(..., env="DATABASE_NAME")
    database_user: str = Field(..., env="DATABASE_USER")
    database_password: str = Field(..., env="DATABASE_PASSWORD")
    database_pool_size: int = Field(default=20, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=10, env="DATABASE_MAX_OVERFLOW")

    # Redis
    redis_host: str = Field(default="localhost", env="REDIS_HOST")
    redis_port: int = Field(default=6379, env="REDIS_PORT")
    redis_db: int = Field(default=1, env="REDIS_DB")
    redis_password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")

    # Cache TTL
    cache_ttl_default: int = Field(default=300, env="CACHE_TTL_DEFAULT")
    cache_ttl_products: int = Field(default=600, env="CACHE_TTL_PRODUCTS")
    cache_ttl_locals: int = Field(default=3600, env="CACHE_TTL_LOCALS")

    # RabbitMQ
    rabbitmq_host: str = Field(default="localhost", env="RABBITMQ_HOST")
    rabbitmq_port: int = Field(default=5672, env="RABBITMQ_PORT")
    rabbitmq_user: str = Field(default="guest", env="RABBITMQ_USER")
    rabbitmq_password: str = Field(default="guest", env="RABBITMQ_PASSWORD")
    rabbitmq_exchange_catalog: str = Field(default="catalog_events")
    rabbitmq_exchange_auth: str = Field(default="auth_events")

    # Auth Service
    auth_grpc_host: str = Field(default="localhost", env="AUTH_GRPC_HOST")
    auth_grpc_port: int = Field(default=50051, env="AUTH_GRPC_PORT")
    auth_grpc_timeout: int = Field(default=5, env="AUTH_GRPC_TIMEOUT")
    auth_rest_url: str = Field(default="http://localhost:8001")

    # JWT
    jwt_public_key_path: str = Field(..., env="JWT_PUBLIC_KEY_PATH")
    jwt_algorithm: str = Field(default="RS256")

    # Multi-tenancy
    tenant_header_name: str = Field(default="X-Tenant-ID")
    enforce_tenant_isolation: bool = Field(default=True)

    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")

    # Pagination
    pagination_default_limit: int = Field(default=20)
    pagination_max_limit: int = Field(default=100)

    @property
    def database_url(self) -> str:
        """Construye la URL de conexión a PostgreSQL."""
        return (
            f"postgresql+asyncpg://{self.database_user}:{self.database_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )

    @property
    def redis_url(self) -> str:
        """Construye la URL de conexión a Redis."""
        password_part = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{password_part}{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @property
    def rabbitmq_url(self) -> str:
        """Construye la URL de conexión a RabbitMQ."""
        return (
            f"amqp://{self.rabbitmq_user}:{self.rabbitmq_password}"
            f"@{self.rabbitmq_host}:{self.rabbitmq_port}/"
        )

    @validator("log_level")
    def validate_log_level(cls, v):
        allowed = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed:
            raise ValueError(f"log_level must be one of {allowed}")
        return v.upper()

    @validator("pagination_max_limit")
    def validate_max_limit(cls, v):
        if v > 1000:
            raise ValueError("pagination_max_limit cannot exceed 1000")
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Singleton
settings = Settings()
```

## Archivo .env de Ejemplo

```bash
# .env.example para Catalog Service

# Environment
ENVIRONMENT=development

# API
API_HOST=0.0.0.0
API_PORT=8002
API_WORKERS=4

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=catalog_db
DATABASE_USER=catalog_user
DATABASE_PASSWORD=change_me_in_production
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=1
REDIS_PASSWORD=

# Cache TTL (seconds)
CACHE_TTL_DEFAULT=300
CACHE_TTL_PRODUCTS=600
CACHE_TTL_LOCALS=3600

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# Auth Service
AUTH_GRPC_HOST=localhost
AUTH_GRPC_PORT=50051
AUTH_GRPC_TIMEOUT=5
AUTH_REST_URL=http://localhost:8001

# JWT
JWT_PUBLIC_KEY_PATH=/app/keys/jwt_public.pem
JWT_ALGORITHM=RS256

# Multi-tenancy
TENANT_HEADER_NAME=X-Tenant-ID
ENFORCE_TENANT_ISOLATION=true

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Pagination
PAGINATION_DEFAULT_LIMIT=20
PAGINATION_MAX_LIMIT=100
```

## Configuración por Ambiente

### Desarrollo (`config/development.py`)

```python
from .settings import Settings

class DevelopmentSettings(Settings):
    """Configuración para desarrollo."""

    environment: str = "development"
    log_level: str = "DEBUG"
    database_pool_size: int = 5
    cache_ttl_default: int = 60  # Cache corto para ver cambios rápido

    class Config:
        env_file = ".env.development"
```

### Producción (`config/production.py`)

```python
from .settings import Settings

class ProductionSettings(Settings):
    """Configuración para producción."""

    environment: str = "production"
    log_level: str = "WARNING"
    database_pool_size: int = 50
    database_max_overflow: int = 20
    api_workers: int = 8

    class Config:
        env_file = ".env.production"
```

### Testing (`config/testing.py`)

```python
from .settings import Settings

class TestingSettings(Settings):
    """Configuración para testing."""

    environment: str = "testing"
    database_name: str = "catalog_db_test"
    redis_db: int = 15  # DB separada para tests
    cache_ttl_default: int = 1
    log_level: str = "ERROR"

    class Config:
        env_file = ".env.test"
```

## Inicialización de Configuración

### `app/main.py`

```python
from fastapi import FastAPI
from config.settings import settings
import logging

# Configurar logging
logging.basicConfig(
    level=settings.log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    """Factory para crear la aplicación FastAPI."""

    app = FastAPI(
        title=settings.service_name,
        version=settings.service_version,
        description="Microservicio de gestión de catálogo de productos",
    )

    # Log de configuración al iniciar
    logger.info(f"Iniciando {settings.service_name} v{settings.service_version}")
    logger.info(f"Ambiente: {settings.environment}")
    logger.info(f"Database: {settings.database_host}:{settings.database_port}")
    logger.info(f"Redis: {settings.redis_host}:{settings.redis_port}")
    logger.info(f"Auth gRPC: {settings.auth_grpc_host}:{settings.auth_grpc_port}")

    return app
```

## Health Check con Configuración

```python
from fastapi import APIRouter, status
from config.settings import settings

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.service_name,
        "version": settings.service_version,
        "environment": settings.environment,
    }

@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def readiness_check():
    """Readiness check endpoint."""
    # TODO: Verificar conexión a DB, Redis, RabbitMQ
    return {
        "status": "ready",
        "checks": {
            "database": "ok",
            "redis": "ok",
            "rabbitmq": "ok",
            "auth_service": "ok",
        }
    }
```

## Próximos Pasos

- [Eventos Publicados](/microservicios/catalog-service/eventos-publicados)
- [Eventos Consumidos](/microservicios/catalog-service/eventos-consumidos)
- [Arquitectura](/microservicios/catalog-service/arquitectura)
