---
sidebar_position: 7
---

# Eventos Consumidos

Eventos de otros microservicios que Catalog Service consume para mantener sincronización.

## Exchanges Suscritos

```python
EXCHANGES_CONSUMED = {
    "auth_events": {
        "type": "topic",
        "bindings": [
            "auth.user.deactivated",
            "auth.local.created",
            "auth.local.updated",
            "auth.local.deleted",
            "auth.organization.suspended",
            "auth.organization.deactivated"
        ]
    }
}
```

## Queue Configuration

```python
QUEUE_NAME = "catalog_auth_events_queue"
QUEUE_DURABLE = True
QUEUE_PREFETCH_COUNT = 10
```

## Eventos de Auth Service

### auth.user.deactivated

**Por qué lo consumimos**: Para auditar quién modificó productos antes de ser desactivado.

**Routing Key**: `auth.user.deactivated`

**Payload**:

```json
{
  "event": "auth.user.deactivated",
  "timestamp": "2025-11-23T15:00:00Z",
  "service": "auth-service",
  "version": "1.0",
  "data": {
    "user_id": "user-uuid",
    "organization_id": "org-uuid",
    "email": "user@example.com",
    "deactivated_by": "admin-uuid",
    "deactivated_at": "2025-11-23T15:00:00Z",
    "reason": "Renuncia"
  }
}
```

**Acción en Catalog Service**:

```python
async def handle_user_deactivated(event: dict):
    """
    Manejar desactivación de usuario.

    - Invalidar cache de productos modificados por este usuario
    - Registrar en logs para auditoría
    """
    user_id = event["data"]["user_id"]
    org_id = event["data"]["organization_id"]

    # Invalidar cache de productos del usuario
    await cache.delete_pattern(f"product:*:created_by:{user_id}")

    logger.info(
        f"Usuario {user_id} desactivado - cache invalidado",
        extra={"organization_id": org_id}
    )
```

### auth.local.created

**Por qué lo consumimos**: Para sincronizar cache de locales disponibles.

**Routing Key**: `auth.local.created`

**Payload**:

```json
{
  "event": "auth.local.created",
  "timestamp": "2025-11-23T16:00:00Z",
  "service": "auth-service",
  "version": "1.0",
  "data": {
    "local_id": "local-uuid",
    "organization_id": "org-uuid",
    "name": "Sucursal Centro",
    "type": "store",
    "is_active": true,
    "created_by": "admin-uuid",
    "created_at": "2025-11-23T16:00:00Z"
  }
}
```

**Acción en Catalog Service**:

```python
async def handle_local_created(event: dict):
    """
    Manejar creación de local.

    - Actualizar cache de locales
    - Permitir asignación de productos a este local
    """
    local_id = event["data"]["local_id"]
    org_id = event["data"]["organization_id"]

    # Actualizar cache de locales
    locals_cache_key = f"locals:{org_id}"
    await cache.delete(locals_cache_key)

    logger.info(
        f"Nuevo local {local_id} creado - cache actualizado",
        extra={"organization_id": org_id}
    )
```

### auth.local.updated

**Por qué lo consumimos**: Para actualizar información de locales en cache.

**Routing Key**: `auth.local.updated`

**Payload**:

```json
{
  "event": "auth.local.updated",
  "timestamp": "2025-11-23T17:00:00Z",
  "service": "auth-service",
  "version": "1.0",
  "data": {
    "local_id": "local-uuid",
    "organization_id": "org-uuid",
    "changes": {
      "name": {
        "old": "Sucursal Centro",
        "new": "Sucursal Centro Histórico"
      }
    },
    "updated_by": "admin-uuid",
    "updated_at": "2025-11-23T17:00:00Z"
  }
}
```

**Acción en Catalog Service**:

```python
async def handle_local_updated(event: dict):
    """
    Manejar actualización de local.

    - Invalidar cache de locales
    """
    org_id = event["data"]["organization_id"]

    # Invalidar cache de locales
    locals_cache_key = f"locals:{org_id}"
    await cache.delete(locals_cache_key)

    logger.info(
        f"Local actualizado - cache invalidado",
        extra={"organization_id": org_id}
    )
```

