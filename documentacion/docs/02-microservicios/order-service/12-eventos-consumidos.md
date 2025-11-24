---
sidebar_position: 12
---

# Eventos Consumidos

Eventos que Order Service consume de otros servicios para mantener sincronización y responder a cambios.

## Configuración de Consumidores

```python
EVENT_CONSUMER_CONFIG = {
    'inventory_consumer': {
        'exchange': 'inventory_events',
        'exchange_type': 'topic',
        'queue': 'order_inventory_consumer',
        'routing_keys': [
            'inventory.stock.updated',
            'inventory.stock.depleted',
            'inventory.stock.reserved',
            'inventory.stock.released'
        ],
        'prefetch_count': 20,
        'auto_ack': False
    },
    'catalog_consumer': {
        'exchange': 'catalog_events',
        'exchange_type': 'topic',
        'queue': 'order_catalog_consumer',
        'routing_keys': [
            'catalog.product.updated',
            'catalog.variant.updated',
            'catalog.product.deleted',
            'catalog.variant.deleted'
        ],
        'prefetch_count': 20,
        'auto_ack': False
    },
    'payment_webhooks': {
        # Webhooks de payment gateways se reciben vía HTTP, no RabbitMQ
        # Se procesan en endpoints específicos: /webhooks/stripe, /webhooks/paypal, etc.
    }
}
```

---

## Eventos de Inventory Service

### inventory.stock.updated

**Trigger:** Inventory actualiza stock (entrada, salida, ajuste)

**Acción:** Invalidar cache de disponibilidad de producto

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

**Handler Implementation:**

```python
async def handle_inventory_stock_updated(event: Dict[str, Any]) -> None:
    """
    Handle stock update events from Inventory Service.

    - Invalidate cache for product availability
    - Update cart items if stock became unavailable
    - Notify customers with pending carts if stock became available
    """
    variant_id = event['data']['variant_id']
    warehouse_id = event['data']['warehouse_id']
    new_available = event['data']['quantities']['available']
    old_available = event['data']['previous_quantities']['available']

    # Invalidar cache de disponibilidad
    await redis_client.delete(f"stock:availability:{variant_id}:{warehouse_id}")

    # Si stock se agotó, notificar carritos activos
    if old_available > 0 and new_available == 0:
        await notify_carts_with_variant(variant_id, "stock_depleted")

    # Si stock se recuperó, notificar usuarios en waitlist
    if old_available == 0 and new_available > 0:
        await notify_waitlist(variant_id, warehouse_id)
```

---

### inventory.stock.depleted

**Trigger:** Stock de una variante llega a 0

**Acción:** Marcar producto como agotado en carritos activos

```json
{
  "event": "inventory.stock.depleted",
  "version": "1.0",
  "timestamp": "2025-11-23T14:00:00Z",
  "organization_id": "org_123",
  "data": {
    "stock_id": "stock_456",
    "variant_id": "var_789",
    "warehouse_id": "wh_101",
    "last_movement_at": "2025-11-23T14:00:00Z"
  }
}
```

**Handler Implementation:**

```python
async def handle_inventory_stock_depleted(event: Dict[str, Any]) -> None:
    """
    Handle stock depleted events.

    - Mark variant as out of stock in carts
    - Prevent new cart additions
    - Notify customers with items in cart
    """
    variant_id = event['data']['variant_id']
    warehouse_id = event['data']['warehouse_id']

    # Buscar carritos activos con esta variante
    carts = await cart_repo.find_active_carts_with_variant(variant_id)

    for cart in carts:
        # Marcar item como no disponible
        await cart_repo.mark_item_unavailable(
            cart.cart_id,
            variant_id,
            reason="out_of_stock"
        )

        # Notificar al cliente
        await notification_service.send(
            cart.customer_id,
            "cart_item_out_of_stock",
            {"variant_id": variant_id, "cart_id": cart.cart_id}
        )
```

---

### inventory.stock.reserved

**Trigger:** Inventory confirma reserva de stock (respuesta a order.placed)

