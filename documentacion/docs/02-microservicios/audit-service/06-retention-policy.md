---
sidebar_position: 7
---

# Retention Policy

Políticas de retención y archivado de logs de auditoría.

## Políticas de Retención

### Niveles de Retención

```yaml
Hot Storage (PostgreSQL):
  Duration: 90 días
  Access: Inmediato
  Performance: Alta
  Cost: Alto

Warm Storage (Compressed):
  Duration: 1 año
  Access: Medio (descompresión requerida)
  Performance: Media
  Cost: Medio

Cold Storage (S3/Archive):
  Duration: 2+ años
  Access: Lento
  Performance: Baja
  Cost: Bajo
```

## Implementación

### Cronjob de Archivado

```python
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select, delete
from app.models.audit import AuditLog
from app.database import get_db

class RetentionPolicy:
    """Gestión de retención de logs."""

    def __init__(self, db_session):
        self.db = db_session

    async def archive_old_logs(self, days: int = 90):
        """
        Archivar logs más antiguos que X días.

        1. Exportar a archivo comprimido
        2. Subir a S3
        3. Eliminar de PostgreSQL
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Seleccionar logs a archivar
        query = select(AuditLog).where(
            AuditLog.created_at < cutoff_date
        )
        result = await self.db.execute(query)
        logs_to_archive = result.scalars().all()

        if not logs_to_archive:
            logger.info("No logs to archive")
            return 0

        # Exportar a JSON comprimido
        archive_file = await self.export_to_file(logs_to_archive)

        # Subir a S3
        await self.upload_to_s3(archive_file)

        # Eliminar de DB (IMPORTANTE: bypass trigger de inmutabilidad)
        await self.delete_archived_logs(cutoff_date)

        logger.info(f"Archived {len(logs_to_archive)} logs older than {days} days")
        return len(logs_to_archive)

    async def export_to_file(self, logs: list) -> str:
        """Exportar logs a archivo JSON.gz."""
        import gzip
        import json
        from pathlib import Path

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"audit_logs_{timestamp}.json.gz"
        filepath = Path("/tmp") / filename

        # Convertir a JSON
        logs_data = [
            {
                "id": str(log.id),
                "event_id": log.event_id,
                "event_type": log.event_type,
                "created_at": log.created_at.isoformat(),
                "service": log.service,
                "payload": log.payload,
                "metadata": log.metadata,
                "organization_id": str(log.organization_id) if log.organization_id else None,
                "user_id": str(log.user_id) if log.user_id else None
            }
            for log in logs
        ]

        # Comprimir
        with gzip.open(filepath, 'wt', encoding='utf-8') as f:
            json.dump(logs_data, f)

        logger.info(f"Exported {len(logs)} logs to {filepath}")
        return str(filepath)

    async def upload_to_s3(self, filepath: str):
        """Subir archivo a S3."""
        import boto3
        from config.settings import settings

        s3 = boto3.client('s3')
        bucket = settings.s3_audit_bucket
        key = f"audit_archives/{Path(filepath).name}"

        s3.upload_file(filepath, bucket, key)

        logger.info(f"Uploaded {filepath} to s3://{bucket}/{key}")

        # Eliminar archivo temporal
        Path(filepath).unlink()

    async def delete_archived_logs(self, cutoff_date: datetime):
        """Eliminar logs archivados de PostgreSQL."""

        # IMPORTANTE: Necesita permisos especiales para bypass triggers
        query = delete(AuditLog).where(
            AuditLog.created_at < cutoff_date
        )

        await self.db.execute(query)
        await self.db.commit()
```

### Configuración de Cronjob

```python
# app/tasks/retention.py

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.retention import RetentionPolicy

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=2)  # 2 AM diario
async def run_retention_policy():
    """Ejecutar política de retención diariamente."""

    async with get_db() as db:
        retention = RetentionPolicy(db)

        # Archivar logs > 90 días
        archived = await retention.archive_old_logs(days=90)

        logger.info(f"Retention policy executed: {archived} logs archived")
```

### Configuración de Variables

```bash
# .env
S3_AUDIT_BUCKET=erp-audit-archives
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Retention settings
AUDIT_RETENTION_DAYS=90
AUDIT_ARCHIVE_ENABLED=true
```

## Recuperación de Logs Archivados

### Script de Restauración

```python
import gzip
import json
import boto3
from app.models.audit import AuditLog

async def restore_from_archive(archive_filename: str):
    """Restaurar logs desde archivo S3."""

    # Descargar de S3
    s3 = boto3.client('s3')
    local_path = f"/tmp/{archive_filename}"

    s3.download_file(
        settings.s3_audit_bucket,
        f"audit_archives/{archive_filename}",
        local_path
    )

    # Descomprimir y cargar
    with gzip.open(local_path, 'rt', encoding='utf-8') as f:
        logs_data = json.load(f)

    # Restaurar en DB
    async with get_db() as db:
        for log_data in logs_data:
            audit_log = AuditLog(
                id=log_data["id"],
                event_id=log_data["event_id"],
                event_type=log_data["event_type"],
                created_at=datetime.fromisoformat(log_data["created_at"]),
                service=log_data["service"],
                payload=log_data["payload"],
                metadata=log_data["metadata"],
                organization_id=log_data["organization_id"],
                user_id=log_data["user_id"]
            )
            db.add(audit_log)

        await db.commit()

    logger.info(f"Restored {len(logs_data)} logs from {archive_filename}")
```

## Compresión de Particiones

### Vacuum y Analyze

```python
async def compress_old_partitions():
    """Comprimir particiones antiguas."""

    # VACUUM FULL en particiones viejas
    partitions = await get_old_partitions(days=60)

    for partition in partitions:
        await db.execute(f"VACUUM FULL {partition}")
        await db.execute(f"ANALYZE {partition}")

        logger.info(f"Compressed partition: {partition}")
```

## Monitoreo de Espacio

```python
from prometheus_client import Gauge

audit_db_size_bytes = Gauge(
    "audit_db_size_bytes",
    "Tamaño de la base de datos de auditoría"
)

async def monitor_db_size():
    """Monitorear tamaño de DB."""

    query = """
    SELECT pg_database_size('erp_audit') as size_bytes
    """

    result = await db.execute(query)
    size = result.scalar()

    audit_db_size_bytes.set(size)
```

## Configuración de Alerts

```yaml
# Prometheus alerts
- alert: AuditDBSizeHigh
  expr: audit_db_size_bytes > 50 * 1024 * 1024 * 1024  # 50GB
  annotations:
    summary: "Base de datos de auditoría muy grande"
    description: "Considerar archivar logs antiguos"
```

## Próximos Pasos

- [Queries Comunes](/microservicios/audit-service/queries-comunes)
- [Event Consumer](/microservicios/audit-service/event-consumer)
- [API Logs](/microservicios/audit-service/api-logs)
