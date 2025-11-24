---
sidebar_position: 18
---

# Flujos de Negocio

Diagramas de secuencia que ilustran los flujos de negocio principales del Inventory Service.

## 1. Flujo de Ingreso de Mercancía (Purchase Order)

Proceso completo desde que llega una orden de compra hasta el registro en inventario.

```mermaid
sequenceDiagram
    participant PO as Purchase Order
    participant WH as Warehouse Staff
    participant IS as Inventory Service
    participant DB as Database
    participant RMQ as RabbitMQ
    participant CS as Catalog Service
    participant NOTIF as Notification Service

    PO->>WH: Mercancía llega a bodega
    WH->>WH: Inspección de calidad

    alt Quality OK
        WH->>IS: POST /movements/in
        Note over WH,IS: {variant_id, warehouse_id,<br/>quantity, lot_number, expiry_date}

        IS->>CS: gRPC: ValidateVariant
        CS-->>IS: Variant valid

        IS->>DB: BEGIN TRANSACTION

        IS->>DB: INSERT INTO stock_movement
        DB-->>IS: Movement created

        IS->>DB: UPDATE stock<br/>SET total += quantity,<br/>available += quantity
        DB-->>IS: Stock updated

        IS->>DB: COMMIT TRANSACTION

        IS->>RMQ: Publish movement.in
        IS->>RMQ: Publish stock.updated

        RMQ->>CS: Notify stock change
        RMQ->>NOTIF: Notify receiving complete

        IS-->>WH: 201 Created<br/>{movement_id, new_stock}

    else Quality Issues
        WH->>IS: POST /movements/in<br/>+ damage_category: "damaged"
        IS->>DB: UPDATE stock<br/>SET damaged += quantity
        IS->>RMQ: Publish stock.damaged
        RMQ->>NOTIF: Notify quality issue
    end
```

**Validaciones:**

- Variante existe y está activa
- Bodega existe y está activa
- Número de lote único si se proporciona
- Fecha de vencimiento futura (si aplica)
- Capacidad de bodega no excedida

**Eventos Publicados:**

- `inventory.movement.in`
- `inventory.stock.updated`
- `inventory.stock.damaged` (si hay productos dañados)

---

## 2. Flujo de Reserva y Venta (E-commerce)

Proceso desde que un cliente hace una orden online hasta el despacho.

```mermaid
sequenceDiagram
    participant C as Customer
    participant OS as Order Service
    participant IS as Inventory Service
    participant PS as Payment Service
    participant RMQ as RabbitMQ
    participant WH as Warehouse

    C->>OS: Add to cart<br/>+ Click checkout
    OS->>IS: gRPC: CheckAvailability<br/>(variant_id, quantity)

    alt Stock Available
        IS-->>OS: Available: true<br/>warehouse_id
        OS->>IS: gRPC: ReserveStock<br/>ttl=15min

        IS->>IS: Create reservation
        IS->>IS: Update stock<br/>(available -> reserved)
        IS-->>OS: Reservation ID<br/>expires_at

        OS-->>C: Order created<br/>Payment pending

        Note over C,PS: Customer has 15 min to pay

        alt Payment Success
            C->>PS: Complete payment
            PS->>RMQ: Publish payment.success
            RMQ->>OS: Consume event

            OS->>IS: gRPC: ConfirmReservation
            IS->>IS: Remove TTL<br/>Mark permanent
            IS-->>OS: Confirmed

            OS->>RMQ: Publish order.confirmed

            Note over WH: Warehouse picks order

            WH->>OS: Mark as shipped
            OS->>RMQ: Publish order.shipped

            RMQ->>IS: Consume event
            IS->>IS: Create movement OUT
            IS->>IS: Update stock<br/>(reserved -> decrease total)
            IS->>RMQ: Publish movement.out

        else Payment Failed/Timeout
            Note over IS: TTL expires (15 min)
            IS->>IS: Auto-release reservation
            IS->>IS: Update stock<br/>(reserved -> available)
            IS->>RMQ: Publish reservation.expired
            RMQ->>OS: Notify expiration
            OS->>OS: Cancel order
        end

    else Stock Not Available
        IS-->>OS: Available: false<br/>current_stock: X
        OS-->>C: Product out of stock
    end
```

**Configuración:**

- **TTL Reserva:** 15 minutos (configurable)
- **Auto-release:** Automático al expirar TTL
- **Estrategia:** FIFO para selección de lote

---

## 3. Flujo de Transferencia entre Bodegas

Transferencia de mercancía de una bodega a otra con seguimiento completo.

