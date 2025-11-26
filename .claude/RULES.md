# Reglas del Proyecto zenLogic ERP

Este documento establece las reglas, convenciones y mejores prácticas para el desarrollo del sistema ERP zenLogic.

## 1. Estilo y Convenciones de Código

### 1.1 Python

#### Formateo y Linting

```bash
# OBLIGATORIO antes de cada commit
black app/ --line-length 100
isort app/ --profile black
flake8 app/ --max-line-length 100
mypy app/ --strict
```

#### Type Hints

**REGLA**: Todos los tipos deben estar explícitos.

✅ **CORRECTO**:
```python
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

async def create_product(
    product_data: ProductCreate,
    user_id: UUID,
    db: AsyncSession
) -> Product:
    """Crear un nuevo producto."""
    pass
```

❌ **INCORRECTO**:
```python
async def create_product(product_data, user_id, db):
    pass
```

#### Naming Conventions

- **Variables y funciones**: `snake_case`
- **Clases**: `PascalCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Métodos/variables privadas**: prefijo `_`
- **Archivos**: `snake_case.py`

✅ **CORRECTO**:
```python
MAX_PAGE_SIZE = 100
DEFAULT_CACHE_TTL = 300

class UserService:
    def __init__(self):
        self._cache = {}

    async def get_user(self, user_id: str) -> Optional[User]:
        pass

    async def _validate_permissions(self, user_id: str) -> bool:
        pass
```

❌ **INCORRECTO**:
```python
maxPageSize = 100
class userService:
    async def getUser(self, userId):
        pass
```

#### Docstrings

**REGLA**: Usar Google-style docstrings para todas las funciones públicas.

✅ **CORRECTO**:
```python
async def create_product(
    product_data: ProductCreate,
    user_id: UUID,
    db: AsyncSession
) -> Product:
    """
    Crear un nuevo producto en el catálogo.

    Args:
        product_data: Datos del producto a crear
        user_id: ID del usuario que crea el producto
        db: Sesión de base de datos async

    Returns:
        Producto creado con ID asignado

    Raises:
        HTTPException: Si el SKU ya existe (409)
        ValueError: Si los datos son inválidos
    """
    pass
```

#### Imports

**REGLA**: Organizar imports en 3 grupos separados por línea en blanco.

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

### 1.2 Base de Datos

#### Nombres de Tablas

**REGLA**: Plural, snake_case.

✅ **CORRECTO**:
```sql
CREATE TABLE users (...);
CREATE TABLE products (...);
CREATE TABLE product_variants (...);
```

❌ **INCORRECTO**:
```sql
CREATE TABLE user (...);
CREATE TABLE Product (...);
CREATE TABLE productVariant (...);
```

#### Nombres de Columnas

**REGLA**: snake_case, descriptivo, sin abreviaciones.

✅ **CORRECTO**:
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    base_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE
);
```

❌ **INCORRECTO**:
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    orgId UUID NOT NULL,
    createdAt TIMESTAMP,
    price DECIMAL(10, 2),
    active BOOLEAN
);
```

#### Constraints y Índices

**REGLA**: Nombres descriptivos siguiendo convención.

```sql
-- Foreign Keys: fk_{tabla}_{referencia}
ALTER TABLE products
    ADD CONSTRAINT fk_products_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id);

-- Unique: uq_{tabla}_{columnas}
ALTER TABLE products
    ADD CONSTRAINT uq_products_org_sku
    UNIQUE (organization_id, sku);

-- Índices: idx_{tabla}_{columnas}
CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_products_org_sku ON products(organization_id, sku);
```

### 1.3 APIs REST

#### Endpoints

**REGLA**: Nombres en plural, sin verbos en URL.

✅ **CORRECTO**:
```python
GET    /api/v1/products              # Listar
GET    /api/v1/products/{id}         # Obtener uno
POST   /api/v1/products              # Crear
PUT    /api/v1/products/{id}         # Actualizar completo
PATCH  /api/v1/products/{id}         # Actualizar parcial
DELETE /api/v1/products/{id}         # Eliminar

# Sub-recursos
GET    /api/v1/products/{id}/variants
POST   /api/v1/products/{id}/variants
```

❌ **INCORRECTO**:
```python
POST /api/v1/create-product
GET  /api/v1/get-product/{id}
POST /api/v1/product/create
```

#### Status Codes

**REGLA**: Usar códigos HTTP semánticamente correctos.

```python
from fastapi import status

