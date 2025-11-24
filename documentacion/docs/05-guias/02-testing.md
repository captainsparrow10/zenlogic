---
sidebar_position: 3
---

# Testing

Estrategias y mejores prácticas de testing para zenLogic.

## Stack de Testing

```bash
pytest==7.4.3           # Framework de testing
pytest-asyncio==0.21.1  # Soporte async
pytest-cov==4.1.0       # Coverage
httpx==0.25.2           # HTTP client async
faker==20.1.0           # Fake data
factory-boy==3.3.0      # Test fixtures
```

## Estructura de Tests

```
tests/
├── __init__.py
├── conftest.py          # Fixtures compartidos
├── unit/                # Tests unitarios
│   ├── test_models.py
│   ├── test_schemas.py
│   └── test_services.py
├── integration/         # Tests de integración
│   ├── test_api.py
│   ├── test_database.py
│   └── test_events.py
└── e2e/                 # Tests end-to-end
    └── test_flows.py
```

## Configuración (conftest.py)

```python
# tests/conftest.py
import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.config import settings

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://test_user:test_pass@localhost:5432/test_db"

# Test engine
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)

# Test session factory
TestSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop():
    """Event loop para tests async."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
async def db_session():
    """Sesión de DB para tests."""

    # Crear tablas
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Sesión
    async with TestSessionLocal() as session:
        yield session

    # Drop tablas
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(db_session):
    """HTTP client para tests."""

    # Override dependency
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()

@pytest.fixture
def fake_user():
    """Usuario de prueba."""
    from faker import Faker
    fake = Faker()

    return {
        "email": fake.email(),
        "password": "Test123!",
        "full_name": fake.name()
    }
```

## Tests Unitarios

### Modelos

```python
# tests/unit/test_models.py
import pytest
from app.models.product import Product

@pytest.mark.asyncio
async def test_product_model():
    """Test modelo Product."""

    product = Product(
        name="Test Product",
        sku="TEST-001",
        base_price=19.99,
        organization_id="org-uuid"
    )

    assert product.name == "Test Product"
    assert product.sku == "TEST-001"
    assert product.base_price == 19.99

def test_product_dict():
    """Test serialización a dict."""

    product = Product(
        name="Test Product",
        sku="TEST-001",
        base_price=19.99
    )

    product_dict = product.dict()

    assert "name" in product_dict
    assert product_dict["name"] == "Test Product"
```

### Schemas

```python
# tests/unit/test_schemas.py
import pytest
from pydantic import ValidationError
from app.schemas.product import ProductCreate

def test_product_create_valid():
    """Test schema válido."""

    data = {
        "name": "Test Product",
        "sku": "TEST-001",
        "base_price": 19.99,
        "organization_id": "org-uuid"
    }

    product = ProductCreate(**data)

    assert product.name == "Test Product"
    assert product.base_price == 19.99

def test_product_create_invalid_price():
    """Test validación de precio."""

    data = {
        "name": "Test Product",
        "sku": "TEST-001",
        "base_price": -10.0,  # ❌ Precio negativo
        "organization_id": "org-uuid"
    }

    with pytest.raises(ValidationError):
        ProductCreate(**data)
```

### Services

```python
# tests/unit/test_services.py
import pytest
from unittest.mock import Mock, AsyncMock
from app.services.product_service import ProductService

@pytest.mark.asyncio
async def test_create_product():
    """Test crear producto."""

    # Mock repository
    mock_repo = Mock()
    mock_repo.create = AsyncMock(return_value={
        "id": "prod-uuid",
        "name": "Test Product",
        "sku": "TEST-001"
    })

    # Service con mock
    service = ProductService(repository=mock_repo)

    # Crear
    product = await service.create({
        "name": "Test Product",
        "sku": "TEST-001",
        "base_price": 19.99
    })

    # Assertions
    assert product["name"] == "Test Product"
    mock_repo.create.assert_called_once()
```

## Tests de Integración

### API Endpoints

