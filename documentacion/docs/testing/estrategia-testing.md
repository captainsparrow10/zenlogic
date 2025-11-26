---
sidebar_position: 1
---

# Estrategia de Testing

Estrategia completa de testing para la arquitectura de microservicios del ERP.

## Pirámide de Testing

```mermaid
graph TB
    subgraph "E2E Tests"
        E2E[5-10% de tests<br/>Flujos completos]
    end

    subgraph "Integration Tests"
        INT[20-30% de tests<br/>Servicios + BD + Queue]
    end

    subgraph "Unit Tests"
        UNIT[60-70% de tests<br/>Lógica de negocio aislada]
    end

    UNIT --> INT
    INT --> E2E

    style UNIT fill:#90EE90
    style INT fill:#FFD700
    style E2E fill:#FF6B6B
```

## Niveles de Testing

### 1. Unit Tests (60-70%)

Pruebas de componentes aislados: funciones, clases, métodos.

#### Herramientas
- **Framework**: `pytest`
- **Mocking**: `pytest-mock`, `unittest.mock`
- **Coverage**: `pytest-cov`
- **Fixtures**: `pytest` fixtures para setup/teardown

#### Qué Testear

**Repositories**:
```python
# tests/unit/test_product_repository.py
import pytest
from unittest.mock import Mock, AsyncMock
from repositories.product_repository import ProductRepository
from models.product import Product

@pytest.fixture
def mock_db():
    """Mock de sesión de base de datos."""
    db = Mock()
    db.execute = AsyncMock()
    db.commit = AsyncMock()
    db.rollback = AsyncMock()
    return db

@pytest.fixture
def product_repo(mock_db):
    """Repository con DB mockeada."""
    return ProductRepository(mock_db)

class TestProductRepository:
    """Tests unitarios para ProductRepository."""

    async def test_create_product_success(self, product_repo, mock_db):
        """Debe crear producto correctamente."""
        # Arrange
        product_data = {
            "name": "Test Product",
            "sku": "TEST-001",
            "organization_id": "org-123"
        }

        # Act
        result = await product_repo.create(product_data)

        # Assert
        assert result is not None
        mock_db.execute.assert_called_once()
        mock_db.commit.assert_called_once()

    async def test_create_product_duplicate_sku(self, product_repo, mock_db):
        """Debe fallar al crear producto con SKU duplicado."""
        from sqlalchemy.exc import IntegrityError

        # Arrange
        mock_db.commit.side_effect = IntegrityError(
            "duplicate key", {}, None
        )

        # Act & Assert
        with pytest.raises(IntegrityError):
            await product_repo.create({"sku": "DUPLICATE"})

        mock_db.rollback.assert_called_once()

    async def test_get_by_id_not_found(self, product_repo, mock_db):
        """Debe retornar None si producto no existe."""
        # Arrange
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        # Act
        result = await product_repo.get_by_id("nonexistent-id")

        # Assert
        assert result is None
```