# 200 OK - Request exitoso con respuesta
return product

# 201 Created - Recurso creado exitosamente
return JSONResponse(content=product, status_code=status.HTTP_201_CREATED)

# 204 No Content - Operación exitosa sin contenido
return Response(status_code=status.HTTP_204_NO_CONTENT)

# 400 Bad Request - Input inválido del cliente
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid SKU format"
)

# 401 Unauthorized - No autenticado
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid credentials"
)

# 403 Forbidden - Autenticado pero sin permisos
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Insufficient permissions"
)

# 404 Not Found - Recurso no existe
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Product not found"
)

# 409 Conflict - Conflicto con estado actual (ej: duplicado)
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

#### Schemas Pydantic

**REGLA**: Schemas explícitos para Request y Response.

✅ **CORRECTO**:
```python
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

### 1.4 Eventos

#### Routing Keys

**REGLA**: Formato `{service}.{entity}.{action}`

✅ **CORRECTO**:
```python
"auth.user.created"
"auth.user.updated"
"auth.user.deactivated"
"auth.local.created"
"catalog.product.created"
"catalog.product.updated"
"catalog.variant.created"
```

❌ **INCORRECTO**:
```python
"user_created"
"AuthUserCreated"
"create-user"
"USER.CREATED"
```

#### Event Payload

**REGLA**: Estructura consistente con formato estandarizado.

```python
event = {
    "event": "catalog.product.created",
    "timestamp": datetime.utcnow().isoformat(),
    "service": "catalog-service",
    "version": "1.0",
    "organization_id": "org_xxx",
    "data": {
        "product_id": "...",
        "name": "...",
        "sku": "...",
        "created_by": "...",
        "created_at": "..."
    }
}
```

## 2. Seguridad

### 2.1 Secretos

**REGLA**: NUNCA hardcodear secretos. Usar variables de entorno.

✅ **CORRECTO**:
```python
from app.config import settings

DATABASE_URL = settings.database_url
JWT_SECRET = settings.jwt_secret_key
REDIS_PASSWORD = settings.redis_password
```

❌ **INCORRECTO**:
```python
DATABASE_URL = "postgresql://user:password@localhost/db"
JWT_SECRET = "my-secret-key-123"
```

### 2.2 SQL Injection

**REGLA**: SIEMPRE usar parámetros, nunca concatenar strings.

✅ **CORRECTO**:
```python
# SQLAlchemy ORM
result = await db.execute(
    select(Product).where(Product.sku == sku)
)

# Raw SQL con parámetros
result = await db.execute(
    text("SELECT * FROM products WHERE sku = :sku"),
    {"sku": sku}
)
```

❌ **INCORRECTO**:
```python
query = f"SELECT * FROM products WHERE sku = '{sku}'"
result = await db.execute(text(query))
```

### 2.3 RBAC

**REGLA**: Validar permisos en TODAS las operaciones sensibles.

```python
from app.api.deps import require_permission

@router.post("/products")
async def create_product(
    product: ProductCreate,
    current_user: User = Depends(require_permission("products.create")),
    db: AsyncSession = Depends(get_db)
):
    pass
```

### 2.4 Multi-tenancy

**REGLA**: SIEMPRE configurar tenant context antes de queries.

```python
async def set_tenant_context(db: AsyncSession, organization_id: UUID):
    """Configurar contexto de tenant para RLS."""
    await db.execute(
        text("SET LOCAL app.current_tenant = :tid"),
        {"tid": str(organization_id)}
    )
```

## 3. Performance

### 3.1 N+1 Queries

**REGLA**: Usar eager loading para relaciones.

✅ **CORRECTO**:
```python
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(Product)
    .options(selectinload(Product.variants))
    .where(Product.organization_id == org_id)
)
```

❌ **INCORRECTO**:
```python
products = await db.execute(select(Product))
for product in products:
    # Esto genera N queries adicionales
    variants = await product.variants
