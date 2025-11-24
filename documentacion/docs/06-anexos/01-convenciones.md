---
sidebar_position: 2
---

# Convenciones de Código

Estándares y convenciones de código utilizadas en zenLogic ERP.

## Lenguaje y Estilo

### Python

Seguimos **PEP 8** con las siguientes especificaciones:

```python
# ✅ BIEN: Nombres descriptivos, snake_case
async def get_user_permissions(user_id: str) -> set[str]:
    """Obtener permisos de usuario."""
    pass

# ❌ MAL: Nombres genéricos, camelCase
async def getPerms(id: str) -> set:
    pass
```

### Formateo

```bash
# Usamos Black para formateo automático
black app/ --line-length 100

# isort para imports
isort app/ --profile black

# flake8 para linting
flake8 app/ --max-line-length 100
```

### Type Hints

```python
# ✅ SIEMPRE usar type hints
from typing import Optional, List, Dict
from uuid import UUID

async def create_product(
    product_data: ProductCreate,
    user_id: UUID,
    db: AsyncSession
) -> Product:
    """Crear producto."""
    pass

# ❌ Evitar código sin tipos
async def create_product(product_data, user_id, db):
    pass
```

## Estructura de Archivos

### Nombres de Archivos

```bash
# ✅ BIEN: snake_case
user_service.py
product_repository.py
auth_dependencies.py

# ❌ MAL: camelCase o PascalCase
UserService.py
productRepository.py
```

### Organización de Imports

```python
# 1. Standard library
import asyncio
import json
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

# 2. Third-party
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from pydantic import BaseModel

# 3. Local
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
```

### Estructura de Módulos

```
app/
├── __init__.py
├── main.py                 # Entry point
├── config.py              # Configuración
├── database.py            # DB setup
│
├── api/                   # Routers
│   ├── __init__.py
│   ├── deps.py           # Dependencies compartidas
│   └── v1/
│       ├── __init__.py
│       ├── users.py
│       └── products.py
│
├── models/                # SQLAlchemy models
│   ├── __init__.py
│   ├── user.py
│   └── product.py
│
├── schemas/               # Pydantic schemas
│   ├── __init__.py
│   ├── user.py
│   └── product.py
│
├── services/              # Business logic
│   ├── __init__.py
│   ├── user_service.py
│   └── product_service.py
│
├── repositories/          # Data access
│   ├── __init__.py
│   ├── user_repository.py
│   └── product_repository.py
│
├── events/                # Event handling
│   ├── __init__.py
│   ├── publisher.py
│   └── consumer.py
│
└── utils/                 # Utilidades
    ├── __init__.py
    └── helpers.py
```

## Naming Conventions

### Variables y Funciones

```python
# ✅ snake_case para variables y funciones
user_id = "123"
organization_name = "Acme Corp"

async def get_product_by_sku(sku: str) -> Optional[Product]:
    pass

# ❌ camelCase
userId = "123"
organizationName = "Acme Corp"

async def getProductBySku(sku: str):
    pass
```

### Clases

```python
# ✅ PascalCase para clases
class UserService:
    pass

class ProductRepository:
    pass

class AuthDependency:
    pass

# ❌ snake_case o camelCase
class user_service:
    pass

class productRepository:
    pass
```

### Constantes

```python
# ✅ UPPER_SNAKE_CASE para constantes
MAX_PAGE_SIZE = 100
DEFAULT_CACHE_TTL = 300
JWT_ALGORITHM = "RS256"

# ❌ Otros formatos
maxPageSize = 100
default_cache_ttl = 300
```

### Variables Privadas

```python
class UserService:
    def __init__(self):
        # ✅ Prefijo _ para variables privadas
        self._cache = {}
        self._db = None

    # ✅ Prefijo _ para métodos privados
    async def _validate_permissions(self, user_id: str):
        pass

    # ✅ Métodos públicos sin prefijo
    async def get_user(self, user_id: str):
        pass
```

## Base de Datos

### Nombres de Tablas

```sql
-- ✅ BIEN: plural, snake_case
CREATE TABLE users (...);
CREATE TABLE products (...);
CREATE TABLE product_variants (...);

-- ❌ MAL: singular o camelCase
CREATE TABLE user (...);
CREATE TABLE Product (...);
CREATE TABLE productVariant (...);
```

### Nombres de Columnas

