---
sidebar_position: 16
---

# Testing

Estrategias y ejemplos de testing para Catalog Service.

## Estructura de Tests

```
tests/
├── unit/
│   ├── services/
│   │   ├── test_product_service.py
│   │   └── test_variant_service.py
│   ├── repositories/
│   │   └── test_product_repository.py
│   └── utils/
│       └── test_cursor_pagination.py
├── integration/
│   ├── test_product_api.py
│   ├── test_variant_api.py
│   └── test_auth_client.py
└── e2e/
    └── test_product_flow.py
```

## Unit Tests

### Test de Service

```python
import pytest
from unittest.mock import Mock, AsyncMock

from app.services.product_service import ProductService
from app.schemas.product import ProductCreate

@pytest.mark.asyncio
async def test_create_product_success():
    """Test de creación exitosa de producto."""

    # Mocks
    product_repo = Mock()
    product_repo.check_sku_exists = AsyncMock(return_value=False)
    product_repo.create = AsyncMock(return_value=Mock(
        id="product-123",
        sku="TEST-001",
        name="Test Product"
    ))

    event_publisher = Mock()
    event_publisher.publish = AsyncMock()

    cache = Mock()
    cache.delete_pattern = AsyncMock()

    # Service
    service = ProductService(product_repo, event_publisher, cache)

    # Ejecutar
    product_data = ProductCreate(
        name="Test Product",
        sku="TEST-001",
        base_price=10.99
    )

    result = await service.create_product(
        product_data=product_data,
        org_id="org-123",
        user_id="user-456"
    )

    # Assertions
    assert result.sku == "TEST-001"
    product_repo.create.assert_called_once()
    event_publisher.publish.assert_called_once()
    cache.delete_pattern.assert_called_once()

@pytest.mark.asyncio
async def test_create_product_duplicate_sku():
    """Test de creación con SKU duplicado."""

    product_repo = Mock()
    product_repo.check_sku_exists = AsyncMock(return_value=True)

    service = ProductService(product_repo, None, None)

    product_data = ProductCreate(
        name="Test Product",
        sku="DUPLICATE-001",
        base_price=10.99
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.create_product(
            product_data=product_data,
            org_id="org-123",
            user_id="user-456"
        )

    assert exc_info.value.status_code == 409
```

## Integration Tests

### Test de API

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_list_products_endpoint():
    """Test de endpoint de listado de productos."""

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/products",
            headers={
                "Authorization": "Bearer test-token",
                "X-Tenant-ID": "org-123"
            }
        )

    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data

@pytest.mark.asyncio
async def test_create_product_endpoint():
    """Test de creación de producto."""

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/products",
            headers={
                "Authorization": "Bearer test-token",
                "X-Tenant-ID": "org-123"
            },
            json={
                "name": "Test Product",
                "sku": "TEST-001",
                "base_price": 10.99
            }
        )

    assert response.status_code == 201
    data = response.json()
    assert data["sku"] == "TEST-001"
```

## Fixtures

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.database import Base

@pytest.fixture
async def db_session():
    """Fixture para sesión de BD de test."""
    engine = create_async_engine("postgresql+asyncpg://test:test@localhost/test_db")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine) as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()

@pytest.fixture
def mock_auth_client():
    """Fixture para Auth Client mockeado."""
    client = Mock()
    client.verify_token = AsyncMock(return_value={
        "user_id": "user-123",
        "organization_id": "org-456",
        "is_active": True
    })
    client.get_user_locals = AsyncMock(return_value=["local-1", "local-2"])
    return client
```

## Coverage

```bash
# Ejecutar tests con coverage
pytest --cov=app --cov-report=html --cov-report=term

# Objetivo: >80% coverage
```

## Próximos Pasos

- [Errores Comunes](/microservicios/catalog-service/errores-comunes)
- [Arquitectura](/microservicios/catalog-service/arquitectura)
