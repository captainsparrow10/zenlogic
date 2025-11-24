---
sidebar_position: 12
---

# Adjustments API

API REST para ajustes de inventario con aprobaciones, motivos y auditoría completa.

## Endpoints

### Listar Ajustes

```http
GET /api/v1/adjustments
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `stock_id` | UUID | No | Filtrar por stock |
| `variant_id` | UUID | No | Filtrar por variante |
| `warehouse_id` | UUID | No | Filtrar por bodega |
| `adjustment_type` | string | No | positive, negative |
| `reason` | string | No | damaged, expired, lost, found, audit, other |
| `status` | string | No | pending, approved, rejected, applied |
| `created_by` | UUID | No | Usuario creador |
| `date_from` | date | No | Fecha desde |
| `date_to` | date | No | Fecha hasta |
| `cursor` | string | No | Cursor de paginación |
| `limit` | integer | No | Resultados por página (max: 100) |

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "edges": [
      {
        "cursor": "YWRqXzEyMw==",
        "node": {
          "adjustment_id": "adj_123",
          "stock_id": "stock_456",
          "stock": {
            "variant_id": "var_789",
            "variant_sku": "PROD-001",
            "warehouse_id": "wh_101",
            "warehouse_name": "Bodega Principal"
          },
          "adjustment_type": "negative",
          "reason": "damaged",
          "quantities": {
            "quantity_before": 150,
            "quantity_after": 145,
            "quantity_change": -5
          },
          "status": "applied",
          "created_by": {
            "user_id": "user_456",
            "name": "Juan Pérez"
          },
          "approved_by": {
            "user_id": "user_789",
            "name": "María García",
            "approval_date": "2025-11-23T14:00:00Z"
          },
          "notes": "Productos dañados durante transporte interno",
          "created_at": "2025-11-23T10:00:00Z",
          "updated_at": "2025-11-23T14:30:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "totalCount": 87
    }
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/adjustments",
  "requestId": "req_adj123"
}
```

---

### Obtener Ajuste por ID

```http
GET /api/v1/adjustments/{adjustmentId}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "adjustment_id": "adj_123",
    "stock_id": "stock_456",
    "variant": {
      "variant_id": "var_789",
      "sku": "PROD-001-RED",
      "name": "Producto Ejemplo - Rojo"
    },
    "warehouse": {
      "warehouse_id": "wh_101",
      "name": "Bodega Principal",
      "code": "WH-001"
    },
    "adjustment_type": "negative",
    "reason": "damaged",
    "quantities": {
      "quantity_before": 150,
      "quantity_after": 145,
      "quantity_change": -5,
      "percentage_change": -3.33
    },
    "status": "applied",
    "created_by": {
      "user_id": "user_456",
      "name": "Juan Pérez",
      "email": "juan.perez@example.com"
    },
    "approved_by": {
      "user_id": "user_789",
      "name": "María García",
      "email": "maria.garcia@example.com",
      "approval_date": "2025-11-23T14:00:00Z"
    },
    "notes": "Productos dañados durante transporte interno - Carretilla chocó estantería",
    "metadata": {
      "incident_report": "IR-2025-0123",
      "photos": ["img1.jpg", "img2.jpg"]
    },
    "audit_trail": [
      {
        "status": "pending",
        "timestamp": "2025-11-23T10:00:00Z",
        "user": "Juan Pérez",
        "action": "created"
      },
      {
        "status": "approved",
        "timestamp": "2025-11-23T14:00:00Z",
        "user": "María García",
        "action": "approved"
      },
      {
        "status": "applied",
        "timestamp": "2025-11-23T14:30:00Z",
        "user": "Sistema",
        "action": "stock_adjusted"
      }
    ],
    "created_at": "2025-11-23T10:00:00Z",
    "updated_at": "2025-11-23T14:30:00Z"
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/adjustments/adj_123",
  "requestId": "req_getadj123"
}
```

---

### Crear Ajuste

```http
POST /api/v1/adjustments
```

**Request Body:**