**Acción:** Actualizar orden con reservation_id

```json
{
  "event": "inventory.stock.reserved",
  "version": "1.0",
  "timestamp": "2025-11-23T15:01:00Z",
  "organization_id": "org_123",
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
    "expires_at": "2025-11-23T15:16:00Z"
  }
}
```

**Handler Implementation:**

```python
async def handle_inventory_stock_reserved(event: Dict[str, Any]) -> None:
    """
    Handle stock reservation confirmation.

    - Update order with reservation_id
    - Set reservation expiration timer
    - Update order status if needed
    """
    order_id = event['data']['order_id']
    reservation_id = event['data']['reservation_id']
    expires_at = datetime.fromisoformat(event['data']['expires_at'])

    # Actualizar orden con reservation_id
    await order_repo.update(
        order_id=order_id,
        reservation_id=reservation_id
    )

    # Programar job para liberar reserva si no se confirma pago a tiempo
    await task_queue.schedule(
        task='release_expired_reservation',
        args={'reservation_id': reservation_id, 'order_id': order_id},
        eta=expires_at
    )

    logger.info(f"Reservation {reservation_id} confirmed for order {order_id}")
```

---

### inventory.stock.released

**Trigger:** Inventory libera reserva (timeout o cancelación)

**Acción:** Actualizar estado de orden si es necesario

```json
{
  "event": "inventory.stock.released",
  "version": "1.0",
  "timestamp": "2025-11-23T15:20:00Z",
  "organization_id": "org_123",
  "data": {
    "reservation_id": "res_123",
    "order_id": "order_456",
    "reason": "timeout",
    "items_released": 2,
    "total_quantity_released": 15
  }
}
```

**Handler Implementation:**

```python
async def handle_inventory_stock_released(event: Dict[str, Any]) -> None:
    """
    Handle stock reservation release.

    - Check if order payment is still pending
    - Cancel order if reservation expired due to timeout
    - Log release reason
    """
    order_id = event['data']['order_id']
    reservation_id = event['data']['reservation_id']
    reason = event['data']['reason']

    order = await order_repo.find_by_id(order_id)

    if not order:
        logger.warning(f"Order {order_id} not found for released reservation")
        return

    # Si la reserva expiró por timeout y el pago aún está pendiente
    if reason == 'timeout' and order.status == 'payment_pending':
        await order_service.cancel_order(
            order_id=order_id,
            reason='payment_timeout',
            auto_cancelled=True
        )

        # Notificar cliente
        await notification_service.send(
            order.customer_id,
            "order_cancelled_timeout",
            {"order_number": order.order_number}
        )

    logger.info(f"Reservation {reservation_id} released for order {order_id}, reason: {reason}")
```

---

## Eventos de Catalog Service

### catalog.product.updated

**Trigger:** Catalog actualiza información de producto

**Acción:** Invalidar cache, no afectar órdenes existentes (snapshot)

```json
{
  "event": "catalog.product.updated",
  "version": "1.0",
  "timestamp": "2025-11-23T16:00:00Z",
  "organization_id": "org_123",
  "data": {
    "product_id": "prod_123",
    "organization_id": "org_123",
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
    "updated_by": "user_456",
    "updated_at": "2025-11-23T16:00:00Z"
  }
}
```

**Handler Implementation:**

```python
async def handle_catalog_product_updated(event: Dict[str, Any]) -> None:
    """
    Handle product updates from Catalog Service.

    - Invalidate product cache
    - Update active carts with new pricing (optional)
    - Existing orders are NOT affected (they have snapshots)
    """
    product_id = event['data']['product_id']
    changes = event['data']['changes']

    # Invalidar cache de producto
    await redis_client.delete(f"product:{product_id}")

    # Si el precio cambió, actualizar carritos activos (opcional - decisión de negocio)
    if 'base_price' in changes:
        # Opción A: No actualizar (carritos mantienen precio anterior)
        pass

        # Opción B: Actualizar carritos (mostrar nuevo precio)
        # await update_carts_with_new_price(product_id, changes['base_price']['new'])

    logger.info(f"Product {product_id} updated in catalog")
```