**Services (Business Logic)**:
```python
# tests/unit/test_pricing_service.py
import pytest
from services.pricing_service import PricingService
from models.product import Product, PriceRule

@pytest.fixture
def pricing_service():
    return PricingService()

class TestPricingService:
    """Tests de lógica de precios."""

    def test_calculate_price_no_rules(self, pricing_service):
        """Precio base sin reglas de descuento."""
        product = Product(base_price=100.0)

        price = pricing_service.calculate_price(
            product=product,
            quantity=1,
            customer_tier=None
        )

        assert price == 100.0

    def test_calculate_price_with_volume_discount(self, pricing_service):
        """Descuento por volumen."""
        product = Product(
            base_price=100.0,
            price_rules=[
                PriceRule(
                    rule_type="volume_discount",
                    min_quantity=10,
                    discount_percentage=15.0
                )
            ]
        )

        # Sin descuento (qty < 10)
        price = pricing_service.calculate_price(product, quantity=5)
        assert price == 100.0

        # Con descuento (qty >= 10)
        price = pricing_service.calculate_price(product, quantity=10)
        assert price == 85.0  # 15% off

    def test_calculate_price_with_tier_discount(self, pricing_service):
        """Descuento por tier de cliente."""
        product = Product(
            base_price=100.0,
            price_rules=[
                PriceRule(
                    rule_type="customer_tier",
                    customer_tier="premium",
                    discount_percentage=20.0
                )
            ]
        )

        # Cliente regular
        price = pricing_service.calculate_price(
            product, quantity=1, customer_tier="regular"
        )
        assert price == 100.0

        # Cliente premium
        price = pricing_service.calculate_price(
            product, quantity=1, customer_tier="premium"
        )
        assert price == 80.0  # 20% off

    def test_calculate_price_stacks_discounts(self, pricing_service):
        """Descuentos se acumulan correctamente."""
        product = Product(
            base_price=100.0,
            price_rules=[
                PriceRule(
                    rule_type="volume_discount",
                    min_quantity=10,
                    discount_percentage=10.0
                ),
                PriceRule(
                    rule_type="customer_tier",
                    customer_tier="premium",
                    discount_percentage=15.0
                )
            ]
        )

        price = pricing_service.calculate_price(
            product, quantity=10, customer_tier="premium"
        )

        # 10% volume + 15% tier = 23.5% total
        # 100 - 10 = 90, 90 - 13.5 = 76.5
        assert price == 76.5
```

**Validators**:
```python
# tests/unit/test_stock_validator.py
import pytest
from validators.stock_validator import StockValidator
from exceptions import InsufficientStockError

class TestStockValidator:
    """Tests de validación de stock."""

    def test_validate_availability_sufficient_stock(self):
        """Stock disponible suficiente."""
        validator = StockValidator()

        # No debe lanzar excepción
        validator.validate_availability(
            available_quantity=100,
            requested_quantity=50
        )

    def test_validate_availability_insufficient_stock(self):
        """Stock insuficiente debe fallar."""
        validator = StockValidator()

        with pytest.raises(InsufficientStockError) as exc_info:
            validator.validate_availability(
                available_quantity=10,
                requested_quantity=50
            )

        assert "Insufficient stock" in str(exc_info.value)
        assert exc_info.value.available == 10
        assert exc_info.value.requested == 50

    def test_validate_reservation_ttl_not_expired(self):
        """Reserva no expirada."""
        from datetime import datetime, timedelta

        validator = StockValidator()

        expires_at = datetime.utcnow() + timedelta(minutes=10)

        # No debe lanzar excepción
        validator.validate_reservation_ttl(expires_at)

    def test_validate_reservation_ttl_expired(self):
        """Reserva expirada debe fallar."""
        from datetime import datetime, timedelta
        from exceptions import ReservationExpiredError

        validator = StockValidator()

        expires_at = datetime.utcnow() - timedelta(minutes=5)

        with pytest.raises(ReservationExpiredError):
            validator.validate_reservation_ttl(expires_at)
```

#### Configuración pytest

```python
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

# Async support
asyncio_mode = auto

# Coverage
addopts =
    --cov=src
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
    -v
    --tb=short

# Markers
markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Slow running tests
```

```python
# conftest.py
import pytest
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Mock database session for unit tests."""
    from unittest.mock import AsyncMock

    session = AsyncMock(spec=AsyncSession)
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()

    yield session

    await session.close()
```

### 2. Integration Tests (20-30%)

Pruebas de integración entre componentes: BD, Redis, RabbitMQ, APIs externas.

#### Herramientas
- **Framework**: `pytest`
- **Test Containers**: `testcontainers-python`
- **HTTP Client**: `httpx` (async)
- **Database**: PostgreSQL real (via testcontainers)
- **Redis**: Redis real (via testcontainers)
- **RabbitMQ**: RabbitMQ real (via testcontainers)

#### Setup con Testcontainers

