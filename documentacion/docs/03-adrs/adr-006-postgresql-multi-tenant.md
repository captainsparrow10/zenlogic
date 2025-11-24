---
sidebar_position: 7
---

# ADR-006: PostgreSQL Row-Level Security para Multi-tenancy

**Estado**: Aceptado
**Fecha**: 2025-11-23
**Decisores**: Equipo de Arquitectura zenLogic

## Contexto

zenLogic es una plataforma SaaS multi-tenant donde múltiples organizaciones comparten la misma infraestructura. Los requisitos son:

### Requisitos de Multi-tenancy

1. **Aislamiento Total**: Organización A no puede ver datos de Organización B
2. **Performance**: Queries deben ser rápidos incluso con millones de filas
3. **Seguridad**: Aislamiento a nivel de base de datos, no solo aplicación
4. **Simplicidad**: Desarrolladores no deben pensar en tenant filtering en cada query
5. **Costo-efectivo**: Compartir infraestructura reduce costos vs DB per tenant

### Ejemplo Problema

```python
# ❌ MAL: Fácil olvidar filtrar por organization_id
products = await db.execute(
    select(Product).where(Product.name.like("%Camiseta%"))
)
# BUG: Retorna productos de TODAS las organizaciones

# ✅ BIEN: Filtrar explícitamente
products = await db.execute(
    select(Product)
    .where(Product.name.like("%Camiseta%"))
    .where(Product.organization_id == current_org_id)
)
# Pero es propenso a errores si lo olvidamos
```

**Desafío**: ¿Cómo garantizar aislamiento sin depender de developers acordarse?

## Decisión

**Usaremos PostgreSQL Row-Level Security (RLS)** para implementar multi-tenancy a nivel de base de datos.

### Enfoque Hybrid

```yaml
Database per Service: Sí
  - auth_db
  - catalog_db
  - audit_db

Tenants per Database: Todos (shared schema)
  - Tabla products contiene productos de todas las organizaciones
  - Filtrado automático con RLS

Row-Level Security: Habilitado
  - Políticas RLS filtran por organization_id automáticamente
  - Imposible acceder datos de otro tenant
```

## Alternativas Consideradas

### 1. Database per Tenant

**Modelo**:
```yaml
Tenant A → database: tenant_a_catalog
Tenant B → database: tenant_b_catalog
Tenant C → database: tenant_c_catalog
```

**Pros**:
- **Aislamiento perfecto**: DB totalmente separadas
- **Backup/restore per tenant**: Fácil recuperar tenant específico
- **Customización**: Cada tenant puede tener schema diferente

**Contras**:
- **Costo alto**: 100 tenants = 100 databases = mucha RAM/storage
- **Ops complejidad**: Gestionar 100 databases vs 1
- **Migraciones pesadilla**: Aplicar schema change a 100 DBs
- **Connection pools**: 100 pools vs 1
- **Cross-tenant queries imposibles**: Reportes agregados, analytics

**Razón de rechazo**: No escala para SaaS con cientos de tenants.

### 2. Schema per Tenant (PostgreSQL Schemas)

**Modelo**:
```sql
-- Database único, schemas por tenant
Database: catalog_db
  - Schema: tenant_a (tables: products, variants...)
  - Schema: tenant_b (tables: products, variants...)
  - Schema: tenant_c (tables: products, variants...)
```

**Pros**:
- Aislamiento razonable (schema-level)
- Menos overhead que DB per tenant
- Queries cross-tenant posibles

**Contras**:
- **Migraciones aún complejas**: Aplicar a cada schema
- **Search_path management**: Configurar schema por request
- **Connection pools**: Pool per schema idealmente
- **Escalabilidad limitada**: 1000 tenants = 1000 schemas

**Razón de rechazo**: Complejidad operacional innecesaria. RLS es más simple.

### 3. Application-Level Filtering (Sin RLS)

**Modelo**:
```python
# Middleware agrega filtro en cada query
async def get_products(org_id: str):
    return await db.execute(
        select(Product).where(Product.organization_id == org_id)
    )
```

**Pros**:
- Simple de implementar inicialmente
- No requiere features especiales de DB
- Funciona con cualquier base de datos

