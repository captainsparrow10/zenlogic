---
sidebar_position: 5
---

# Event Consumer

Implementación del consumidor de eventos para Audit Service.

## Configuración de Queue

```python
QUEUE_NAME = "audit_service_queue"
EXCHANGES = ["auth_events", "catalog_events", "inventory_events", "order_events"]
ROUTING_KEY = "#"  # Wildcard - todos los eventos
PREFETCH_COUNT = 50
```

## Implementación

### Consumer Principal

```python
import aio_pika
import json
import asyncio
from typing import Dict, Any
from config.settings import settings
from app.services.audit_service import AuditService

class AuditEventConsumer:
    """Consumer de eventos para Audit Service."""

    def __init__(self, audit_service: AuditService):
        self.audit_service = audit_service
        self.connection = None
        self.channel = None
        self.queue = None

    async def connect(self):
        """Conectar a RabbitMQ y configurar queue."""
        self.connection = await aio_pika.connect_robust(
            settings.rabbitmq_url,
            loop=asyncio.get_event_loop()
        )

        self.channel = await self.connection.channel()
        await self.channel.set_qos(prefetch_count=50)

        # Declarar queue durable
        self.queue = await self.channel.declare_queue(
            "audit_service_queue",
            durable=True,
            arguments={
                "x-message-ttl": 3600000,  # 1 hora
                "x-dead-letter-exchange": "audit_dlq"
            }
        )

        # Bind a múltiples exchanges
        for exchange_name in ["auth_events", "catalog_events", "inventory_events", "order_events"]:
            exchange = await self.channel.declare_exchange(
                exchange_name,
                aio_pika.ExchangeType.TOPIC,
                durable=True
            )
            await self.queue.bind(exchange, routing_key="#")

        logger.info("Audit Consumer connected to RabbitMQ")

    async def start_consuming(self):
        """Iniciar consumo de eventos."""
        if not self.queue:
            await self.connect()

        logger.info("Starting to consume audit events...")

        async with self.queue.iterator() as queue_iter:
            async for message in queue_iter:
                await self.process_message(message)

    async def process_message(self, message: aio_pika.IncomingMessage):
        """Procesar mensaje recibido."""
        async with message.process(ignore_processed=True):
            try:
                # Parse event
                event = json.loads(message.body.decode())

                # Store event
                await self.audit_service.store_event(event)

                # Metrics
                audit_events_consumed.labels(
                    event_type=event.get("event_type", "unknown"),
                    status="success"
                ).inc()

                # Log
                logger.info(
                    "Event stored",
                    extra={
                        "event_type": event.get("event_type"),
                        "event_id": event.get("metadata", {}).get("correlation_id")
                    }
                )

                # ACK message
                await message.ack()

            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in message: {e}")
                await message.reject(requeue=False)  # DLQ

            except Exception as e:
                logger.error(f"Error processing message: {e}")
                audit_events_consumed.labels(
                    event_type="unknown",
                    status="error"
                ).inc()

                # Requeue para retry
                await message.nack(requeue=True)

    async def close(self):
        """Cerrar conexión."""
        if self.connection:
            await self.connection.close()
```

## Service Layer

```python
from app.repositories.audit_repository import AuditRepository
from app.schemas.audit import AuditLogCreate
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class AuditService:
    """Servicio de auditoría."""

    def __init__(self, audit_repo: AuditRepository):
        self.audit_repo = audit_repo

    async def store_event(self, event: Dict[str, Any]):
        """
        Almacenar evento de auditoría.

        Args:
            event: Evento completo con payload y metadata
        """
        # Generar event_id para idempotencia
        event_id = event.get("metadata", {}).get("correlation_id")
        if not event_id:
            event_id = f"{event['event_type']}_{event['timestamp']}"

        # Verificar si ya existe (idempotencia)
        existing = await self.audit_repo.find_by_event_id(event_id)
        if existing:
            logger.debug(f"Event {event_id} already exists, skipping")
            return existing

        # Extraer datos del evento
        audit_data = AuditLogCreate(
            event_id=event_id,
            event_type=event["event_type"],
            service=event["service"],
            version=event.get("version", "1.0"),
            payload=event["payload"],
            metadata=event.get("metadata", {}),
            organization_id=event["payload"].get("organization_id"),
            user_id=event.get("metadata", {}).get("user_id"),
            ip_address=event.get("metadata", {}).get("ip_address"),
            user_agent=event.get("metadata", {}).get("user_agent")
        )

        # Almacenar
        audit_log = await self.audit_repo.create(audit_data)

        logger.info(
            f"Audit log created: {audit_log.id}",
            extra={
                "event_type": audit_log.event_type,
                "organization_id": str(audit_log.organization_id) if audit_log.organization_id else None
            }
        )

        return audit_log
```