```python
# tests/integration/conftest.py
import pytest
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer
from testcontainers.rabbitmq import RabbitMqContainer
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

@pytest.fixture(scope="session")
def postgres_container():
    """PostgreSQL container para tests."""
    with PostgresContainer("postgres:15-alpine") as postgres:
        yield postgres

@pytest.fixture(scope="session")
def redis_container():
    """Redis container para tests."""
    with RedisContainer("redis:7-alpine") as redis:
        yield redis

@pytest.fixture(scope="session")
def rabbitmq_container():
    """RabbitMQ container para tests."""
    with RabbitMqContainer("rabbitmq:3-management-alpine") as rabbitmq:
        yield rabbitmq

@pytest.fixture(scope="session")
async def engine(postgres_container):
    """Database engine conectado a testcontainer."""
    connection_url = postgres_container.get_connection_url().replace(
        "psycopg2", "asyncpg"
    )

    engine = create_async_engine(connection_url, echo=True)

    # Crear tablas
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()

@pytest.fixture
async def db_session(engine):
    """Session de base de datos para cada test."""
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def redis_client(redis_container):
    """Redis client conectado a testcontainer."""
    import redis.asyncio as redis

    client = redis.from_url(
        f"redis://{redis_container.get_container_host_ip()}:"
        f"{redis_container.get_exposed_port(6379)}"
    )

    yield client

    await client.flushdb()
    await client.close()

@pytest.fixture
async def rabbitmq_channel(rabbitmq_container):
    """RabbitMQ channel conectado a testcontainer."""
    import aio_pika

    connection = await aio_pika.connect_robust(
        f"amqp://guest:guest@{rabbitmq_container.get_container_host_ip()}:"
        f"{rabbitmq_container.get_exposed_port(5672)}/"
    )

    channel = await connection.channel()

    yield channel

    await channel.close()
    await connection.close()
```

#### Test de Repository con BD Real

```python
# tests/integration/test_product_repository_integration.py
import pytest
from repositories.product_repository import ProductRepository
from models.product import Product
from sqlalchemy.exc import IntegrityError

@pytest.mark.integration
class TestProductRepositoryIntegration:
    """Integration tests para ProductRepository con BD real."""

    async def test_create_and_retrieve_product(self, db_session):
        """Debe crear y recuperar producto de BD."""
        repo = ProductRepository(db_session)

        # Create
        product = await repo.create({
            "name": "Integration Test Product",
            "sku": "INT-001",
            "organization_id": "org-test",
            "base_price": 99.99,
            "status": "active"
        })

        assert product.product_id is not None
        assert product.name == "Integration Test Product"

        # Retrieve
        retrieved = await repo.get_by_id(product.product_id)

        assert retrieved is not None
        assert retrieved.product_id == product.product_id
        assert retrieved.sku == "INT-001"

    async def test_duplicate_sku_raises_error(self, db_session):
        """Debe fallar al crear producto con SKU duplicado."""
        repo = ProductRepository(db_session)

        # First product
        await repo.create({
            "sku": "DUPLICATE-SKU",
            "name": "Product 1",
            "organization_id": "org-test"
        })

        # Duplicate SKU should fail
        with pytest.raises(IntegrityError):
            await repo.create({
                "sku": "DUPLICATE-SKU",
                "name": "Product 2",
                "organization_id": "org-test"
            })

    async def test_update_product(self, db_session):
        """Debe actualizar producto correctamente."""
        repo = ProductRepository(db_session)

        # Create
        product = await repo.create({
            "name": "Original Name",
            "sku": "UPDATE-001",
            "organization_id": "org-test",
            "base_price": 50.0
        })

        # Update
        updated = await repo.update(
            product.product_id,
            {"name": "Updated Name", "base_price": 75.0}
        )

        assert updated.name == "Updated Name"
        assert updated.base_price == 75.0
        assert updated.sku == "UPDATE-001"  # Unchanged

    async def test_soft_delete(self, db_session):
        """Debe soft-delete producto."""
        repo = ProductRepository(db_session)

        # Create
        product = await repo.create({
            "name": "To Delete",
            "sku": "DELETE-001",
            "organization_id": "org-test"
        })

        # Soft delete
        await repo.soft_delete(product.product_id)

        # Should not appear in normal queries
        retrieved = await repo.get_by_id(product.product_id)
        assert retrieved is None

        # Should appear in query with deleted
        deleted = await repo.get_by_id(
            product.product_id,
            include_deleted=True
        )
        assert deleted is not None
        assert deleted.deleted_at is not None
```

