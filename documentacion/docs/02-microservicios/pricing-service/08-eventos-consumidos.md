---
sidebar_position: 9
---

# Eventos Consumidos

## Configuración

```python
CONSUMER_CONFIG = {
    'pricing_catalog_consumer': {
        'exchange': 'catalog_events',
        'queue': 'pricing_catalog_queue',
        'routing_keys': [
            'catalog.product.deleted',
            'catalog.variant.deleted'
        ]
    }
}
```

## Catalog Events

### catalog.product.deleted

**Acción:** Eliminar precios asociados.

```python
async def handle_product_deleted(event: dict):
    variant_id = event['data']['variant_id']

    await price_service.delete_prices_by_variant(variant_id)
    await promotion_service.remove_variant_from_promotions(variant_id)
```

### catalog.variant.deleted

**Acción:** Similar a product.deleted.

## Próximos Pasos

- [Integraciones](./09-integraciones.md)
- [Tipos de Promociones](./10-tipos-promociones.md)