### auth.local.deleted

**Por qué lo consumimos**: Para remover productos asignados a locales eliminados.

**Routing Key**: `auth.local.deleted`

**Payload**:

```json
{
  "event": "auth.local.deleted",
  "timestamp": "2025-11-23T18:00:00Z",
  "service": "auth-service",
  "version": "1.0",
  "data": {
    "local_id": "local-uuid",
    "organization_id": "org-uuid",
    "deleted_by": "admin-uuid",
    "deleted_at": "2025-11-23T18:00:00Z"
  }
}
```

**Acción en Catalog Service**:

```python
async def handle_local_deleted(event: dict):
    """
    Manejar eliminación de local.

    - Remover asignaciones de productos a este local
    - Invalidar cache
    """
    local_id = event["data"]["local_id"]
    org_id = event["data"]["organization_id"]

    # Remover asignaciones (si existieran en el futuro)
    # await product_repo.remove_local_assignments(local_id)

    # Invalidar cache de locales
    await cache.delete(f"locals:{org_id}")

    logger.warning(
        f"Local {local_id} eliminado",
        extra={"organization_id": org_id}
    )
```

### auth.organization.suspended

**Por qué lo consumimos**: Para desactivar temporalmente productos de organización suspendida.

**Routing Key**: `auth.organization.suspended`

**Payload**:

```json
{
  "event": "auth.organization.suspended",
  "timestamp": "2025-11-23T19:00:00Z",
  "service": "auth-service",
  "version": "1.0",
  "data": {
    "organization_id": "org-uuid",
    "suspended_by": "system-admin-uuid",
    "suspended_at": "2025-11-23T19:00:00Z",
    "reason": "Falta de pago",
    "suspension_end_date": "2025-12-23T19:00:00Z"
  }
}
```

**Acción en Catalog Service**:

```python
async def handle_organization_suspended(event: dict):
    """
    Manejar suspensión de organización.

    - Marcar todos los productos como inactivos temporalmente
    - Invalidar todo el cache de la organización
    """
    org_id = event["data"]["organization_id"]

    # Desactivar productos (flag temporal)
    await product_repo.suspend_all_products(org_id)

    # Invalidar todo el cache de la organización
    await cache.delete_pattern(f"*:{org_id}:*")

    logger.warning(
        f"Organización {org_id} suspendida - productos desactivados",
        extra={"organization_id": org_id}
    )
```

### auth.organization.deactivated

**Por qué lo consumimos**: Para archivar productos de organización desactivada.

**Routing Key**: `auth.organization.deactivated`

**Payload**:

```json
{
  "event": "auth.organization.deactivated",
  "timestamp": "2025-11-23T20:00:00Z",
  "service": "auth-service",
  "version": "1.0",
  "data": {
    "organization_id": "org-uuid",
    "deactivated_by": "system-admin-uuid",
    "deactivated_at": "2025-11-23T20:00:00Z",
    "reason": "Cancelación de cuenta"
  }
}
```

**Acción en Catalog Service**:

```python
async def handle_organization_deactivated(event: dict):
    """
    Manejar desactivación de organización.

    - Soft delete de todos los productos
    - Limpiar todo el cache
    """
    org_id = event["data"]["organization_id"]

    # Soft delete de todos los productos
    await product_repo.soft_delete_all(org_id)

    # Limpiar cache completamente
    await cache.delete_pattern(f"*:{org_id}:*")

    logger.critical(
        f"Organización {org_id} desactivada - productos eliminados",
        extra={"organization_id": org_id}
    )
```

## Implementación del Consumer

### Event Consumer