#### Test de Cache con Redis Real

```python
# tests/integration/test_product_cache_integration.py
import pytest
from services.product_cache import ProductCache
import json

@pytest.mark.integration
class TestProductCacheIntegration:
    """Integration tests para cache con Redis real."""

    async def test_cache_set_and_get(self, redis_client):
        """Debe guardar y recuperar producto del cache."""
        cache = ProductCache(redis_client)

        product_data = {
            "product_id": "prod-123",
            "name": "Cached Product",
            "base_price": 100.0
        }

        # Set cache
        await cache.set_product("prod-123", product_data, ttl=300)

        # Get cache
        cached = await cache.get_product("prod-123")

        assert cached is not None
        assert cached["product_id"] == "prod-123"
        assert cached["name"] == "Cached Product"

    async def test_cache_expiration(self, redis_client):
        """Debe expirar cache después de TTL."""
        import asyncio
        cache = ProductCache(redis_client)

        # Set con TTL corto
        await cache.set_product(
            "prod-ttl",
            {"product_id": "prod-ttl"},
            ttl=1  # 1 segundo
        )

        # Debe existir inmediatamente
        cached = await cache.get_product("prod-ttl")
        assert cached is not None

        # Esperar expiración
        await asyncio.sleep(2)

        # Debe haber expirado
        cached = await cache.get_product("prod-ttl")
        assert cached is None

    async def test_cache_invalidation(self, redis_client):
        """Debe invalidar cache correctamente."""
        cache = ProductCache(redis_client)

        await cache.set_product("prod-inv", {"data": "test"})

        # Verificar existe
        assert await cache.get_product("prod-inv") is not None

        # Invalidar
        await cache.invalidate_product("prod-inv")

        # Debe estar vacío
        assert await cache.get_product("prod-inv") is None

    async def test_cache_pattern_invalidation(self, redis_client):
        """Debe invalidar múltiples keys por patrón."""
        cache = ProductCache(redis_client)

        # Crear múltiples entries
        await cache.set_product("org:123:prod:1", {"id": "1"})
        await cache.set_product("org:123:prod:2", {"id": "2"})
        await cache.set_product("org:456:prod:3", {"id": "3"})

        # Invalidar organización 123
        await cache.invalidate_pattern("org:123:*")

        # org:123 debe estar vacío
        assert await cache.get_product("org:123:prod:1") is None
        assert await cache.get_product("org:123:prod:2") is None

        # org:456 debe existir
        assert await cache.get_product("org:456:prod:3") is not None
```

#### Test de Event Publishing

```python
# tests/integration/test_event_publisher_integration.py
import pytest
from events.publisher import EventPublisher
from events.schemas import ProductCreatedEvent
import asyncio
import json

@pytest.mark.integration
class TestEventPublisherIntegration:
    """Integration tests para RabbitMQ event publishing."""

    async def test_publish_and_consume_event(
        self, rabbitmq_channel
    ):
        """Debe publicar evento y ser consumido."""
        import aio_pika

        # Setup exchange y queue
        exchange = await rabbitmq_channel.declare_exchange(
            "catalog.events",
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

        queue = await rabbitmq_channel.declare_queue(
            "test_queue",
            durable=True
        )

        await queue.bind(exchange, routing_key="product.created")

        # Publisher
        publisher = EventPublisher(rabbitmq_channel)

        # Event to publish
        event = ProductCreatedEvent(
            event_id="evt-123",
            product_id="prod-123",
            name="Test Product",
            sku="TEST-001",
            organization_id="org-test"
        )

        # Publish
        await publisher.publish(
            exchange="catalog.events",
            routing_key="product.created",
            event=event
        )

        # Consume
        consumed = []

        async def on_message(message: aio_pika.IncomingMessage):
            async with message.process():
                consumed.append(json.loads(message.body))

        await queue.consume(on_message)

        # Esperar consumo
        await asyncio.sleep(1)

        # Verificar
        assert len(consumed) == 1
        assert consumed[0]["event_id"] == "evt-123"
        assert consumed[0]["product_id"] == "prod-123"

    async def test_event_idempotency(self, rabbitmq_channel, db_session):
        """Eventos duplicados no deben procesarse dos veces."""
        # Este test requiere event consumer que guarda event_id
        # en audit_logs para prevenir duplicados
        pass  # TODO: implementar con audit service
```

