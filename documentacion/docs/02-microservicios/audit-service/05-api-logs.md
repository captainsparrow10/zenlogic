---
sidebar_position: 6
---

# API Logs

Endpoints REST para consulta de logs de auditoría.

## Base URL

```
GET /api/v1/logs
GET /api/v1/logs/{id}
GET /api/v1/logs/timeline
GET /api/v1/logs/stats
```

## Listar Logs

### `GET /api/v1/logs`

**Headers**:
```
Authorization: Bearer {access_token}
X-Tenant-ID: {organization_id}
```

**Query Parameters**:
- `start_date` (optional): Fecha inicio (ISO 8601)
- `end_date` (optional): Fecha fin (ISO 8601)
- `event_type` (optional): Filtrar por tipo de evento
- `user_id` (optional): Filtrar por usuario
- `service` (optional): Filtrar por servicio
- `limit` (optional, default=50, max=200): Cantidad de resultados
- `offset` (optional, default=0): Offset para paginación

**Response 200 OK**:
```json
{
  "data": [
    {
      "id": "log-uuid",
      "event_id": "correlation-id-123",
      "event_type": "catalog.product.created",
      "created_at": "2025-11-23T15:00:00Z",
      "service": "catalog-service",
      "version": "1.0",
      "payload": {
        "product_id": "product-uuid",
        "organization_id": "org-uuid",
        "name": "Camiseta Básica",
        "sku": "CAM-001",
        "base_price": 19.99
      },
      "metadata": {
        "user_id": "user-uuid",
        "correlation_id": "correlation-id-123",
        "ip_address": "192.168.1.100"
      },
      "organization_id": "org-uuid",
      "user_id": "user-uuid",
      "ip_address": "192.168.1.100"
    }
  ],
  "pagination": {
    "total": 1523,
    "limit": 50,
    "offset": 0,
    "has_next": true
  }
}
```

## Obtener Log Específico

### `GET /api/v1/logs/{id}`

**Response 200 OK**: Log completo con todos los detalles

**Response 404 Not Found**:
```json
{
  "detail": "Log no encontrado"
}
```

## Timeline de Eventos

### `GET /api/v1/logs/timeline`

Obtener timeline cronológico de eventos para una entidad específica.

**Query Parameters**:
- `entity_type` (required): Tipo de entidad (product, user, role, etc.)
- `entity_id` (required): ID de la entidad
- `start_date` (optional): Fecha inicio
- `end_date` (optional): Fecha fin

**Response 200 OK**:
```json
{
  "entity_type": "product",
  "entity_id": "product-uuid",
  "events": [
    {
      "timestamp": "2025-11-23T10:00:00Z",
      "event_type": "catalog.product.created",
      "user": {
        "id": "user-uuid",
        "email": "admin@example.com"
      },
      "changes": {
        "name": "Camiseta Básica",
        "base_price": 19.99
      }
    },
    {
      "timestamp": "2025-11-23T14:30:00Z",
      "event_type": "catalog.product.updated",
      "user": {
        "id": "user-uuid-2",
        "email": "manager@example.com"
      },
      "changes": {
        "base_price": {
          "old": 19.99,
          "new": 29.99
        }
      }
    }
  ]
}
```

## Estadísticas

### `GET /api/v1/logs/stats`

Obtener estadísticas agregadas de logs.

**Query Parameters**:
- `group_by` (required): Campo para agrupar (event_type, service, user_id)
- `start_date` (optional): Fecha inicio
- `end_date` (optional): Fecha fin

**Response 200 OK**:
```json
{
  "group_by": "event_type",
  "stats": [
    {
      "group": "auth.session.created",
      "count": 1523,
      "percentage": 35.2
    },
    {
      "group": "catalog.product.updated",
      "count": 892,
      "percentage": 20.6
    },
    {
      "group": "auth.user.created",
      "count": 456,
      "percentage": 10.5
    }
  ],
  "total_events": 4328,
  "period": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-11-30T23:59:59Z"
  }
}
```

## Implementación

### Router

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from datetime import datetime

from app.services.query_service import QueryService
from app.schemas.audit import AuditLogResponse, TimelineResponse, StatsResponse
from app.dependencies import get_current_user, get_organization_id

