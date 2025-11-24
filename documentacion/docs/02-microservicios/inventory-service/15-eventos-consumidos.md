---
sidebar_position: 15
---

# Eventos Consumidos

Eventos externos que el Inventory Service consume desde otros microservicios para mantener sincronización y ejecutar acciones automáticas.

## Configuración de Consumidores

### RabbitMQ Setup

```python
# Event consumer configuration
CONSUMER_CONFIG = {
    'catalog_events': {
        'exchange': 'catalog_events',
        'exchange_type': 'topic',
        'queue': 'inventory_catalog_consumer',
        'routing_keys': [
            'catalog.variant.created',
            'catalog.variant.updated',
            'catalog.variant.deleted',
            'catalog.product.deleted'
        ],
        'prefetch_count': 10,
        'auto_ack': False
    },
    'order_events': {
        'exchange': 'order_events',
        'exchange_type': 'topic',
        'queue': 'inventory_order_consumer',
        'routing_keys': [
            'order.placed',
            'order.confirmed',
            'order.cancelled',
            'order.shipped',
            'return.received'
        ],
        'prefetch_count': 20,
        'auto_ack': False
    }
}
```

---

## Catalog Service Events

### catalog.variant.created

**Trigger:** Nueva variante creada en Catalog Service

**Acción:** Inicializar registros de stock en todas las bodegas activas

```json
{
  "event": "catalog.variant.created",
  "version": "1.0",
  "timestamp": "2025-11-23T15:00:00Z",
  "organization_id": "org_123",
  "data": {
    "variant_id": "var_789",
    "product_id": "prod_456",
    "sku": "PROD-001-RED-M",
    "track_inventory": true,
    "default_min_stock": 20,
    "default_max_stock": 200
  }
}
```

**Handler Implementation:**

```python
async def handle_variant_created(event: Dict[str, Any]) -> None:
    """
    Initialize stock records for new variant in all active warehouses.
    """
    variant_id = event['data']['variant_id']
    organization_id = event['organization_id']
    track_inventory = event['data'].get('track_inventory', True)

    if not track_inventory:
        logger.info(f"Variant {variant_id} does not track inventory. Skipping.")
        return

    # Get all active warehouses for this organization
    warehouses = await warehouse_service.get_active_warehouses(
        organization_id=organization_id
    )

    # Create stock records
    stock_records = []
    for warehouse in warehouses:
        stock = Stock(
            stock_id=generate_uuid(),
            organization_id=organization_id,
            variant_id=variant_id,
            warehouse_id=warehouse.warehouse_id,
            total_quantity=0,
            available_quantity=0,
            reserved_quantity=0,
            damaged_quantity=0,
            in_transit_quantity=0,
            min_stock=event['data'].get('default_min_stock', 0),
            max_stock=event['data'].get('default_max_stock', 999999),
            stock_strategy='FIFO',
            created_at=datetime.utcnow()
        )
        stock_records.append(stock)

    # Bulk insert
    await stock_service.bulk_create(stock_records)

    # Publish confirmation event
    await publish_event('inventory.stock.initialized', {
        'variant_id': variant_id,
        'warehouses_count': len(warehouses),
        'stock_records_created': len(stock_records)
    })

    logger.info(f"Initialized stock for variant {variant_id} in {len(warehouses)} warehouses")
```

**Error Handling:**

- **Warehouse not found:** Log warning, continue with available warehouses
- **Duplicate stock record:** Skip, log as already initialized
- **Database error:** Retry with exponential backoff (max 3 retries)
- **Validation error:** Send to dead letter queue for manual review

---

### catalog.variant.updated

**Trigger:** Variante actualizada (ej: SKU, tracking status)

**Acción:** Actualizar configuración de stock si aplica

```json
{
  "event": "catalog.variant.updated",
  "data": {
    "variant_id": "var_789",
    "changes": {
      "sku": {
        "old": "PROD-001-RED-M",
        "new": "PROD-001-ROJO-M"
      },
      "track_inventory": {
        "old": false,
        "new": true
      }
    }
  }
}
```

**Handler Implementation:**