```sql
-- ✅ BIEN: snake_case, descriptivo
CREATE TABLE products (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    base_price DECIMAL(10, 2)
);

-- ❌ MAL: camelCase o abreviado
CREATE TABLE products (
    id UUID PRIMARY KEY,
    orgId UUID NOT NULL,
    createdAt TIMESTAMP,
    price DECIMAL(10, 2)
);
```

### Constraints

```sql
-- ✅ BIEN: Nombres descriptivos
ALTER TABLE products
    ADD CONSTRAINT fk_products_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id);

ALTER TABLE products
    ADD CONSTRAINT uq_products_org_sku
    UNIQUE (organization_id, sku);

-- ❌ MAL: Nombres auto-generados
ALTER TABLE products
    ADD CONSTRAINT fk_123
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id);
```

### Índices

```sql
-- ✅ BIEN: idx_{tabla}_{columnas}
CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_org_sku ON products(organization_id, sku);

-- ❌ MAL: Nombres genéricos
CREATE INDEX index1 ON products(organization_id);
```

## APIs REST

### Endpoints

```python
# ✅ BIEN: Nombres descriptivos, plurales
GET    /api/v1/products              # Listar
GET    /api/v1/products/{id}         # Obtener uno
POST   /api/v1/products              # Crear
PUT    /api/v1/products/{id}         # Actualizar completo
PATCH  /api/v1/products/{id}         # Actualizar parcial
DELETE /api/v1/products/{id}         # Eliminar

# Sub-recursos
GET    /api/v1/products/{id}/variants
POST   /api/v1/products/{id}/variants

# ❌ MAL: Verbos en URL
POST /api/v1/create-product
GET  /api/v1/get-product/{id}
```

### Request/Response

```python
# ✅ BIEN: Schemas explícitos
class ProductCreate(BaseModel):
    name: str
    sku: str
    base_price: Decimal
    description: Optional[str] = None

class ProductResponse(BaseModel):
    id: UUID
    name: str
    sku: str
    base_price: Decimal
    organization_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(
    product: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProductResponse:
    """Crear nuevo producto."""
    pass
```

### Status Codes

```python
# ✅ Usar status codes apropiados
from fastapi import status

# 200 OK - Request exitoso
return product

# 201 Created - Recurso creado
return JSONResponse(content=product, status_code=status.HTTP_201_CREATED)

# 204 No Content - Eliminación exitosa
return Response(status_code=status.HTTP_204_NO_CONTENT)

# 400 Bad Request - Input inválido
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid SKU format"
)

# 401 Unauthorized - No autenticado
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid credentials"
)

# 403 Forbidden - No autorizado
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Insufficient permissions"
)

# 404 Not Found - Recurso no existe
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Product not found"
)

# 409 Conflict - Conflicto (ej: SKU duplicado)
raise HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="SKU already exists"
)

# 500 Internal Server Error - Error del servidor
raise HTTPException(
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    detail="Internal error"
)
```

## Eventos

### Routing Keys

```python
# ✅ Formato: {service}.{entity}.{action}
"auth.user.created"
"auth.user.updated"
"auth.user.deactivated"
"auth.local.created"
"catalog.product.created"
"catalog.product.updated"
"catalog.variant.created"

# ❌ Formatos inconsistentes
"user_created"
"AuthUserCreated"
"create-user"
```

### Event Payload

```python
# ✅ Estructura consistente
event = {
    "event_id": str(uuid4()),
    "event_type": "catalog.product.created",
    "timestamp": datetime.utcnow().isoformat(),
    "service": "catalog-service",
    "version": "1.0",
    "payload": {
        "product_id": "...",
        "organization_id": "...",
        "name": "...",
        "sku": "..."
    },
    "metadata": {
        "user_id": "...",
        "correlation_id": "..."
    }
}
```

## Testing

### Nombres de Tests

```python
# ✅ BIEN: test_{función}_{escenario}_{resultado_esperado}
def test_create_product_with_valid_data_returns_201():
    pass

def test_create_product_with_duplicate_sku_raises_conflict():
    pass

def test_get_product_with_invalid_id_returns_404():
    pass

# ❌ MAL: Nombres genéricos
def test_product():
    pass

def test_1():
    pass
```

### Fixtures

```python
# ✅ BIEN: Fixtures reutilizables y descriptivos
@pytest.fixture
async def db_session():
    """Sesión de DB para testing."""
    pass

@pytest.fixture
async def test_organization():
    """Organización de prueba."""
    pass

@pytest.fixture
async def test_user(test_organization):
    """Usuario de prueba con rol admin."""
    pass
```