```json
{
  "stock_id": "stock_456",
  "adjustment_type": "negative",
  "quantity_change": -5,
  "reason": "damaged",
  "notes": "Productos dañados durante transporte interno",
  "metadata": {
    "incident_report": "IR-2025-0123",
    "photos": ["img1.jpg", "img2.jpg"]
  },
  "auto_approve": false
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `stock_id` | UUID | Sí | ID del stock a ajustar |
| `adjustment_type` | string | Sí | positive, negative |
| `quantity_change` | integer | Sí | Cambio en cantidad (con signo) |
| `reason` | string | Sí | damaged, expired, lost, found, audit, other |
| `notes` | text | Sí | Justificación del ajuste |
| `metadata` | object | No | Información adicional |
| `auto_approve` | boolean | No | Auto-aprobar si está permitido (default: false) |

**Validaciones:**
- `quantity_change` debe coincidir con `adjustment_type` (positivo/negativo)
- Para ajustes negativos: `abs(quantity_change)` no puede ser mayor al stock disponible
- Ajustes mayores al X% requieren aprobación obligatoria (configurable)

**Respuesta Exitosa (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "adjustment_id": "adj_new456",
    "stock_id": "stock_456",
    "adjustment_type": "negative",
    "quantity_change": -5,
    "reason": "damaged",
    "status": "pending",
    "requires_approval": true,
    "created_at": "2025-11-23T16:00:00Z"
  },
  "timestamp": "2025-11-23T16:00:00Z",
  "path": "/api/v1/adjustments",
  "requestId": "req_createadj456"
}
```

**Códigos de Error:**
- `400` - `INVALID_ADJUSTMENT_DATA`: Datos inválidos
- `400` - `QUANTITY_EXCEEDS_STOCK`: Ajuste negativo excede stock disponible
- `404` - `STOCK_NOT_FOUND`: Stock no existe
- `400` - `QUANTITY_SIGN_MISMATCH`: Signo de cantidad no coincide con tipo

**Evento Publicado:**
```json
{
  "event": "inventory.adjustment.created",
  "data": {
    "adjustment_id": "adj_new456",
    "stock_id": "stock_456",
    "adjustment_type": "negative",
    "quantity_change": -5,
    "status": "pending"
  }
}
```

---

### Aprobar Ajuste

```http
POST /api/v1/adjustments/{adjustmentId}/approve
```

**Request Body:**

```json
{
  "notes": "Aprobado - Revisado reporte de incidente"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "adjustment_id": "adj_123",
    "status": "approved",
    "approved_by": {
      "user_id": "user_789",
      "name": "María García"
    },
    "approval_date": "2025-11-23T16:30:00Z",
    "will_auto_apply": true,
    "estimated_apply_time": "2025-11-23T16:30:05Z"
  },
  "timestamp": "2025-11-23T16:30:00Z",
  "path": "/api/v1/adjustments/adj_123/approve",
  "requestId": "req_approve123"
}
```

**Códigos de Error:**
- `404` - `ADJUSTMENT_NOT_FOUND`: Ajuste no existe
- `409` - `ADJUSTMENT_ALREADY_APPROVED`: Ya fue aprobado
- `409` - `ADJUSTMENT_ALREADY_APPLIED`: Ya fue aplicado
- `409` - `ADJUSTMENT_REJECTED`: Ajuste fue rechazado
- `403` - `INSUFFICIENT_PERMISSIONS`: Sin permisos para aprobar

**Evento Publicado:**
```json
{
  "event": "inventory.adjustment.approved",
  "data": {
    "adjustment_id": "adj_123",
    "approved_by": "user_789",
    "approval_date": "2025-11-23T16:30:00Z"
  }
}
```

**Nota:** Al aprobar, el ajuste se aplica automáticamente al stock.

---

### Rechazar Ajuste

```http
POST /api/v1/adjustments/{adjustmentId}/reject
```

**Request Body:**

```json
{
  "reason": "Falta evidencia fotográfica",
  "notes": "Por favor adjuntar fotos del daño antes de re-enviar"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "adjustment_id": "adj_123",
    "status": "rejected",
    "rejected_by": {
      "user_id": "user_789",
      "name": "María García"
    },
    "rejection_reason": "Falta evidencia fotográfica",
    "rejected_at": "2025-11-23T16:45:00Z"
  },
  "timestamp": "2025-11-23T16:45:00Z",
  "path": "/api/v1/adjustments/adj_123/reject",
  "requestId": "req_reject123"
}
```

**Códigos de Error:**
- `409` - `ADJUSTMENT_ALREADY_APPROVED`: Ya fue aprobado
- `409` - `ADJUSTMENT_ALREADY_APPLIED`: Ya fue aplicado

**Evento Publicado:**
```json
{
  "event": "inventory.adjustment.rejected",
  "data": {
    "adjustment_id": "adj_123",
    "rejected_by": "user_789",
    "reason": "Falta evidencia fotográfica"
  }
}
```