```python
async def handle_variant_updated(event: Dict[str, Any]) -> None:
    """
    Update stock configuration when variant tracking changes.
    """
    variant_id = event['data']['variant_id']
    changes = event['data']['changes']

    # Check if inventory tracking was enabled
    if 'track_inventory' in changes:
        old_value = changes['track_inventory']['old']
        new_value = changes['track_inventory']['new']

        if not old_value and new_value:
            # Tracking was enabled, initialize stock
            await handle_variant_created(event)
        elif old_value and not new_value:
            # Tracking was disabled, verify zero stock
            stock_records = await stock_service.get_by_variant(variant_id)
            has_stock = any(s.total_quantity > 0 for s in stock_records)

            if has_stock:
                raise ValueError(
                    f"Cannot disable tracking for variant {variant_id}. "
                    f"Stock must be zero in all warehouses."
                )
```

---

### catalog.variant.deleted

**Trigger:** Variante eliminada (soft delete)

**Acción:** Validar stock cero y archivar registros

```json
{
  "event": "catalog.variant.deleted",
  "data": {
    "variant_id": "var_789",
    "product_id": "prod_456",
    "deletion_type": "soft",
    "deleted_by": "user_123"
  }
}
```

**Handler Implementation:**

```python
async def handle_variant_deleted(event: Dict[str, Any]) -> None:
    """
    Archive stock records when variant is deleted.
    Validates that all stock is zero before archiving.
    """
    variant_id = event['data']['variant_id']
    organization_id = event['organization_id']

    # Get all stock records for this variant
    stock_records = await stock_service.get_by_variant(
        variant_id=variant_id,
        organization_id=organization_id
    )

    # Validate all stock is zero
    for stock in stock_records:
        if stock.total_quantity != 0:
            raise ValueError(
                f"Cannot delete variant {variant_id}. "
                f"Warehouse {stock.warehouse_id} has {stock.total_quantity} units. "
                f"Stock must be zero before deletion."
            )

    # Archive stock records (soft delete)
    await stock_service.archive_by_variant(variant_id)

    # Publish confirmation
    await publish_event('inventory.stock.archived', {
        'variant_id': variant_id,
        'records_archived': len(stock_records)
    })

    logger.info(f"Archived {len(stock_records)} stock records for variant {variant_id}")
```

**Validation Errors:**

```json
{
  "error": "STOCK_NOT_ZERO",
  "message": "Cannot delete variant with existing stock",
  "details": {
    "variant_id": "var_789",
    "warehouses_with_stock": [
      {
        "warehouse_id": "wh_101",
        "warehouse_name": "Bodega Principal",
        "total_quantity": 45,
        "available": 30,
        "reserved": 15
      }
    ],
    "action_required": "Clear all stock before deleting variant"
  }
}
```

---

### catalog.product.deleted

**Trigger:** Producto completo eliminado (afecta todas las variantes)

**Acción:** Validar y archivar stock de todas las variantes del producto

```json
{
  "event": "catalog.product.deleted",
  "data": {
    "product_id": "prod_456",
    "variant_ids": ["var_789", "var_790", "var_791"],
    "deleted_by": "user_123"
  }
}
```

**Handler:** Llama a `handle_variant_deleted` para cada variante

---

## Order Service Events

### order.placed

**Trigger:** Orden creada pero no confirmada (pendiente de pago)

**Acción:** Reservar stock temporalmente

```json
{
  "event": "order.placed",
  "version": "1.0",
  "timestamp": "2025-11-23T15:00:00Z",
  "organization_id": "org_123",
  "data": {
    "order_id": "order_456",
    "customer_id": "cust_789",
    "local_id": "local_101",
    "items": [
      {
        "variant_id": "var_789",
        "quantity": 2,
        "preferred_warehouse_id": "wh_101"
      }
    ],
    "reservation_ttl_minutes": 15
  }
}
```

**Handler Implementation:**

