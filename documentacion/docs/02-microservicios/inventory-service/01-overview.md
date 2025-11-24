---
sidebar_position: 1
---

# Inventory Service - Overview

Servicio de gestión de inventario multilocal con tracking de stock, movimientos, transferencias y ubicaciones físicas.

## Descripción

El **Inventory Service** es el microservicio responsable de gestionar todo el inventario físico del sistema ERP. Proporciona control en tiempo real sobre el stock disponible, movimientos de mercancía, transferencias entre bodegas, ajustes de inventario y ubicaciones físicas dentro de los almacenes.

### Responsabilidades Principales

1. **Gestión de Stock**
   - Control de stock por variante, bodega y local
   - Tracking de estados: disponible, reservado, dañado, en tránsito
   - Alertas automáticas por stock mínimo/máximo
   - Soporte para lotes (lot tracking) con fechas de vencimiento
   - Soporte para números de serie (serial tracking)

2. **Movimientos de Inventario**
   - Registro de todas las transacciones (entrada, salida, transferencia, ajuste)
   - Historial completo de movimientos con trazabilidad
   - Motivos y notas en cada movimiento
   - Integración con Order Service para reservas automáticas

3. **Bodegas y Ubicaciones**
   - CRUD de bodegas con capacidad y configuración
   - Ubicaciones físicas jerárquicas (pasillo → estante → bin)
   - Asignación de bodegas a locales específicos
   - Control de capacidad y ocupación

4. **Transferencias**
   - Transferencias entre bodegas con estados (pending, in_transit, received, cancelled)
   - Tracking de mercancía en tránsito
   - Aprobaciones y validaciones de transferencias
   - Notificaciones automáticas

5. **Ajustes de Inventario**
   - Ajustes positivos y negativos con motivos
   - Auditoría completa de ajustes
   - Conciliación de inventario físico vs sistema
   - Aprobaciones para ajustes significativos

## Características Principales

### Stock Tracking Multi-Nivel

```mermaid
graph TD
    A[Stock Total] --> B[Disponible]
    A --> C[Reservado]
    A --> D[Dañado]
    A --> E[En Tránsito]

    B --> F[Pedidos Online]
    C --> G[Orden Confirmada]
    D --> H[Para Devolución]
    E --> I[Transferencia]
```

### Estrategias de Inventario

- **FIFO** (First In, First Out) - Por defecto para productos perecederos
- **LIFO** (Last In, First Out) - Para productos no perecederos
- **FEFO** (First Expired, First Out) - Automático para productos con fecha de vencimiento
- **Serial Tracking** - Para productos individualizables (electrónicos, vehículos)

### Control de Calidad

- Estados de stock: good, damaged, expired, quarantine, returned
- Flujos de inspección y aprobación
- Registro de motivos de daños y pérdidas

## Arquitectura Técnica

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Runtime | Python | 3.11+ |
| Framework | FastAPI | 0.104+ |
| ORM | SQLAlchemy | 2.0+ |
| Database | PostgreSQL | 15+ |
| Cache | Redis | 7.2+ |
| Message Broker | RabbitMQ | 3.12+ |
| gRPC | grpcio | 1.59+ |

### Puertos

- **HTTP REST API**: `8003`
- **gRPC**: `50053`
- **Health Check**: `8003/health`
- **Metrics**: `8003/metrics`

### Variables de Entorno

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/inventory_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=40

# Redis Cache
REDIS_URL=redis://localhost:6379/2
CACHE_TTL_STOCK=60          # Stock cache: 1 minuto
CACHE_TTL_WAREHOUSE=3600    # Warehouse cache: 1 hora

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE=inventory_events
RABBITMQ_QUEUE_STOCK=inventory_stock_updates
RABBITMQ_QUEUE_MOVEMENTS=inventory_movements

# gRPC Clients
CATALOG_GRPC_HOST=localhost
CATALOG_GRPC_PORT=50051
ORDER_GRPC_HOST=localhost
ORDER_GRPC_PORT=50054

# Business Logic
MIN_STOCK_ALERT_THRESHOLD=10
LOW_STOCK_PERCENTAGE=0.2    # 20% del stock máximo
TRANSFER_AUTO_APPROVE=false
ADJUSTMENT_REQUIRE_APPROVAL=true
MAX_ADJUSTMENT_PERCENTAGE=0.1  # 10% del stock actual
```

## Integraciones

### Con Catalog Service

```mermaid
sequenceDiagram
    participant IS as Inventory Service
    participant CS as Catalog Service
    participant RMQ as RabbitMQ

    CS->>RMQ: variant.created
    RMQ->>IS: Consume event
    IS->>IS: Initialize stock record<br/>for all warehouses
    IS->>RMQ: stock.initialized

    CS->>RMQ: variant.deleted
    RMQ->>IS: Consume event
    IS->>IS: Validate stock = 0
    IS->>IS: Archive stock records
```

### Con Order Service

```mermaid
sequenceDiagram
    participant OS as Order Service
    participant IS as Inventory Service
    participant RMQ as RabbitMQ

    OS->>IS: gRPC: ReserveStock(order_id, items)
    IS->>IS: Validate availability
    IS->>IS: Create reservation
    IS->>OS: Reservation confirmed

    OS->>RMQ: order.cancelled
    RMQ->>IS: Consume event
    IS->>IS: Release reservation
    IS->>RMQ: stock.released
