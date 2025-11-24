---
sidebar_position: 18
---

# Migraciones de Base de Datos

Gestión de migraciones con Alembic para Catalog Service.

## Configuración

### `alembic.ini`

```ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql://catalog_user:password@localhost/erp_catalog

[loggers]
keys = root,sqlalchemy,alembic

[logger_alembic]
level = INFO
handlers =
qualname = alembic
```

### `alembic/env.py`

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

from app.models import Base
from config.settings import settings

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

target_metadata = Base.metadata

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()
```

## Migraciones Principales

### 001 - Crear Tablas Iniciales

```python
"""create initial tables

Revision ID: 001_initial
Create Date: 2025-11-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '001_initial'
down_revision = None

def upgrade():
    # Products
    op.create_table(
        'products',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('sku', sa.String(50), nullable=False),
        sa.Column('category', sa.String(100)),
        sa.Column('description', sa.Text()),
        sa.Column('base_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.Column('deleted_at', sa.DateTime(timezone=True))
    )

    # Índices
    op.create_index(
        'idx_products_org',
        'products',
        ['organization_id']
    )
    op.create_index(
        'idx_products_sku_org',
        'products',
        ['sku', 'organization_id'],
        unique=True
    )

    # Variants
    op.create_table(
        'variants',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('product_id', UUID(as_uuid=True), nullable=False),
        sa.Column('sku', sa.String(50), nullable=False),
        sa.Column('name', sa.String(200)),
        sa.Column('price', sa.Numeric(10, 2), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'])
    )

    # Options
    op.create_table(
        'options',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('values', sa.ARRAY(sa.String(100))),
        sa.Column('created_at', sa.DateTime(timezone=True))
    )

def downgrade():
    op.drop_table('options')
    op.drop_table('variants')
    op.drop_table('products')
```

### 002 - Agregar Auditoría

```python
"""add audit fields

Revision ID: 002_audit
"""

def upgrade():
    op.add_column('products', sa.Column('created_by', UUID(as_uuid=True)))
    op.add_column('products', sa.Column('updated_by', UUID(as_uuid=True)))
    op.add_column('variants', sa.Column('created_by', UUID(as_uuid=True)))

def downgrade():
    op.drop_column('products', 'created_by')
    op.drop_column('products', 'updated_by')
    op.drop_column('variants', 'created_by')
```

## Comandos Alembic

```bash
# Crear nueva migración automática
alembic revision --autogenerate -m "descripcion del cambio"

# Aplicar migraciones
alembic upgrade head

# Rollback última migración
alembic downgrade -1

# Ver historial
alembic history

# Ver estado actual
alembic current

# Rollback a versión específica
alembic downgrade 001_initial
```

## Buenas Prácticas

1. **Siempre revisar migraciones auto-generadas**
2. **Nunca modificar migraciones ya aplicadas en producción**
3. **Usar transacciones para cambios complejos**
4. **Probar rollback antes de deploy**
5. **Hacer backup antes de aplicar migraciones**

## Próximos Pasos

- [Configuración](/microservicios/catalog-service/configuracion)
- [Modelo de Datos](/microservicios/catalog-service/modelo-datos)