```python
async def handle_order_placed(event: Dict[str, Any]) -> None:
    """
    Reserve stock for placed order with TTL.
    """
    order_id = event['data']['order_id']
    items = event['data']['items']
    ttl_minutes = event['data'].get('reservation_ttl_minutes', 15)
    organization_id = event['organization_id']

    reservation_items = []

    for item in items:
        variant_id = item['variant_id']
        quantity = item['quantity']
        warehouse_id = item.get('preferred_warehouse_id')

        # Find available stock
        if warehouse_id:
            # Try preferred warehouse first
            stock = await stock_service.get_stock(
                variant_id=variant_id,
                warehouse_id=warehouse_id,
                organization_id=organization_id
            )
        else:
            # Find warehouse with most available stock
            stock = await stock_service.find_best_warehouse(
                variant_id=variant_id,
                quantity=quantity,
                organization_id=organization_id
            )

        if not stock or stock.available_quantity < quantity:
            # Insufficient stock
            await publish_event('inventory.reservation.failed', {
                'order_id': order_id,
                'variant_id': variant_id,
                'requested': quantity,
                'available': stock.available_quantity if stock else 0,
                'reason': 'insufficient_stock'
            })
            raise InsufficientStockError(
                f"Insufficient stock for variant {variant_id}. "
                f"Requested: {quantity}, Available: {stock.available_quantity if stock else 0}"
            )

        reservation_items.append({
            'stock_id': stock.stock_id,
            'variant_id': variant_id,
            'warehouse_id': stock.warehouse_id,
            'quantity': quantity
        })

    # Create reservation
    reservation = await reservation_service.create(
        reservation_id=generate_uuid(),
        order_id=order_id,
        organization_id=organization_id,
        items=reservation_items,
        expires_at=datetime.utcnow() + timedelta(minutes=ttl_minutes),
        status='active'
    )

    # Update stock quantities (available -> reserved)
    for item in reservation_items:
        await stock_service.reserve_quantity(
            stock_id=item['stock_id'],
            quantity=item['quantity']
        )

    # Publish success event
    await publish_event('inventory.stock.reserved', {
        'reservation_id': reservation.reservation_id,
        'order_id': order_id,
        'items': reservation_items,
        'expires_at': reservation.expires_at.isoformat()
    })

    # Schedule auto-release job
    await scheduler.schedule_task(
        task='release_expired_reservation',
        execute_at=reservation.expires_at,
        args={'reservation_id': reservation.reservation_id}
    )
```

---

### order.confirmed

**Trigger:** Orden confirmada (pago exitoso)

**Acción:** Convertir reserva temporal en permanente

```json
{
  "event": "order.confirmed",
  "data": {
    "order_id": "order_456",
    "reservation_id": "res_123",
    "payment_confirmed": true
  }
}
```

**Handler Implementation:**

```python
async def handle_order_confirmed(event: Dict[str, Any]) -> None:
    """
    Convert temporary reservation to permanent.
    """
    order_id = event['data']['order_id']
    reservation_id = event['data']['reservation_id']

    # Update reservation status
    await reservation_service.confirm(reservation_id)

    # Remove TTL (no auto-release)
    await scheduler.cancel_task(
        task='release_expired_reservation',
        args={'reservation_id': reservation_id}
    )

    logger.info(f"Order {order_id} confirmed. Reservation {reservation_id} is now permanent.")
```

---

### order.cancelled

**Trigger:** Orden cancelada antes de envío

**Acción:** Liberar stock reservado

```json
{
  "event": "order.cancelled",
  "data": {
    "order_id": "order_456",
    "reservation_id": "res_123",
    "cancellation_reason": "customer_request",
    "cancelled_by": "user_789"
  }
}
```

**Handler Implementation:**

```python
async def handle_order_cancelled(event: Dict[str, Any]) -> None:
    """
    Release reserved stock when order is cancelled.
    """
    order_id = event['data']['order_id']
    reservation_id = event['data']['reservation_id']
    reason = event['data'].get('cancellation_reason', 'unknown')

    # Get reservation details
    reservation = await reservation_service.get(reservation_id)

    if not reservation:
        logger.warning(f"Reservation {reservation_id} not found. May be already released.")
        return

    # Release stock (reserved -> available)
    for item in reservation.items:
        await stock_service.release_quantity(
            stock_id=item['stock_id'],
            quantity=item['quantity']
        )

    # Update reservation status
    await reservation_service.cancel(reservation_id, reason=reason)

    # Publish event
    await publish_event('inventory.stock.released', {
        'reservation_id': reservation_id,
        'order_id': order_id,
        'reason': reason,
        'items_released': len(reservation.items)
    })
```

