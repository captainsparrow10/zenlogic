---
sidebar_position: 2
---

# RabbitMQ - Message Broker

Integración con RabbitMQ para comunicación asíncrona basada en eventos.

## Overview

RabbitMQ es el message broker central para la arquitectura event-driven de zenLogic. Todos los microservicios publican eventos de negocio que otros servicios pueden consumir de manera desacoplada.

```mermaid
graph LR
    Auth[Auth Service] -->|publish| Exchange[erp.events<br/>Topic Exchange]
    Catalog[Catalog Service] -->|publish| Exchange

    Exchange -->|route| Q1[catalog.events<br/>Queue]
    Exchange -->|route| Q2[audit.events<br/>Queue]

    Q1 -->|consume| Catalog
    Q2 -->|consume| Audit[Audit Service]
```

## Configuración

### Instalación

```bash
# Docker Compose
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"      # AMQP
      - "15672:15672"    # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  rabbitmq_data:
```

### Variables de Entorno

```bash
# .env
RABBITMQ_URL=amqp://admin:admin123@localhost:5672/
RABBITMQ_EXCHANGE=erp.events
RABBITMQ_EXCHANGE_TYPE=topic
```

## Estructura de Exchange y Queues

### Exchange Principal

```python
# Exchange: erp.events (tipo: topic)
# Routing keys: {service}.{entity}.{action}

# Ejemplos:
# - auth.user.created
# - auth.user.deactivated
# - auth.local.created
# - catalog.product.created
# - catalog.product.updated
# - catalog.variant.created
```

### Declaración de Exchange

```python
import aio_pika

async def declare_exchange(channel: aio_pika.Channel):
    """Declarar exchange principal."""

    exchange = await channel.declare_exchange(
        name="erp.events",
        type=aio_pika.ExchangeType.TOPIC,
        durable=True  # Persiste en disco
    )

    return exchange
```

### Declaración de Queues

```python
async def declare_queue(
    channel: aio_pika.Channel,
    queue_name: str,
    routing_keys: list[str]
):
    """Declarar queue con bindings."""

    # Declarar exchange
    exchange = await channel.declare_exchange(
        "erp.events",
        aio_pika.ExchangeType.TOPIC,
        durable=True
    )

    # Declarar queue con DLQ
    queue = await channel.declare_queue(
        queue_name,
        durable=True,
        arguments={
            "x-dead-letter-exchange": "dlx.events",
            "x-dead-letter-routing-key": f"{queue_name}.dead",
            "x-message-ttl": 3600000  # 1 hora
        }
    )

    # Bind routing keys
    for routing_key in routing_keys:
        await queue.bind(exchange, routing_key=routing_key)

    logger.info(f"Queue '{queue_name}' declared with bindings: {routing_keys}")
    return queue
```

## Publisher (Publicador de Eventos)

### Implementación

```python
# app/events/publisher.py
import aio_pika
import json
from uuid import uuid4
from datetime import datetime
from typing import Dict, Any
from app.config import settings

class EventPublisher:
    """Publicador de eventos a RabbitMQ."""

    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange = None

    async def connect(self):
        """Conectar a RabbitMQ."""

        self.connection = await aio_pika.connect_robust(
            settings.rabbitmq_url,
            heartbeat=60  # Heartbeat cada 60 segundos
        )

        self.channel = await self.connection.channel()

        # Habilitar publisher confirms
        await self.channel.set_qos(prefetch_count=1)

        # Declarar exchange
        self.exchange = await self.channel.declare_exchange(
            settings.rabbitmq_exchange,
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

        logger.info(f"Connected to RabbitMQ: {settings.rabbitmq_url}")

    async def publish(
        self,
        event_type: str,
        payload: Dict[str, Any],
        metadata: Dict[str, Any] = None
    ):
        """
        Publicar evento.

        Args:
            event_type: Tipo de evento (routing key)
            payload: Datos del evento
            metadata: Metadata adicional (user_id, correlation_id, etc.)
        """

        # Construir evento
        event = {
            "event_id": str(uuid4()),
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "service": settings.service_name,
            "version": "1.0",
            "payload": payload,
            "metadata": metadata or {}
        }

        # Serializar
        message_body = json.dumps(event, default=str).encode()

        # Crear mensaje
        message = aio_pika.Message(
            body=message_body,
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,  # Persistente
            content_type="application/json",
            message_id=event["event_id"],
            timestamp=datetime.utcnow()
        )

        # Publicar
        await self.exchange.publish(
            message,
            routing_key=event_type
        )

        logger.info(
            f"Event published: {event_type}",
            extra={"event_id": event["event_id"]}
        )

        # Métricas
        events_published.labels(event_type=event_type).inc()

    async def close(self):
        """Cerrar conexión."""
        if self.connection:
            await self.connection.close()
```