```mermaid
sequenceDiagram
    participant MG as Manager
    participant IS as Inventory Service
    participant DB as Database
    participant RMQ as RabbitMQ
    participant WH_FROM as Warehouse Origin
    participant WH_TO as Warehouse Destination
    participant NOTIF as Notification Service

    MG->>IS: POST /transfers
    Note over MG,IS: {from: wh_1, to: wh_2,<br/>items: [{variant_id, qty}]}

    IS->>IS: Validate stock in origin

    alt Sufficient Stock
        IS->>DB: INSERT transfer (status: pending)
        IS->>DB: UPDATE stock_origin<br/>(available -> in_transit)

        IS->>RMQ: Publish transfer.created
        RMQ->>NOTIF: Notify warehouse managers

        IS-->>MG: 201 Created<br/>{transfer_id, status: pending}

        Note over MG: Review and approve

        MG->>IS: POST /transfers/{id}/approve
        IS->>DB: UPDATE status = approved
        IS->>RMQ: Publish transfer.approved

        IS-->>MG: Approved

        Note over WH_FROM: Prepare shipment

        WH_FROM->>IS: POST /transfers/{id}/ship
        IS->>DB: UPDATE status = in_transit<br/>shipped_at = NOW()
        IS->>RMQ: Publish transfer.in_transit
        RMQ->>NOTIF: Notify destination
        RMQ->>WH_TO: Expect arrival

        Note over WH_FROM,WH_TO: Goods in transit

        WH_TO->>IS: POST /transfers/{id}/receive<br/>{received_items: [...]}

        alt No Discrepancies
            IS->>DB: UPDATE status = received
            IS->>DB: UPDATE stock_destination<br/>(increase available)
            IS->>DB: UPDATE stock_origin<br/>(decrease in_transit)
            IS->>DB: INSERT movements (OUT origin, IN destination)

            IS->>RMQ: Publish transfer.received
            IS-->>WH_TO: Transfer complete

        else Discrepancies Found
            IS->>DB: UPDATE with discrepancies
            IS->>RMQ: Publish transfer.discrepancy
            RMQ->>NOTIF: Alert managers<br/>Investigation required

            Note over MG: Review discrepancy

            MG->>IS: POST /adjustments<br/>(resolve discrepancy)
            IS->>DB: Apply adjustment
            IS->>DB: UPDATE transfer status = received
        end

    else Insufficient Stock
        IS-->>MG: 400 Bad Request<br/>TRANSFER_INSUFFICIENT_STOCK
    end
```

**Estados de Transferencia:**

1. **pending** - Creada, esperando aprobación
2. **approved** - Aprobada, lista para envío
3. **in_transit** - En camino
4. **received** - Recibida en destino
5. **cancelled** - Cancelada

**Reglas de Negocio:**

- Transferencias mayores a $1000 requieren aprobación
- Discrepancias mayores a 5% requieren investigación
- Stock se marca como "in_transit" durante el traslado

---

## 4. Flujo de Ajuste de Inventario (Physical Count)

Ajuste manual después de un conteo físico de inventario.

```mermaid
sequenceDiagram
    participant OP as Operator
    participant IS as Inventory Service
    participant DB as Database
    participant MG as Manager
    participant RMQ as RabbitMQ
    participant NOTIF as Notification Service

    Note over OP: Physical inventory count

    OP->>IS: GET /stock?warehouse_id=wh_1
    IS-->>OP: Current stock levels

    OP->>OP: Count physical stock<br/>Compare with system

    alt Small Adjustment (< 10%)
        OP->>IS: POST /adjustments
        Note over OP,IS: {variant_id, warehouse_id,<br/>quantity_change: -5,<br/>reason: "audit"}

        IS->>DB: INSERT adjustment<br/>status: pending
        IS->>IS: Calculate percentage<br/>change = 5%

        Note over IS: Auto-approve if < 10%

        IS->>DB: UPDATE status = approved
        IS->>DB: UPDATE status = applied
        IS->>DB: UPDATE stock quantities
        IS->>DB: INSERT stock_movement

        IS->>RMQ: Publish adjustment.applied
        IS-->>OP: Adjustment complete

    else Large Adjustment (≥ 10%)
        OP->>IS: POST /adjustments
        Note over OP,IS: {quantity_change: -50,<br/>reason: "audit",<br/>notes: "Discrepancia en conteo"}

        IS->>DB: INSERT adjustment<br/>status: pending
        IS->>IS: Calculate percentage<br/>change = 25%

        Note over IS: Requires approval

        IS->>RMQ: Publish adjustment.approval_required
        RMQ->>NOTIF: Notify manager

        IS-->>OP: Created (pending approval)

        Note over MG: Review adjustment

        alt Manager Approves
            MG->>IS: POST /adjustments/{id}/approve
            IS->>DB: UPDATE status = approved
            IS->>DB: UPDATE status = applied
            IS->>DB: UPDATE stock quantities
            IS->>DB: INSERT stock_movement

            IS->>RMQ: Publish adjustment.approved
            IS->>RMQ: Publish adjustment.applied
            IS-->>MG: Applied successfully

        else Manager Rejects
            MG->>IS: POST /adjustments/{id}/reject<br/>{reason: "Falta evidencia"}
            IS->>DB: UPDATE status = rejected
            IS->>RMQ: Publish adjustment.rejected
            RMQ->>NOTIF: Notify operator
            IS-->>MG: Rejected
        end
    end
```

