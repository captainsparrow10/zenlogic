---
sidebar_position: 6
---

# Eventos Publicados

Eventos que Catalog Service publica a RabbitMQ para comunicación asíncrona.

## Exchange Configuration

```python
EXCHANGE_NAME = "catalog_events"
EXCHANGE_TYPE = "topic"
```

## Routing Keys Pattern

```
catalog.{entity}.{action}
```

- **entity**: `product`, `variant`, `option`
- **action**: `created`, `updated`, `deleted`, `activated`, `deactivated`

## Eventos de Productos

### catalog.product.created

**Cuándo se publica**: Cuando se crea un nuevo producto.

**Routing Key**: `catalog.product.created`

**Payload**:

```json
{
  "event": "catalog.product.created",
  "timestamp": "2025-11-23T15:30:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "data": {
    "product_id": "uuid-123",
    "organization_id": "org-uuid",
    "name": "Camiseta Básica",
    "sku": "CAM-001",
    "category": "Ropa",
    "description": "Camiseta de algodón 100%",
    "base_price": 19.99,
    "is_active": true,
    "created_by": "user-uuid",
    "created_at": "2025-11-23T15:30:00Z"
  }
}
```

### catalog.product.updated

**Cuándo se publica**: Cuando se actualiza un producto existente.

**Routing Key**: `catalog.product.updated`

**Payload**:

```json
{
  "event": "catalog.product.updated",
  "timestamp": "2025-11-23T16:00:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "data": {
    "product_id": "uuid-123",
    "organization_id": "org-uuid",
    "changes": {
      "name": {
        "old": "Camiseta Básica",
        "new": "Camiseta Premium"
      },
      "base_price": {
        "old": 19.99,
        "new": 29.99
      }
    },
    "updated_by": "user-uuid",
    "updated_at": "2025-11-23T16:00:00Z"
  }
}
```

### catalog.product.deleted

**Cuándo se publica**: Cuando se elimina un producto (soft delete).

**Routing Key**: `catalog.product.deleted`

**Payload**:

```json
{
  "event": "catalog.product.deleted",
  "timestamp": "2025-11-23T17:00:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "data": {
    "product_id": "uuid-123",
    "organization_id": "org-uuid",
    "variant_ids": ["variant-uuid-1", "variant-uuid-2", "variant-uuid-3"],
    "deleted_by": "user-uuid",
    "deleted_at": "2025-11-23T17:00:00Z",
    "reason": "Producto descontinuado"
  }
}
```

### catalog.product.activated

**Cuándo se publica**: Cuando se activa un producto previamente inactivo.

**Routing Key**: `catalog.product.activated`

**Payload**:

```json
{
  "event": "catalog.product.activated",
  "timestamp": "2025-11-23T18:00:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "data": {
    "product_id": "uuid-123",
    "organization_id": "org-uuid",
    "activated_by": "user-uuid",
    "activated_at": "2025-11-23T18:00:00Z"
  }
}
```

### catalog.product.deactivated

**Cuándo se publica**: Cuando se desactiva un producto.

**Routing Key**: `catalog.product.deactivated`

**Payload**:

```json
{
  "event": "catalog.product.deactivated",
  "timestamp": "2025-11-23T19:00:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "data": {
    "product_id": "uuid-123",
    "organization_id": "org-uuid",
    "deactivated_by": "user-uuid",
    "deactivated_at": "2025-11-23T19:00:00Z",
    "reason": "Fuera de stock permanente"
  }
}
```

## Eventos de Variantes

### catalog.variant.created

**Cuándo se publica**: Cuando se crea una variante de producto.

**Routing Key**: `catalog.variant.created`

**Payload**:

```json
{
  "event": "catalog.variant.created",
  "timestamp": "2025-11-23T15:45:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "data": {
    "variant_id": "variant-uuid",
    "product_id": "product-uuid",
    "organization_id": "org-uuid",
    "sku": "CAM-001-ROJO-M",
    "barcode": "7501234567890",
    "name": "Camiseta Roja - M",
    "price": 29.99,
    "warehouse_id": "wh_101",
    "options": [
      {"option_name": "Color", "value": "Rojo"},
      {"option_name": "Talla", "value": "M"}
    ],
    "is_active": true,
    "track_inventory": true,
    "default_min_stock": 20,
    "default_max_stock": 200,
    "created_by": "user-uuid",
    "created_at": "2025-11-23T15:45:00Z"
  }
}
```

### catalog.variant.updated

**Cuándo se publica**: Cuando se actualiza una variante.

**Routing Key**: `catalog.variant.updated`

**Payload**:

```json
{
  "event": "catalog.variant.updated",
  "timestamp": "2025-11-23T16:15:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "data": {
    "variant_id": "variant-uuid",
    "product_id": "product-uuid",
    "organization_id": "org-uuid",
    "changes": {
      "price": {
        "old": 29.99,
        "new": 34.99
      }
    },
    "updated_by": "user-uuid",
    "updated_at": "2025-11-23T16:15:00Z"
  }
}
```

### catalog.variant.deleted

**Cuándo se publica**: Cuando se elimina una variante.

**Routing Key**: `catalog.variant.deleted`

**Payload**:

```json
{
  "event": "catalog.variant.deleted",
  "timestamp": "2025-11-23T17:30:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "data": {
    "variant_id": "variant-uuid",
    "product_id": "product-uuid",
    "organization_id": "org-uuid",
    "deleted_by": "user-uuid",
    "deleted_at": "2025-11-23T17:30:00Z"
  }
}
```

## Eventos de Opciones

### catalog.option.created

**Cuándo se publica**: Cuando se crea una opción de producto (Color, Talla, etc.).

**Routing Key**: `catalog.option.created`

**Payload**:

```json
{
  "event": "catalog.option.created",
  "timestamp": "2025-11-23T14:00:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "data": {
    "option_id": "option-uuid",
    "organization_id": "org-uuid",
    "name": "Talla",
    "values": ["XS", "S", "M", "L", "XL"],
    "created_by": "user-uuid",
    "created_at": "2025-11-23T14:00:00Z"
  }
}
```

### catalog.option.updated

**Cuándo se publica**: Cuando se actualiza una opción.

**Routing Key**: `catalog.option.updated`

**Payload**:

```json
{
  "event": "catalog.option.updated",
  "timestamp": "2025-11-23T14:30:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "data": {
    "option_id": "option-uuid",
    "organization_id": "org-uuid",
    "changes": {
      "values": {
        "old": ["XS", "S", "M", "L", "XL"],
        "new": ["XS", "S", "M", "L", "XL", "XXL"]
      }
    },
    "updated_by": "user-uuid",
    "updated_at": "2025-11-23T14:30:00Z"
  }
}
```

### catalog.option.deleted

**Cuándo se publica**: Cuando se elimina una opción.

**Routing Key**: `catalog.option.deleted`

**Payload**:

```json
{
  "event": "catalog.option.deleted",
  "timestamp": "2025-11-23T18:30:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "data": {
    "option_id": "option-uuid",
    "organization_id": "org-uuid",
    "deleted_by": "user-uuid",
    "deleted_at": "2025-11-23T18:30:00Z"
  }
}
```

## Implementación

### Event Publisher

```python
import json
from typing import Dict, Any
from datetime import datetime
import aio_pika
from config.settings import settings

class EventPublisher:
    """Publisher de eventos a RabbitMQ."""

    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange = None

    async def connect(self):
        """Conectar a RabbitMQ."""
        self.connection = await aio_pika.connect_robust(
            settings.rabbitmq_url
        )
        self.channel = await self.connection.channel()
        self.exchange = await self.channel.declare_exchange(
            settings.rabbitmq_exchange_catalog,
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

    async def publish(
        self,
        event_type: str,
        data: Dict[str, Any]
    ):
        """
        Publicar un evento.

        Args:
            event_type: Tipo de evento (ej: 'catalog.product.created')
            data: Datos del evento
        """
        event = {
            "event": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "service": settings.service_name,
            "version": "1.0",
            "organization_id": data.get("organization_id"),
            "data": data
        }

        message = aio_pika.Message(
            body=json.dumps(event).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            content_type="application/json"
        )

        await self.exchange.publish(
            message,
            routing_key=event_type
        )

    async def close(self):
        """Cerrar conexión."""
        if self.connection:
            await self.connection.close()
```

### Uso en Service Layer

```python
from app.events.publisher import EventPublisher

class ProductService:
    def __init__(
        self,
        product_repo: ProductRepository,
        event_publisher: EventPublisher
    ):
        self.product_repo = product_repo
        self.event_publisher = event_publisher

    async def create_product(
        self,
        product_data: ProductCreate,
        user_id: str,
        organization_id: str
    ) -> Product:
        """Crear producto y publicar evento."""

        # Crear producto
        product = await self.product_repo.create(
            product_data,
            organization_id
        )

        # Publicar evento
        await self.event_publisher.publish(
            event_type="catalog.product.created",
            data={
                "product_id": str(product.id),
                "organization_id": organization_id,
                "name": product.name,
                "sku": product.sku,
                "category": product.category,
                "base_price": float(product.base_price),
                "is_active": product.is_active,
                "created_by": user_id,
                "created_at": product.created_at.isoformat()
            }
        )

        return product

    async def delete_product(
        self,
        product_id: str,
        user_id: str,
        organization_id: str,
        reason: str = None
    ) -> None:
        """Eliminar producto y publicar evento con variant_ids."""

        # Obtener todas las variantes del producto antes de eliminar
        variants = await self.product_repo.get_variants(product_id)
        variant_ids = [str(v.id) for v in variants]

        # Soft delete del producto
        await self.product_repo.soft_delete(product_id)

        # Publicar evento con variant_ids para Inventory Service
        await self.event_publisher.publish(
            event_type="catalog.product.deleted",
            data={
                "product_id": product_id,
                "organization_id": organization_id,
                "variant_ids": variant_ids,
                "deleted_by": user_id,
                "deleted_at": datetime.utcnow().isoformat(),
                "reason": reason
            }
        )
```

## Consumidores Esperados

Estos eventos son consumidos por:

1. **Audit Service** - Registra todos los eventos para auditoría
2. **Inventory Service** - Actualiza inventarios cuando cambian productos/variantes
3. **Order Service** - Valida disponibilidad de productos
4. **Analytics Service** - Genera reportes de cambios en catálogo

## Garantías

- **At-Least-Once Delivery**: Los eventos pueden ser entregados más de una vez
- **Persistencia**: Mensajes marcados como `PERSISTENT`
- **Orden**: No garantizado entre diferentes routing keys
- **Idempotencia**: Los consumidores deben implementar manejo idempotente

## Monitoreo

### Logs de Eventos Publicados

```python
import logging

logger = logging.getLogger(__name__)

async def publish_with_logging(event_type: str, payload: dict):
    logger.info(
        f"Publishing event: {event_type}",
        extra={
            "event": event_type,
            "product_id": payload.get("product_id"),
            "organization_id": payload.get("organization_id")
        }
    )
    await event_publisher.publish(event_type, payload)
```

## Próximos Pasos

- [Eventos Consumidos](/microservicios/catalog-service/eventos-consumidos)
- [Arquitectura Event-Driven](/arquitectura/arquitectura-event-driven)
- [Audit Service](/microservicios/audit-service/overview)
