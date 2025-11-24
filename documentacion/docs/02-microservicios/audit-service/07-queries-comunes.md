---
sidebar_position: 8
---

# Queries Comunes

Ejemplos de consultas SQL frecuentes para auditoría.

## Por Usuario

### Todas las acciones de un usuario

```sql
SELECT
    event_type,
    created_at,
    payload->>'entity_type' as entity,
    payload
FROM audit_logs
WHERE user_id = 'user-uuid'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Logins de un usuario

```sql
SELECT
    created_at,
    ip_address,
    metadata->>'user_agent' as browser,
    payload->>'result' as result
FROM audit_logs
WHERE user_id = 'user-uuid'
  AND event_type = 'auth.session.created'
ORDER BY created_at DESC
LIMIT 50;
```

## Por Organización

### Actividad reciente de organización

```sql
SELECT
    event_type,
    service,
    COUNT(*) as event_count,
    array_agg(DISTINCT user_id) as users
FROM audit_logs
WHERE organization_id = 'org-uuid'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type, service
ORDER BY event_count DESC;
```

### Top usuarios activos

```sql
SELECT
    user_id,
    COUNT(*) as actions_count,
    COUNT(DISTINCT event_type) as event_types,
    MAX(created_at) as last_action
FROM audit_logs
WHERE organization_id = 'org-uuid'
  AND created_at >= NOW() - INTERVAL '30 days'
  AND user_id IS NOT NULL
GROUP BY user_id
ORDER BY actions_count DESC
LIMIT 20;
```

## Por Entidad

### Historial de un producto

```sql
SELECT
    event_type,
    created_at,
    user_id,
    payload->'changes' as changes
FROM audit_logs
WHERE payload->>'product_id' = 'product-uuid'
  AND event_type LIKE 'catalog.product.%'
ORDER BY created_at ASC;
```

### Cambios de precio

```sql
SELECT
    payload->>'product_id' as product_id,
    payload->'changes'->'base_price'->>'old' as old_price,
    payload->'changes'->'base_price'->>'new' as new_price,
    created_at,
    user_id
FROM audit_logs
WHERE event_type = 'catalog.product.updated'
  AND payload @> '{"changes": {"base_price": {}}}'::jsonb
  AND created_at >= '2025-11-01'
ORDER BY created_at DESC;
```

## Estadísticas

### Eventos por día (últimos 30 días)

```sql
SELECT
    DATE(created_at) as date,
    COUNT(*) as events_count,
    COUNT(DISTINCT user_id) as unique_users
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Eventos por servicio

```sql
SELECT
    service,
    event_type,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY service, event_type
ORDER BY count DESC;
```

### Pico de actividad por hora

```sql
SELECT
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as events
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY events DESC
LIMIT 10;
```

## Compliance

### Accesos a datos sensibles

```sql
SELECT
    user_id,
    event_type,
    created_at,
    ip_address,
    payload->>'entity_id' as entity_accessed
FROM audit_logs
WHERE event_type IN (
    'auth.user.accessed',
    'catalog.product.viewed',
    'order.order.viewed'
)
  AND created_at >= NOW() - INTERVAL '90 days'
ORDER BY created_at DESC;
```

### Cambios en permisos

```sql
SELECT
    payload->>'role_id' as role_id,
    payload->>'role_name' as role_name,
    payload->'changes' as permission_changes,
    user_id as modified_by,
    created_at
FROM audit_logs
WHERE event_type = 'auth.role.permissions_changed'
ORDER BY created_at DESC;
```

### Usuarios desactivados

```sql
SELECT
    payload->>'user_id' as deactivated_user,
    payload->>'email' as email,
    user_id as deactivated_by,
    created_at,
    payload->>'reason' as reason
FROM audit_logs
WHERE event_type = 'auth.user.deactivated'
  AND created_at >= NOW() - INTERVAL '1 year'
ORDER BY created_at DESC;
```

## Debugging

### Eventos fallidos

```sql
SELECT
    event_type,
    service,
    payload->>'error' as error_message,
    created_at,
    COUNT(*) OVER (PARTITION BY event_type) as error_count
FROM audit_logs
WHERE payload ? 'error'
  AND created_at >= NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

### Timeline de una transacción

```sql
SELECT
    event_type,
    created_at,
    service,
    payload
FROM audit_logs
WHERE metadata->>'correlation_id' = 'transaction-uuid'
ORDER BY created_at ASC;
```

## Performance

### Eventos con payloads grandes

```sql
SELECT
    id,
    event_type,
    pg_column_size(payload) as payload_size_bytes,
    created_at
FROM audit_logs
WHERE pg_column_size(payload) > 10240  -- > 10KB
ORDER BY payload_size_bytes DESC
LIMIT 100;
```

### Particiones más grandes

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE 'audit_logs_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Implementación en Python

### Query Helper

```python
from sqlalchemy import select, func, and_, or_
from app.models.audit import AuditLog

class AuditQueries:
    """Helpers para queries comunes."""

    @staticmethod
    async def get_user_timeline(db, user_id: str, days: int = 7):
        """Timeline de usuario."""
        query = select(AuditLog).where(
            and_(
                AuditLog.user_id == user_id,
                AuditLog.created_at >= datetime.utcnow() - timedelta(days=days)
            )
        ).order_by(AuditLog.created_at.desc())

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_price_changes(db, start_date: datetime):
        """Cambios de precio."""
        query = select(AuditLog).where(
            and_(
                AuditLog.event_type == 'catalog.product.updated',
                AuditLog.payload.op('@>')('{"changes": {"base_price": {}}}'::JSONB),
                AuditLog.created_at >= start_date
            )
        ).order_by(AuditLog.created_at.desc())

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_top_active_users(db, org_id: str, limit: int = 10):
        """Usuarios más activos."""
        query = select(
            AuditLog.user_id,
            func.count().label('actions_count')
        ).where(
            and_(
                AuditLog.organization_id == org_id,
                AuditLog.created_at >= datetime.utcnow() - timedelta(days=30),
                AuditLog.user_id.isnot(None)
            )
        ).group_by(AuditLog.user_id).order_by(
            func.count().desc()
        ).limit(limit)

        result = await db.execute(query)
        return result.all()
```

## Próximos Pasos

- [API Logs](/microservicios/audit-service/api-logs)
- [Modelo de Datos](/microservicios/audit-service/modelo-datos)
- [Event Consumer](/microservicios/audit-service/event-consumer)
