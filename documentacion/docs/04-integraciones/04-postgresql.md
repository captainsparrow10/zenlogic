---
sidebar_position: 5
---

# PostgreSQL - Base de Datos

Integración con PostgreSQL para almacenamiento relacional persistente.

## Overview

PostgreSQL 15+ es la base de datos principal de zenLogic. Cada microservicio tiene su propia base de datos (database-per-service pattern) con Row-Level Security para multi-tenancy.

## Configuración

### Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: erp_password
      POSTGRES_DB: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-dbs.sql:/docker-entrypoint-initdb.d/init-dbs.sql

volumes:
  postgres_data:
```

### Init Script

```sql
-- init-dbs.sql
CREATE DATABASE auth_db;
CREATE DATABASE catalog_db;
CREATE DATABASE audit_db;

-- Extensions
\c auth_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c catalog_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

\c audit_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## SQLAlchemy Async

### Engine Configuration

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Engine con connection pooling
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=20,              # 20 conexiones permanentes
    max_overflow=10,           # +10 temporales
    pool_pre_ping=True,        # Health check antes de usar
    pool_recycle=3600,         # Reciclar cada hora
    pool_timeout=30,           # Timeout en obtener conexión
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
        try:
            # Configurar tenant context
            org_id = get_current_organization_id()
            if org_id:
                await session.execute(
                    text("SET LOCAL app.current_tenant = :tenant_id"),
                    {"tenant_id": str(org_id)}
                )

            yield session

        finally:
            await session.close()
```

### Base Model

```python
# app/models/base.py
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, DateTime, func
from uuid import uuid4

Base = declarative_base()

class BaseModel(Base):
    """Modelo base con campos comunes."""

    __abstract__ = True

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    def dict(self):
        """Convertir a diccionario."""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
```

## Row-Level Security

### Habilitar RLS

```sql
-- Habilitar RLS en tabla
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política de SELECT
CREATE POLICY tenant_isolation_select ON products
    FOR SELECT
    USING (organization_id = current_setting('app.current_tenant')::uuid);

-- Política de INSERT
CREATE POLICY tenant_isolation_insert ON products
    FOR INSERT
    WITH CHECK (organization_id = current_setting('app.current_tenant')::uuid);

-- Política de UPDATE
CREATE POLICY tenant_isolation_update ON products
    FOR UPDATE
    USING (organization_id = current_setting('app.current_tenant')::uuid)
    WITH CHECK (organization_id = current_setting('app.current_tenant')::uuid);

-- Política de DELETE
CREATE POLICY tenant_isolation_delete ON products
    FOR DELETE
    USING (organization_id = current_setting('app.current_tenant')::uuid);
```

### Testing RLS

```python
# tests/test_rls.py
import pytest

@pytest.mark.asyncio
async def test_rls_isolates_tenants():
    """Verificar que RLS aísla tenants."""

    org_a = "org-a-uuid"
    org_b = "org-b-uuid"

    # Crear producto para Org A
    async with get_db() as db:
        await db.execute(text("SET app.current_tenant = :tid"), {"tid": org_a})
        await db.execute(
            insert(Product).values(name="Product A", organization_id=org_a)
        )
        await db.commit()

    # Crear producto para Org B
    async with get_db() as db:
        await db.execute(text("SET app.current_tenant = :tid"), {"tid": org_b})
        await db.execute(
            insert(Product).values(name="Product B", organization_id=org_b)
        )
        await db.commit()

    # Verificar Org A solo ve sus productos
    async with get_db() as db:
        await db.execute(text("SET app.current_tenant = :tid"), {"tid": org_a})
        result = await db.execute(select(Product))
        products = result.scalars().all()

        assert len(products) == 1
        assert products[0].name == "Product A"
```

## Migraciones con Alembic

### Configuración

```python
# alembic/env.py
from sqlalchemy import pool
from alembic import context
from app.database import engine
from app.models import Base

target_metadata = Base.metadata

def run_migrations_online():
    """Run migrations in 'online' mode."""

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True
        )

        with context.begin_transaction():
            context.run_migrations()
```

### Crear Migración

```bash
# Generar migración automáticamente
alembic revision --autogenerate -m "add products table"

# Aplicar migraciones
alembic upgrade head

# Rollback última migración
alembic downgrade -1
```

## Índices

### Índices Recomendados

```sql
-- Índices para multi-tenancy (RLS)
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_variants_org ON variants(organization_id);

-- Índices compuestos para queries comunes
CREATE INDEX idx_products_org_sku ON products(organization_id, sku);
CREATE INDEX idx_products_org_created ON products(organization_id, created_at DESC);

-- Índices para búsqueda
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

-- Índices para JSONB
CREATE INDEX idx_products_metadata ON products USING GIN (metadata);
```

## Full-Text Search

```python
async def search_products(search_term: str, org_id: str) -> list[Product]:
    """Buscar productos por nombre o descripción."""

    # Configurar tenant
    await db.execute(
        text("SET app.current_tenant = :tid"),
        {"tid": org_id}
    )

    # Full-text search
    query = select(Product).where(
        func.to_tsvector('spanish', Product.name + ' ' + Product.description).op('@@')(
            func.to_tsquery('spanish', search_term)
        )
    ).order_by(
        func.ts_rank(
            func.to_tsvector('spanish', Product.name),
            func.to_tsquery('spanish', search_term)
        ).desc()
    )

    result = await db.execute(query)
    return result.scalars().all()
```

## Monitoring

### Slow Queries

```sql
-- Habilitar pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Queries más lentos
SELECT
    query,
    calls,
    mean_exec_time / 1000 as mean_time_sec,
    total_exec_time / 1000 as total_time_sec
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Connection Pool

```python
from prometheus_client import Gauge

db_pool_size = Gauge("db_pool_size", "DB connection pool size")
db_pool_overflow = Gauge("db_pool_overflow", "DB pool overflow connections")

async def monitor_pool():
    """Monitorear connection pool."""

    db_pool_size.set(engine.pool.size())
    db_pool_overflow.set(engine.pool.overflow())
```

## Próximos Pasos

- [ADR-002: PostgreSQL](/adrs/adr-002-postgresql)
- [ADR-006: Row-Level Security Multi-tenant](/adrs/adr-006-postgresql-multi-tenant)
- [Catalog Service - Modelo de Datos](/microservicios/catalog-service/modelo-datos)