```python
import json
import aio_pika
from typing import Callable, Dict
from config.settings import settings

class EventConsumer:
    """Consumer de eventos de RabbitMQ."""

    def __init__(self):
        self.connection = None
        self.channel = None
        self.handlers: Dict[str, Callable] = {}

    def register_handler(self, event_type: str, handler: Callable):
        """Registrar handler para tipo de evento."""
        self.handlers[event_type] = handler

    async def connect(self):
        """Conectar a RabbitMQ y configurar queue."""
        self.connection = await aio_pika.connect_robust(
            settings.rabbitmq_url
        )
        self.channel = await self.connection.channel()
        await self.channel.set_qos(prefetch_count=10)

        # Declarar queue
        queue = await self.channel.declare_queue(
            "catalog_auth_events_queue",
            durable=True
        )

        # Declarar exchange
        exchange = await self.channel.declare_exchange(
            "auth_events",
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

        # Bindings
        await queue.bind(exchange, routing_key="auth.user.deactivated")
        await queue.bind(exchange, routing_key="auth.local.*")
        await queue.bind(exchange, routing_key="auth.organization.suspended")
        await queue.bind(exchange, routing_key="auth.organization.deactivated")

        return queue

    async def start_consuming(self):
        """Iniciar consumo de eventos."""
        queue = await self.connect()

        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    await self.handle_message(message)

    async def handle_message(self, message: aio_pika.IncomingMessage):
        """Procesar mensaje recibido."""
        try:
            event = json.loads(message.body.decode())
            event_type = event.get("event")

            if event_type in self.handlers:
                handler = self.handlers[event_type]
                await handler(event)
                logger.info(f"Evento {event_type} procesado correctamente")
            else:
                logger.warning(f"No hay handler para evento: {event_type}")

        except Exception as e:
            logger.error(f"Error procesando mensaje: {e}")
            # El mensaje NO se confirma, RabbitMQ lo reenviará
            raise
```

### Registro de Handlers

```python
from app.events.consumer import EventConsumer
from app.events.handlers import (
    handle_user_deactivated,
    handle_local_created,
    handle_local_updated,
    handle_local_deleted,
    handle_organization_suspended,
    handle_organization_deactivated
)

def setup_event_consumer() -> EventConsumer:
    """Configurar consumer con todos los handlers."""
    consumer = EventConsumer()

    # Registrar handlers
    consumer.register_handler(
        "auth.user.deactivated",
        handle_user_deactivated
    )
    consumer.register_handler(
        "auth.local.created",
        handle_local_created
    )
    consumer.register_handler(
        "auth.local.updated",
        handle_local_updated
    )
    consumer.register_handler(
        "auth.local.deleted",
        handle_local_deleted
    )
    consumer.register_handler(
        "auth.organization.suspended",
        handle_organization_suspended
    )
    consumer.register_handler(
        "auth.organization.deactivated",
        handle_organization_deactivated
    )

    return consumer
```

### Inicio del Consumer

```python
import asyncio
from app.events.setup import setup_event_consumer

async def main():
    """Iniciar consumer en background."""
    consumer = setup_event_consumer()
    await consumer.start_consuming()

if __name__ == "__main__":
    asyncio.run(main())
```

## Manejo de Errores

### Retry Logic

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def handle_with_retry(handler: Callable, event: dict):
    """Ejecutar handler con reintentos."""
    await handler(event)
```

### Dead Letter Queue

```python
# Configurar DLQ para mensajes que fallan repetidamente
dlq = await channel.declare_queue(
    "catalog_events_dlq",
    durable=True
)

queue = await channel.declare_queue(
    "catalog_auth_events_queue",
    durable=True,
    arguments={
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": "catalog_events_dlq"
    }
)
```

## Monitoreo

### Métricas

```python
import prometheus_client as prom

events_consumed = prom.Counter(
    "catalog_events_consumed_total",
    "Total de eventos consumidos",
    ["event_type", "status"]
)

@events_consumed.count_exceptions()
async def handle_message(message):
    event_type = message.event_type
    try:
        await process_event(message)
        events_consumed.labels(event_type=event_type, status="success").inc()
    except Exception as e:
        events_consumed.labels(event_type=event_type, status="error").inc()
        raise
```

## Próximos Pasos

- [Eventos Publicados](/microservicios/catalog-service/eventos-publicados)
- [Validación de Locales](/microservicios/catalog-service/validacion-locales)
- [Auth Service](/microservicios/auth-service/overview)