## Documentación

### Docstrings

```python
# ✅ BIEN: Google-style docstrings
async def create_product(
    product_data: ProductCreate,
    user_id: UUID,
    db: AsyncSession
) -> Product:
    """
    Crear un nuevo producto.

    Args:
        product_data: Datos del producto a crear
        user_id: ID del usuario que crea el producto
        db: Sesión de base de datos

    Returns:
        Producto creado con ID asignado

    Raises:
        HTTPException: Si el SKU ya existe
        ValueError: Si los datos son inválidos
    """
    pass

# ❌ MAL: Sin docstring o incompleto
async def create_product(product_data, user_id, db):
    """Crear producto."""
    pass
```

### Comentarios

```python
# ✅ BIEN: Comentarios útiles que explican el "por qué"
# Usamos RLS en lugar de filtros manuales para garantizar
# aislamiento de tenants incluso si hay bugs en queries
await db.execute(
    text("SET LOCAL app.current_tenant = :tid"),
    {"tid": str(organization_id)}
)

# ❌ MAL: Comentarios obvios que explican el "qué"
# Configurar el tenant
await db.execute(...)
```

## Git

### Commits

```bash
# ✅ BIEN: Mensajes descriptivos en imperativo
git commit -m "Add product creation endpoint"
git commit -m "Fix SKU validation for special characters"
git commit -m "Refactor user service to use repository pattern"

# ❌ MAL: Mensajes genéricos
git commit -m "changes"
git commit -m "fix bug"
git commit -m "update"
```

### Branches

```bash
# ✅ BIEN: Formato {tipo}/{descripción}
feature/user-authentication
bugfix/sku-validation
hotfix/cache-invalidation
refactor/repository-pattern

# ❌ MAL: Nombres genéricos
dev
test
branch1
```

## Seguridad

### Secretos

```python
# ✅ BIEN: Usar variables de entorno
from app.config import settings

DATABASE_URL = settings.database_url
JWT_SECRET = settings.jwt_secret_key

# ❌ MAL: Hardcodear secretos
DATABASE_URL = "postgresql://user:password@localhost/db"
JWT_SECRET = "my-secret-key-123"
```

### SQL Injection

```python
# ✅ BIEN: Usar parámetros
result = await db.execute(
    select(Product).where(Product.sku == sku)
)

# Con raw SQL, usar parámetros
result = await db.execute(
    text("SELECT * FROM products WHERE sku = :sku"),
    {"sku": sku}
)

# ❌ MAL: Concatenar strings
query = f"SELECT * FROM products WHERE sku = '{sku}'"
result = await db.execute(text(query))
```

## Performance

### N+1 Queries

```python
# ✅ BIEN: Usar joinedload
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(Product)
    .options(selectinload(Product.variants))
    .where(Product.organization_id == org_id)
)

# ❌ MAL: Lazy loading en loop
products = await db.execute(select(Product))
for product in products:
    # Esto genera N queries adicionales
    variants = await product.variants
```

### Cache Keys

```python
# ✅ BIEN: Namespace claro y consistente
cache_key = f"product:{product_id}"
cache_key = f"org:{org_id}:locals"
cache_key = f"permissions:{user_id}"

# ❌ MAL: Keys sin namespace
cache_key = product_id
cache_key = f"{org_id}_locals"
```

## Logging

### Niveles

```python
import logging

logger = logging.getLogger(__name__)

# DEBUG: Información detallada para debugging
logger.debug(f"Processing product: {product_id}")

# INFO: Eventos normales de negocio
logger.info(f"Product created: {product_id}")

# WARNING: Situaciones anormales pero manejables
logger.warning(f"Cache miss for product: {product_id}")

# ERROR: Errores que requieren atención
logger.error(f"Failed to create product: {e}", exc_info=True)

# CRITICAL: Errores críticos del sistema
logger.critical("Database connection lost")
```

### Structured Logging

```python
# ✅ BIEN: Usar extra para structured logs
logger.info(
    "Product created",
    extra={
        "product_id": product_id,
        "organization_id": org_id,
        "user_id": user_id
    }
)

# ❌ MAL: Concatenar strings
logger.info(f"Product {product_id} created by user {user_id}")
```

## Referencias

- [PEP 8 - Style Guide for Python Code](https://pep8.org/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)
- [SQLAlchemy Best Practices](https://docs.sqlalchemy.org/en/20/orm/queryguide/index.html)