### 3. API Tests

Pruebas de endpoints HTTP completos.

```python
# tests/integration/test_product_api.py
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.integration
class TestProductAPI:
    """Integration tests para Product API."""

    async def test_create_product_success(self, db_session):
        """POST /products debe crear producto."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/products",
                json={
                    "name": "API Test Product",
                    "sku": "API-001",
                    "base_price": 99.99,
                    "category_id": "cat-123"
                },
                headers={"X-Organization-ID": "org-test"}
            )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "API Test Product"
        assert data["sku"] == "API-001"
        assert "product_id" in data

    async def test_create_product_validation_error(self):
        """POST /products con datos inválidos debe retornar 422."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/products",
                json={
                    "name": "",  # Nombre vacío
                    "base_price": -10  # Precio negativo
                },
                headers={"X-Organization-ID": "org-test"}
            )

        assert response.status_code == 422
        assert "detail" in response.json()

    async def test_get_product_success(self, db_session):
        """GET /products/{id} debe retornar producto."""
        # Crear producto primero
        async with AsyncClient(app=app, base_url="http://test") as client:
            create_response = await client.post(
                "/api/v1/products",
                json={
                    "name": "Get Test",
                    "sku": "GET-001",
                    "base_price": 50.0
                },
                headers={"X-Organization-ID": "org-test"}
            )

            product_id = create_response.json()["product_id"]

            # Get producto
            get_response = await client.get(
                f"/api/v1/products/{product_id}",
                headers={"X-Organization-ID": "org-test"}
            )

        assert get_response.status_code == 200
        data = get_response.json()
        assert data["product_id"] == product_id
        assert data["name"] == "Get Test"

    async def test_get_product_not_found(self):
        """GET /products/{id} con ID inexistente debe retornar 404."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/products/nonexistent-id",
                headers={"X-Organization-ID": "org-test"}
            )

        assert response.status_code == 404

    async def test_list_products_pagination(self, db_session):
        """GET /products debe retornar lista paginada."""
        # Crear múltiples productos
        async with AsyncClient(app=app, base_url="http://test") as client:
            for i in range(15):
                await client.post(
                    "/api/v1/products",
                    json={
                        "name": f"Product {i}",
                        "sku": f"LIST-{i:03d}",
                        "base_price": 10.0
                    },
                    headers={"X-Organization-ID": "org-test"}
                )

            # Get página 1
            response = await client.get(
                "/api/v1/products?page=1&page_size=10",
                headers={"X-Organization-ID": "org-test"}
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["total"] >= 15
        assert data["page"] == 1
        assert data["page_size"] == 10
```

### 4. End-to-End Tests (5-10%)

Pruebas de flujos completos que involucran múltiples servicios.

#### Herramientas
- **Orchestration**: Docker Compose con servicios reales
- **API Client**: `httpx`
- **Assertions**: `pytest`