router = APIRouter(prefix="/api/v1/logs", tags=["Audit Logs"])

@router.get("/", response_model=dict)
async def list_logs(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    event_type: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    org_id: str = Depends(get_organization_id),
    current_user: dict = Depends(get_current_user),
    query_service: QueryService = Depends()
):
    """Listar logs de auditoría con filtros."""

    # Solo admins pueden ver logs
    if "audit:read" not in current_user["permissions"]:
        raise HTTPException(status_code=403, detail="No autorizado")

    filters = {
        "organization_id": org_id,
        "start_date": start_date,
        "end_date": end_date,
        "event_type": event_type,
        "user_id": user_id,
        "service": service
    }

    # Remover filtros None
    filters = {k: v for k, v in filters.items() if v is not None}

    result = await query_service.query_logs(
        filters=filters,
        limit=limit,
        offset=offset
    )

    return result

@router.get("/timeline", response_model=TimelineResponse)
async def get_timeline(
    entity_type: str = Query(...),
    entity_id: str = Query(...),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: dict = Depends(get_current_user),
    query_service: QueryService = Depends()
):
    """Obtener timeline de eventos para una entidad."""

    if "audit:read" not in current_user["permissions"]:
        raise HTTPException(status_code=403, detail="No autorizado")

    return await query_service.get_timeline(
        entity_type=entity_type,
        entity_id=entity_id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    group_by: str = Query(..., regex="^(event_type|service|user_id)$"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    org_id: str = Depends(get_organization_id),
    current_user: dict = Depends(get_current_user),
    query_service: QueryService = Depends()
):
    """Obtener estadísticas agregadas."""

    if "audit:read" not in current_user["permissions"]:
        raise HTTPException(status_code=403, detail="No autorizado")

    return await query_service.get_stats(
        organization_id=org_id,
        group_by=group_by,
        start_date=start_date,
        end_date=end_date
    )
```

### Query Service

```python
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.models.audit import AuditLog
from app.repositories.audit_repository import AuditRepository

class QueryService:
    """Servicio para queries complejas de auditoría."""

    def __init__(self, audit_repo: AuditRepository):
        self.audit_repo = audit_repo

    async def query_logs(
        self,
        filters: Dict[str, Any],
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Consultar logs con filtros."""

        # Contar total
        total = await self.audit_repo.count_by_filters(filters)

        # Obtener logs
        logs = await self.audit_repo.find_by_filters(
            filters=filters,
            limit=limit,
            offset=offset,
            order_by=AuditLog.created_at.desc()
        )

        return {
            "data": logs,
            "pagination": {
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_next": (offset + limit) < total
            }
        }

    async def get_timeline(
        self,
        entity_type: str,
        entity_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Obtener timeline de eventos para una entidad."""

        # Buscar en payload JSON
        filters = {}
        if start_date:
            filters["start_date"] = start_date
        if end_date:
            filters["end_date"] = end_date

        # Query con JSONB
        logs = await self.audit_repo.find_by_entity(
            entity_type=entity_type,
            entity_id=entity_id,
            filters=filters
        )

        return {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "events": [self._format_timeline_event(log) for log in logs]
        }

    def _format_timeline_event(self, log: AuditLog) -> Dict[str, Any]:
        """Formatear evento para timeline."""
        return {
            "timestamp": log.created_at,
            "event_type": log.event_type,
            "user": {
                "id": str(log.user_id) if log.user_id else None,
                "email": log.payload.get("user_email")
            },
            "changes": log.payload.get("changes", log.payload)
        }
```

## Códigos de Error

| Código | Error Code | Descripción |
|--------|-----------|-------------|
| 401 | UNAUTHORIZED | Token inválido |
| 403 | FORBIDDEN | Sin permisos de auditoría |
| 404 | LOG_NOT_FOUND | Log no encontrado |
| 422 | INVALID_FILTERS | Filtros inválidos |

## Próximos Pasos

- [Queries Comunes](/microservicios/audit-service/queries-comunes)
- [Retention Policy](/microservicios/audit-service/retention-policy)
- [Modelo de Datos](/microservicios/audit-service/modelo-datos)
