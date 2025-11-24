---
sidebar_position: 2
---

# Arquitectura

Arquitectura técnica completa del Inventory Service con diagramas de componentes, patrones y decisiones de diseño.

## Arquitectura General

```mermaid
graph TB
    subgraph "API Layer"
        REST[REST API<br/>FastAPI<br/>Port 8003]
        GRPC[gRPC Server<br/>Port 50053]
    end

    subgraph "Application Layer"
        STOCK_SVC[Stock Service]
        MOVEMENT_SVC[Movement Service]
        TRANSFER_SVC[Transfer Service]
        ADJUSTMENT_SVC[Adjustment Service]
        RESERVATION_SVC[Reservation Service]
    end

    subgraph "Domain Layer"
        STOCK_MODEL[Stock Model]
        MOVEMENT_MODEL[Movement Model]
        TRANSFER_MODEL[Transfer Model]
        WAREHOUSE_MODEL[Warehouse Model]
        LOCATION_MODEL[Location Model]
    end

    subgraph "Infrastructure Layer"
        DB[(PostgreSQL<br/>Database)]
        CACHE[(Redis<br/>Cache)]
        MQ[RabbitMQ<br/>Message Broker]
        GRPC_CLIENTS[gRPC Clients<br/>Catalog/Order]
    end

    REST --> STOCK_SVC
    REST --> MOVEMENT_SVC
    REST --> TRANSFER_SVC
    REST --> ADJUSTMENT_SVC
    GRPC --> STOCK_SVC
    GRPC --> RESERVATION_SVC

    STOCK_SVC --> STOCK_MODEL
    MOVEMENT_SVC --> MOVEMENT_MODEL
    TRANSFER_SVC --> TRANSFER_MODEL

    STOCK_MODEL --> DB
    STOCK_SVC --> CACHE
    STOCK_SVC --> MQ
    STOCK_SVC --> GRPC_CLIENTS
```

---

## Componentes Principales

### 1. API Layer

#### REST API (FastAPI)

