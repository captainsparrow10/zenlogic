---
sidebar_position: 6
---

# Eventos y Mensajería (RabbitMQ)

Sistema centralizado de eventos asíncronos para comunicación entre microservicios.

## Arquitectura de Mensajería

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              RabbitMQ                                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Exchange: erp.events                            │ │
│  │                        Type: topic                                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│         │                    │                    │                    │    │
│         ▼                    ▼                    ▼                    ▼    │
│   ┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐ │
│   │ queue:   │        │ queue:   │        │ queue:   │        │ queue:   │ │
│   │ inventory│        │ audit    │        │ reports  │        │ pricing  │ │
│   │ .events  │        │ .events  │        │ .events  │        │ .events  │ │
│   └──────────┘        └──────────┘        └──────────┘        └──────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ Inventory│        │  Audit   │        │ Reports  │        │ Pricing  │
   │ Service  │        │ Service  │        │ Service  │        │ Service  │
   └──────────┘        └──────────┘        └──────────┘        └──────────┘
```

## Convención de Nombres

### Formato de Routing Key

```
{servicio}.{entidad}.{accion}
```

**Ejemplos:**
- `catalog.product.created`
- `inventory.stock.low_level`
- `order.completed`
- `auth.user.deactivated`

### Estructura de Mensaje

```json
{
  "event_id": "evt_abc123",
  "event": "catalog.product.created",
  "version": "1.0",
  "timestamp": "2025-01-15T10:30:00Z",
  "organization_id": "org_123",
  "correlation_id": "req_xyz789",
  "service": "catalog-service",
  "data": {
    // Payload específico del evento
  }
}
```

## Catálogo de Eventos

### Auth Service (16 eventos)

| Evento | Descripción | Consumidores |
|--------|-------------|--------------|
| `auth.user.created` | Usuario creado | Audit, Customer |
| `auth.user.updated` | Usuario actualizado | Audit |
| `auth.user.deleted` | Usuario eliminado permanentemente | Audit, todas las caches |
| `auth.user.deactivated` | Usuario desactivado | Audit, todas las caches |
| `auth.user.password_changed` | Contraseña cambiada | Audit |
| `auth.role.created` | Rol creado | Audit |
| `auth.role.updated` | Rol modificado | Audit |
| `auth.role.deleted` | Rol eliminado | Audit |
| `auth.role.permissions_changed` | Permisos de rol cambiaron | Audit |
| `auth.permission.changed` | Permisos directos cambiaron | Audit |
| `auth.organization.created` | Organización creada | Audit |
| `auth.organization.updated` | Organización actualizada | Audit |
| `auth.organization.module_enabled` | Módulo habilitado en organización | Audit |
| `auth.organization.suspended` | Organización suspendida | Audit, todas las caches |
| `auth.local.created` | Local/sucursal creado | Audit, Inventory |
| `auth.session.created` | Sesión iniciada | Audit |
| `auth.session.expired` | Sesión expirada | Audit |
| `auth.session.revoked` | Sesión revocada manualmente | Audit |

### Catalog Service (12 eventos)

| Evento | Descripción | Consumidores |
|--------|-------------|--------------|
| `catalog.product.created` | Producto creado | Audit, Reports |
| `catalog.product.updated` | Producto actualizado | Audit, Pricing, POS cache |
| `catalog.product.activated` | Producto activado | Inventory, POS |
| `catalog.product.deactivated` | Producto desactivado | Inventory, POS |
| `catalog.product.deleted` | Producto eliminado | Inventory, Pricing, POS |
| `catalog.variant.created` | Variante creada | Inventory, Audit |
| `catalog.variant.updated` | Variante actualizada | Pricing, POS cache |
| `catalog.variant.deleted` | Variante eliminada | Inventory, Pricing |
| `catalog.option.created` | Opción de producto creada | Audit |
| `catalog.option.updated` | Opción de producto actualizada | Audit |
| `catalog.option.deleted` | Opción de producto eliminada | Audit |
| `catalog.price.updated` | Precio base actualizado | Pricing (sync) |

### Inventory Service (20 eventos)

| Evento | Descripción | Consumidores |
|--------|-------------|--------------|
| `inventory.stock.updated` | Stock actualizado | Reports, POS cache |
| `inventory.stock.low_level` | Stock bajo mínimo | Procurement, Notifications |
| `inventory.stock.depleted` | Stock agotado completamente | POS, Notifications |
| `inventory.stock.out` | Sin stock disponible | POS, Notifications |
| `inventory.stock.reserved` | Stock reservado para orden | Order |
| `inventory.stock.released` | Reserva liberada | Order |
| `inventory.movement.created` | Movimiento registrado | Audit, Reports |
| `inventory.movement.in` | Entrada de inventario | Audit, Reports |
| `inventory.movement.out` | Salida de inventario | Audit, Reports |
| `inventory.warehouse.created` | Almacén creado | Audit |
| `inventory.warehouse.updated` | Almacén actualizado | Audit |
| `inventory.warehouse.deactivated` | Almacén desactivado | Audit, POS |
| `inventory.transfer.created` | Transferencia creada | Audit |
| `inventory.transfer.approved` | Transferencia aprobada | Audit |
| `inventory.transfer.in_transit` | Transferencia en tránsito | Audit |
| `inventory.transfer.received` | Transferencia recibida | Audit, Reports |
| `inventory.transfer.completed` | Transferencia completada | Audit, Reports |
| `inventory.transfer.cancelled` | Transferencia cancelada | Audit |
| `inventory.adjustment.created` | Ajuste creado | Audit |
| `inventory.adjustment.approved` | Ajuste aprobado | Audit, Reports |
| `inventory.adjustment.rejected` | Ajuste rechazado | Audit |
| `inventory.adjustment.applied` | Ajuste aplicado a stock | Audit, Reports |
| `inventory.goods.received` | Mercancía recibida (de compra) | Procurement, Audit |

### Order Service (29 eventos)

| Evento | Descripción | Consumidores |
|--------|-------------|--------------|
| **Órdenes** |
| `order.created` | Orden creada | Inventory, Reports, Audit |
| `order.processing` | Orden en procesamiento | Audit |
| `order.completed` | Orden completada | Customer (loyalty), Inventory, Reports, Audit |
| `order.cancelled` | Orden cancelada | Inventory (restore), Audit |
| `order.delivered` | Orden entregada | Customer, Reports, Audit |
| **Pagos** |
| `order.payment.pending` | Pago pendiente | Audit |
| `order.payment.succeeded` | Pago exitoso | Audit, Reports |
| `order.payment.failed` | Pago fallido | Audit, Notifications |
| `order.payment.refunded` | Pago reembolsado | Audit, Reports |
| **Envíos** |
| `order.shipment.created` | Envío creado | Audit |
| `order.shipment.label_created` | Etiqueta de envío generada | Audit |
| `order.shipment.dispatched` | Envío despachado | Audit, Notifications |
| `order.shipment.in_transit` | Envío en tránsito | Audit, Notifications |
| `order.shipment.delivered` | Envío entregado | Customer, Audit |
| **Devoluciones** |
| `order.return.requested` | Devolución solicitada | Audit |
| `order.return.approved` | Devolución aprobada | Inventory, Audit |
| `order.return.received` | Devolución recibida | Inventory, Audit |
| `order.return.refunded` | Devolución reembolsada | Audit, Reports |
| **Carrito** |
| `order.cart.created` | Carrito creado | Audit |
| `order.cart.item_added` | Item agregado al carrito | Audit |
| `order.cart.item_removed` | Item eliminado del carrito | Audit |
| `order.cart.abandoned` | Carrito abandonado | Notifications, Reports |
| `order.cart.converted` | Carrito convertido a orden | Audit |
| **Fulfillment** |
| `order.fulfillment.started` | Fulfillment iniciado | Audit |
| `order.fulfillment.item_picked` | Item recolectado | Audit |
| `order.fulfillment.packed` | Orden empacada | Audit |
| **Facturación** |
| `order.invoice.created` | Factura creada | Audit, Reports |
| `order.invoice.sent` | Factura enviada | Audit |
| `order.invoice.generated` | Factura generada (PDF) | Reports |

### POS Service (8 eventos)

| Evento | Descripción | Consumidores |
|--------|-------------|--------------|
| `pos.transaction.created` | Transacción iniciada | Audit |
| `pos.transaction.completed` | Transacción completada | Order, Inventory |
| `pos.transaction.voided` | Transacción anulada | Audit |
| `pos.payment.processed` | Pago procesado en POS | Audit |
| `pos.return.processed` | Devolución procesada en POS | Inventory, Audit |
| `pos.drawer.opened` | Caja abierta | Audit |
| `pos.drawer.closed` | Caja cerrada | Audit, Reports |
| `pos.drawer.reconciled` | Caja cuadrada | Audit, Reports |

### Pricing Service (8 eventos)

| Evento | Descripción | Consumidores |
|--------|-------------|--------------|
| `pricing.price.updated` | Precio actualizado | POS cache |
| `pricing.price.created` | Precio creado | POS cache |
| `pricing.price.deleted` | Precio eliminado | POS cache |
| `pricing.promotion.created` | Promoción creada | POS, Frontend |
| `pricing.promotion.activated` | Promoción activa | POS, Frontend |
| `pricing.promotion.deactivated` | Promoción terminó | POS, Frontend |
| `pricing.promotion.updated` | Promoción actualizada | POS, Frontend |
| `pricing.loyalty.tier_changed` | Tier de lealtad cambió | Customer |

### Customer Service (8 eventos)

| Evento | Descripción | Consumidores |
|--------|-------------|--------------|
| `customer.created` | Cliente creado | Pricing (loyalty enrollment), Audit |
| `customer.updated` | Cliente actualizado | Audit |
| `customer.deactivated` | Cliente desactivado | Audit |
| `customer.loyalty.points_earned` | Puntos de lealtad ganados | Audit |
| `customer.loyalty.points_redeemed` | Puntos de lealtad canjeados | Audit |
| `customer.loyalty.tier_upgraded` | Cliente subió de tier | Notifications, Audit |
| `customer.credit.approved` | Crédito aprobado | Audit |
| `customer.credit.limit_exceeded` | Límite de crédito excedido | Notifications, Audit |

### Procurement Service (6 eventos)

| Evento | Descripción | Consumidores |
|--------|-------------|--------------|
| `procurement.po.created` | Orden de compra creada | Audit |
| `procurement.po.approved` | OC aprobada | Audit, Inventory |
| `procurement.po.sent` | OC enviada al proveedor | Audit |
| `procurement.po.received` | OC recibida parcial/total | Inventory |
| `procurement.po.cancelled` | OC cancelada | Audit |
| `procurement.goods_receipt.created` | Recepción de mercancía creada | Inventory, Audit |

### Audit Service (2 eventos)

| Evento | Descripción | Consumidores |
|--------|-------------|--------------|
| `audit.retention.executed` | Política de retención ejecutada | Reports |
| `audit.integrity.alert` | Alerta de integridad detectada | Notifications |

## Matriz de Publicación/Consumo

```
┌─────────────────┬──────────────────────────────────┬────────────────────────────────────────┐
│ Servicio        │ Publica                          │ Consume                                │
├─────────────────┼──────────────────────────────────┼────────────────────────────────────────┤
│ Auth            │ auth.user.*                      │ -                                      │
│                 │ auth.role.*                      │                                        │
│                 │ auth.organization.*              │                                        │
│                 │ auth.local.*                     │                                        │
│                 │ auth.session.*                   │                                        │
│                 │ auth.permission.*                │                                        │
├─────────────────┼──────────────────────────────────┼────────────────────────────────────────┤
│ Catalog         │ catalog.product.*                │ auth.user.deactivated                  │
│                 │ catalog.variant.*                │                                        │
│                 │ catalog.option.*                 │                                        │
│                 │ catalog.price.*                  │                                        │
├─────────────────┼──────────────────────────────────┼────────────────────────────────────────┤
│ Inventory       │ inventory.stock.*                │ catalog.variant.*                      │
│                 │ inventory.movement.*             │ catalog.product.deleted                │
│                 │ inventory.warehouse.*            │ order.completed                        │
│                 │ inventory.transfer.*             │ order.return.approved                  │
│                 │ inventory.adjustment.*           │ pos.transaction.completed              │
│                 │ inventory.goods.*                │ pos.return.processed                   │
├─────────────────┼──────────────────────────────────┼────────────────────────────────────────┤
│ Order           │ order.created                    │ inventory.stock.reserved               │
│                 │ order.processing                 │ inventory.stock.released               │
│                 │ order.completed                  │ pos.transaction.completed              │
│                 │ order.cancelled                  │                                        │
│                 │ order.delivered                  │                                        │
│                 │ order.payment.*                  │                                        │
│                 │ order.shipment.*                 │                                        │
│                 │ order.return.*                   │                                        │
│                 │ order.cart.*                     │                                        │
│                 │ order.fulfillment.*              │                                        │
│                 │ order.invoice.*                  │                                        │
├─────────────────┼──────────────────────────────────┼────────────────────────────────────────┤
│ POS             │ pos.transaction.*                │ catalog.product.*                      │
│                 │ pos.payment.*                    │ catalog.variant.*                      │
│                 │ pos.return.*                     │ pricing.price.*                        │
│                 │ pos.drawer.*                     │ pricing.promotion.*                    │
│                 │                                  │ inventory.stock.updated                │
│                 │                                  │ inventory.stock.out                    │
├─────────────────┼──────────────────────────────────┼────────────────────────────────────────┤
│ Pricing         │ pricing.price.*                  │ catalog.price.updated                  │
│                 │ pricing.promotion.*              │ customer.created                       │
│                 │ pricing.loyalty.*                │ order.completed                        │
├─────────────────┼──────────────────────────────────┼────────────────────────────────────────┤
│ Customer        │ customer.created                 │ auth.user.created                      │
│                 │ customer.updated                 │ order.completed                        │
│                 │ customer.deactivated             │ pricing.loyalty.tier_changed           │
│                 │ customer.loyalty.*               │                                        │
│                 │ customer.credit.*                │                                        │
├─────────────────┼──────────────────────────────────┼────────────────────────────────────────┤
│ Procurement     │ procurement.po.*                 │ inventory.stock.low_level              │
│                 │ procurement.goods_receipt.*      │                                        │
├─────────────────┼──────────────────────────────────┼────────────────────────────────────────┤
│ Audit           │ audit.retention.*                │ * (todos los eventos)                  │
│                 │ audit.integrity.*                │                                        │
├─────────────────┼──────────────────────────────────┼────────────────────────────────────────┤
│ Reports         │ -                                │ order.*                                │
│                 │                                  │ inventory.*                            │
│                 │                                  │ pos.drawer.*                           │
│                 │                                  │ customer.loyalty.*                     │
│                 │                                  │ pricing.promotion.*                    │
└─────────────────┴──────────────────────────────────┴────────────────────────────────────────┘
```

## Resumen de Eventos por Servicio

| Servicio | Total Eventos | Categorías |
|----------|---------------|------------|
| Auth | 18 | user, role, organization, local, session, permission |
| Catalog | 12 | product, variant, option, price |
| Inventory | 23 | stock, movement, warehouse, transfer, adjustment, goods |
| Order | 29 | order, payment, shipment, return, cart, fulfillment, invoice |
| POS | 8 | transaction, payment, return, drawer |
| Pricing | 8 | price, promotion, loyalty |
| Customer | 8 | customer, loyalty, credit |
| Procurement | 6 | po, goods_receipt |
| Audit | 2 | retention, integrity |
| **TOTAL** | **114** | |

## Implementación

### Publisher

```python
# shared/events/publisher.py
import aio_pika
import json
from datetime import datetime
import uuid