#### Setup E2E

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"

  rabbitmq-test:
    image: rabbitmq:3-management-alpine
    ports:
      - "5673:5672"
      - "15673:15672"

  catalog-service-test:
    build: ./services/catalog-service
    environment:
      DATABASE_URL: postgresql://postgres:test_password@postgres-test:5432/catalog_db
      REDIS_URL: redis://redis-test:6379/1
      RABBITMQ_URL: amqp://guest:guest@rabbitmq-test:5672/
    depends_on:
      - postgres-test
      - redis-test
      - rabbitmq-test
    ports:
      - "8002:8002"

  inventory-service-test:
    build: ./services/inventory-service
    environment:
      DATABASE_URL: postgresql://postgres:test_password@postgres-test:5432/inventory_db
      CATALOG_GRPC_HOST: catalog-service-test
      CATALOG_GRPC_PORT: 50052
    depends_on:
      - postgres-test
      - catalog-service-test
    ports:
      - "8003:8003"

  order-service-test:
    build: ./services/order-service
    environment:
      DATABASE_URL: postgresql://postgres:test_password@postgres-test:5432/order_db
      INVENTORY_GRPC_HOST: inventory-service-test
      INVENTORY_GRPC_PORT: 50053
    depends_on:
      - postgres-test
      - inventory-service-test
    ports:
      - "8004:8004"
```

#### Test E2E: Flujo de Venta Completo

```python
# tests/e2e/test_complete_sale_flow.py
import pytest
from httpx import AsyncClient
import asyncio