**Puerto:** `8003`

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI(
    title="Inventory Service API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routers
app.include_router(stock_router, prefix="/api/v1/stock", tags=["Stock"])
app.include_router(movement_router, prefix="/api/v1/movements", tags=["Movements"])
app.include_router(warehouse_router, prefix="/api/v1/warehouses", tags=["Warehouses"])
app.include_router(transfer_router, prefix="/api/v1/transfers", tags=["Transfers"])
app.include_router(adjustment_router, prefix="/api/v1/adjustments", tags=["Adjustments"])
app.include_router(location_router, prefix="/api/v1/locations", tags=["Locations"])
```

**Rutas Principales:**

| Prefijo | Descripción | Endpoints |
|---------|-------------|-----------|
| `/api/v1/stock` | Gestión de stock | 7 endpoints |
| `/api/v1/movements` | Movimientos de inventario | 8 endpoints |
| `/api/v1/warehouses` | Administración de bodegas | 7 endpoints |
| `/api/v1/transfers` | Transferencias entre bodegas | 7 endpoints |
| `/api/v1/adjustments` | Ajustes de inventario | 6 endpoints |
| `/api/v1/locations` | Ubicaciones físicas | 5 endpoints |

#### gRPC Server

**Puerto:** `50053`

```protobuf
// inventory.proto
syntax = "proto3";

package inventory;

service InventoryService {
  // Stock operations
  rpc CheckAvailability(AvailabilityRequest) returns (AvailabilityResponse);
  rpc ReserveStock(ReserveStockRequest) returns (ReserveStockResponse);
  rpc ReleaseReservation(ReleaseRequest) returns (ReleaseResponse);
  rpc ConfirmReservation(ConfirmRequest) returns (ConfirmResponse);

  // Warehouse operations
  rpc GetWarehouseStock(WarehouseRequest) returns (WarehouseStockResponse);

  // Movement operations
  rpc GetStockHistory(HistoryRequest) returns (HistoryResponse);
}
```

**Implementación:**

```python
# grpc_server.py
from concurrent import futures
import grpc
from proto import inventory_pb2_grpc

class InventoryServicer(inventory_pb2_grpc.InventoryServiceServicer):
    def __init__(self, stock_service, reservation_service):
        self.stock_service = stock_service
        self.reservation_service = reservation_service

    async def CheckAvailability(self, request, context):
        # Implementation
        pass

    async def ReserveStock(self, request, context):
        # Implementation
        pass

async def serve():
    server = grpc.aio.server(
        futures.ThreadPoolExecutor(max_workers=10)
    )

    inventory_pb2_grpc.add_InventoryServiceServicer_to_server(
        InventoryServicer(stock_service, reservation_service),
        server
    )

    server.add_insecure_port('[::]:50053')
    await server.start()
    await server.wait_for_termination()
```

---

### 2. Application Layer

#### Stock Service

**Responsabilidades:**

- Gestión de niveles de stock
- Validaciones de disponibilidad
- Alertas de stock bajo
- Sincronización con cache

```python
# services/stock_service.py
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

class StockService:
    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis

    async def get_stock(
        self,
        variant_id: str,
        warehouse_id: str,
        organization_id: str
    ) -> Optional[Stock]:
        """Get stock with cache fallback."""
        # Try cache first
        cache_key = f"stock:{variant_id}:{warehouse_id}"
        cached = await self.redis.get(cache_key)

        if cached:
            return Stock.parse_raw(cached)

        # Query database
        stock = await self.db.execute(
            select(Stock).where(
                Stock.variant_id == variant_id,
                Stock.warehouse_id == warehouse_id,
                Stock.organization_id == organization_id
            )
        )

        result = stock.scalar_one_or_none()

        if result:
            # Cache for 1 minute
            await self.redis.setex(
                cache_key,
                60,
                result.json()
            )

        return result

    async def check_availability(
        self,
        variant_id: str,
        quantity: int,
        organization_id: str,
        preferred_warehouse_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Check if sufficient stock is available."""
        if preferred_warehouse_id:
            stock = await self.get_stock(
                variant_id,
                preferred_warehouse_id,
                organization_id
            )

            if stock and stock.available_quantity >= quantity:
                return {
                    'available': True,
                    'warehouse_id': preferred_warehouse_id,
                    'available_quantity': stock.available_quantity
                }

        # Find warehouse with most available stock
        stocks = await self.db.execute(
            select(Stock)
            .where(
                Stock.variant_id == variant_id,
                Stock.organization_id == organization_id,
                Stock.available_quantity >= quantity
            )
            .order_by(Stock.available_quantity.desc())
        )

        best_stock = stocks.scalars().first()

        if best_stock:
            return {
                'available': True,
                'warehouse_id': best_stock.warehouse_id,
                'available_quantity': best_stock.available_quantity
            }

        return {'available': False}

    async def update_stock_quantities(
        self,
        stock_id: str,
        quantity_change: int,
        movement_type: str,
        expected_version: Optional[int] = None
    ) -> Stock:
        """Update stock with optimistic locking."""
        query = (
            update(Stock)
            .where(Stock.stock_id == stock_id)
            .values(
                total_quantity=Stock.total_quantity + quantity_change,
                version=Stock.version + 1,
                updated_at=datetime.utcnow()
            )
            .returning(Stock)
        )

        if expected_version is not None:
            query = query.where(Stock.version == expected_version)

        result = await self.db.execute(query)
        stock = result.scalar_one_or_none()

        if not stock:
            raise ConcurrentModificationError(
                f"Stock {stock_id} was modified"
            )

        # Invalidate cache
        await self.invalidate_stock_cache(stock)

        # Check for low stock
        await self.check_low_stock_alert(stock)

        return stock

    async def check_low_stock_alert(self, stock: Stock) -> None:
        """Check and publish low stock alerts."""
        if stock.available_quantity <= stock.min_stock:
            alert_level = 'critical' if stock.available_quantity == 0 else 'warning'

            await event_publisher.publish('inventory.stock.low_level', {
                'stock_id': stock.stock_id,
                'variant_id': stock.variant_id,
                'warehouse_id': stock.warehouse_id,
                'available_quantity': stock.available_quantity,
                'min_stock': stock.min_stock,
                'alert_level': alert_level
            })
```

#### Reservation Service

**Responsabilidades:**

- Crear/liberar reservas
- Gestión de TTL automático
- Confirmación de reservas

```python
# services/reservation_service.py
from datetime import datetime, timedelta

class ReservationService:
    def __init__(self, db: AsyncSession, scheduler: Scheduler):
        self.db = db
        self.scheduler = scheduler

    async def create_reservation(
        self,
        order_id: str,
        organization_id: str,
        items: List[Dict[str, Any]],
        ttl_minutes: int = 15
    ) -> Reservation:
        """Create stock reservation with auto-expiry."""
        reservation_id = generate_uuid()
        expires_at = datetime.utcnow() + timedelta(minutes=ttl_minutes)

        # Validate all items have stock
        for item in items:
            stock = await stock_service.get_stock(
                variant_id=item['variant_id'],
                warehouse_id=item['warehouse_id'],
                organization_id=organization_id
            )

            if not stock or stock.available_quantity < item['quantity']:
                raise InsufficientStockError(
                    f"Insufficient stock for {item['variant_id']}"
                )

        # Create reservation
        reservation = Reservation(
            reservation_id=reservation_id,
            order_id=order_id,
            organization_id=organization_id,
            items=items,
            status='active',
            expires_at=expires_at
        )

        self.db.add(reservation)

        # Update stock quantities (available -> reserved)
        for item in items:
            await stock_service.reserve_quantity(
                variant_id=item['variant_id'],
                warehouse_id=item['warehouse_id'],
                quantity=item['quantity']
            )

        await self.db.commit()

        # Schedule auto-release
        await self.scheduler.schedule_task(
            task='release_expired_reservation',
            execute_at=expires_at,
            args={'reservation_id': reservation_id}
        )

        return reservation

    async def release_reservation(
        self,
        reservation_id: str,
        reason: str = 'manual_release'
    ) -> None:
        """Release reserved stock."""
        reservation = await self.get_reservation(reservation_id)

        if reservation.status != 'active':
            raise InvalidReservationStateError(
                f"Cannot release reservation with status {reservation.status}"
            )

        # Update stock (reserved -> available)
        for item in reservation.items:
            await stock_service.release_quantity(
                variant_id=item['variant_id'],
                warehouse_id=item['warehouse_id'],
                quantity=item['quantity']
            )

        # Update reservation status
        reservation.status = 'released'
        reservation.released_at = datetime.utcnow()
        reservation.release_reason = reason

        await self.db.commit()

        # Cancel scheduled auto-release
        await self.scheduler.cancel_task(
            task='release_expired_reservation',
            args={'reservation_id': reservation_id}
        )

        # Publish event
        await event_publisher.publish('inventory.stock.released', {
            'reservation_id': reservation_id,
            'order_id': reservation.order_id,
            'reason': reason
        })
```

---

### 3. Domain Layer

#### Modelos de Dominio

```python
# models/stock.py
from sqlalchemy import Column, String, Integer, DECIMAL, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

class Stock(Base):
    __tablename__ = 'stock'

    stock_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), nullable=False)
    variant_id = Column(UUID(as_uuid=True), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), nullable=False)

    # Quantities
    total_quantity = Column(Integer, nullable=False, default=0)
    available_quantity = Column(Integer, nullable=False, default=0)
    reserved_quantity = Column(Integer, nullable=False, default=0)
    damaged_quantity = Column(Integer, nullable=False, default=0)
    in_transit_quantity = Column(Integer, nullable=False, default=0)

    # Thresholds
    min_stock = Column(Integer, nullable=False, default=0)
    max_stock = Column(Integer, nullable=False, default=999999)
    reorder_point = Column(Integer, nullable=False, default=0)

    # Configuration
    stock_strategy = Column(String(10), nullable=False, default='FIFO')
    track_lots = Column(Boolean, default=False)
    track_serial_numbers = Column(Boolean, default=False)

    # Metadata
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_stock_variant_warehouse', 'variant_id', 'warehouse_id'),
        Index('idx_stock_organization', 'organization_id'),
        Index('idx_stock_low_level', 'available_quantity', 'min_stock'),
        # Constraint
        CheckConstraint(
            'total_quantity = available_quantity + reserved_quantity + damaged_quantity + in_transit_quantity',
            name='check_stock_quantities'
        ),
        # Unique constraint
        UniqueConstraint('variant_id', 'warehouse_id', 'organization_id', name='uq_stock_variant_warehouse'),
    )

    @property
    def is_low_stock(self) -> bool:
        """Check if stock is below minimum."""
        return self.available_quantity <= self.min_stock

    @property
    def needs_reorder(self) -> bool:
        """Check if stock reached reorder point."""
        return self.available_quantity <= self.reorder_point

    @property
    def utilization_percentage(self) -> float:
        """Calculate stock utilization."""
        if self.max_stock == 0:
            return 0.0
        return (self.total_quantity / self.max_stock) * 100
```

---

### 4. Infrastructure Layer

#### Database (PostgreSQL)

**Configuración:**

```python
# database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://user:pass@localhost:5432/inventory_db"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

**Row-Level Security:**

```sql
-- Enable RLS on all tables
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movement ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer ENABLE ROW LEVEL SECURITY;

-- Create policy for organization isolation
CREATE POLICY stock_organization_isolation ON stock
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY movement_organization_isolation ON stock_movement
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- Set organization_id for each request
SET app.current_organization_id = 'org_123';
```

#### Cache (Redis)

**Estrategia de Cache:**

```python
# cache/redis_client.py
import redis.asyncio as redis
from typing import Optional, Any
import json

class RedisCache:
    def __init__(self, url: str):
        self.client = redis.from_url(
            url,
            decode_responses=True,
            encoding='utf-8'
        )

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        value = await self.client.get(key)
        if value:
            return json.loads(value)
        return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int = 60
    ) -> None:
        """Set value in cache with TTL."""
        await self.client.setex(
            key,
            ttl,
            json.dumps(value, default=str)
        )

    async def delete(self, key: str) -> None:
        """Delete key from cache."""
        await self.client.delete(key)

    async def delete_pattern(self, pattern: str) -> None:
        """Delete all keys matching pattern."""
        keys = await self.client.keys(pattern)
        if keys:
            await self.client.delete(*keys)

# Cache keys
CACHE_KEYS = {
    'stock': 'stock:{variant_id}:{warehouse_id}',
    'warehouse': 'warehouse:{warehouse_id}',
    'variant': 'variant:{variant_id}',
    'stock_by_variant': 'stock:variant:{variant_id}',
}

# TTL configuration
CACHE_TTL = {
    'stock': 60,          # 1 minute
    'warehouse': 3600,    # 1 hour
    'variant': 1800,      # 30 minutes
}
```

#### Message Broker (RabbitMQ)

**Publisher:**

```python
# events/publisher.py
import aio_pika
from typing import Dict, Any
import json

class EventPublisher:
    def __init__(self, rabbitmq_url: str):
        self.url = rabbitmq_url
        self.connection = None
        self.channel = None

    async def connect(self):
        """Establish connection to RabbitMQ."""
        self.connection = await aio_pika.connect_robust(self.url)
        self.channel = await self.connection.channel()

        # Declare exchange
        self.exchange = await self.channel.declare_exchange(
            'inventory_events',
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

    async def publish(
        self,
        event_type: str,
        data: Dict[str, Any],
        organization_id: str
    ) -> None:
        """Publish event to RabbitMQ."""
        event = {
            'event': event_type,
            'version': '1.0',
            'timestamp': datetime.utcnow().isoformat(),
            'organization_id': organization_id,
            'event_id': str(uuid.uuid4()),
            'data': data
        }

        message = aio_pika.Message(
            body=json.dumps(event).encode(),
            content_type='application/json',
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT
        )

        await self.exchange.publish(
            message,
            routing_key=event_type
        )

        logger.info(f"Published event: {event_type}")

    async def close(self):
        """Close connection."""
        if self.connection:
            await self.connection.close()
```

**Consumer:**

```python
# events/consumer.py
class EventConsumer:
    def __init__(self, rabbitmq_url: str):
        self.url = rabbitmq_url
        self.handlers = {}

    def register_handler(self, event_type: str, handler):
        """Register event handler."""
        self.handlers[event_type] = handler

    async def start(self):
        """Start consuming events."""
        connection = await aio_pika.connect_robust(self.url)
        channel = await connection.channel()

        await channel.set_qos(prefetch_count=10)

        # Declare queue
        queue = await channel.declare_queue(
            'inventory_catalog_consumer',
            durable=True
        )

        # Bind to routing keys
        exchange = await channel.declare_exchange(
            'catalog_events',
            aio_pika.ExchangeType.TOPIC
        )

        await queue.bind(exchange, 'catalog.variant.created')
        await queue.bind(exchange, 'catalog.variant.deleted')

        # Start consuming
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    event = json.loads(message.body)
                    event_type = event['event']

                    if event_type in self.handlers:
                        try:
                            await self.handlers[event_type](event)
                        except Exception as e:
                            logger.error(f"Error handling {event_type}: {e}")
```

---

## Patrones de Diseño

### 1. Repository Pattern

```python
# repositories/stock_repository.py
from typing import List, Optional
from sqlalchemy import select

class StockRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, stock_id: str) -> Optional[Stock]:
        result = await self.db.execute(
            select(Stock).where(Stock.stock_id == stock_id)
        )
        return result.scalar_one_or_none()

    async def get_by_variant_warehouse(
        self,
        variant_id: str,
        warehouse_id: str,
        organization_id: str
    ) -> Optional[Stock]:
        result = await self.db.execute(
            select(Stock).where(
                Stock.variant_id == variant_id,
                Stock.warehouse_id == warehouse_id,
                Stock.organization_id == organization_id
            )
        )
        return result.scalar_one_or_none()

    async def get_low_stock_items(
        self,
        organization_id: str,
        warehouse_id: Optional[str] = None
    ) -> List[Stock]:
        query = select(Stock).where(
            Stock.organization_id == organization_id,
            Stock.available_quantity <= Stock.min_stock
        )

        if warehouse_id:
            query = query.where(Stock.warehouse_id == warehouse_id)

        result = await self.db.execute(query)
        return result.scalars().all()
```

### 2. Unit of Work Pattern

```python
# Unit of Work implementation
class UnitOfWork:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.stock_repo = StockRepository(db)
        self.movement_repo = MovementRepository(db)
        self.transfer_repo = TransferRepository(db)

    async def commit(self):
        await self.db.commit()

    async def rollback(self):
        await self.db.rollback()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.rollback()
        await self.db.close()
```

### 3. Saga Pattern (Distributed Transactions)

```python
# saga/transfer_saga.py
class TransferSaga:
    """Saga for warehouse transfer with compensating actions."""

    def __init__(self, uow: UnitOfWork):
        self.uow = uow
        self.completed_steps = []

    async def execute_transfer(self, transfer_id: str):
        try:
            # Step 1: Reserve stock in origin
            await self.reserve_stock_origin(transfer_id)
            self.completed_steps.append('reserve')

            # Step 2: Update transfer status
            await self.mark_in_transit(transfer_id)
            self.completed_steps.append('in_transit')

            # Step 3: Receive in destination
            await self.receive_stock_destination(transfer_id)
            self.completed_steps.append('receive')

            # Step 4: Commit
            await self.uow.commit()

        except Exception as e:
            await self.compensate(transfer_id)
            raise

    async def compensate(self, transfer_id: str):
        """Rollback completed steps in reverse order."""
        for step in reversed(self.completed_steps):
            if step == 'reserve':
                await self.release_reservation(transfer_id)
            elif step == 'in_transit':
                await self.cancel_transfer(transfer_id)
            # Add more compensating actions
```

---

## Próximos Pasos

- [Modelo de Datos](./modelo-datos)
- [API: Stock](./api-stock)
- [Eventos Publicados](./eventos-publicados)