---

### catalog.variant.updated

**Trigger:** Catalog actualiza variante (precio, SKU, etc.)

**Acción:** Invalidar cache de variante, actualizar carritos activos

```json
{
  "event": "catalog.variant.updated",
  "version": "1.0",
  "timestamp": "2025-11-23T16:15:00Z",
  "organization_id": "org_123",
  "data": {
    "variant_id": "var_789",
    "product_id": "prod_123",
    "organization_id": "org_123",
    "changes": {
      "price": {
        "old": 29.99,
        "new": 34.99
      }
    },
    "updated_by": "user_456",
    "updated_at": "2025-11-23T16:15:00Z"
  }
}
```

**Handler Implementation:**

```python
async def handle_catalog_variant_updated(event: Dict[str, Any]) -> None:
    """
    Handle variant updates.

    - Invalidate variant cache
    - Update active carts with new pricing
    - Notify customers if price increased significantly
    """
    variant_id = event['data']['variant_id']
    changes = event['data']['changes']

    # Invalidar cache
    await redis_client.delete(f"variant:{variant_id}")

    # Si el precio cambió
    if 'price' in changes:
        old_price = changes['price']['old']
        new_price = changes['price']['new']
        price_increase = new_price - old_price

        # Actualizar carritos activos
        await cart_service.update_variant_price(variant_id, new_price)

        # Si el aumento es > 10%, notificar clientes
        if price_increase / old_price > 0.10:
            await notify_price_increase(variant_id, old_price, new_price)
```

---

### catalog.product.deleted

**Trigger:** Catalog elimina producto

**Acción:** Remover de carritos activos, no afectar órdenes confirmadas

```json
{
  "event": "catalog.product.deleted",
  "version": "1.0",
  "timestamp": "2025-11-23T17:00:00Z",
  "organization_id": "org_123",
  "data": {
    "product_id": "prod_123",
    "organization_id": "org_123",
    "variant_ids": ["var_456", "var_789", "var_101"],
    "deleted_by": "user_456",
    "deleted_at": "2025-11-23T17:00:00Z",
    "reason": "Producto descontinuado"
  }
}
```

**Handler Implementation:**

```python
async def handle_catalog_product_deleted(event: Dict[str, Any]) -> None:
    """
    Handle product deletion.

    - Remove product from all active carts
    - Cancel pending orders with this product (if not yet confirmed)
    - Notify affected customers
    """
    product_id = event['data']['product_id']
    variant_ids = event['data']['variant_ids']

    # Remover de carritos activos
    for variant_id in variant_ids:
        carts_affected = await cart_repo.remove_variant_from_carts(variant_id)

        # Notificar clientes afectados
        for cart in carts_affected:
            await notification_service.send(
                cart.customer_id,
                "cart_item_removed",
                {
                    "variant_id": variant_id,
                    "reason": "product_discontinued"
                }
            )

    # Cancelar órdenes pendientes (aún no confirmadas)
    pending_orders = await order_repo.find_pending_orders_with_variants(variant_ids)

    for order in pending_orders:
        if order.status in ['pending', 'payment_pending']:
            await order_service.cancel_order(
                order_id=order.order_id,
                reason='product_discontinued',
                auto_cancelled=True
            )
```

---

### catalog.variant.deleted

**Trigger:** Catalog elimina variante específica

**Acción:** Similar a product.deleted pero solo para esa variante

```json
{
  "event": "catalog.variant.deleted",
  "version": "1.0",
  "timestamp": "2025-11-23T17:30:00Z",
  "organization_id": "org_123",
  "data": {
    "variant_id": "var_789",
    "product_id": "prod_123",
    "organization_id": "org_123",
    "deleted_by": "user_456",
    "deleted_at": "2025-11-23T17:30:00Z"
  }
}
```

---

## Payment Gateway Webhooks

