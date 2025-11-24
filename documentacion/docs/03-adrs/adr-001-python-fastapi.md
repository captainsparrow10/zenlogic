---
sidebar_position: 2
---

# ADR-001: Python + FastAPI

**Estado**: Aceptado
**Fecha**: 2025-11-23
**Decisores**: Equipo de Arquitectura zenLogic

## Contexto

Necesitamos elegir un stack tecnológico para el backend de zenLogic, un sistema ERP empresarial con arquitectura de microservicios. Los requisitos clave son:

1. **Alta concurrencia**: Manejar miles de requests simultáneos
2. **Desarrollo rápido**: Time-to-market es crítico
3. **Type safety**: Minimizar errores en runtime
4. **Ecosistema maduro**: Bibliotecas para integraciones (PostgreSQL, Redis, RabbitMQ, gRPC)
5. **Facilidad de contratación**: Pool de desarrolladores disponibles
6. **Performance aceptable**: No necesitamos ultra-baja latencia, pero sí throughput razonable

## Decisión

**Usaremos Python 3.11+ con FastAPI** como stack principal para todos los microservicios de zenLogic.

### Componentes Específicos

```python
# Stack completo
Python: 3.11+
Framework: FastAPI 0.104+
ASGI Server: Uvicorn con workers
ORM: SQLAlchemy 2.0+ (async)
Validación: Pydantic v2
Testing: pytest + pytest-asyncio
Type Checking: mypy (strict mode)
```

## Alternativas Consideradas

### 1. Node.js + Express

**Pros**:
- JavaScript end-to-end (frontend + backend)
- Event loop nativo, excelente para I/O
- NPM ecosystem masivo

**Contras**:
- TypeScript aún es opcional, menos type safety que Python 3.11+
- Callback hell / Promise chains complejas
- ORM menos maduro (Sequelize/TypeORM vs SQLAlchemy)
- Menos bibliotecas para data science (si necesitamos analytics)

**Razón de rechazo**: Type safety inferior, menos experiencia del equipo actual.

### 2. Go + Gin

**Pros**:
- Performance excelente (compilado)
- Concurrencia nativa con goroutines
- Binario único, fácil deployment
- Type safety fuerte

**Contras**:
- Desarrollo más lento (verboso)
- Ecosistema menor para integraciones empresariales
- Curva de aprendizaje para equipo actual
- Error handling verboso

**Razón de rechazo**: Trade-off development speed vs performance no justificado para ERP (no necesitamos latencia `<1ms`).

### 3. Java + Spring Boot

**Pros**:
- Ecosistema enterprise masivo
- Type safety robusto
- Performance buena (JVM JIT)
- Herramientas maduras (Spring ecosystem)

**Contras**:
- Verboso, desarrollo más lento
- Configuración compleja (XML/annotations)
- Consumo de memoria alto (JVM overhead)
- Hot reload pobre comparado con FastAPI

**Razón de rechazo**: Overhead de configuración, desarrollo más lento, memoria alta.

## Consecuencias

### Positivas

1. **Type Hints + Pydantic**
   ```python
   from pydantic import BaseModel, Field

   class ProductCreate(BaseModel):
       name: str = Field(..., min_length=1, max_length=200)
       base_price: float = Field(..., gt=0)
       organization_id: UUID

   # Auto-validación + serialización + OpenAPI docs
   ```

2. **Async Nativo**
   ```python
   async def get_products(db: AsyncSession):
       result = await db.execute(select(Product))
       return result.scalars().all()
   ```

3. **Auto-documentación OpenAPI**
   - Swagger UI automático en `/docs`
   - ReDoc en `/redoc`
   - OpenAPI JSON schema

4. **Desarrollo Rápido**
   - Hot reload instantáneo
   - Menos boilerplate que Java/Go
   - Type hints previenen errores sin overhead

5. **Ecosistema Rico**
   - SQLAlchemy (ORM maduro)
   - aio-pika (RabbitMQ async)
   - grpcio (gRPC oficial)
   - redis-py (Redis async)