---

### order.shipped

**Trigger:** Orden enviada al cliente

**Acción:** Descontar stock reservado (reserved -> out movement)

```json
{
  "event": "order.shipped",
  "data": {
    "order_id": "order_456",
    "reservation_id": "res_123",
    "shipment_id": "ship_789",
    "shipped_items": [
      {
        "variant_id": "var_789",
        "quantity": 2,
        "warehouse_id": "wh_101"
      }
    ]
  }
}
```

**Handler Implementation:**

```python
async def handle_order_shipped(event: Dict[str, Any]) -> None:
    """
    Deduct stock when order is shipped.
    Creates outbound movements and updates stock quantities.
    """
    order_id = event['data']['order_id']
    reservation_id = event['data']['reservation_id']
    shipment_id = event['data']['shipment_id']
    items = event['data']['shipped_items']
    organization_id = event['organization_id']

    movements = []

    for item in items:
        variant_id = item['variant_id']
        quantity = item['quantity']
        warehouse_id = item['warehouse_id']

        # Get stock record
        stock = await stock_service.get_stock(
            variant_id=variant_id,
            warehouse_id=warehouse_id,
            organization_id=organization_id
        )

        # Create outbound movement
        movement = StockMovement(
            movement_id=generate_uuid(),
            organization_id=organization_id,
            stock_id=stock.stock_id,
            variant_id=variant_id,
            warehouse_id=warehouse_id,
            movement_type='out',
            quantity_change=-quantity,
            quantity_before=stock.total_quantity,
            quantity_after=stock.total_quantity - quantity,
            reason='order_shipment',
            reference_type='order',
            reference_id=order_id,
            notes=f"Shipped via {shipment_id}",
            created_at=datetime.utcnow()
        )
        movements.append(movement)

        # Update stock (reserved -> out)
        await stock_service.deduct_reserved(
            stock_id=stock.stock_id,
            quantity=quantity
        )

    # Bulk insert movements
    await movement_service.bulk_create(movements)

    # Release reservation
    await reservation_service.fulfill(reservation_id)

    # Publish events
    for movement in movements:
        await publish_event('inventory.movement.out', {
            'movement_id': movement.movement_id,
            'variant_id': movement.variant_id,
            'warehouse_id': movement.warehouse_id,
            'quantity': abs(movement.quantity_change),
            'reason': 'order_shipment',
            'order_id': order_id
        })
```

---

### return.received

**Trigger:** Cliente devuelve orden y productos son recibidos en bodega

**Acción:** Registrar entrada y reevaluar calidad

```json
{
  "event": "return.received",
  "version": "1.0",
  "timestamp": "2025-11-28T14:00:00Z",
  "organization_id": "org_123",
  "data": {
    "order_id": "order_456",
    "return_id": "ret_123",
    "rma_number": "RMA-2025-0001",
    "warehouse_id": "wh_101",
    "returned_items": [
      {
        "variant_id": "var_789",
        "quantity": 1,
        "condition": "good",
        "return_reason": "wrong_size"
      }
    ],
    "received_at": "2025-11-28T14:00:00Z"
  }
}
```

**Handler Implementation:**

```python
async def handle_return_received(event: Dict[str, Any]) -> None:
    """
    Process returned items and update stock accordingly.
    """
    return_id = event['data']['return_id']
    order_id = event['data']['order_id']
    items = event['data']['returned_items']
    organization_id = event['organization_id']

    for item in items:
        variant_id = item['variant_id']
        quantity = item['quantity']
        condition = item['condition']  # good, damaged, defective
        warehouse_id = item['warehouse_id']

        # Determine stock category based on condition
        if condition == 'good':
            category = 'available'
        else:
            category = 'damaged'

        # Create inbound movement
        await movement_service.create_in(
            variant_id=variant_id,
            warehouse_id=warehouse_id,
            quantity=quantity,
            reason='customer_return',
            reference_type='return',
            reference_id=return_id,
            stock_category=category,
            notes=f"Return from order {order_id}. Condition: {condition}"
        )

        # Update stock in appropriate category
        await stock_service.add_quantity(
            variant_id=variant_id,
            warehouse_id=warehouse_id,
            quantity=quantity,
            category=category
        )
```

