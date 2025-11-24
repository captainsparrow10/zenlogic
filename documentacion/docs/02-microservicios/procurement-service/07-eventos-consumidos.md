---
sidebar_position: 8
---

# Eventos Consumidos

## Configuración

```python
CONSUMER_CONFIG = {
    'procurement_catalog_consumer': {
        'exchange': 'catalog_events',
        'queue': 'procurement_catalog_queue',
        'routing_keys': [
            'catalog.product.created',
            'catalog.product.updated'
        ]
    }
}
```

## Catalog Events

### catalog.product.created

**Acción:** Registrar nuevo producto disponible para compra.

```python
async def handle_product_created(event: dict):
    variant_id = event['data']['variant_id']
    product_name = event['data']['product_name']

    # Actualizar cache de productos disponibles
    await procurement_cache.add_purchasable_product(variant_id, product_name)
```

## Próximos Pasos

- [Integraciones](./08-integraciones.md)
- [Configuración](./09-configuracion.md)