6. **Testing Sencillo**
   ```python
   @pytest.mark.asyncio
   async def test_create_product(client):
       response = await client.post("/products", json={...})
       assert response.status_code == 201
   ```

### Negativas

1. **Performance < Go/Rust**
   - Latencia típica: 5-10ms (vs 1-2ms en Go)
   - Throughput menor en CPU-intensive tasks
   - **Mitigación**: Para ERP, I/O es bottleneck (DB, Redis), no CPU. Aceptable.

2. **GIL (Global Interpreter Lock)**
   - Un solo thread Python ejecuta bytecode a la vez
   - **Mitigación**: Usamos async I/O (no blocking). GIL no afecta operaciones async.

3. **Deployment Multi-archivo**
   - No es binario único como Go
   - Necesita virtualenv/Docker
   - **Mitigación**: Docker containers estándar. No es problema real.

4. **Memory Footprint Mayor que Go**
   - Python: ~50-100MB base
   - Go: ~10-20MB base
   - **Mitigación**: Con costos cloud actuales, no es factor decisivo.

### Riesgos

1. **Escalabilidad Horizontal**
   - Python no escala verticalmente tan bien como Go
   - **Mitigación**: Arquitectura de microservicios permite escalar horizontalmente. Agregar más pods Kubernetes.

2. **Errores de Runtime**
   - Type hints no previenen 100% errores (son hints, no enforcement)
   - **Mitigación**:
     - mypy en CI/CD (modo strict)
     - Tests comprehensivos
     - Pydantic valida datos en runtime

3. **Dependency Hell**
   - Python packaging puede ser complejo
   - **Mitigación**:
     - Poetry para dependency management
     - Lock files estrictos
     - Docker para entorno reproducible

## Benchmark de Referencia

```python
# Comparación de throughput para operación típica
# (Query DB + JSON serialization)

FastAPI (Python 3.11):
  Requests/sec: 2,500 - 3,500
  Latency p99: 15ms

Go (Gin):
  Requests/sec: 8,000 - 12,000
  Latency p99: 3ms

Node.js (Express):
  Requests/sec: 3,000 - 4,000
  Latency p99: 12ms

# Para ERP con 100-500 usuarios concurrentes, FastAPI es suficiente
```

## Implementación

### Estructura Base de Microservicio

```python
# app/main.py
from fastapi import FastAPI
from app.api import products, variants
from app.database import init_db

app = FastAPI(
    title="Catalog Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(products.router, prefix="/api/v1")
app.include_router(variants.router, prefix="/api/v1")
```

### Type Safety Example

```python
# app/schemas/product.py
from pydantic import BaseModel, Field, validator
from typing import Optional
from uuid import UUID

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    base_price: float = Field(..., gt=0)

    @validator('base_price')
    def price_must_have_two_decimals(cls, v):
        if round(v, 2) != v:
            raise ValueError('Price must have max 2 decimals')
        return v

class ProductCreate(ProductBase):
    organization_id: UUID
    local_id: UUID

class ProductResponse(ProductBase):
    id: UUID
    sku: str
    created_at: datetime

    class Config:
        from_attributes = True  # SQLAlchemy ORM compatibility
```

## Revisión Futura

Este ADR debe revisarse si:

1. Los requisitos de latencia cambian a `<5ms` p99
2. El throughput requerido supera `>10,000 req/s` por servicio
3. Necesitamos procesamiento CPU-intensive significativo
4. El equipo adquiere expertise profundo en Go/Rust

**Fecha de próxima revisión**: 2026-11-23 (1 año)

## Referencias

- [FastAPI Official Docs](https://fastapi.tiangolo.com/)
- [Python 3.11 Performance Improvements](https://docs.python.org/3.11/whatsnew/3.11.html)
- [Pydantic v2 Performance](https://docs.pydantic.dev/latest/blog/pydantic-v2/)
- [SQLAlchemy 2.0 Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

## Próximos Pasos

- [ADR-002: PostgreSQL como Base de Datos Principal](/adrs/adr-002-postgresql)
- [Stack Tecnológico](/arquitectura/stack-tecnologico)
- [Catalog Service - Arquitectura](/microservicios/catalog-service/arquitectura)