class EventPublisher:
    def __init__(self, rabbitmq_url: str, service_name: str):
        self.url = rabbitmq_url
        self.service_name = service_name
        self.exchange_name = "erp.events"

    async def connect(self):
        self.connection = await aio_pika.connect_robust(self.url)
        self.channel = await self.connection.channel()
        self.exchange = await self.channel.declare_exchange(
            self.exchange_name,
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

    async def publish(
        self,
        event_name: str,
        data: dict,
        organization_id: str,
        correlation_id: str | None = None
    ):
        event = {
            "event_id": f"evt_{uuid.uuid4().hex[:12]}",
            "event": event_name,
            "version": "1.0",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "organization_id": organization_id,
            "correlation_id": correlation_id or f"req_{uuid.uuid4().hex[:12]}",
            "service": self.service_name,
            "data": data
        }

        message = aio_pika.Message(
            body=json.dumps(event).encode(),
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            headers={
                "event": event_name,
                "organization_id": organization_id
            }
        )

        await self.exchange.publish(
            message,
            routing_key=event_name
        )
```

### Consumer

```python
# shared/events/consumer.py
import aio_pika
import json
from typing import Callable, Dict

class EventConsumer:
    def __init__(self, rabbitmq_url: str, service_name: str):
        self.url = rabbitmq_url
        self.service_name = service_name
        self.handlers: Dict[str, Callable] = {}
        self.queue_name = f"{service_name}.events"

    def on(self, event_name: str):
        """Decorator para registrar handlers."""
        def decorator(func):
            self.handlers[event_name] = func
            return func
        return decorator

    async def start(self, bindings: list[str]):
        connection = await aio_pika.connect_robust(self.url)
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=10)

        # Declarar exchange
        exchange = await channel.declare_exchange(
            "erp.events",
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

        # Declarar queue
        queue = await channel.declare_queue(
            self.queue_name,
            durable=True
        )

        # Bind a routing keys
        for pattern in bindings:
            await queue.bind(exchange, pattern)

        # Consumir
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    await self._handle_message(message)

    async def _handle_message(self, message):
        try:
            event_data = json.loads(message.body)
            event_name = event_data["event"]

            if event_name in self.handlers:
                await self.handlers[event_name](event_data)
            else:
                # Log: evento sin handler
                pass
        except Exception as e:
            # Log error, posiblemente enviar a DLQ
            raise
```

### Ejemplo de Uso

```python
# inventory-service/app/events/consumers.py
from shared.events import EventConsumer

consumer = EventConsumer(
    rabbitmq_url=settings.RABBITMQ_URL,
    service_name="inventory-service"
)

@consumer.on("catalog.variant.created")
async def handle_variant_created(event: dict):
    """Crear registro de stock inicial cuando se crea variante."""
    data = event["data"]
    org_id = event["organization_id"]

    # Pre-crear registro de stock (cantidad 0)
    await stock_service.initialize_stock(
        organization_id=org_id,
        variant_id=data["variant_id"],
        track_inventory=data.get("track_inventory", True),
        default_min_stock=data.get("default_min_stock", 10),
        default_max_stock=data.get("default_max_stock", 1000)
    )

@consumer.on("order.completed")
async def handle_order_completed(event: dict):
    """Descontar stock cuando se completa una orden."""
    data = event["data"]
    org_id = event["organization_id"]

    for item in data["items"]:
        await stock_service.deduct_stock(
            organization_id=org_id,
            variant_id=item["variant_id"],
            warehouse_id=item["warehouse_id"],
            quantity=item["quantity"],
            reason="sale",
            reference_id=data["order_id"]
        )

# Iniciar consumer con bindings
await consumer.start([
    "catalog.variant.*",
    "order.completed",
    "order.cancelled",
    "order.return.approved",
    "pos.transaction.completed",
    "pos.return.processed"
])
```

## Dead Letter Queue (DLQ)

Para mensajes que fallan repetidamente:

```python
# Configuración de DLQ
queue = await channel.declare_queue(
    "inventory.events",
    durable=True,
    arguments={
        "x-dead-letter-exchange": "erp.dlq",
        "x-dead-letter-routing-key": "inventory.events.dlq",
        "x-message-ttl": 86400000  # 24 horas
    }
)

# Queue para mensajes fallidos
dlq = await channel.declare_queue(
    "inventory.events.dlq",
    durable=True
)
```

## Monitoreo

### Métricas a Monitorear

| Métrica | Descripción | Alerta |
|---------|-------------|--------|
| `rabbitmq_queue_messages` | Mensajes en cola | > 1000 |
| `rabbitmq_queue_consumers` | Consumidores activos | < 1 |
| `events_published_total` | Eventos publicados | - |
| `events_consumed_total` | Eventos consumidos | - |
| `events_processing_errors` | Errores de procesamiento | > 10/min |

### Dashboard

```yaml
# prometheus/alerts.yml
groups:
  - name: rabbitmq
    rules:
      - alert: QueueBacklog
        expr: rabbitmq_queue_messages > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Queue backlog detected"

      - alert: NoConsumers
        expr: rabbitmq_queue_consumers == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "No consumers for queue"
```

## Próximos Pasos

- [Comunicación entre Microservicios](./03-comunicacion-microservicios.md)
- [API Gateway](./07-api-gateway.md)
- [Audit Service](/microservicios/audit-service/overview)