### Uso del Publisher

```python
# app/main.py
from app.events.publisher import EventPublisher

# Inicializar
event_publisher = EventPublisher()

@app.on_event("startup")
async def startup():
    await event_publisher.connect()

@app.on_event("shutdown")
async def shutdown():
    await event_publisher.close()

# En endpoints
@router.post("/products")
async def create_product(product: ProductCreate):
    # Crear producto en DB
    new_product = await product_service.create(product)

    # Publicar evento
    await event_publisher.publish(
        event_type="catalog.product.created",
        payload={
            "product_id": str(new_product.id),
            "organization_id": str(new_product.organization_id),
            "name": new_product.name,
            "sku": new_product.sku,
            "base_price": float(new_product.base_price)
        },
        metadata={
            "user_id": current_user.id,
            "correlation_id": request.state.correlation_id
        }
    )

    return new_product
```

## Consumer (Consumidor de Eventos)

### Implementación

```python
# app/events/consumer.py
import aio_pika
import json
import asyncio
from typing import Callable, Dict
from app.config import settings

class EventConsumer:
    """Consumidor de eventos de RabbitMQ."""

    def __init__(
        self,
        queue_name: str,
        routing_keys: list[str],
        handlers: Dict[str, Callable]
    ):
        self.queue_name = queue_name
        self.routing_keys = routing_keys
        self.handlers = handlers
        self.connection = None
        self.channel = None

    async def start(self):
        """Iniciar consumidor."""

        # Conectar
        self.connection = await aio_pika.connect_robust(
            settings.rabbitmq_url,
            heartbeat=60
        )

        self.channel = await self.connection.channel()

        # QoS: procesar 10 mensajes en paralelo
        await self.channel.set_qos(prefetch_count=10)

        # Declarar exchange
        exchange = await self.channel.declare_exchange(
            settings.rabbitmq_exchange,
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )

        # Declarar queue
        queue = await self.channel.declare_queue(
            self.queue_name,
            durable=True,
            arguments={
                "x-dead-letter-exchange": "dlx.events",
                "x-message-ttl": 3600000
            }
        )

        # Bind routing keys
        for routing_key in self.routing_keys:
            await queue.bind(exchange, routing_key=routing_key)

        # Consumir
        await queue.consume(self.process_message)

        logger.info(
            f"Consumer started: {self.queue_name}",
            extra={"routing_keys": self.routing_keys}
        )

    async def process_message(self, message: aio_pika.IncomingMessage):
        """Procesar mensaje recibido."""

        async with message.process(ignore_processed=True):
            try:
                # Parsear evento
                event = json.loads(message.body.decode())
                event_type = event["event_type"]

                logger.info(
                    f"Processing event: {event_type}",
                    extra={"event_id": event.get("event_id")}
                )

                # Buscar handler
                handler = self.handlers.get(event_type)

                if handler:
                    # Ejecutar handler
                    await handler(event)

                    # ACK
                    await message.ack()

                    # Métricas
                    events_consumed.labels(
                        event_type=event_type,
                        status="success"
                    ).inc()

                    logger.info(f"Event processed successfully: {event_type}")
                else:
                    logger.warning(f"No handler for event: {event_type}")
                    await message.ack()  # ACK anyway

            except Exception as e:
                logger.error(
                    f"Error processing event: {e}",
                    exc_info=True
                )

                # NACK con requeue
                await message.nack(requeue=True)

                # Métricas
                events_consumed.labels(
                    event_type=event.get("event_type", "unknown"),
                    status="error"
                ).inc()

    async def stop(self):
        """Detener consumidor."""
        if self.connection:
            await self.connection.close()
```

### Uso del Consumer

```python
# app/main.py
from app.events.consumer import EventConsumer
from app.handlers import event_handlers

# Definir handlers
event_handlers = {
    "auth.user.created": handle_user_created,
    "auth.user.deactivated": handle_user_deactivated,
    "auth.local.created": handle_local_created,
}

# Inicializar consumer
consumer = EventConsumer(
    queue_name="catalog.events",
    routing_keys=["auth.user.*", "auth.local.*"],
    handlers=event_handlers
)

@app.on_event("startup")
async def startup():
    # Iniciar consumer en background
    asyncio.create_task(consumer.start())

@app.on_event("shutdown")
async def shutdown():
    await consumer.stop()

# Handlers
async def handle_user_created(event: dict):
    """Handler para auth.user.created."""
    payload = event["payload"]
    logger.info(f"User created: {payload['user_id']}")

    # Lógica de negocio
    # ...

async def handle_local_created(event: dict):
    """Handler para auth.local.created."""
    payload = event["payload"]

    # Invalidar cache de locales
    await redis.delete(f"org:{payload['organization_id']}:locals")
```

