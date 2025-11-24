---
sidebar_position: 4
---

# Modelo de Datos

Estructura de base de datos para almacenar logs de auditoría.

## Diagrama ER

```mermaid
erDiagram
    AUDIT_LOGS {
        uuid id PK
        string event_id UK
        string event_type
        timestamp created_at
        string service
        string version
        jsonb payload
        jsonb metadata
        uuid organization_id
        uuid user_id
        string ip_address
        string user_agent
    }
```

## Tabla Principal

### `audit_logs`

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    service VARCHAR(50) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',

    -- Payload del evento (JSON completo)
    payload JSONB NOT NULL,

    -- Metadata adicional
    metadata JSONB,

    -- Datos de contexto
    organization_id UUID,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,

    -- Particionamiento
    CONSTRAINT audit_logs_created_at_check CHECK (created_at >= DATE '2025-01-01')
) PARTITION BY RANGE (created_at);
```

## Particiones por Mes

```sql
-- Partición Noviembre 2025
CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Partición Diciembre 2025
CREATE TABLE audit_logs_2025_12 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Script automático para crear particiones futuras
CREATE OR REPLACE FUNCTION create_audit_partition(year INT, month INT)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_name := 'audit_logs_' || year || '_' || LPAD(month::TEXT, 2, '0');
    start_date := make_date(year, month, 1);
    end_date := start_date + INTERVAL '1 month';

    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;
```

## Índices

### Índices de Búsqueda

```sql
-- Por organización y fecha (query más común)
CREATE INDEX idx_audit_org_time
    ON audit_logs(organization_id, created_at DESC)
    WHERE organization_id IS NOT NULL;

-- Por usuario y fecha
CREATE INDEX idx_audit_user_time
    ON audit_logs(user_id, created_at DESC)
    WHERE user_id IS NOT NULL;

-- Por tipo de evento
CREATE INDEX idx_audit_event_type
    ON audit_logs(event_type, created_at DESC);

-- Por servicio
CREATE INDEX idx_audit_service
    ON audit_logs(service, created_at DESC);

-- Índice único para idempotencia
CREATE UNIQUE INDEX idx_audit_event_id
    ON audit_logs(event_id);

-- GIN para búsqueda en payload JSON
CREATE INDEX idx_audit_payload_gin
    ON audit_logs USING GIN (payload jsonb_path_ops);
```

## Modelo SQLAlchemy

```python
from sqlalchemy import Column, String, DateTime, Text, Index
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from datetime import datetime
import uuid

class AuditLog(Base):
    """Modelo de log de auditoría."""

    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(String(100), unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    service = Column(String(50), nullable=False, index=True)
    version = Column(String(20), default="1.0")

    # JSON fields
    payload = Column(JSONB, nullable=False)
    metadata = Column(JSONB)

    # Contexto
    organization_id = Column(UUID(as_uuid=True), index=True)
    user_id = Column(UUID(as_uuid=True), index=True)
    ip_address = Column(INET)
    user_agent = Column(Text)

    # Índices compuestos
    __table_args__ = (
        Index('idx_audit_org_time', 'organization_id', 'created_at'),
        Index('idx_audit_user_time', 'user_id', 'created_at'),
        Index('idx_audit_payload_gin', 'payload', postgresql_using='gin'),
    )

    def __repr__(self):
        return f"<AuditLog {self.event_type} at {self.created_at}>"
```

## Schemas Pydantic

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

class AuditLogCreate(BaseModel):
    """Schema para crear log de auditoría."""

    event_id: str = Field(..., max_length=100)
    event_type: str = Field(..., max_length=100)
    service: str = Field(..., max_length=50)
    version: str = Field(default="1.0", max_length=20)
    payload: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None
    organization_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class AuditLogResponse(BaseModel):
    """Schema de respuesta de log de auditoría."""

    id: UUID
    event_id: str
    event_type: str
    created_at: datetime
    service: str
    version: str
    payload: Dict[str, Any]
    metadata: Optional[Dict[str, Any]]
    organization_id: Optional[UUID]
    user_id: Optional[UUID]
    ip_address: Optional[str]
    user_agent: Optional[str]

    class Config:
        from_attributes = True
```

## Queries Comunes

### Buscar por Organización

```sql
SELECT *
FROM audit_logs
WHERE organization_id = 'org-uuid'
  AND created_at >= '2025-11-01'
  AND created_at < '2025-12-01'
ORDER BY created_at DESC
LIMIT 100;
```

### Buscar por Usuario

```sql
SELECT *
FROM audit_logs
WHERE user_id = 'user-uuid'
  AND event_type LIKE 'auth.%'
ORDER BY created_at DESC;
```

### Buscar en Payload JSON

```sql
-- Buscar cambios de precio
SELECT *
FROM audit_logs
WHERE event_type = 'catalog.product.updated'
  AND payload @> '{"changes": {"base_price": {}}}'::jsonb;

-- Buscar producto específico
SELECT *
FROM audit_logs
WHERE payload->>'product_id' = 'product-uuid';
```

### Estadísticas

```sql
-- Eventos por tipo en últimas 24h
SELECT
    event_type,
    COUNT(*) as count
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY count DESC;

-- Actividad por usuario en el mes
SELECT
    user_id,
    COUNT(*) as events_count,
    COUNT(DISTINCT event_type) as event_types
FROM audit_logs
WHERE created_at >= DATE_TRUNC('month', NOW())
  AND user_id IS NOT NULL
GROUP BY user_id
ORDER BY events_count DESC
LIMIT 20;
```

## Triggers de Inmutabilidad

```sql
-- Prevenir UPDATE
CREATE OR REPLACE FUNCTION prevent_audit_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable - UPDATE not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_update_audit_logs
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

-- Prevenir DELETE
CREATE OR REPLACE FUNCTION prevent_audit_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable - DELETE not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_delete_audit_logs
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();
```

## Estimaciones de Tamaño

### Por Evento

```
Tamaño promedio por evento: 1-2 KB
- Metadata: 200 bytes
- Payload: 500-1500 bytes
- Índices: 300 bytes
```

### Por Volumen

```
100 eventos/minuto = 6,000/hora = 144,000/día

Tamaño diario: 144,000 * 1.5 KB ≈ 216 MB/día
Tamaño mensual: 216 MB * 30 ≈ 6.5 GB/mes
Tamaño anual: 6.5 GB * 12 ≈ 78 GB/año
```

## Próximos Pasos

- [Event Consumer](/microservicios/audit-service/event-consumer)
- [API Logs](/microservicios/audit-service/api-logs)
- [Retention Policy](/microservicios/audit-service/retention-policy)
