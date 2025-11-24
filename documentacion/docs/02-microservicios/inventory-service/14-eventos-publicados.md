---
sidebar_position: 14
---

# Eventos Publicados

Eventos que el Inventory Service publica a RabbitMQ para notificar cambios a otros servicios.

## Configuración

**Exchange:** `inventory_events`
**Exchange Type:** `topic`
**Routing Key Pattern:** `inventory.{entity}.{action}`

## Stock Events

### inventory.stock.updated

Publicado cuando el stock de una variante cambia.

```json
{
  "event": "inventory.stock.updated",
  "version": "1.0",
  "timestamp": "2025-11-23T15:00:00Z",
  "organization_id": "org_123",
  "data": {
    "stock_id": "stock_456",
    "variant_id": "var_789",
    "warehouse_id": "wh_101",
    "quantities": {
      "total": 150,
      "available": 120,
      "reserved": 25,
      "damaged": 5
    },
    "previous_quantities": {
      "total": 145,
      "available": 115,
      "reserved": 25,
      "damaged": 5
    },
    "change_type": "in",
    "movement_id": "mov_123"
  }
}
```

**Consumidores:** Catalog Service, Order Service, Analytics

---

### inventory.stock.reserved

Stock reservado para una orden.

```json
{
  "event": "inventory.stock.reserved",
  "data": {
    "reservation_id": "res_123",
    "order_id": "order_456",
    "items": [
      {
        "variant_id": "var_789",
        "warehouse_id": "wh_101",
        "quantity": 10,
        "stock_before": 120,
        "stock_after": 110
      }
    ],
    "expires_at": "2025-11-23T15:30:00Z"
  }
}
```

**Consumidores:** Order Service

---

### inventory.stock.released

Reserva de stock liberada.

```json
{
  "event": "inventory.stock.released",
  "data": {
    "reservation_id": "res_123",
    "order_id": "order_456",
    "reason": "order_cancelled",
    "items_released": 2,
    "total_quantity_released": 15
  }
}
```

---

### inventory.stock.low_level

Stock alcanzó nivel mínimo.

```json
{
  "event": "inventory.stock.low_level",
  "data": {
    "stock_id": "stock_456",
    "variant_id": "var_789",
    "warehouse_id": "wh_101",
    "available_quantity": 15,
    "min_stock": 20,
    "reorder_point": 30,
    "shortage": 5,
    "alert_level": "critical"
  }
}
```

**Consumidores:** Notification Service, Purchasing Service

---

### inventory.stock.depleted

Stock agotado completamente.

```json
{
  "event": "inventory.stock.depleted",
  "data": {
    "stock_id": "stock_456",
    "variant_id": "var_789",
    "warehouse_id": "wh_101",
    "last_movement_at": "2025-11-23T14:00:00Z"
  }
}
```

---

## Movement Events

### inventory.movement.created

Movimiento de inventario registrado.

```json
{
  "event": "inventory.movement.created",
  "data": {
    "movement_id": "mov_123",
    "stock_id": "stock_456",
    "variant_id": "var_789",
    "warehouse_id": "wh_101",
    "type": "in",
    "reason": "purchase",
    "quantity_change": 50,
    "reference_id": "po_789",
    "reference_type": "purchase_order"
  }
}
```

---

### inventory.movement.in

Entrada de mercancía.

```json
{
  "event": "inventory.movement.in",
  "data": {
    "movement_id": "mov_123",
    "variant_id": "var_789",
    "warehouse_id": "wh_101",
    "quantity": 50,
    "lot_number": "LOT-2025-001",
    "expiry_date": "2026-12-31"
  }
}
```

---

### inventory.movement.out

Salida de mercancía.

```json
{
  "event": "inventory.movement.out",
  "data": {
    "movement_id": "mov_456",
    "variant_id": "var_789",
    "warehouse_id": "wh_101",
    "quantity": -25,
    "reason": "sale",
    "order_id": "order_456"
  }
}
```

---

## Warehouse Events

### inventory.warehouse.created

```json
{
  "event": "inventory.warehouse.created",
  "data": {
    "warehouse_id": "wh_new789",
    "name": "Bodega Sucursal Este",
    "code": "WH-005",
    "local_id": "local_789",
    "warehouse_type": "branch"
  }
}
```

---

### inventory.warehouse.updated

