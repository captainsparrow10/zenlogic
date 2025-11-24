---
sidebar_position: 2
---

# Crear un Nuevo Microservicio

Guía paso a paso para crear un nuevo microservicio en zenLogic siguiendo los patrones establecidos.

## Estructura del Microservicio

```
new-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings
│   ├── database.py          # DB connection
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   └── base.py
│   ├── schemas/             # Pydantic schemas
│   │   └── __init__.py
│   ├── api/                 # API routers
│   │   ├── __init__.py
│   │   └── v1/
│   ├── services/            # Business logic
│   │   └── __init__.py
│   ├── repositories/        # Data access
│   │   └── __init__.py
│   ├── events/              # Event handlers
│   │   ├── publisher.py
│   │   └── consumer.py
│   ├── grpc_server/         # gRPC (si aplica)
│   │   └── server.py
│   └── clients/             # External clients
│       └── __init__.py
├── tests/
│   └── __init__.py
├── alembic/                 # Migrations
│   └── versions/
├── scripts/
│   └── seed_data.py
├── requirements.txt
├── .env.example
├── Dockerfile
├── alembic.ini
└── README.md
```

## Paso 1: Crear Proyecto Base

```bash
# Crear directorio
mkdir services/new-service
cd services/new-service

# Crear estructura
mkdir -p app/{models,schemas,api/v1,services,repositories,events,grpc_server,clients}
mkdir -p tests scripts alembic/versions

# Crear __init__.py
touch app/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/api/__init__.py
touch app/api/v1/__init__.py
touch tests/__init__.py
```

## Paso 2: Configuración (config.py)

```python
# app/config.py
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    """Configuración del servicio."""

    # Service
    service_name: str = "new-service"
    api_port: int = Field(default=8004)
    debug: bool = Field(default=False)

    # Database
    database_url: str = Field(..., env="DATABASE_URL")

    # Redis
    redis_url: str = Field(..., env="REDIS_URL")

    # RabbitMQ
    rabbitmq_url: str = Field(..., env="RABBITMQ_URL")
    rabbitmq_exchange: str = Field(default="erp.events")

    # Auth gRPC (si necesita validar con Auth)
    auth_grpc_url: str = Field(default="localhost:50051")

    # CORS
    cors_origins: list[str] = Field(default=["http://localhost:3000"])

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

## Paso 3: Database (database.py)

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text
from app.config import settings

# Base para modelos
Base = declarative_base()

# Engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)

# Session factory
async_session_factory = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db() -> AsyncSession:
    """Dependency para obtener sesión de DB."""
    async with async_session_factory() as session:
        yield session
```

## Paso 4: Main App (main.py)

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import router as api_router
from app.events.publisher import event_publisher
from app.events.consumer import event_consumer

app = FastAPI(
    title=f"{settings.service_name}",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api/v1")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.service_name}

# Startup
@app.on_event("startup")
async def startup():
    # Conectar event publisher
    await event_publisher.connect()

    # Iniciar event consumer
    import asyncio
    asyncio.create_task(event_consumer.start())

# Shutdown
@app.on_event("shutdown")
async def shutdown():
    await event_publisher.close()
    await event_consumer.stop()
```

## Paso 5: Event Publisher

```python
# app/events/publisher.py
import aio_pika
import json
from uuid import uuid4
from datetime import datetime
from app.config import settings

class EventPublisher:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange = None

    async def connect(self):
        self.connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        self.channel = await self.connection.channel()
        self.exchange = await self.channel.declare_exchange(
            settings.rabbitmq_exchange,
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

    async def publish(self, event_type: str, payload: dict):
        event = {
            "event_id": str(uuid4()),
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "service": settings.service_name,
            "payload": payload
        }

        message = aio_pika.Message(
            body=json.dumps(event).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT
        )

        await self.exchange.publish(message, routing_key=event_type)

    async def close(self):
        if self.connection:
            await self.connection.close()

event_publisher = EventPublisher()
```

## Paso 6: Requirements

```txt
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy[asyncio]==2.0.23
asyncpg==0.29.0
alembic==1.12.1
pydantic==2.5.0
pydantic-settings==2.1.0
aio-pika==9.3.0
aioredis==2.0.1
grpcio==1.59.3
prometheus-client==0.19.0

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
httpx==0.25.2
```

## Paso 7: Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code
COPY . .

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"]
```

## Paso 8: Añadir a Docker Compose

```yaml
# docker-compose.yml (añadir)
services:
  # ... servicios existentes

  new-service:
    build: ./services/new-service
    ports:
      - "8004:8004"
    environment:
      DATABASE_URL: postgresql+asyncpg://erp_user:erp_password@postgres:5432/new_db
      REDIS_URL: redis://redis:6379/3
      RABBITMQ_URL: amqp://admin:admin123@rabbitmq:5672/
    depends_on:
      - postgres
      - redis
      - rabbitmq
```

## Paso 9: Inicializar Alembic

```bash
# Inicializar
alembic init alembic

# Configurar alembic.ini
nano alembic.ini
```

```ini
# alembic.ini
[alembic]
script_location = alembic
sqlalchemy.url = driver://user:pass@localhost/dbname  # Será override por env
```

```python
# alembic/env.py
from app.database import Base, engine
from app.models import *  # Importar todos los modelos

target_metadata = Base.metadata

def run_migrations_online():
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
```

## Paso 10: Testing

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

# tests/test_api.py
@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

## Checklist de Integración

- [ ] Base de datos creada en PostgreSQL
- [ ] Migraciones ejecutadas
- [ ] Event publisher conectado a RabbitMQ
- [ ] Event consumer configurado (si aplica)
- [ ] Health check funcionando
- [ ] API docs accesibles (/docs)
- [ ] Tests passing
- [ ] Añadido a docker-compose.yml
- [ ] README.md actualizado
- [ ] Documentación en Docusaurus

## Próximos Pasos

- [Testing](/guias/testing)
- [Deployment](/guias/deployment)
- [Troubleshooting](/guias/troubleshooting)