```python
# tests/integration/test_api.py
import pytest

@pytest.mark.asyncio
async def test_create_product_endpoint(client, db_session):
    """Test POST /products."""

    product_data = {
        "name": "Test Product",
        "sku": "TEST-001",
        "base_price": 19.99,
        "organization_id": "org-uuid"
    }

    response = await client.post("/api/v1/products", json=product_data)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Product"
    assert "id" in data

@pytest.mark.asyncio
async def test_get_products_pagination(client, db_session):
    """Test paginación de productos."""

    # Crear productos
    for i in range(10):
        await client.post("/api/v1/products", json={
            "name": f"Product {i}",
            "sku": f"PROD-{i:03d}",
            "base_price": 10.0 + i,
            "organization_id": "org-uuid"
        })

    # Listar con paginación
    response = await client.get("/api/v1/products?limit=5")

    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 5
    assert data["page_info"]["has_next_page"] is True
```

### Database

```python
# tests/integration/test_database.py
import pytest
from sqlalchemy import select
from app.models.product import Product

@pytest.mark.asyncio
async def test_database_crud(db_session):
    """Test CRUD en database."""

    # Create
    product = Product(
        name="Test Product",
        sku="TEST-001",
        base_price=19.99,
        organization_id="org-uuid"
    )
    db_session.add(product)
    await db_session.commit()

    # Read
    result = await db_session.execute(
        select(Product).where(Product.sku == "TEST-001")
    )
    found = result.scalar_one()

    assert found.name == "Test Product"

    # Update
    found.base_price = 29.99
    await db_session.commit()

    # Delete
    await db_session.delete(found)
    await db_session.commit()

    # Verify deleted
    result = await db_session.execute(
        select(Product).where(Product.sku == "TEST-001")
    )
    assert result.scalar_one_or_none() is None
```

## Tests E2E

```python
# tests/e2e/test_flows.py
import pytest

@pytest.mark.asyncio
async def test_complete_product_flow(client):
    """Test flujo completo de producto."""

    # 1. Crear producto
    create_response = await client.post("/api/v1/products", json={
        "name": "E2E Product",
        "sku": "E2E-001",
        "base_price": 99.99,
        "organization_id": "org-uuid"
    })

    assert create_response.status_code == 201
    product_id = create_response.json()["id"]

    # 2. Obtener producto
    get_response = await client.get(f"/api/v1/products/{product_id}")

    assert get_response.status_code == 200
    assert get_response.json()["sku"] == "E2E-001"

    # 3. Actualizar producto
    update_response = await client.patch(
        f"/api/v1/products/{product_id}",
        json={"base_price": 149.99}
    )

    assert update_response.status_code == 200
    assert update_response.json()["base_price"] == 149.99

    # 4. Eliminar producto
    delete_response = await client.delete(f"/api/v1/products/{product_id}")

    assert delete_response.status_code == 204

    # 5. Verificar eliminado
    get_deleted = await client.get(f"/api/v1/products/{product_id}")
    assert get_deleted.status_code == 404
```

## Factories

```python
# tests/factories.py
import factory
from app.models import Product, Organization

class OrganizationFactory(factory.Factory):
    class Meta:
        model = Organization

    name = factory.Faker("company")
    is_active = True

class ProductFactory(factory.Factory):
    class Meta:
        model = Product

    name = factory.Faker("word")
    sku = factory.Sequence(lambda n: f"SKU-{n:05d}")
    base_price = factory.Faker("pydecimal", left_digits=3, right_digits=2, positive=True)
    organization = factory.SubFactory(OrganizationFactory)

# Uso en tests
@pytest.mark.asyncio
async def test_with_factory(db_session):
    product = ProductFactory.build()
    db_session.add(product)
    await db_session.commit()
```

## Coverage

```bash
# Ejecutar con coverage
pytest --cov=app --cov-report=html --cov-report=term

# Ver reporte HTML
open htmlcov/index.html

# Target: 80%+ coverage
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_db
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Run tests
        run: |
          pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Próximos Pasos

- [Deployment](/guias/deployment)
- [Troubleshooting](/guias/troubleshooting)
