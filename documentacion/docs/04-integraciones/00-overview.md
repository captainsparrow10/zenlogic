---
sidebar_position: 1
---

# Integraciones - Overview

Documentación de las integraciones tecnológicas principales de zenLogic.

## Stack de Integraciones

zenLogic integra diversas tecnologías para construir una arquitectura de microservicios robusta y escalable:

```mermaid
graph TB
    subgraph "Microservicios"
        Auth[Auth Service]
        Catalog[Catalog Service]
        Audit[Audit Service]
    end

    subgraph "Message Broker"
        RabbitMQ[RabbitMQ<br/>Event-Driven]
    end

    subgraph "Caché"
        Redis[Redis<br/>Cache + Sessions]
    end

    subgraph "Base de Datos"
        Postgres[(PostgreSQL<br/>RDBMS)]
    end

    subgraph "Comunicación"
        gRPC[gRPC<br/>Sync Internal]
    end

    Auth --> Postgres
    Catalog --> Postgres
    Audit --> Postgres

    Auth --> Redis
    Catalog --> Redis

    Auth --> RabbitMQ
    Catalog --> RabbitMQ
    RabbitMQ --> Audit

    Catalog --> gRPC
    gRPC --> Auth
```

## Integraciones Principales

### 1. RabbitMQ - Message Broker

**Propósito**: Comunicación asíncrona entre microservicios mediante eventos.

**Características**:
- Topic exchange para routing flexible
- Dead Letter Queues para manejo de errores
- Entrega garantizada (at-least-once)
- Persistencia de mensajes

**Casos de uso**:
- Publicar eventos de negocio (user.created, product.updated)
- Consumir eventos para mantener datos sincronizados
- Auditoría centralizada de todos los eventos del sistema

📖 [Ver documentación detallada](/integraciones/rabbitmq)

### 2. Redis - Cache y Sesiones

**Propósito**: Cache distribuido y almacenamiento de sesiones.

**Características**:
- Cache de permisos de usuarios (TTL 5min)
- Cache de datos de locales (TTL 1 hora)
- Sessions management para tokens JWT
- Pub/Sub para invalidación de cache

**Casos de uso**:
- Reducir latencia de queries frecuentes
- Evitar N+1 queries a PostgreSQL
- Mantener sesiones de usuarios activas
- Invalidar cache coordinado entre servicios

📖 [Ver documentación detallada](/integraciones/redis)

### 3. gRPC - Comunicación Interna

**Propósito**: Comunicación síncrona de baja latencia entre microservicios.

**Características**:
- Protocol Buffers para serialización binaria
- HTTP/2 con multiplexing
- Type-safe con schema explícito
- Latencia típica 2-5ms

**Casos de uso**:
- Validación en tiempo real (Catalog valida locales con Auth)
- Verificación de tokens JWT
- Consultas entre servicios que requieren respuesta inmediata

📖 [Ver documentación detallada](/integraciones/grpc)

### 4. PostgreSQL - Base de Datos

**Propósito**: Almacenamiento relacional persistente.

**Características**:
- PostgreSQL 15+ con extensiones (uuid-ossp, pg_trgm, btree_gist)
- Row-Level Security para multi-tenancy
- JSONB para datos semi-estructurados
- Full-text search nativo

**Casos de uso**:
- Persistencia de datos transaccionales
- Queries complejos con JOINs
- Búsqueda full-text de productos
- Enforcement de integridad referencial

📖 [Ver documentación detallada](/integraciones/postgresql)

## Patrones de Integración

### Event-Driven Architecture

```python
# Publicar evento
await event_publisher.publish(
    event_type="catalog.product.created",
    payload={
        "product_id": product.id,
        "organization_id": product.organization_id,
        "name": product.name
    }
)

# Consumir evento
@event_handler("catalog.product.created")
async def on_product_created(event: dict):
    # Audit Service registra el evento
    await audit_service.store_event(event)
```

### Cache-Aside Pattern

```python
# Intentar obtener de cache
cached = await redis.get(f"product:{product_id}")
if cached:
    return json.loads(cached)

# Cache miss → obtener de DB
product = await db.query(Product).filter_by(id=product_id).first()

# Guardar en cache
await redis.setex(
    f"product:{product_id}",
    ttl=300,  # 5 minutos
    value=json.dumps(product.dict())
)

return product
```