@pytest.mark.e2e
@pytest.mark.slow
class TestCompleteSaleFlow:
    """E2E test del flujo completo de venta."""

    async def test_complete_order_workflow(self):
        """
        Test flujo completo:
        1. Crear producto en Catalog
        2. Crear stock en Inventory
        3. Crear orden en Order Service
        4. Reservar stock
        5. Confirmar pago
        6. Despachar orden
        7. Deducir stock
        """
        catalog_url = "http://localhost:8002"
        inventory_url = "http://localhost:8003"
        order_url = "http://localhost:8004"

        org_id = "e2e-org-123"

        # 1. Crear producto
        async with AsyncClient(base_url=catalog_url) as client:
            product_response = await client.post(
                "/api/v1/products",
                json={
                    "name": "E2E Test Product",
                    "sku": "E2E-PRODUCT-001",
                    "base_price": 100.0,
                    "category_id": "cat-electronics"
                },
                headers={"X-Organization-ID": org_id}
            )
            assert product_response.status_code == 201
            product = product_response.json()
            product_id = product["product_id"]

            # Crear variant
            variant_response = await client.post(
                f"/api/v1/products/{product_id}/variants",
                json={
                    "sku": "E2E-VAR-001",
                    "name": "Default Variant",
                    "price": 100.0
                },
                headers={"X-Organization-ID": org_id}
            )
            assert variant_response.status_code == 201
            variant = variant_response.json()
            variant_id = variant["variant_id"]

        # 2. Crear stock en Inventory
        async with AsyncClient(base_url=inventory_url) as client:
            stock_response = await client.post(
                "/api/v1/stock",
                json={
                    "variant_id": variant_id,
                    "warehouse_id": "wh-main",
                    "total_quantity": 100,
                    "available_quantity": 100,
                    "reserved_quantity": 0
                },
                headers={"X-Organization-ID": org_id}
            )
            assert stock_response.status_code == 201
            stock = stock_response.json()

        # Esperar propagación de eventos
        await asyncio.sleep(2)

        # 3. Crear orden
        async with AsyncClient(base_url=order_url) as client:
            order_response = await client.post(
                "/api/v1/orders",
                json={
                    "customer_id": "cust-123",
                    "items": [
                        {
                            "variant_id": variant_id,
                            "quantity": 2,
                            "unit_price": 100.0
                        }
                    ],
                    "shipping_address": {
                        "street": "123 Test St",
                        "city": "Test City",
                        "country": "US"
                    }
                },
                headers={"X-Organization-ID": org_id}
            )
            assert order_response.status_code == 201
            order = order_response.json()
            order_id = order["order_id"]

            assert order["status"] == "pending"
            assert order["total_amount"] == 200.0

        # Esperar reserva de stock (evento asíncrono)
        await asyncio.sleep(2)

        # 4. Verificar stock reservado
        async with AsyncClient(base_url=inventory_url) as client:
            stock_response = await client.get(
                f"/api/v1/stock?variant_id={variant_id}",
                headers={"X-Organization-ID": org_id}
            )
            assert stock_response.status_code == 200
            updated_stock = stock_response.json()["items"][0]

            assert updated_stock["reserved_quantity"] == 2
            assert updated_stock["available_quantity"] == 98

        # 5. Simular confirmación de pago
        async with AsyncClient(base_url=order_url) as client:
            payment_response = await client.post(
                f"/api/v1/orders/{order_id}/payments",
                json={
                    "payment_method": "stripe",
                    "amount": 200.0,
                    "gateway_payment_id": "py_test_12345"
                },
                headers={"X-Organization-ID": org_id}
            )
            assert payment_response.status_code == 201

        await asyncio.sleep(1)

        # 6. Verificar orden confirmada
        async with AsyncClient(base_url=order_url) as client:
            order_get = await client.get(
                f"/api/v1/orders/{order_id}",
                headers={"X-Organization-ID": org_id}
            )
            updated_order = order_get.json()
            assert updated_order["status"] == "confirmed"

        # 7. Despachar orden
        async with AsyncClient(base_url=order_url) as client:
            ship_response = await client.post(
                f"/api/v1/orders/{order_id}/ship",
                json={
                    "tracking_number": "TRACK-E2E-001",
                    "carrier": "UPS"
                },
                headers={"X-Organization-ID": org_id}
            )
            assert ship_response.status_code == 200

        await asyncio.sleep(2)

        # 8. Verificar stock deducido
        async with AsyncClient(base_url=inventory_url) as client:
            stock_response = await client.get(
                f"/api/v1/stock?variant_id={variant_id}",
                headers={"X-Organization-ID": org_id}
            )
            final_stock = stock_response.json()["items"][0]

            # Stock total y reservado deben haber disminuido
            assert final_stock["total_quantity"] == 98
            assert final_stock["reserved_quantity"] == 0
            assert final_stock["available_quantity"] == 98

        # 9. Verificar movement creado
        async with AsyncClient(base_url=inventory_url) as client:
            movements_response = await client.get(
                f"/api/v1/movements?reference_id={order_id}",
                headers={"X-Organization-ID": org_id}
            )
            movements = movements_response.json()["items"]

            # Debe haber un movement de tipo "out"
            assert len(movements) > 0
            sale_movement = next(
                m for m in movements if m["type"] == "out"
            )
            assert sale_movement["reason"] == "sale"
            assert sale_movement["quantity"] == 2