---

## Error Handling

### Retry Policy

```python
RETRY_CONFIG = {
    'max_retries': 3,
    'retry_backoff': 'exponential',  # 1s, 2s, 4s
    'retry_on': [
        'DatabaseError',
        'ConnectionError',
        'TimeoutError'
    ],
    'dead_letter_on': [
        'ValidationError',
        'InsufficientStockError',
        'DuplicateRecordError'
    ]
}
```

### Dead Letter Queue

```python
# Events that cannot be processed go to DLQ
DEAD_LETTER_CONFIG = {
    'exchange': 'inventory_dlq',
    'queue': 'inventory_failed_events',
    'ttl': 86400000,  # 24 hours
    'max_length': 10000
}

# DLQ monitoring
async def monitor_dead_letter_queue():
    """Alert when DLQ has items."""
    queue_size = await rabbitmq.get_queue_size('inventory_failed_events')

    if queue_size > 100:
        await alert_service.send_alert(
            level='critical',
            message=f"Inventory DLQ has {queue_size} failed events",
            action_required="Review and reprocess failed events"
        )
```

### Idempotency

```python
async def consume_event_with_idempotency(event: Dict[str, Any]) -> None:
    """
    Process event with idempotency check.
    """
    event_id = event.get('event_id') or event.get('message_id')

    # Check if already processed
    if await event_log_service.exists(event_id):
        logger.info(f"Event {event_id} already processed. Skipping.")
        return

    # Process event
    try:
        await process_event(event)

        # Log as processed
        await event_log_service.create(
            event_id=event_id,
            event_type=event['event'],
            processed_at=datetime.utcnow(),
            status='success'
        )
    except Exception as e:
        await event_log_service.create(
            event_id=event_id,
            event_type=event['event'],
            processed_at=datetime.utcnow(),
            status='failed',
            error=str(e)
        )
        raise
```

---

## Monitoring y Observabilidad

### Métricas

```python
# Prometheus metrics
inventory_events_consumed = Counter(
    'inventory_events_consumed_total',
    'Total events consumed',
    ['event_type', 'source_service']
)

inventory_event_processing_duration = Histogram(
    'inventory_event_processing_seconds',
    'Event processing duration',
    ['event_type']
)

inventory_event_errors = Counter(
    'inventory_event_errors_total',
    'Event processing errors',
    ['event_type', 'error_type']
)
```

### Logging

```python
logger.info(
    "Event consumed",
    extra={
        'event_type': event['event'],
        'event_id': event.get('event_id'),
        'source': event.get('source'),
        'organization_id': event.get('organization_id'),
        'processing_time_ms': processing_time
    }
)
```

---

## Testing

### Mock Events

```python
# Test helper
async def publish_mock_event(
    event_type: str,
    data: Dict[str, Any],
    organization_id: str = "test_org"
) -> None:
    """Publish test event to RabbitMQ."""
    event = {
        'event': event_type,
        'version': '1.0',
        'timestamp': datetime.utcnow().isoformat(),
        'organization_id': organization_id,
        'event_id': generate_uuid(),
        'data': data
    }

    await rabbitmq.publish(
        exchange=get_exchange_for_event(event_type),
        routing_key=event_type,
        message=event
    )

# Test example
@pytest.mark.asyncio
async def test_variant_created_handler():
    """Test stock initialization when variant is created."""
    # Publish mock event
    await publish_mock_event('catalog.variant.created', {
        'variant_id': 'test_var_123',
        'product_id': 'test_prod_456',
        'sku': 'TEST-SKU',
        'track_inventory': True,
        'default_min_stock': 10
    })

    # Wait for processing
    await asyncio.sleep(1)

    # Verify stock records created
    stock_records = await stock_service.get_by_variant('test_var_123')
    assert len(stock_records) > 0
    assert all(s.min_stock == 10 for s in stock_records)
```

---

## Próximos Pasos

- [Integraciones](./integraciones)
- [Errores Comunes](./errores-comunes)
- [Flujos de Negocio](./flujos-negocio)