**Umbrales de Aprobación:**

- **Auto-aprobado:** Cambio menor a 10% o menos de 10 unidades
- **Requiere aprobación:** Cambio mayor a 10% o más de 10 unidades
- **Requiere doble aprobación:** Cambio mayor a 50% o más de 100 unidades

**Motivos Válidos:**

- `audit` - Conteo físico
- `damaged` - Productos dañados
- `expired` - Productos vencidos
- `lost` - Pérdida/robo
- `found` - Encontrado (ajuste positivo)

---

## 5. Flujo de Stock Bajo Mínimo (Low Stock Alert)

Detección automática y notificación cuando el stock llega al nivel mínimo.

```mermaid
sequenceDiagram
    participant IS as Inventory Service
    participant DB as Database
    participant RMQ as RabbitMQ
    participant NOTIF as Notification Service
    participant PURCH as Purchasing Service
    participant MG as Manager

    Note over IS: Stock movement occurs

    IS->>DB: UPDATE stock quantities
    IS->>IS: Check if available ≤ min_stock

    alt Stock Below Minimum
        IS->>DB: SELECT stock WHERE<br/>available ≤ min_stock

        IS->>RMQ: Publish stock.low_level
        Note over IS,RMQ: {variant_id, warehouse_id,<br/>available: 15, min_stock: 20,<br/>reorder_point: 30,<br/>alert_level: "warning"}

        RMQ->>NOTIF: Consume event
        NOTIF->>MG: Send email alert<br/>"Stock bajo para SKU-123"
        NOTIF->>MG: In-app notification

        alt Stock ≤ Reorder Point
            IS->>RMQ: Publish stock.reorder_needed
            Note over IS,RMQ: {suggested_quantity: 200,<br/>last_supplier_id,<br/>avg_lead_time: 7 days}

            RMQ->>PURCH: Auto-create draft PO
            PURCH->>PURCH: Calculate order quantity<br/>(max_stock - current_stock)
            PURCH->>PURCH: Select preferred supplier
            PURCH-->>MG: Draft PO created<br/>Pending review

        else Stock > Reorder Point
            Note over NOTIF: Only alert, no auto-order
        end

        alt Stock Completely Depleted
            IS->>IS: Check if available = 0
            IS->>RMQ: Publish stock.depleted
            RMQ->>NOTIF: Send critical alert
            NOTIF->>MG: SMS + Email<br/>"CRITICAL: Out of stock"

            RMQ->>IS: Update catalog
            Note over IS: Mark product unavailable<br/>on website
        end
    end
```

**Niveles de Alerta:**

- **Normal:** `available > min_stock`
- **Warning:** `min_stock ≥ available > reorder_point`
- **Critical:** `reorder_point ≥ available > 0`
- **Depleted:** `available = 0`

**Configuración:**

```python
stock_config = {
    'min_stock': 20,           # Nivel mínimo
    'reorder_point': 30,       # Punto de reorden automático
    'max_stock': 200,          # Nivel máximo
    'auto_reorder': True,      # Activar reorden automático
    'preferred_supplier_id': 'sup_123'
}
```

---

## 6. Flujo de Devolución de Cliente

Proceso completo de devolución desde el cliente hasta reingreso a inventario.