```

#### Test E2E: Flujo de Devolución

```python
# tests/e2e/test_return_flow.py
@pytest.mark.e2e
@pytest.mark.slow
class TestReturnFlow:
    """E2E test del flujo de devolución."""

    async def test_complete_return_workflow(self):
        """
        Test flujo de devolución:
        1. Orden completada existente
        2. Crear solicitud de devolución
        3. Aprobar devolución
        4. Recibir items
        5. Re-stock inventory
        6. Procesar reembolso
        """
        order_url = "http://localhost:8004"
        inventory_url = "http://localhost:8003"
        org_id = "e2e-org-return"

        # Prerequisito: orden completada
        order_id = await self._create_completed_order(org_id)
        variant_id = "var-return-001"

        # 1. Crear return request
        async with AsyncClient(base_url=order_url) as client:
            return_response = await client.post(
                "/api/v1/returns",
                json={
                    "order_id": order_id,
                    "items": [
                        {
                            "variant_id": variant_id,
                            "quantity": 1,
                            "reason": "defective"
                        }
                    ]
                },
                headers={"X-Organization-ID": org_id}
            )
            assert return_response.status_code == 201
            return_obj = return_response.json()
            return_id = return_obj["return_id"]
            rma_number = return_obj["rma_number"]

            assert return_obj["status"] == "pending"

        # 2. Aprobar return
        async with AsyncClient(base_url=order_url) as client:
            approve_response = await client.post(
                f"/api/v1/returns/{return_id}/approve",
                headers={"X-Organization-ID": org_id}
            )
            assert approve_response.status_code == 200

        # 3. Recibir items
        async with AsyncClient(base_url=order_url) as client:
            receive_response = await client.post(
                f"/api/v1/returns/{return_id}/receive",
                json={
                    "items": [
                        {
                            "variant_id": variant_id,
                            "quantity": 1,
                            "condition": "good"
                        }
                    ]
                },
                headers={"X-Organization-ID": org_id}
            )
            assert receive_response.status_code == 200

        await asyncio.sleep(2)

        # 4. Verificar re-stock
        async with AsyncClient(base_url=inventory_url) as client:
            stock_response = await client.get(
                f"/api/v1/stock?variant_id={variant_id}",
                headers={"X-Organization-ID": org_id}
            )
            stock = stock_response.json()["items"][0]

            # Stock debe haber aumentado
            # (dependiente del stock inicial)
            assert stock["total_quantity"] > 0

        # 5. Verificar refund procesado
        async with AsyncClient(base_url=order_url) as client:
            return_get = await client.get(
                f"/api/v1/returns/{return_id}",
                headers={"X-Organization-ID": org_id}
            )
            final_return = return_get.json()

            assert final_return["status"] == "completed"
            assert final_return["refund_amount"] > 0
```

## Estrategia de Ejecución

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth, catalog, inventory, order, audit]

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd services/${{ matrix.service }}-service
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run unit tests
        run: |
          cd services/${{ matrix.service }}-service
          pytest tests/unit -v --cov --cov-report=xml -m unit

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Start test containers
        run: |
          docker-compose -f docker-compose.test.yml up -d

      - name: Run integration tests
        run: |
          pytest tests/integration -v -m integration

      - name: Cleanup
        run: docker-compose -f docker-compose.test.yml down

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    if: github.ref == 'refs/heads/main' || github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v3

      - name: Build services
        run: docker-compose -f docker-compose.test.yml build

      - name: Start all services
        run: docker-compose -f docker-compose.test.yml up -d

      - name: Wait for services
        run: ./scripts/wait-for-services.sh

      - name: Run E2E tests
        run: pytest tests/e2e -v -m e2e

      - name: Cleanup
        run: docker-compose -f docker-compose.test.yml down -v
```

### Comandos Locales

```bash
# Ejecutar solo unit tests
pytest tests/unit -v -m unit

# Ejecutar integration tests con containers
docker-compose -f docker-compose.test.yml up -d
pytest tests/integration -v -m integration
docker-compose -f docker-compose.test.yml down

# Ejecutar E2E tests
docker-compose -f docker-compose.test.yml up -d --build
pytest tests/e2e -v -m e2e
docker-compose -f docker-compose.test.yml down -v

# Coverage completo
pytest --cov=src --cov-report=html --cov-report=term

# Tests específicos
pytest tests/unit/test_pricing_service.py::TestPricingService::test_calculate_price_with_volume_discount -v
```

## Métricas de Calidad

### Cobertura Mínima

| Nivel | Cobertura Mínima |
|-------|------------------|
| Unit Tests | 80% |
| Integration Tests | 60% |
| E2E Tests | Critical paths |

### Performance Benchmarks

| Tipo de Test | Tiempo Máximo |
|--------------|---------------|
| Unit test individual | 10ms |
| Integration test | 1s |
| E2E test | 30s |
| Suite completa (CI) | 10 min |

## Próximos Pasos

- [Guía de Observabilidad](/observabilidad/guia-observabilidad) - Monitoring y logging
- [Error Handling y Retry](/resiliencia/error-handling-retry) - Manejo de errores
- [Docker Compose](/deployment/docker-compose) - Testing en contenedores
