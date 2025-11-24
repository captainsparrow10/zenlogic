---
sidebar_position: 5
---

# Eventos Consumidos

## Configuración

```python
CONSUMER_CONFIG = {
    'reports_order_consumer': {
        'exchange': 'order_events',
        'queue': 'reports_order_queue',
        'routing_keys': [
            'order.completed',
            'order.cancelled'
        ]
    },
    'reports_pos_consumer': {
        'exchange': 'pos_events',
        'queue': 'reports_pos_queue',
        'routing_keys': [
            'pos.transaction.completed'
        ]
    },
    'reports_inventory_consumer': {
        'exchange': 'inventory_events',
        'queue': 'reports_inventory_queue',
        'routing_keys': [
            'inventory.stock.updated',
            'inventory.movement.created'
        ]
    }
}
```

## Order Events

### order.completed

**Acción:** Agregar a cache para reportes en tiempo real.

```python
async def handle_order_completed(event: dict):
    order_data = event['data']

    # Agregar a cache de ventas del día
    await redis.zadd(
        f"sales:daily:{today}",
        {order_data['order_id']: order_data['total_amount']}
    )

    # Actualizar métricas en tiempo real
    await metrics_service.increment_sales(
        amount=order_data['total_amount'],
        date=today
    )
```

## POS Events

### pos.transaction.completed

**Acción:** Similar a order.completed, actualizar métricas de ventas.

## Inventory Events

### inventory.stock.updated

**Acción:** Actualizar snapshot de inventario para reportes.

```python
async def handle_stock_updated(event: dict):
    variant_id = event['data']['variant_id']
    local_id = event['data']['local_id']
    new_quantity = event['data']['new_quantity']

    # Actualizar snapshot diario de inventario
    await inventory_snapshot_service.update(
        date=today,
        variant_id=variant_id,
        local_id=local_id,
        quantity=new_quantity
    )
```

## Próximos Pasos

- [Tipos de Reportes](./05-tipos-reportes.md)
- [Permisos](./06-permisos.md)