Los webhooks de payment gateways se reciben vía HTTP POST, no vía RabbitMQ.

### Stripe Webhook

```python
@app.post("/api/v1/webhooks/stripe")
async def stripe_webhook(request: Request):
    """
    Handle Stripe payment webhooks.

    Eventos importantes:
    - payment_intent.succeeded
    - payment_intent.payment_failed
    - charge.refunded
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        return JSONResponse(status_code=400, content={"error": "Invalid payload"})
    except stripe.error.SignatureVerificationError:
        return JSONResponse(status_code=400, content={"error": "Invalid signature"})

    # Manejar evento
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        await handle_payment_succeeded(payment_intent)

    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        await handle_payment_failed(payment_intent)

    elif event['type'] == 'charge.refunded':
        charge = event['data']['object']
        await handle_payment_refunded(charge)

    return JSONResponse(content={"status": "success"})


async def handle_payment_succeeded(payment_intent):
    """Handle successful payment."""
    # Buscar pago por gateway_payment_id
    payment = await payment_repo.find_by_gateway_id(payment_intent['id'])

    if payment:
        # Actualizar estado de pago
        await payment_repo.update(
            payment_id=payment.payment_id,
            status='succeeded',
            paid_at=datetime.now()
        )

        # Actualizar orden a confirmed
        await order_service.confirm_order(payment.order_id)

        # Confirmar reserva de stock en Inventory
        order = await order_repo.find_by_id(payment.order_id)
        if order.reservation_id:
            await inventory_client.confirm_reservation(
                organization_id=order.organization_id,
                reservation_id=order.reservation_id,
                order_id=order.order_id
            )

        # Publicar evento order.confirmed
        await event_publisher.publish('order.confirmed', {...})
```

---

## Resumen de Eventos Consumidos

| Servicio | Exchange | Total Eventos | Eventos Críticos |
|----------|----------|---------------|------------------|
| **Inventory** | inventory_events | 4 | stock.reserved, stock.released |
| **Catalog** | catalog_events | 4 | variant.updated, product.deleted |
| **Payment Gateways** | HTTP Webhooks | 3+ | payment.succeeded, payment.failed |
| **TOTAL** | | **11+** | |

---

## Event Consumer Service

```python
import asyncio
from app.events.handlers import inventory_handlers, catalog_handlers
from app.config.rabbitmq import RabbitMQConsumer

async def start_event_consumers():
    """Start all event consumers."""

    # Inventory consumer
    inventory_consumer = RabbitMQConsumer(
        exchange='inventory_events',
        queue='order_inventory_consumer',
        routing_keys=[
            'inventory.stock.updated',
            'inventory.stock.depleted',
            'inventory.stock.reserved',
            'inventory.stock.released'
        ]
    )

    await inventory_consumer.start(
        handlers={
            'inventory.stock.updated': inventory_handlers.handle_stock_updated,
            'inventory.stock.depleted': inventory_handlers.handle_stock_depleted,
            'inventory.stock.reserved': inventory_handlers.handle_stock_reserved,
            'inventory.stock.released': inventory_handlers.handle_stock_released
        }
    )

    # Catalog consumer
    catalog_consumer = RabbitMQConsumer(
        exchange='catalog_events',
        queue='order_catalog_consumer',
        routing_keys=[
            'catalog.product.updated',
            'catalog.variant.updated',
            'catalog.product.deleted',
            'catalog.variant.deleted'
        ]
    )

    await catalog_consumer.start(
        handlers={
            'catalog.product.updated': catalog_handlers.handle_product_updated,
            'catalog.variant.updated': catalog_handlers.handle_variant_updated,
            'catalog.product.deleted': catalog_handlers.handle_product_deleted,
            'catalog.variant.deleted': catalog_handlers.handle_variant_deleted
        }
    )

    logger.info("All event consumers started")
```

---

## Próximos Pasos

- [Eventos Publicados](./eventos-publicados)
- [Integraciones](./integraciones)
- [Flujos de Negocio](./flujos-negocio)
