---
sidebar_position: 7
---

# API de Caja (Drawers)

Endpoints para gestión de cajas y arqueos en POS.

## Base URL

```
POST   /api/v1/pos/drawers/open
POST   /api/v1/pos/drawers/close
GET    /api/v1/pos/drawers/current
GET    /api/v1/pos/drawers/{drawerId}
GET    /api/v1/pos/drawers/{drawerId}/transactions
POST   /api/v1/pos/drawers/{drawerId}/movements
```

## Abrir Caja

Inicia una sesión de caja con fondo inicial.

```http
POST /api/v1/pos/drawers/open
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "local_id": "local_001",
  "initial_cash": 100.00,
  "terminal_id": "TERM_001",
  "notes": "Apertura matutina"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "drawer_id": "drawer_123",
    "local_id": "local_001",
    "cashier_id": "user_456",
    "cashier_name": "María García",
    "status": "open",
    "initial_cash": 100.00,
    "current_cash": 100.00,
    "terminal_id": "TERM_001",
    "opened_at": "2025-11-24T08:00:00Z",
    "created_at": "2025-11-24T08:00:00Z"
  },
  "timestamp": "2025-11-24T08:00:00Z"
}
```

**Validaciones:**
- Usuario debe tener permiso `pos:drawer:open`
- Solo puede haber una caja abierta por usuario
- `initial_cash` debe ser >= 0

## Cerrar Caja

Cierra la sesión de caja y genera reporte de arqueo.

```http
POST /api/v1/pos/drawers/close
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "drawer_id": "drawer_123",
  "final_cash": 450.00,
  "counted_totals": {
    "cash": 450.00,
    "card": 320.00,
    "yappy": 85.00,
    "transfer": 45.00
  },
  "notes": "Cierre sin novedad"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "drawer_id": "drawer_123",
    "status": "closed",
    "summary": {
      "initial_cash": 100.00,
      "transactions_count": 25,
      "sales": {
        "cash": 320.00,
        "card": 320.00,
        "yappy": 85.00,
        "transfer": 45.00,
        "credit": 0.00,
        "total": 770.00
      },
      "refunds": {
        "cash": 0.00,
        "card": 15.00,
        "total": 15.00
      },
      "withdrawals": 0.00,
      "deposits": 0.00,
      "expected_cash": 420.00,
      "actual_cash": 450.00,
      "difference": 30.00,
      "difference_percentage": 7.14,
      "net_sales": 755.00
    },
    "counted_totals": {
      "cash": 450.00,
      "card": 320.00,
      "yappy": 85.00,
      "transfer": 45.00
    },
    "opened_at": "2025-11-24T08:00:00Z",
    "closed_at": "2025-11-24T18:00:00Z",
    "duration_hours": 10.0,
    "reconciliation_status": "surplus",
    "notes": "Cierre sin novedad"
  },
  "timestamp": "2025-11-24T18:00:00Z"
}
```

**Reconciliation Status:**
- `balanced`: Diferencia = 0
- `surplus`: Diferencia > 0 (sobrante)
- `shortage`: Diferencia < 0 (faltante)

**Validaciones:**
- La caja debe estar abierta
- Solo el cajero que abrió puede cerrar (o supervisor con permiso `pos:drawer:force_close`)

## Obtener Caja Actual

Obtiene la caja abierta del usuario actual.

```http
GET /api/v1/pos/drawers/current
Authorization: Bearer {token}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "drawer_id": "drawer_123",
    "local_id": "local_001",
    "status": "open",
    "initial_cash": 100.00,
    "current_totals": {
      "cash": 320.00,
      "card": 250.00,
      "yappy": 60.00,
      "transfer": 30.00,
      "total": 660.00
    },
    "transactions_count": 18,
    "opened_at": "2025-11-24T08:00:00Z",
    "hours_open": 6.5
  }
}
```

**Si no hay caja abierta:** `404 Not Found`

```json
{
  "error": {
    "code": "POS-3001",
    "type": "NO_OPEN_DRAWER",
    "message": "No hay caja abierta para el usuario actual"
  }
}
```

## Obtener Detalle de Caja