```json
{
  "event": "inventory.warehouse.updated",
  "data": {
    "warehouse_id": "wh_123",
    "changes": {
      "name": "Bodega Principal - Actualizada",
      "max_capacity": 12000
    }
  }
}
```

---

### inventory.warehouse.deactivated

```json
{
  "event": "inventory.warehouse.deactivated",
  "data": {
    "warehouse_id": "wh_123",
    "reason": "Mantenimiento programado",
    "deactivated_by": "user_789"
  }
}
```

---

## Transfer Events

### inventory.transfer.created

```json
{
  "event": "inventory.transfer.created",
  "data": {
    "transfer_id": "trans_123",
    "from_warehouse_id": "wh_001",
    "to_warehouse_id": "wh_002",
    "items_count": 5,
    "total_quantity": 150,
    "status": "pending"
  }
}
```

---

### inventory.transfer.approved

```json
{
  "event": "inventory.transfer.approved",
  "data": {
    "transfer_id": "trans_123",
    "approved_by": "user_789",
    "approval_date": "2025-11-23T14:00:00Z"
  }
}
```

---

### inventory.transfer.in_transit

```json
{
  "event": "inventory.transfer.in_transit",
  "data": {
    "transfer_id": "trans_123",
    "shipped_date": "2025-11-24T08:00:00Z",
    "items_shipped": 5,
    "total_quantity_sent": 145
  }
}
```

---

### inventory.transfer.received

```json
{
  "event": "inventory.transfer.received",
  "data": {
    "transfer_id": "trans_123",
    "received_date": "2025-11-25T10:00:00Z",
    "items_received": 5,
    "total_quantity_received": 140,
    "has_discrepancies": true,
    "discrepancies": [
      {
        "variant_id": "var_457",
        "sent": 95,
        "received": 90,
        "difference": -5
      }
    ]
  }
}
```

---

### inventory.transfer.cancelled

```json
{
  "event": "inventory.transfer.cancelled",
  "data": {
    "transfer_id": "trans_123",
    "reason": "Stock insuficiente en origen",
    "cancelled_by": "user_456"
  }
}
```

---

## Adjustment Events

### inventory.adjustment.created

```json
{
  "event": "inventory.adjustment.created",
  "data": {
    "adjustment_id": "adj_123",
    "stock_id": "stock_456",
    "variant_id": "var_789",
    "adjustment_type": "negative",
    "quantity_change": -5,
    "reason": "damaged",
    "status": "pending"
  }
}
```

---

### inventory.adjustment.approved

```json
{
  "event": "inventory.adjustment.approved",
  "data": {
    "adjustment_id": "adj_123",
    "approved_by": "user_789",
    "approval_date": "2025-11-23T14:00:00Z",
    "will_auto_apply": true
  }
}
```

---

### inventory.adjustment.rejected

```json
{
  "event": "inventory.adjustment.rejected",
  "data": {
    "adjustment_id": "adj_123",
    "rejected_by": "user_789",
    "rejection_reason": "Falta evidencia"
  }
}
```

---

### inventory.adjustment.applied

```json
{
  "event": "inventory.adjustment.applied",
  "data": {
    "adjustment_id": "adj_123",
    "stock_id": "stock_456",
    "quantity_before": 150,
    "quantity_after": 145,
    "movement_id": "mov_789"
  }
}
```

---

## Resumen de Eventos

| Categoría | Total | Eventos |
|-----------|-------|---------|
| Stock | 5 | updated, reserved, released, low_level, depleted |
| Movements | 3 | created, in, out |
| Warehouses | 3 | created, updated, deactivated |
| Transfers | 5 | created, approved, in_transit, received, cancelled |
| Adjustments | 4 | created, approved, rejected, applied |
| **Total** | **20** | |

## Configuración de Consumidores

```python
# Ejemplo de suscripción a eventos
queue_bindings = {
    'catalog_inventory_queue': [
        'inventory.stock.updated',
        'inventory.stock.low_level',
        'inventory.stock.depleted'
    ],
    'order_inventory_queue': [
        'inventory.stock.reserved',
        'inventory.stock.released',
        'inventory.stock.updated'
    ],
    'notification_queue': [
        'inventory.stock.low_level',
        'inventory.stock.depleted',
        'inventory.transfer.received'
    ]
}
```

## Próximos Pasos

- [Eventos Consumidos](./eventos-consumidos)
- [Integraciones](./integraciones)