**Contras**:
- **ERROR-PRONE**: Fácil olvidar filtrar
- **Riesgo de seguridad ALTO**: Un query sin filtro = data leak
- **No defense in depth**: Si app tiene bug, no hay segunda barrera
- **Auditoría difícil**: ¿Cómo asegurar que TODOS los queries filtran?

**Razón de rechazo**: Inseguro. Dependemos 100% de developers.

## Consecuencias

### Positivas

1. **RLS Automático**

```sql
-- 1. Habilitar RLS en tabla
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Crear política: usuarios solo ven su organización
CREATE POLICY tenant_isolation ON products
    USING (organization_id = current_setting('app.current_tenant')::uuid);

-- 3. ✨ Magia: queries automáticamente filtrados
SELECT * FROM products WHERE name LIKE '%Camiseta%';
-- PostgreSQL inyecta: AND organization_id = current_setting('app.current_tenant')::uuid
```

2. **Configuración per Request**

```python
# app/middleware/tenant_context.py
from fastapi import Request
from app.database import get_db

async def set_tenant_context(request: Request):
    """Middleware para configurar tenant ID en PostgreSQL."""

    # Extraer organization_id del JWT
    current_user = request.state.user  # Seteado por auth middleware
    org_id = current_user["organization_id"]

    # Configurar PostgreSQL session variable
    async with get_db() as db:
        await db.execute(
            text("SET app.current_tenant = :tenant_id"),
            {"tenant_id": str(org_id)}
        )

    # Todos los queries subsecuentes usan este tenant
    yield

# app/main.py
app.middleware("http")(set_tenant_context)
```

3. **Desarrollo Sin Pensar en Tenancy**

```python
# Developers escriben queries NORMALMENTE
# RLS maneja tenant filtering automáticamente

async def search_products(search_term: str):
    # ✅ No necesita filtrar por organization_id explícitamente
    query = select(Product).where(Product.name.like(f"%{search_term}%"))
    result = await db.execute(query)
    return result.scalars().all()

# PostgreSQL RLS automáticamente inyecta:
# AND organization_id = current_setting('app.current_tenant')
```

4. **Defense in Depth**

```python
# Incluso con bug en aplicación, RLS protege
async def buggy_get_all_products():
    # ❌ BUG: Developer olvidó filtrar
    query = select(Product)  # Sin WHERE clause

    # ✅ RLS RESCATA: PostgreSQL filtra automáticamente
    # Solo retorna productos del tenant actual
    result = await db.execute(query)
    return result.scalars().all()
```

5. **Policies Flexibles**

```sql
-- Política para SELECT (read)
CREATE POLICY tenant_isolation_select ON products
    FOR SELECT
    USING (organization_id = current_setting('app.current_tenant')::uuid);

-- Política para INSERT (create)
CREATE POLICY tenant_isolation_insert ON products
    FOR INSERT
    WITH CHECK (organization_id = current_setting('app.current_tenant')::uuid);

-- Política para UPDATE (update)
CREATE POLICY tenant_isolation_update ON products
    FOR UPDATE
    USING (organization_id = current_setting('app.current_tenant')::uuid)
    WITH CHECK (organization_id = current_setting('app.current_tenant')::uuid);

-- Política para DELETE (delete)
CREATE POLICY tenant_isolation_delete ON products
    FOR DELETE
    USING (organization_id = current_setting('app.current_tenant')::uuid);
```

6. **Bypass para Admin Tasks**

```sql
-- Super user puede bypass RLS para migrations, backups
CREATE ROLE admin_user WITH SUPERUSER;

-- O usar SECURITY DEFINER functions
CREATE FUNCTION cross_tenant_report()
RETURNS TABLE(org_id UUID, product_count INT)
SECURITY DEFINER  -- Run with function owner's privileges
AS $$
    SELECT organization_id, COUNT(*)
    FROM products
    GROUP BY organization_id;
$$ LANGUAGE SQL;
```

### Negativas

1. **Overhead de Performance**