```mermaid
sequenceDiagram
    participant C as Customer
    participant OS as Order Service
    participant RET as Returns Service
    participant IS as Inventory Service
    participant WH as Warehouse
    participant QC as Quality Control
    participant DB as Database
    participant RMQ as RabbitMQ

    C->>OS: Request return<br/>order_id + items
    OS->>RET: Create return request
    RET->>RET: Generate RMA number
    RET-->>C: RMA-12345<br/>Return label

    Note over C,WH: Customer ships back

    WH->>RET: Scan RMA-12345
    RET-->>WH: Return details

    WH->>QC: Send for inspection

    QC->>QC: Inspect items

    alt Item in Good Condition
        QC->>IS: POST /movements/in
        Note over QC,IS: {variant_id, warehouse_id,<br/>quantity: 1,<br/>reason: "customer_return",<br/>condition: "good",<br/>reference_id: RMA-12345}

        IS->>DB: UPDATE stock<br/>available += 1
        IS->>DB: INSERT movement

        IS->>RMQ: Publish movement.in
        IS->>RMQ: Publish stock.updated

        RMQ->>OS: Stock available again

        IS-->>QC: Return processed<br/>Stock updated

    else Item Damaged
        QC->>IS: POST /movements/in<br/>condition: "damaged"

        IS->>DB: UPDATE stock<br/>damaged += 1
        IS->>DB: INSERT movement

        IS->>RMQ: Publish stock.damaged

        IS-->>QC: Damaged stock recorded

    else Item Defective/Expired
        QC->>IS: POST /movements/in<br/>condition: "defective"

        IS->>DB: Do not add to available
        IS->>DB: INSERT movement (for audit)
        IS->>DB: Mark for disposal

        IS-->>QC: Marked for disposal
    end

    RET->>OS: Update return status
    OS->>C: Refund processed
```

**Condiciones de Retorno:**

- **good** - Se devuelve a stock disponible
- **damaged** - Se marca como dañado
- **defective** - Se marca para disposal
- **expired** - No se reingresa

---

## 7. Flujo de Trazabilidad de Lote (Lot Tracking)

Seguimiento completo de un lote desde ingreso hasta venta.

```mermaid
sequenceDiagram
    participant SUP as Supplier
    participant WH as Warehouse
    participant IS as Inventory Service
    participant DB as Database
    participant C as Customer
    participant OS as Order Service

    SUP->>WH: Deliver goods<br/>LOT-2025-001

    WH->>IS: POST /movements/in
    Note over WH,IS: {variant_id, quantity: 100,<br/>lot_number: "LOT-2025-001",<br/>expiry_date: "2026-12-31",<br/>supplier_id: "sup_456"}

    IS->>DB: INSERT INTO stock_movement
    Note over IS,DB: Store lot metadata

    IS->>DB: UPDATE stock<br/>available += 100

    IS-->>WH: Lot registered

    Note over IS: Time passes...

    C->>OS: Place order (variant)
    OS->>IS: gRPC: ReserveStock

    IS->>DB: SELECT stock WHERE<br/>variant_id = X<br/>ORDER BY expiry_date ASC<br/>LIMIT 1
    Note over IS,DB: FEFO Strategy

    IS->>DB: Reserve from LOT-2025-001
    IS-->>OS: Reserved (lot_number)

    OS->>IS: Order shipped

    IS->>DB: INSERT movement OUT<br/>lot_number: "LOT-2025-001"
    IS->>DB: UPDATE stock -= 1

    Note over IS: Later - Recall scenario

    alt Product Recall
        SUP->>WH: Recall LOT-2025-001

        WH->>IS: GET /movements/lot/LOT-2025-001

        IS->>DB: SELECT * FROM stock_movement<br/>WHERE lot_number = "LOT-2025-001"

        IS-->>WH: Complete traceability
        Note over IS,WH: - Received: 100 units<br/>- Sold: 65 units<br/>- Remaining: 35 units<br/>- Customers: [list]

        WH->>IS: Create adjustment<br/>Remove remaining stock

        IS->>DB: UPDATE stock -= 35
        IS->>DB: INSERT movement<br/>reason: "recall"

        WH->>OS: Notify affected customers
    end
```

**Estrategias de Selección:**

- **FIFO** (First In, First Out) - Por defecto
- **LIFO** (Last In, First Out) - Casos específicos
- **FEFO** (First Expired, First Out) - Productos perecederos

---

## 8. Flujo de Sincronización Multi-Servicio

Coordinación entre Inventory, Catalog y Order services.