## Repository Layer

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogCreate
from typing import Optional

class AuditRepository:
    """Repositorio para logs de auditoría."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, audit_data: AuditLogCreate) -> AuditLog:
        """Crear nuevo log de auditoría."""
        audit_log = AuditLog(**audit_data.model_dump())
        self.db.add(audit_log)
        await self.db.commit()
        await self.db.refresh(audit_log)
        return audit_log

    async def find_by_event_id(self, event_id: str) -> Optional[AuditLog]:
        """Buscar log por event_id (para idempotencia)."""
        query = select(AuditLog).where(AuditLog.event_id == event_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def bulk_create(self, events: list[AuditLogCreate]) -> int:
        """Crear múltiples logs en batch."""
        audit_logs = [AuditLog(**event.model_dump()) for event in events]
        self.db.add_all(audit_logs)
        await self.db.commit()
        return len(audit_logs)
```

## Batch Processing

```python
import asyncio
from collections import deque
from datetime import datetime, timedelta

class BatchAuditConsumer(AuditEventConsumer):
    """Consumer con batch processing para mejor performance."""

    def __init__(self, audit_service: AuditService):
        super().__init__(audit_service)
        self.batch = deque()
        self.batch_size = 100
        self.batch_timeout = 0.5  # 500ms
        self.last_flush = datetime.now()

    async def process_message(self, message: aio_pika.IncomingMessage):
        """Acumular en batch."""
        try:
            event = json.loads(message.body.decode())
            self.batch.append((event, message))

            # Flush si batch lleno o timeout
            if len(self.batch) >= self.batch_size or \
               datetime.now() - self.last_flush > timedelta(seconds=self.batch_timeout):
                await self.flush_batch()

        except Exception as e:
            logger.error(f"Error in batch processing: {e}")
            await message.nack(requeue=True)

    async def flush_batch(self):
        """Guardar batch en DB."""
        if not self.batch:
            return

        events_to_store = []
        messages_to_ack = []

        # Preparar eventos
        for event, message in self.batch:
            events_to_store.append(event)
            messages_to_ack.append(message)

        try:
            # Bulk insert
            await self.audit_service.bulk_store_events(events_to_store)

            # ACK todos los mensajes
            for message in messages_to_ack:
                await message.ack()

            logger.info(f"Flushed batch of {len(events_to_store)} events")

        except Exception as e:
            logger.error(f"Error flushing batch: {e}")
            # NACK todos
            for message in messages_to_ack:
                await message.nack(requeue=True)

        finally:
            self.batch.clear()
            self.last_flush = datetime.now()
```

## Manejo de Errores

### Dead Letter Queue

```python
async def setup_dlq():
    """Configurar Dead Letter Queue."""
    channel = await connection.channel()

    # DLQ Exchange
    dlq_exchange = await channel.declare_exchange(
        "audit_dlq",
        aio_pika.ExchangeType.DIRECT,
        durable=True
    )

    # DLQ Queue
    dlq_queue = await channel.declare_queue(
        "audit_dlq_queue",
        durable=True
    )

    await dlq_queue.bind(dlq_exchange, routing_key="audit_dlq")
```

### Retry Logic

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def store_event_with_retry(event: dict):
    """Almacenar evento con reintentos."""
    await audit_service.store_event(event)
```

## Métricas

```python
from prometheus_client import Counter, Histogram

# Contador de eventos consumidos
audit_events_consumed = Counter(
    "audit_events_consumed_total",
    "Total eventos consumidos",
    ["event_type", "status"]
)

# Latencia de procesamiento
audit_processing_duration = Histogram(
    "audit_processing_duration_seconds",
    "Duración de procesamiento de eventos"
)

# Uso
with audit_processing_duration.time():
    await audit_service.store_event(event)
```

## Próximos Pasos

- [API Logs](/microservicios/audit-service/api-logs)
- [Modelo de Datos](/microservicios/audit-service/modelo-datos)
- [Retention Policy](/microservicios/audit-service/retention-policy)