---

### Reporte de Ajustes

```http
GET /api/v1/adjustments/report
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `date_from` | date | Sí | Fecha desde (YYYY-MM-DD) |
| `date_to` | date | Sí | Fecha hasta (YYYY-MM-DD) |
| `warehouse_id` | UUID | No | Filtrar por bodega |
| `group_by` | string | No | reason, warehouse, type, user |

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "period": {
      "from": "2025-11-01",
      "to": "2025-11-30",
      "days": 30
    },
    "summary": {
      "total_adjustments": 87,
      "positive_adjustments": 12,
      "negative_adjustments": 75,
      "net_quantity_change": -250,
      "total_value_impact": -12500.00,
      "pending_approvals": 5,
      "approved": 70,
      "rejected": 12
    },
    "by_reason": [
      {
        "reason": "damaged",
        "count": 45,
        "total_quantity": -180,
        "percentage": 51.7
      },
      {
        "reason": "expired",
        "count": 20,
        "total_quantity": -50,
        "percentage": 23.0
      },
      {
        "reason": "lost",
        "count": 8,
        "total_quantity": -15,
        "percentage": 9.2
      },
      {
        "reason": "found",
        "count": 10,
        "total_quantity": 25,
        "percentage": 11.5
      },
      {
        "reason": "audit",
        "count": 4,
        "total_quantity": -30,
        "percentage": 4.6
      }
    ],
    "by_warehouse": [
      {
        "warehouse_id": "wh_101",
        "warehouse_name": "Bodega Principal",
        "count": 55,
        "net_change": -180
      },
      {
        "warehouse_id": "wh_102",
        "warehouse_name": "Bodega Sucursal",
        "count": 32,
        "net_change": -70
      }
    ],
    "top_variants_adjusted": [
      {
        "variant_id": "var_789",
        "sku": "PROD-001",
        "adjustments_count": 8,
        "total_change": -25
      }
    ]
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/adjustments/report",
  "requestId": "req_adjreport123"
}
```

---

## Motivos de Ajuste

### Ajustes Negativos

| Motivo | Código | Descripción |
|--------|--------|-------------|
| Dañado | `damaged` | Productos dañados |
| Vencido | `expired` | Productos con fecha vencida |
| Perdido | `lost` | Inventario perdido/robado |
| Auditoría | `audit` | Ajuste por conteo físico |
| Otro | `other` | Otro motivo (especificar) |

### Ajustes Positivos

| Motivo | Código | Descripción |
|--------|--------|-------------|
| Encontrado | `found` | Inventario encontrado |
| Auditoría | `audit` | Ajuste por conteo físico |
| Otro | `other` | Otro motivo (especificar) |

---

## Configuración de Aprobaciones

Los ajustes requieren aprobación si:

1. **Valor absoluto mayor a umbral:** `abs(quantity_change) > MAX_ADJUSTMENT_QUANTITY`
2. **Porcentaje mayor a umbral:** `(abs(quantity_change) / current_stock) > MAX_ADJUSTMENT_PERCENTAGE`
3. **Razón específica:** Configuración por organización

**Variables de Entorno:**
```bash
MAX_ADJUSTMENT_QUANTITY=100
MAX_ADJUSTMENT_PERCENTAGE=0.1  # 10%
ADJUSTMENT_REQUIRE_APPROVAL=true
ADJUSTMENT_AUTO_APPLY_ON_APPROVE=true
```

---

## Permisos Requeridos

| Endpoint | Permiso Requerido |
|----------|-------------------|
| `GET /adjustments` | `inventory.adjustments.read` |
| `GET /adjustments/{id}` | `inventory.adjustments.read` |
| `POST /adjustments` | `inventory.adjustments.create` |
| `POST /adjustments/{id}/approve` | `inventory.adjustments.approve` |
| `POST /adjustments/{id}/reject` | `inventory.adjustments.approve` |
| `GET /adjustments/report` | `inventory.adjustments.read` |

## Eventos Publicados

- `inventory.adjustment.created` - Ajuste creado
- `inventory.adjustment.approved` - Ajuste aprobado
- `inventory.adjustment.rejected` - Ajuste rechazado
- `inventory.adjustment.applied` - Ajuste aplicado al stock
- `inventory.stock.updated` - Stock actualizado (automático)

## Próximos Pasos

- [API: Locations](./api-locations)
- [Eventos Publicados](./eventos-publicados)
- [Errores Comunes](./errores-comunes)
