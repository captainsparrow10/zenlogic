---
sidebar_position: 3
---

# ADR-002: PostgreSQL como Base de Datos Principal

**Estado**: Aceptado
**Fecha**: 2025-11-23
**Decisores**: Equipo de Arquitectura zenLogic

## Contexto

zenLogic requiere una base de datos relacional para almacenar:

1. **Datos transaccionales**: Productos, pedidos, usuarios, roles
2. **Relaciones complejas**: Productos↔Variantes, Usuarios↔Roles↔Permisos
3. **Multi-tenancy**: Aislamiento de datos por organización
4. **JSONB**: Datos semi-estructurados (metadata, configuraciones)
5. **ACID**: Consistencia crítica en transacciones de negocio
6. **Escalabilidad**: Millones de filas en producción
7. **Full-text search**: Búsqueda de productos

Cada microservicio necesita su propia base de datos (database per service pattern).

## Decisión

**Usaremos PostgreSQL 15+** como base de datos relacional principal para todos los microservicios.

### Configuración

```yaml
PostgreSQL: 15+
Connection Pool: asyncpg (async driver)
ORM: SQLAlchemy 2.0 (async mode)
Migrations: Alembic
Backup: pg_dump diario + WAL archiving
Replication: Primary-Replica (read replicas)
```

## Alternativas Consideradas

### 1. MySQL 8.0

**Pros**:
- Popular, muchos devs lo conocen
- Performance buena para workloads simples
- Clustering con Galera

**Contras**:
- JSONB support inferior (JSON sin índices eficientes)
- Full-text search limitado
- Row-level security no nativo (necesitaríamos middleware)
- Transacciones DDL no soportadas (ALTER TABLE no es transaccional)

**Razón de rechazo**: JSONB y Row-Level Security son críticos para nuestro multi-tenancy.

### 2. MongoDB

**Pros**:
- Schema flexible
- Scaling horizontal fácil (sharding)
- BSON nativo (similar a JSON)

**Contras**:
- No ACID a nivel de documento (hasta MongoDB 4+, y aún limitado)
- JOINs ineficientes
- No hay tipo safety en queries
- Transacciones multi-documento complejas
- **CRÍTICO**: Multi-tenancy row-level difícil de implementar

**Razón de rechazo**: ERP requiere ACID estricto y relaciones complejas. NoSQL no es apropiado.

### 3. CockroachDB

**Pros**:
- Compatible con PostgreSQL
- Distributed nativo, alta disponibilidad
- ACID global

**Contras**:
- **Latencia mayor** que PostgreSQL (consensus overhead)
- **Costo licensing** para features enterprise
- **Complejidad operacional** innecesaria para nuestro scale
- Menos maduro que PostgreSQL

**Razón de rechazo**: Over-engineering. No necesitamos distributed DB aún. PostgreSQL + replicas es suficiente.

## Consecuencias

### Positivas

1. **JSONB Potente**
   ```sql
   -- Índices GIN en JSONB
   CREATE INDEX idx_product_metadata ON products USING GIN (metadata);

   -- Queries eficientes
   SELECT * FROM products
   WHERE metadata @> '{"featured": true}'::jsonb;
   ```

2. **Row-Level Security (RLS)**
   ```sql
   -- Multi-tenancy a nivel de DB
   CREATE POLICY tenant_isolation ON products
       USING (organization_id = current_setting('app.current_tenant')::uuid);

   ALTER TABLE products ENABLE ROW LEVEL SECURITY;
   ```

3. **Full-Text Search**
   ```sql
   -- tsvector + tsquery
   CREATE INDEX idx_product_search ON products
   USING GIN (to_tsvector('spanish', name || ' ' || description));

   SELECT * FROM products
   WHERE to_tsvector('spanish', name || ' ' || description)
       @@ to_tsquery('spanish', 'camiseta & algodón');
   ```

4. **Tipos de Datos Ricos**
   ```sql
   CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');

   CREATE TABLE orders (
       id UUID PRIMARY KEY,
       status order_status NOT NULL,
       metadata JSONB,
       tags TEXT[],  -- Array nativo
       price NUMERIC(10, 2),  -- Exacto para dinero
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

5. **Transacciones DDL**
   ```sql
   BEGIN;
   ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
   UPDATE products SET is_featured = TRUE WHERE metadata->>'featured' = 'true';
   COMMIT;  -- Si falla UPDATE, rollback de ALTER TABLE
   ```

6. **Window Functions**
   ```sql
   -- Top 5 productos por categoría
   SELECT
       category,
       name,
       sales,
       ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC) as rank
   FROM products
   WHERE rank <= 5;
   ```

7. **CTEs Recursivos**
   ```sql
   -- Árbol de categorías
   WITH RECURSIVE category_tree AS (
       SELECT id, name, parent_id, 1 as level
       FROM categories
       WHERE parent_id IS NULL

       UNION ALL

       SELECT c.id, c.name, c.parent_id, ct.level + 1
       FROM categories c
       JOIN category_tree ct ON c.parent_id = ct.id
   )
   SELECT * FROM category_tree;
   ```

8. **Extensiones Útiles**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- UUID generation
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Fuzzy search
   CREATE EXTENSION IF NOT EXISTS "btree_gist";      -- Advanced indexes
   CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query monitoring
   ```