```

## Modelo de Datos Resumen

### Entidades Principales

1. **Stock** - Stock por variante, bodega y local
2. **StockMovement** - Historial de movimientos
3. **Warehouse** - Bodegas físicas
4. **WarehouseLocation** - Ubicaciones dentro de bodegas
5. **StockTransfer** - Transferencias entre bodegas
6. **StockAdjustment** - Ajustes de inventario

### Relaciones Clave

```mermaid
erDiagram
    STOCK ||--o{ STOCK_MOVEMENT : has
    STOCK }o--|| WAREHOUSE : stored_in
    STOCK }o--|| VARIANT : tracks
    WAREHOUSE ||--o{ WAREHOUSE_LOCATION : contains
    STOCK_TRANSFER }o--|| WAREHOUSE : from_warehouse
    STOCK_TRANSFER }o--|| WAREHOUSE : to_warehouse
    STOCK_ADJUSTMENT }o--|| STOCK : adjusts
```

## Eventos Publicados

### Stock Events

- `inventory.stock.updated` - Stock modificado
- `inventory.stock.reserved` - Stock reservado
- `inventory.stock.released` - Reserva liberada
- `inventory.stock.low_level` - Stock bajo mínimo
- `inventory.stock.depleted` - Stock agotado

### Movement Events

- `inventory.movement.created` - Movimiento registrado
- `inventory.movement.in` - Entrada de mercancía
- `inventory.movement.out` - Salida de mercancía

### Transfer Events

- `inventory.transfer.created` - Transferencia iniciada
- `inventory.transfer.approved` - Transferencia aprobada
- `inventory.transfer.in_transit` - En tránsito
- `inventory.transfer.received` - Recibida en destino
- `inventory.transfer.cancelled` - Transferencia cancelada

### Adjustment Events

- `inventory.adjustment.created` - Ajuste creado
- `inventory.adjustment.approved` - Ajuste aprobado
- `inventory.adjustment.applied` - Ajuste aplicado

## Eventos Consumidos

- `catalog.variant.created` - Inicializar stock para nueva variante
- `catalog.variant.deleted` - Archivar stock de variante eliminada
- `order.placed` - Reservar stock para orden
- `order.confirmed` - Confirmar reserva
- `order.cancelled` - Liberar stock reservado
- `order.shipped` - Descontar stock de bodega

## Casos de Uso Principales

### 1. Consulta de Stock Disponible

```http
GET /api/v1/stock?variant_id=var_123&warehouse_id=wh_1&local_id=local_456
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "variant_id": "var_123",
    "warehouse_id": "wh_1",
    "total": 100,
    "available": 85,
    "reserved": 10,
    "damaged": 3,
    "in_transit": 2,
    "min_stock": 20,
    "max_stock": 200,
    "alert_level": "normal"
  }
}
```

### 2. Registrar Entrada de Mercancía

```http
POST /api/v1/movements
{
  "type": "in",
  "variant_id": "var_123",
  "warehouse_id": "wh_1",
  "quantity": 50,
  "lot_number": "LOT-2025-001",
  "expiry_date": "2026-12-31",
  "reason": "purchase_order",
  "reference_id": "po_789",
  "notes": "Proveedor XYZ - Factura 12345"
}
```

### 3. Crear Transferencia entre Bodegas

```http
POST /api/v1/transfers
{
  "from_warehouse_id": "wh_1",
  "to_warehouse_id": "wh_2",
  "items": [
    {
      "variant_id": "var_123",
      "quantity": 25,
      "lot_number": "LOT-2025-001"
    }
  ],
  "reason": "restock",
  "notes": "Reabastecimiento Local 2"
}
```

### 4. Ajuste de Inventario

```http
POST /api/v1/adjustments
{
  "variant_id": "var_123",
  "warehouse_id": "wh_1",
  "quantity_change": -5,
  "reason": "damaged",
  "notes": "Productos dañados durante transporte interno",
  "requires_approval": true
}
```

## Seguridad y Permisos

### Roles y Permisos

| Rol | Stock | Movements | Transfers | Adjustments |
|-----|-------|-----------|-----------|-------------|
| `inventory.viewer` | Read | Read | Read | Read |
| `inventory.operator` | Read | Create, Read | Create, Read | - |
| `inventory.manager` | All | All | All | Create, Read |
| `inventory.admin` | All | All | All | All |

### Validaciones de Seguridad

- Multi-tenancy estricto por `organization_id`
- Validación de acceso a bodegas por local
- Usuarios solo ven stock de sus locales asignados
- Auditoría completa de todos los movimientos
- Aprobaciones requeridas para ajustes significativos

## Métricas y Monitoring

### KPIs Principales

- **Stock Accuracy Rate** - Precisión del inventario
- **Stock Turnover** - Rotación de inventario
- **Fill Rate** - Tasa de cumplimiento de órdenes
- **Carrying Cost** - Costo de mantenimiento
- **Stockout Frequency** - Frecuencia de agotamiento

### Health Checks

```bash
# Basic health
GET /health

# Detailed readiness
GET /health/ready

# Database connectivity
GET /health/db

# Cache connectivity
GET /health/cache
```

## Próximos Pasos

- [Modelo de Datos](./modelo-datos)
- [Arquitectura](./arquitectura)
- [API: Stock](./api-stock)
- [API: Movements](./api-movements)
- [API: Warehouses](./api-warehouses)