```yaml
Sin RLS:
  Query: SELECT * FROM products WHERE sku = 'CAM-001'
  Plan: Index Scan on products_sku_idx
  Time: 1ms

Con RLS:
  Query: SELECT * FROM products WHERE sku = 'CAM-001'
  Plan: Index Scan on products_sku_idx + Filter (organization_id = ...)
  Time: 1.2ms

Overhead: ~20% (aceptable)
```

**Mitigación**:
- Índice compuesto: `(organization_id, sku)`
- Reduce overhead a ~5%

```sql
CREATE INDEX idx_products_org_sku ON products(organization_id, sku);
```

2. **Debugging Más Difícil**

```python
# Query parece no retornar nada
products = await db.execute(select(Product).where(Product.sku == "CAM-001"))
# Result: []

# ¿Por qué? Posibles razones:
# 1. Producto no existe
# 2. Producto existe pero en otro tenant (RLS lo filtró)
# 3. app.current_tenant no está configurado (RLS bloquea todo)
```

**Mitigación**:
- Logging de `app.current_tenant` en cada request
- Tests que verifican tenant isolation
- Alertas si queries retornan 0 rows inesperadamente

3. **Configuración Requerida en Cada Request**

```python
# CRÍTICO: Olvidar SET app.current_tenant = '...'
# Resultado: RLS bloquea TODO (no data visible)

# ❌ MAL:
async with get_db() as db:
    products = await db.execute(select(Product))
    # No configuramos tenant → RLS bloquea todo → []

# ✅ BIEN:
async with get_db() as db:
    await db.execute(text("SET app.current_tenant = :tid"), {"tid": org_id})
    products = await db.execute(select(Product))
```

**Mitigación**:
- Middleware automático configura tenant
- Tests verifican middleware está activo
- Si tenant no está configurado, lanzar excepción explícita

4. **Connection Pooling Consideraciones**

```python
# Problema: Session variables persisten en conexión pooled
# Conexión 1: SET app.current_tenant = 'org-A'
# Conexión retorna a pool
# Request 2 reutiliza conexión → ve tenant 'org-A' (INCORRECTO)

# Solución 1: Reset tenant al retornar conexión
async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.execute(text("RESET app.current_tenant"))

# Solución 2: Configurar tenant por transacción (no por sesión)
async def get_db():
    async with async_session() as session:
        # LOCAL: solo para esta transacción
        await session.execute(
            text("SET LOCAL app.current_tenant = :tid"),
            {"tid": current_tenant_id}
        )
        yield session
```

### Riesgos

1. **Misconfiguration = Data Leak**

```python
# PELIGRO: Si middleware no configura tenant
# Y RLS policy tiene bug
# → Posible data leak

# Ejemplo INCORRECTO:
CREATE POLICY bad_policy ON products
    USING (organization_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);
    --                                                                    ^^^^
    -- "true" = no error si variable no existe → retorna NULL
    -- NULLIF(NULL, '') = NULL
    -- WHERE organization_id = NULL → FALSE para todos (seguro)
    -- PERO si hay bug en policy logic → peligro
```

**Mitigación**:
- Testing exhaustivo de RLS policies
- Auditoría de policies en code review
- Monitorear queries sin tenant configurado

2. **Bypass Accidental con SECURITY DEFINER**

```sql
-- PELIGRO: Function SECURITY DEFINER puede bypass RLS
CREATE FUNCTION get_all_products_unsafe()
RETURNS SETOF products
SECURITY DEFINER  -- ⚠️ Runs as function owner (puede tener bypass)
AS $$
    SELECT * FROM products;  -- Ve TODOS los tenants
$$ LANGUAGE SQL;
```

**Mitigación**:
- Evitar SECURITY DEFINER a menos que absolutamente necesario
- Si se usa, documentar claramente por qué
- Review de todas las functions SECURITY DEFINER

3. **Performance Degradation en Cross-Tenant Queries**

```sql
-- Para analytics, a veces necesitamos cross-tenant
-- RLS puede hacer esto difícil

-- Solución: Role con bypass para analytics
CREATE ROLE analytics_user WITH BYPASSRLS;

-- O disable RLS temporalmente (con cuidado)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- Run analytics query
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

## Implementación Completa

### Migration

```python
# migrations/versions/001_enable_rls.py
"""Enable Row-Level Security on all tables."""