### Circuit Breaker Pattern

```python
# gRPC con fallback a REST
class AuthClientWithCircuitBreaker:
    async def validate_local(self, user_id, org_id, local_id):
        try:
            # Intentar gRPC
            return await self._validate_grpc(user_id, org_id, local_id)
        except CircuitBreakerError:
            # Fallback a REST
            logger.warning("gRPC circuit open, using REST")
            return await self._validate_rest(user_id, org_id, local_id)
```

## Configuración de Conexiones

### URLs de Conexión

```bash
# .env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/catalog_db
REDIS_URL=redis://localhost:6379/0
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
AUTH_GRPC_URL=auth-service:50051
```

### Connection Pooling

```python
# PostgreSQL
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,           # 20 conexiones permanentes
    max_overflow=10,        # +10 conexiones temporales
    pool_pre_ping=True,     # Verificar conexión antes de usar
    pool_recycle=3600       # Reciclar conexiones cada hora
)

# Redis
redis_client = aioredis.from_url(
    REDIS_URL,
    max_connections=50,
    decode_responses=True
)

# RabbitMQ (aio-pika)
connection = await aio_pika.connect_robust(
    RABBITMQ_URL,
    heartbeat=60
)
```

## Health Checks

Cada servicio expone endpoints de health check para verificar conectividad:

```python
@router.get("/health")
async def health_check():
    """Health check con verificación de dependencias."""

    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "dependencies": {}
    }

    # Check PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        health_status["dependencies"]["postgres"] = "healthy"
    except Exception as e:
        health_status["dependencies"]["postgres"] = f"unhealthy: {e}"
        health_status["status"] = "unhealthy"

    # Check Redis
    try:
        await redis.ping()
        health_status["dependencies"]["redis"] = "healthy"
    except Exception as e:
        health_status["dependencies"]["redis"] = f"unhealthy: {e}"
        health_status["status"] = "degraded"

    # Check RabbitMQ
    try:
        if rabbitmq_connection.is_closed:
            raise Exception("Connection closed")
        health_status["dependencies"]["rabbitmq"] = "healthy"
    except Exception as e:
        health_status["dependencies"]["rabbitmq"] = f"unhealthy: {e}"
        health_status["status"] = "degraded"

    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(health_status, status_code=status_code)
```

## Monitoreo y Observabilidad

### Métricas de Integración

```python
from prometheus_client import Counter, Histogram

# PostgreSQL
db_query_duration = Histogram(
    "db_query_duration_seconds",
    "Database query duration",
    ["query_type"]
)

db_connection_pool_size = Gauge(
    "db_connection_pool_size",
    "Current connection pool size"
)

# Redis
cache_hits = Counter("cache_hits_total", "Cache hits")
cache_misses = Counter("cache_misses_total", "Cache misses")

# RabbitMQ
events_published = Counter(
    "events_published_total",
    "Events published",
    ["event_type"]
)

events_consumed = Counter(
    "events_consumed_total",
    "Events consumed",
    ["event_type", "status"]
)

# gRPC
grpc_request_duration = Histogram(
    "grpc_request_duration_seconds",
    "gRPC request duration",
    ["service", "method"]
)
```

## Resiliencia

### Retry Policies

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def publish_event_with_retry(event_type: str, payload: dict):
    """Publicar evento con retries exponenciales."""
    await event_publisher.publish(event_type, payload)
```

### Timeouts

```python
# PostgreSQL query timeout
await db.execute(
    text("SET statement_timeout = '30s'")
)

# Redis timeout
await redis.get(key, timeout=5.0)

# gRPC timeout
response = await grpc_stub.ValidateLocal(
    request,
    timeout=5.0  # 5 segundos
)
```

## Próximos Pasos

Explorar cada integración en detalle:

- [RabbitMQ - Message Broker](/integraciones/rabbitmq)
- [Redis - Cache y Sesiones](/integraciones/redis)
- [gRPC - Comunicación Interna](/integraciones/grpc)
- [PostgreSQL - Base de Datos](/integraciones/postgresql)

## Referencias

- [ADR-003: Arquitectura Event-Driven](/adrs/adr-003-event-driven)
- [ADR-002: PostgreSQL](/adrs/adr-002-postgresql)
- [ADR-004: gRPC](/adrs/adr-004-grpc-internal)
- [Arquitectura General](/arquitectura/vision-general)