### Negativas

1. **Escalabilidad Vertical**
   - PostgreSQL escala verticalmente mejor que horizontalmente
   - Sharding requiere herramientas externas (Citus, Postgres-XL)
   - **Mitigación**:
     - Para 100k-1M usuarios, vertical scaling es suficiente
     - Read replicas para queries pesados
     - Database per service reduce carga por DB

2. **Backup/Restore Más Lento que NoSQL**
   - pg_dump de 1TB puede tomar horas
   - **Mitigación**:
     - WAL archiving + Point-in-Time Recovery
     - pg_basebackup para backups incrementales
     - Replicas para DR (Disaster Recovery)

3. **Schema Migrations Requieren Downtime (en casos específicos)**
   - Agregar columna con default → lock table
   - **Mitigación**:
     ```sql
     -- En vez de:
     ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

     -- Hacer:
     ALTER TABLE products ADD COLUMN is_active BOOLEAN;
     UPDATE products SET is_active = TRUE WHERE is_active IS NULL;
     ALTER TABLE products ALTER COLUMN is_active SET DEFAULT TRUE;
     ```

4. **Conexiones Costosas**
   - Cada conexión = proceso OS (overhead)
   - Límite típico: 100-300 conexiones
   - **Mitigación**:
     - Connection pooling (asyncpg pool, PgBouncer)
     - Configuración:
       ```python
       # SQLAlchemy async pool
       engine = create_async_engine(
           DATABASE_URL,
           pool_size=20,
           max_overflow=10,
           pool_pre_ping=True
       )
       ```

### Riesgos

1. **Vacuuming Overhead**
   - MVCC genera row versions que deben limpiarse
   - **Mitigación**:
     ```sql
     -- Autovacuum configurado agresivamente
     ALTER TABLE products SET (
         autovacuum_vacuum_scale_factor = 0.05,
         autovacuum_analyze_scale_factor = 0.02
     );
     ```

2. **Índices Pueden Crecer Descontroladamente**
   - Cada índice duplica I/O en writes
   - **Mitigación**:
     - Solo índices justificados por queries reales
     - Monitorear con pg_stat_user_indexes

3. **Transacciones Largas Bloquean VACUUM**
   - Transacción abierta 1 hora → vacuum no puede limpiar
   - **Mitigación**:
     - Timeout: statement_timeout = 30s, idle_in_transaction_session_timeout = 10min
     - Monitorear transacciones largas

## Configuración de Producción

### postgresql.conf

```ini
# Connections
max_connections = 200
superuser_reserved_connections = 3

# Memory
shared_buffers = 8GB            # 25% de RAM
effective_cache_size = 24GB     # 75% de RAM
work_mem = 50MB                 # Per operation
maintenance_work_mem = 2GB

# Checkpoints
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
max_wal_size = 4GB

# Query Planner
random_page_cost = 1.1          # SSD
effective_io_concurrency = 200  # SSD

# Logging
log_min_duration_statement = 1000  # Log queries > 1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
```

### Connection Pooling (PgBouncer)

```ini
[databases]
catalog_db = host=localhost port=5432 dbname=catalog
auth_db = host=localhost port=5432 dbname=auth

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
```

## Monitoreo

### Queries Lentos

```sql
-- Top 10 queries más lentos
SELECT
    query,
    calls,
    total_exec_time / 1000 as total_time_sec,
    mean_exec_time / 1000 as mean_time_sec,
    max_exec_time / 1000 as max_time_sec
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Índices No Usados

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Bloat de Tablas

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Benchmark

```yaml
Hardware: 4 vCPU, 16GB RAM, SSD
Workload: 70% reads, 30% writes

Simple SELECT (indexed):
  Latency: 0.5-1ms
  Throughput: 10,000+ QPS

Complex JOIN (3 tables):
  Latency: 5-10ms
  Throughput: 2,000 QPS

INSERT (with 3 indexes):
  Latency: 2-3ms
  Throughput: 3,000 TPS

Full-text search:
  Latency: 10-20ms
  Throughput: 500 QPS
```

## Revisión Futura

Este ADR debe revisarse si:

1. Alcanzamos 10M+ filas y queries se vuelven lentos (`>100ms`)
2. Necesitamos sharding horizontal
3. Costos de vertical scaling superan `>$10k/mes`
4. Requieremos 99.99% uptime (actualmente 99.9% es suficiente)

**Fecha de próxima revisión**: 2026-11-23 (1 año)

## Referencias

- [PostgreSQL 15 Documentation](https://www.postgresql.org/docs/15/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Use the Index, Luke](https://use-the-index-luke.com/) - SQL indexing guide
- [Citus Data - PostgreSQL Scaling](https://www.citusdata.com/)

## Próximos Pasos

- [ADR-006: PostgreSQL Row-Level Security para Multi-tenancy](/adrs/adr-006-postgresql-multi-tenant)
- [Auth Service - Modelo de Datos](/microservicios/auth-service/modelo-datos)
- [Catalog Service - Modelo de Datos](/microservicios/catalog-service/modelo-datos)