from alembic import op
import sqlalchemy as sa

def upgrade():
    # Habilitar RLS en todas las tablas multi-tenant
    tables = ['products', 'variants', 'options', 'prices']

    for table in tables:
        # 1. Enable RLS
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")

        # 2. Policy para SELECT
        op.execute(f"""
            CREATE POLICY tenant_isolation_select ON {table}
            FOR SELECT
            USING (organization_id = current_setting('app.current_tenant')::uuid)
        """)

        # 3. Policy para INSERT
        op.execute(f"""
            CREATE POLICY tenant_isolation_insert ON {table}
            FOR INSERT
            WITH CHECK (organization_id = current_setting('app.current_tenant')::uuid)
        """)

        # 4. Policy para UPDATE
        op.execute(f"""
            CREATE POLICY tenant_isolation_update ON {table}
            FOR UPDATE
            USING (organization_id = current_setting('app.current_tenant')::uuid)
            WITH CHECK (organization_id = current_setting('app.current_tenant')::uuid)
        """)

        # 5. Policy para DELETE
        op.execute(f"""
            CREATE POLICY tenant_isolation_delete ON {table}
            FOR DELETE
            USING (organization_id = current_setting('app.current_tenant')::uuid)
        """)

def downgrade():
    tables = ['products', 'variants', 'options', 'prices']
    for table in tables:
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
```

### Testing

```python
# tests/test_rls.py
import pytest
from app.database import get_db

@pytest.mark.asyncio
async def test_rls_isolates_tenants():
    """Verificar que RLS aísla tenants."""

    org_a_id = "org-a-uuid"
    org_b_id = "org-b-uuid"

    # Crear productos para Org A
    async with get_db() as db:
        await db.execute(text("SET app.current_tenant = :tid"), {"tid": org_a_id})
        await db.execute(
            insert(Product).values(
                name="Product A",
                organization_id=org_a_id
            )
        )
        await db.commit()

    # Crear productos para Org B
    async with get_db() as db:
        await db.execute(text("SET app.current_tenant = :tid"), {"tid": org_b_id})
        await db.execute(
            insert(Product).values(
                name="Product B",
                organization_id=org_b_id
            )
        )
        await db.commit()

    # Verificar Org A solo ve sus productos
    async with get_db() as db:
        await db.execute(text("SET app.current_tenant = :tid"), {"tid": org_a_id})
        result = await db.execute(select(Product))
        products = result.scalars().all()

        assert len(products) == 1
        assert products[0].name == "Product A"

    # Verificar Org B solo ve sus productos
    async with get_db() as db:
        await db.execute(text("SET app.current_tenant = :tid"), {"tid": org_b_id})
        result = await db.execute(select(Product))
        products = result.scalars().all()

        assert len(products) == 1
        assert products[0].name == "Product B"
```

## Monitoreo

```python
from prometheus_client import Counter, Histogram

tenant_isolation_violations = Counter(
    "tenant_isolation_violations_total",
    "Potential tenant isolation violations detected"
)

# Log si tenant no está configurado
async def verify_tenant_configured(db):
    result = await db.execute(text("SELECT current_setting('app.current_tenant', true)"))
    tenant_id = result.scalar()

    if not tenant_id:
        tenant_isolation_violations.inc()
        logger.error("Tenant not configured in database session!")
        raise Exception("Tenant ID not configured")
```

## Revisión Futura

Este ADR debe revisarse si:

1. Performance overhead de RLS supera 30%
2. Necesitamos sharding (RLS complica sharding strategies)
3. Requisito de tenant customization extremo (schema diferente)

**Fecha de próxima revisión**: 2026-11-23 (1 año)

## Referencias

- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-tenancy with PostgreSQL](https://www.citusdata.com/blog/2016/10/03/designing-your-saas-database-for-high-scalability/)
- [RLS Performance Considerations](https://www.2ndquadrant.com/en/blog/postgresql-row-level-security-performance/)

## Próximos Pasos

- [Multi-tenancy](/arquitectura/multi-tenancy)
- [Catalog Service - Validación de Locales](/microservicios/catalog-service/validacion-locales)
- [ADR-002: PostgreSQL](/adrs/adr-002-postgresql)