## Dead Letter Queue (DLQ)

### Configuración

```python
async def setup_dlq(channel: aio_pika.Channel):
    """Configurar Dead Letter Exchange y Queue."""

    # DLX Exchange
    dlx = await channel.declare_exchange(
        "dlx.events",
        aio_pika.ExchangeType.TOPIC,
        durable=True
    )

    # DLQ Queue
    dlq = await channel.declare_queue(
        "dlq.events",
        durable=True
    )

    # Bind all dead letters
    await dlq.bind(dlx, routing_key="#")

    logger.info("DLQ configured")
```

### Monitoreo de DLQ

```python
async def check_dlq_size():
    """Verificar tamaño de DLQ."""

    async with aio_pika.connect_robust(settings.rabbitmq_url) as connection:
        channel = await connection.channel()
        queue = await channel.declare_queue("dlq.events", passive=True)

        message_count = queue.declaration_result.message_count

        if message_count > 100:
            logger.warning(
                f"DLQ has {message_count} messages!",
                extra={"dlq_size": message_count}
            )

            # Alerta
            send_alert(f"DLQ size: {message_count}")
```

## Patrones Avanzados

### Idempotencia

```python
# Tabla de eventos procesados
CREATE TABLE processed_events (
    event_id UUID PRIMARY KEY,
    event_type VARCHAR(100),
    processed_at TIMESTAMP DEFAULT NOW()
);

# Handler idempotente
async def handle_event_idempotent(event: dict):
    event_id = event["event_id"]

    # Verificar si ya fue procesado
    existing = await db.execute(
        select(ProcessedEvent).where(ProcessedEvent.event_id == event_id)
    )

    if existing.scalar():
        logger.info(f"Event {event_id} already processed, skipping")
        return

    # Procesar evento
    await process_event(event)

    # Registrar como procesado
    await db.execute(
        insert(ProcessedEvent).values(
            event_id=event_id,
            event_type=event["event_type"]
        )
    )
    await db.commit()
```

### Event Replay

```python
async def replay_events(start_date: datetime, end_date: datetime):
    """Replay de eventos históricos."""

    # Obtener eventos de Audit Service
    events = await audit_service.get_events(
        start_date=start_date,
        end_date=end_date
    )

    # Republicar
    for event in events:
        await event_publisher.publish(
            event_type=event["event_type"],
            payload=event["payload"],
            metadata={
                **event.get("metadata", {}),
                "replayed": True,
                "original_timestamp": event["timestamp"]
            }
        )
```

## Monitoreo

### Métricas Prometheus

```python
from prometheus_client import Counter, Histogram, Gauge

events_published = Counter(
    "events_published_total",
    "Total events published",
    ["event_type"]
)

events_consumed = Counter(
    "events_consumed_total",
    "Total events consumed",
    ["event_type", "status"]
)

event_processing_duration = Histogram(
    "event_processing_seconds",
    "Event processing duration",
    ["event_type"]
)

rabbitmq_queue_size = Gauge(
    "rabbitmq_queue_size",
    "Current queue size",
    ["queue_name"]
)
```

### Health Check

```python
@router.get("/health/rabbitmq")
async def rabbitmq_health():
    """Health check de RabbitMQ."""

    try:
        async with aio_pika.connect_robust(
            settings.rabbitmq_url,
            timeout=5.0
        ) as connection:
            if connection.is_closed:
                raise Exception("Connection closed")

            return {"status": "healthy"}

    except Exception as e:
        return JSONResponse(
            {"status": "unhealthy", "error": str(e)},
            status_code=503
        )
```

## Troubleshooting

### Problema: Mensajes no se consumen

**Causas**:
- Consumer no está corriendo
- Routing key incorrecto en binding
- Mensaje en DLQ

**Solución**:
```bash
# Verificar queues
curl -u admin:admin123 http://localhost:15672/api/queues

# Ver DLQ
curl -u admin:admin123 http://localhost:15672/api/queues/%2F/dlq.events

# Purgar DLQ si es necesario
curl -u admin:admin123 -X DELETE \
  http://localhost:15672/api/queues/%2F/dlq.events/contents
```

### Problema: Memory leak en RabbitMQ

**Causas**:
- Mensajes no se consumen
- Muchos mensajes en queues
- Falta de flow control

**Solución**:
```bash
# Ver uso de memoria
rabbitmqctl status

# Configurar memory alarms
rabbitmqctl set_vm_memory_high_watermark 0.6  # 60%
```

## Próximos Pasos

- [Redis - Cache](/integraciones/redis)
- [ADR-003: Event-Driven Architecture](/adrs/adr-003-event-driven)
- [Catalog Service - Eventos Consumidos](/microservicios/catalog-service/eventos-consumidos)