```http
GET /api/v1/pos/drawers/{drawerId}
Authorization: Bearer {token}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "drawer_id": "drawer_123",
    "local_id": "local_001",
    "local_name": "Tienda Central",
    "cashier_id": "user_456",
    "cashier_name": "María García",
    "terminal_id": "TERM_001",
    "status": "closed",
    "initial_cash": 100.00,
    "summary": {
      "sales": {
        "cash": 320.00,
        "card": 320.00,
        "yappy": 85.00,
        "transfer": 45.00,
        "total": 770.00
      },
      "refunds_total": 15.00,
      "net_sales": 755.00,
      "transactions_count": 25
    },
    "counted_totals": {
      "cash": 450.00,
      "card": 320.00,
      "yappy": 85.00,
      "transfer": 45.00
    },
    "expected_cash": 420.00,
    "actual_cash": 450.00,
    "difference": 30.00,
    "reconciliation_status": "surplus",
    "movements": [
      {
        "movement_id": "mov_001",
        "type": "deposit",
        "amount": 50.00,
        "reason": "Cambio adicional",
        "created_at": "2025-11-24T10:30:00Z"
      }
    ],
    "opened_at": "2025-11-24T08:00:00Z",
    "closed_at": "2025-11-24T18:00:00Z"
  }
}
```

## Listar Transacciones de Caja

```http
GET /api/v1/pos/drawers/{drawerId}/transactions
Authorization: Bearer {token}
```

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `limit` | int | Resultados por página (default: 50) |
| `cursor` | string | Cursor para paginación |
| `payment_method` | string | Filtrar por método de pago |

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "drawer_id": "drawer_123",
    "transactions": [
      {
        "transaction_id": "txn_001",
        "transaction_number": "POS-2025-001234",
        "status": "completed",
        "total_amount": 45.50,
        "payment_method": "cash",
        "completed_at": "2025-11-24T09:15:00Z"
      },
      {
        "transaction_id": "txn_002",
        "transaction_number": "POS-2025-001235",
        "status": "completed",
        "total_amount": 128.00,
        "payment_method": "card",
        "completed_at": "2025-11-24T09:32:00Z"
      }
    ],
    "summary": {
      "total_transactions": 25,
      "total_sales": 770.00,
      "by_payment_method": {
        "cash": {"count": 10, "total": 320.00},
        "card": {"count": 8, "total": 320.00},
        "yappy": {"count": 5, "total": 85.00},
        "transfer": {"count": 2, "total": 45.00}
      }
    },
    "pageInfo": {
      "hasNextPage": false,
      "endCursor": null
    }
  }
}
```

## Registrar Movimiento de Caja

Para depósitos adicionales o retiros de efectivo.

```http
POST /api/v1/pos/drawers/{drawerId}/movements
Authorization: Bearer {token}
```

**Request Body - Depósito:**

```json
{
  "type": "deposit",
  "amount": 50.00,
  "reason": "Cambio adicional solicitado",
  "authorized_by": "supervisor_123"
}
```

**Request Body - Retiro:**

```json
{
  "type": "withdrawal",
  "amount": 200.00,
  "reason": "Retiro parcial para banco",
  "authorized_by": "supervisor_123"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "movement_id": "mov_001",
    "drawer_id": "drawer_123",
    "type": "withdrawal",
    "amount": 200.00,
    "reason": "Retiro parcial para banco",
    "authorized_by": "supervisor_123",
    "created_at": "2025-11-24T14:00:00Z",
    "new_cash_balance": 220.00
  }
}
```

**Validaciones:**
- Caja debe estar abierta
- Retiros requieren `authorized_by` (supervisor)
- Retiro no puede exceder el efectivo disponible

## Errores Comunes

### POS-3001: NO_OPEN_DRAWER

```json
{
  "error": {
    "code": "POS-3001",
    "type": "NO_OPEN_DRAWER",
    "message": "No hay caja abierta para el usuario actual"
  }
}
```

### POS-3002: DRAWER_ALREADY_OPEN

```json
{
  "error": {
    "code": "POS-3002",
    "type": "DRAWER_ALREADY_OPEN",
    "message": "Ya tiene una caja abierta",
    "details": {
      "drawer_id": "drawer_123",
      "opened_at": "2025-11-24T08:00:00Z"
    }
  }
}
```

### POS-3003: INSUFFICIENT_CASH

```json
{
  "error": {
    "code": "POS-3003",
    "type": "INSUFFICIENT_CASH",
    "message": "Efectivo insuficiente para retiro",
    "details": {
      "available": 150.00,
      "requested": 200.00
    }
  }
}
```

### POS-3004: UNAUTHORIZED_DRAWER_ACCESS

```json
{
  "error": {
    "code": "POS-3004",
    "type": "UNAUTHORIZED_DRAWER_ACCESS",
    "message": "No autorizado para acceder a esta caja"
  }
}
```

## Próximos Pasos

- [Eventos Publicados](./06-eventos-publicados.md)
- [Modo Offline](./09-modo-offline.md)
