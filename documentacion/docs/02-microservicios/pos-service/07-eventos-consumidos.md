---
sidebar_position: 8
---

# Eventos Consumidos

Eventos de otros servicios que POS Service consume.

## Configuración de Consumidores

```python
CONSUMER_CONFIG = {
    'pos_catalog_consumer': {
        'exchange': 'catalog_events',
        'queue': 'pos_catalog_queue',
        'routing_keys': [
            'catalog.product.updated',
            'catalog.product.deleted',
            'catalog.variant.updated',
            'catalog.variant.deleted'
        ]
    },
    'pos_inventory_consumer': {
        'exchange': 'inventory_events',
        'queue': 'pos_inventory_queue',
        'routing_keys': [
            'inventory.stock.updated',
            'inventory.stock.low'
        ]
    },
    'pos_pricing_consumer': {
        'exchange': 'pricing_events',
        'queue': 'pos_pricing_queue',
        'routing_keys': [
            'pricing.promotion.activated',
            'pricing.promotion.deactivated',
            'pricing.price.updated'
        ]
    }
}
```

## Catalog Events

### catalog.product.updated

**Acción:** Invalidar cache de producto.

```python
async def handle_product_updated(event: dict):
    variant_id = event['data']['variant_id']

    # Invalidar cache
    await cache_manager.invalidate_product(variant_id)

    logger.info(f"Cache invalidated for variant {variant_id}")
```

### catalog.product.deleted

**Acción:** Invalidar cache y marcar como no disponible.

```python
async def handle_product_deleted(event: dict):
    variant_id = event['data']['variant_id']

    # Invalidar cache
    await cache_manager.invalidate_product(variant_id)

    # Marcar como no disponible en transacciones abiertas
    await transaction_service.remove_deleted_product_from_open_transactions(variant_id)
```

## Inventory Events

### inventory.stock.updated

**Acción:** Actualizar disponibilidad en cache.

```python
async def handle_stock_updated(event: dict):
    variant_id = event['data']['variant_id']
    local_id = event['data']['local_id']
    new_quantity = event['data']['new_quantity']

    # Actualizar cache de stock
    cache_key = f"stock:{local_id}:{variant_id}"
    await redis.setex(cache_key, 300, new_quantity)  # 5 minutos

    # Si stock es 0, notificar a cajeras activas
    if new_quantity == 0:
        await notify_cashiers_out_of_stock(local_id, variant_id)
```

### inventory.stock.low

**Acción:** Notificar a cajeras sobre bajo stock.

```python
async def handle_stock_low(event: dict):
    variant_id = event['data']['variant_id']
    local_id = event['data']['local_id']
    current_quantity = event['data']['current_quantity']
    threshold = event['data']['threshold']

    # Notificar a POS terminals activos en el local
    await websocket_manager.broadcast_to_local(
        local_id,
        {
            'type': 'stock_warning',
            'variant_id': variant_id,
            'message': f'Quedan solo {current_quantity} unidades'
        }
    )
```

## Pricing Events

### pricing.promotion.activated

**Acción:** Actualizar promociones activas en cache.

```python
async def handle_promotion_activated(event: dict):
    promotion_id = event['data']['promotion_id']
    promotion_data = event['data']

    # Cachear promoción activa
    cache_key = f"promotion:{promotion_id}"
    await redis.setex(
        cache_key,
        1800,  # 30 minutos
        json.dumps(promotion_data)
    )

    # Notificar a POS terminals
    await websocket_manager.broadcast_all({
        'type': 'promotion_activated',
        'promotion': promotion_data
    })
```

### pricing.promotion.deactivated

**Acción:** Remover promoción del cache.

```python
async def handle_promotion_deactivated(event: dict):
    promotion_id = event['data']['promotion_id']

    # Invalidar cache
    cache_key = f"promotion:{promotion_id}"
    await redis.delete(cache_key)

    # Notificar a POS terminals
    await websocket_manager.broadcast_all({
        'type': 'promotion_deactivated',
        'promotion_id': promotion_id
    })
```

### pricing.price.updated

**Acción:** Actualizar precio en cache.

```python
async def handle_price_updated(event: dict):
    variant_id = event['data']['variant_id']
    new_price = event['data']['new_price']

    # Actualizar cache de precio
    cache_key = f"price:{variant_id}"
    await redis.setex(
        cache_key,
        900,  # 15 minutos
        new_price
    )

    # Invalidar cache completo del producto
    await cache_manager.invalidate_product(variant_id)
```

## Resumen de Eventos Consumidos

| Servicio | Evento | Acción |
|----------|--------|--------|
| **Catalog** | `product.updated` | Invalidar cache |
| **Catalog** | `product.deleted` | Invalidar cache y remover de transacciones abiertas |
| **Inventory** | `stock.updated` | Actualizar stock en cache |
| **Inventory** | `stock.low` | Notificar a cajeras |
| **Pricing** | `promotion.activated` | Cachear promoción |
| **Pricing** | `promotion.deactivated` | Remover promoción |
| **Pricing** | `price.updated` | Actualizar precio en cache |

## Próximos Pasos

- [Integraciones](./08-integraciones.md)
- [Modo Offline](./09-modo-offline.md)