```mermaid
sequenceDiagram
    participant CS as Catalog Service
    participant RMQ as RabbitMQ
    participant IS as Inventory Service
    participant OS as Order Service
    participant DB as Inventory DB

    Note over CS: New variant created

    CS->>RMQ: Publish variant.created
    Note over CS,RMQ: {variant_id: "var_new_789",<br/>track_inventory: true,<br/>default_min_stock: 10}

    RMQ->>IS: Consume event

    IS->>DB: SELECT active_warehouses
    DB-->>IS: [wh_1, wh_2, wh_3]

    loop For each warehouse
        IS->>DB: INSERT INTO stock
        Note over IS,DB: {variant_id, warehouse_id,<br/>total: 0, available: 0,<br/>min_stock: 10}
    end

    IS->>RMQ: Publish stock.initialized
    RMQ->>CS: Confirm initialization

    Note over IS: Stock arrives

    IS->>IS: POST /movements/in<br/>quantity: 100
    IS->>DB: UPDATE stock<br/>available = 100

    IS->>RMQ: Publish stock.updated
    Note over IS,RMQ: {variant_id, warehouse_id,<br/>available: 100}

    RMQ->>CS: Update product availability
    CS->>CS: Mark as "In Stock"<br/>on website

    RMQ->>OS: Stock available for orders

    Note over OS: Customer orders

    OS->>IS: gRPC: CheckAvailability
    IS-->>OS: Available: true

    OS->>IS: gRPC: ReserveStock
    IS->>DB: available -= 10<br/>reserved += 10
    IS-->>OS: Reserved

    IS->>RMQ: Publish stock.reserved
    RMQ->>CS: Update available qty display

    Note over OS: Order confirmed & shipped

    OS->>RMQ: Publish order.shipped
    RMQ->>IS: Consume event

    IS->>DB: total -= 10<br/>reserved -= 10
    IS->>RMQ: Publish stock.updated

    RMQ->>CS: Sync final stock count
    CS->>CS: Update product page<br/>"90 available"
```

---

## Mejores Prácticas

### 1. Manejo de Concurrencia

```python
# Optimistic locking para actualizaciones de stock
async def update_stock_with_version(
    stock_id: str,
    quantity_change: int,
    expected_version: int
) -> Stock:
    """
    Update stock with optimistic locking to prevent race conditions.
    """
    result = await db.execute(
        """
        UPDATE stock
        SET available_quantity = available_quantity + :qty_change,
            version = version + 1,
            updated_at = NOW()
        WHERE stock_id = :stock_id
        AND version = :expected_version
        RETURNING *
        """,
        {
            'stock_id': stock_id,
            'qty_change': quantity_change,
            'expected_version': expected_version
        }
    )

    if not result:
        raise ConcurrentModificationError(
            f"Stock {stock_id} was modified by another transaction"
        )

    return result
```

### 2. Event Idempotency

```python
async def handle_order_shipped(event: Dict[str, Any]) -> None:
    """
    Handle order.shipped event idempotently.
    """
    event_id = event['event_id']

    # Check if already processed
    if await event_log.exists(event_id):
        logger.info(f"Event {event_id} already processed")
        return

    try:
        # Process event
        await process_shipment(event['data'])

        # Mark as processed
        await event_log.mark_processed(event_id)

    except Exception as e:
        await event_log.mark_failed(event_id, error=str(e))
        raise
```

### 3. Transacciones Distribuidas (Saga Pattern)

```python
# Saga for transfer between warehouses
class TransferSaga:
    async def execute(self, transfer_id: str):
        """Execute transfer saga with compensating actions."""
        try:
            # Step 1: Reserve in origin
            await self.reserve_stock_origin(transfer_id)

            # Step 2: Ship
            await self.mark_as_shipped(transfer_id)

            # Step 3: Receive in destination
            await self.receive_stock_destination(transfer_id)

            # Step 4: Complete
            await self.complete_transfer(transfer_id)

        except Exception as e:
            # Compensate
            await self.compensate(transfer_id, failed_step=e.step)
            raise

    async def compensate(self, transfer_id: str, failed_step: str):
        """Rollback changes on failure."""
        if failed_step in ['reserve', 'ship']:
            # Release reserved stock
            await self.release_reservation(transfer_id)
```

### 4. Monitoring de Flujos

```python
# Prometheus metrics for business flows
transfer_duration = Histogram(
    'inventory_transfer_duration_seconds',
    'Time to complete transfer',
    ['from_warehouse', 'to_warehouse']
)

reservation_expiry_rate = Counter(
    'inventory_reservation_expired_total',
    'Number of expired reservations',
    ['warehouse']
)

stock_alert_frequency = Gauge(
    'inventory_low_stock_alerts_active',
    'Number of active low stock alerts',
    ['warehouse', 'alert_level']
)
```

---

## Próximos Pasos

- [Arquitectura](./arquitectura)
- [Errores Comunes](./errores-comunes)
- [Eventos Publicados](./eventos-publicados)