```

### 3.2 Cache Keys

**REGLA**: Usar namespace claro y consistente.

✅ **CORRECTO**:
```python
cache_key = f"product:{product_id}"
cache_key = f"org:{org_id}:locals"
cache_key = f"permissions:{user_id}"
cache_key = f"user:{user_id}:profile"
```

❌ **INCORRECTO**:
```python
cache_key = product_id
cache_key = f"{org_id}_locals"
cache_key = "user_" + user_id
```

### 3.3 Paginación

**REGLA**: Usar cursor-based pagination, NO offset-based.

✅ **CORRECTO**:
```python
async def get_products(
    cursor: Optional[str] = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Paginación cursor-based."""
    query = select(Product).order_by(Product.created_at, Product.id)

    if cursor:
        decoded = decode_cursor(cursor)
        query = query.where(
            (Product.created_at, Product.id) > (decoded.created_at, decoded.id)
        )

    query = query.limit(limit + 1)  # +1 para has_next
    # ...
```

❌ **INCORRECTO**:
```python
async def get_products(page: int = 1, page_size: int = 20):
    offset = (page - 1) * page_size
    query = select(Product).offset(offset).limit(page_size)
```

## 4. Testing

### 4.1 Nombres de Tests

**REGLA**: `test_{función}_{escenario}_{resultado_esperado}`

✅ **CORRECTO**:
```python
def test_create_product_with_valid_data_returns_201():
    pass

def test_create_product_with_duplicate_sku_raises_conflict():
    pass

def test_get_product_with_invalid_id_returns_404():
    pass

async def test_list_products_returns_paginated_results():
    pass
```

❌ **INCORRECTO**:
```python
def test_product():
    pass

def test_1():
    pass

def test_create():
    pass
```

### 4.2 Fixtures

**REGLA**: Fixtures reutilizables y bien nombrados.

```python
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

@pytest.fixture
async def auth_headers(test_user):
    """Headers de autenticación."""
    pass
```

### 4.3 Cobertura

**REGLA**: Mínimo 80% de cobertura para código nuevo.

```bash
pytest --cov=app --cov-report=html --cov-report=term
```

## 5. Git

### 5.1 Commits

**REGLA**: Mensajes descriptivos en tiempo imperativo.

✅ **CORRECTO**:
```bash
git commit -m "Add product creation endpoint"
git commit -m "Fix SKU validation for special characters"
git commit -m "Refactor user service to use repository pattern"
git commit -m "Update product cache invalidation logic"
```

❌ **INCORRECTO**:
```bash
git commit -m "changes"
git commit -m "fix bug"
git commit -m "update"
git commit -m "WIP"
```

### 5.2 Branches

**REGLA**: Formato `{tipo}/{descripción-kebab-case}`

✅ **CORRECTO**:
```bash
feature/user-authentication
feature/product-variants
bugfix/sku-validation
bugfix/cache-invalidation-race-condition
hotfix/critical-security-patch
refactor/repository-pattern
```

❌ **INCORRECTO**:
```bash
dev
test
branch1
my-branch
fix
```

### 5.3 Pull Requests

**REGLA**: PR title descriptivo + descripción detallada.

```markdown
## Title
Add product variant management endpoints

## Description
Implements CRUD endpoints for product variants with the following features:
- Create variant with options
- Update variant price and stock
- Soft delete variants
- List variants with pagination

## Changes
- Added `ProductVariant` model
- Added variant endpoints in catalog API
- Added variant validation logic
- Added tests for variant operations

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Tested multi-tenant isolation

## Related Issues
Closes #123
```

## 6. Logging

### 6.1 Niveles

**REGLA**: Usar niveles apropiados.

```python
import logging

logger = logging.getLogger(__name__)

# DEBUG: Información detallada para debugging
logger.debug(f"Processing product: {product_id}")

# INFO: Eventos normales de negocio
logger.info("Product created", extra={"product_id": product_id})

# WARNING: Situaciones anormales pero manejables
logger.warning("Cache miss", extra={"key": cache_key})

# ERROR: Errores que requieren atención
logger.error("Failed to create product", exc_info=True)

# CRITICAL: Errores críticos del sistema
logger.critical("Database connection lost")
```

### 6.2 Structured Logging

**REGLA**: Usar `extra` para structured logs.

✅ **CORRECTO**:
```python
logger.info(
    "Product created",
    extra={
        "product_id": str(product_id),
        "organization_id": str(org_id),
        "user_id": str(user_id),
        "correlation_id": correlation_id
    }
)
```

❌ **INCORRECTO**:
```python
logger.info(f"Product {product_id} created by user {user_id}")
```

## 7. Documentación

### 7.1 Docusaurus

**REGLA**: Document IDs sin prefijos numéricos en sidebars.js.

✅ **CORRECTO**:
```javascript
items: [
  'arquitectura/vision-general',
  'microservicios/auth-service/overview',
  'adrs/adr-001-python-fastapi'
]
```

❌ **INCORRECTO**:
```javascript
items: [
  '01-arquitectura/vision-general',
  '02-microservicios/auth-service/overview',
  '03-adrs/adr-001-python-fastapi'
]
```

**RAZÓN**: Docusaurus elimina prefijos numéricos automáticamente al generar IDs.

### 7.2 Mermaid Diagrams

**REGLA**: Evitar conflictos de nombres entre subgraphs y nodes.

✅ **CORRECTO**:
```mermaid
graph TB
    subgraph "Ingress Layer"
        Ingress[Ingress Controller]
    end
```

❌ **INCORRECTO**:
```mermaid
graph TB
    subgraph "Ingress"
        Ingress[Ingress Controller]  # Conflicto de nombres
    end
```

### 7.3 README

**REGLA**: Cada microservicio debe tener README.md con:

```markdown
# Service Name

## Description
Brief description

## Tech Stack
- Python 3.11+
- FastAPI
- PostgreSQL
- ...

## Setup
```bash
# Local development
...
```

## API Documentation
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Environment Variables
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| DATABASE_URL | PostgreSQL connection | Yes | - |
| ...

## Testing
```bash
pytest
```

## Architecture
Link to full documentation
```

## 8. Error Handling

### 8.1 Excepciones Personalizadas

**REGLA**: Crear excepciones específicas del dominio.

```python
class DomainException(Exception):
    """Base exception para el dominio."""
    pass

class ProductNotFoundException(DomainException):
    """Producto no encontrado."""
    pass

class DuplicateSKUException(DomainException):
    """SKU duplicado."""
    pass

class InsufficientPermissionsException(DomainException):
    """Permisos insuficientes."""
    pass
```

### 8.2 Global Exception Handler

**REGLA**: Capturar y transformar excepciones en responses HTTP.

```python
@app.exception_handler(ProductNotFoundException)
async def product_not_found_handler(request: Request, exc: ProductNotFoundException):
    return JSONResponse(
        status_code=404,
        content={"detail": str(exc)}
    )

@app.exception_handler(DuplicateSKUException)
async def duplicate_sku_handler(request: Request, exc: DuplicateSKUException):
    return JSONResponse(
        status_code=409,
        content={"detail": str(exc)}
    )
```

## 9. Deployment

### 9.1 Docker

**REGLA**: Multi-stage builds para optimizar tamaño.

```dockerfile
# Builder stage
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 9.2 Health Checks

**REGLA**: Implementar endpoints de health check.

```python
@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint."""
    try:
        # Check database
        await db.execute(text("SELECT 1"))

        # Check Redis
        await redis.ping()

        # Check RabbitMQ
        # ...

        return {"status": "healthy"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")
```

## 10. Prohibiciones

### ❌ NUNCA hacer esto:

1. **Hardcodear secretos o contraseñas**
2. **Concatenar SQL queries con strings**
3. **Usar `SELECT *` en producción**
4. **Ignorar excepciones sin logging**
5. **Commitear código sin formatear (black, isort)**
6. **Pushear a main sin PR**
7. **Desactivar RLS en PostgreSQL**
8. **Usar offset pagination para grandes datasets**
9. **Retornar datos de otros tenants**
10. **Hacer queries sin límite (LIMIT)**

## 11. Checklist Pre-Commit

Antes de cada commit, verificar:

- [ ] Código formateado con `black`
- [ ] Imports ordenados con `isort`
- [ ] Sin errores de `flake8`
- [ ] Sin errores de `mypy`
- [ ] Tests pasan: `pytest`
- [ ] Cobertura >= 80%
- [ ] Docstrings en funciones públicas
- [ ] No hay secretos hardcodeados
- [ ] No hay TODOs críticos sin issue

## 12. Checklist Pre-PR

Antes de crear PR, verificar:

- [ ] Todos los checks pre-commit pasan
- [ ] Branch actualizado con main
- [ ] Tests de integración pasan
- [ ] Documentación actualizada
- [ ] CHANGELOG.md actualizado
- [ ] PR description completa
- [ ] Screenshots si hay cambios UI
- [ ] Sin conflictos de merge

---

**Última actualización**: 2025-11-25
**Versión**: 1.1
**Mantenedor**: Equipo zenLogic

## Changelog

### v1.1 (2025-11-25)
- Actualizado formato de eventos: `event` + `data` (antes: `event_type` + `payload`)
- Eliminado campo `metadata` del evento (ahora integrado en estructura principal)
- Agregado `organization_id` como campo obligatorio de primer nivel
