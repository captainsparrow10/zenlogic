---
sidebar_position: 8
---

# Stock API

API REST para consulta y gestión de stock de inventario con soporte para consultas multi-criterio, alertas y reservas.

## Endpoints

### Consultar Stock

Obtiene el stock actual de una variante en bodegas específicas.

```http
GET /api/v1/stock
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `variant_id` | UUID | Sí | ID de la variante |
| `warehouse_id` | UUID | No | Filtrar por bodega específica |
| `local_id` | UUID | No | Filtrar por local |
| `location_id` | UUID | No | Filtrar por ubicación específica |
| `include_reserved` | boolean | No | Incluir cantidad reservada (default: true) |

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "edges": [
      {
        "cursor": "c3RvY2tfMTIz",
        "node": {
          "stock_id": "stock_123",
          "variant_id": "var_456",
          "warehouse_id": "wh_789",
          "warehouse": {
            "warehouse_id": "wh_789",
            "name": "Bodega Principal",
            "code": "WH-001",
            "warehouse_type": "main"
          },
          "location_id": "loc_101",
          "location": {
            "location_id": "loc_101",
            "name": "Pasillo A - Estante 5",
            "code": "WH01-A05-R03"
          },
          "quantities": {
            "total": 150,
            "available": 120,
            "reserved": 25,
            "damaged": 3,
            "in_transit": 2
          },
          "stock_levels": {
            "min_stock": 20,
            "max_stock": 200,
            "reorder_point": 30,
            "safety_stock": 10
          },
          "stock_strategy": "FIFO",
          "stock_status": "in_stock",
          "alert_level": "normal",
          "last_movement_at": "2025-11-23T10:30:00Z",
          "created_at": "2025-01-15T08:00:00Z",
          "updated_at": "2025-11-23T10:30:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": false,
      "hasPreviousPage": false,
      "totalCount": 1
    }
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/stock",
  "requestId": "req_abc123"
}
```

**stock_status Values:**
- `in_stock`: Stock disponible mayor que mínimo
- `low_stock`: Stock disponible menor o igual al mínimo
- `out_of_stock`: Stock disponible = 0

**alert_level Values:**
- `normal`: Stock > reorder_point
- `warning`: Stock menor o igual a reorder_point pero mayor a min_stock
- `critical`: Stock menor o igual a min_stock

**Códigos de Error:**
- `404` - `VARIANT_NOT_FOUND`: Variante no existe
- `404` - `WAREHOUSE_NOT_FOUND`: Bodega no existe
- `403` - `LOCAL_ACCESS_DENIED`: Sin acceso a este local

---

### Consultar Stock por Variante

Obtiene resumen de stock de una variante en todas las bodegas.

```http
GET /api/v1/stock/variant/{variantId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | UUID | ID de la variante |

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `local_id` | UUID | No | Filtrar por local |
| `warehouse_type` | string | No | Filtrar por tipo de bodega |
| `active_only` | boolean | No | Solo bodegas activas (default: true) |

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "variant_id": "var_456",
    "summary": {
      "total_warehouses": 3,
      "total_quantity": 450,
      "available_quantity": 385,
      "reserved_quantity": 55,
      "damaged_quantity": 8,
      "in_transit_quantity": 2,
      "stock_status": "in_stock"
    },
    "by_warehouse": [
      {
        "warehouse_id": "wh_789",
        "warehouse_name": "Bodega Principal",
        "warehouse_code": "WH-001",
        "warehouse_type": "main",
        "quantities": {
          "total": 300,
          "available": 260,
          "reserved": 35,
          "damaged": 5,
          "in_transit": 0
        },
        "stock_status": "in_stock"
      },
      {
        "warehouse_id": "wh_790",
        "warehouse_name": "Bodega Sucursal Centro",
        "warehouse_code": "WH-002",
        "warehouse_type": "branch",
        "quantities": {
          "total": 150,
          "available": 125,
          "reserved": 20,
          "damaged": 3,
          "in_transit": 2
        },
        "stock_status": "low_stock"
      }
    ]
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/stock/variant/var_456",
  "requestId": "req_abc456"
}
```

---

### Actualizar Niveles de Stock

Actualiza min_stock, max_stock y configuraciones de alerta.

```http
PATCH /api/v1/stock/{stockId}/levels
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `stockId` | UUID | ID del stock |

**Request Body:**

```json
{
  "min_stock": 25,
  "max_stock": 250,
  "reorder_point": 40,
  "safety_stock": 15,
  "stock_strategy": "FIFO"
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `min_stock` | integer | No | Stock mínimo |
| `max_stock` | integer | No | Stock máximo |
| `reorder_point` | integer | No | Punto de reorden |
| `safety_stock` | integer | No | Stock de seguridad |
| `stock_strategy` | string | No | FIFO, LIFO, FEFO |

**Validaciones:**
- `min_stock` menor o igual a `max_stock`
- `reorder_point` mayor a `min_stock`
- `safety_stock` menor a `min_stock`

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "stock_id": "stock_123",
    "variant_id": "var_456",
    "warehouse_id": "wh_789",
    "quantities": {
      "total": 150,
      "available": 120,
      "reserved": 25,
      "damaged": 3,
      "in_transit": 2
    },
    "stock_levels": {
      "min_stock": 25,
      "max_stock": 250,
      "reorder_point": 40,
      "safety_stock": 15
    },
    "stock_strategy": "FIFO",
    "updated_at": "2025-11-23T15:05:00Z"
  },
  "timestamp": "2025-11-23T15:05:00Z",
  "path": "/api/v1/stock/stock_123/levels",
  "requestId": "req_abc789"
}
```

**Códigos de Error:**
- `404` - `STOCK_NOT_FOUND`: Stock no existe
- `400` - `INVALID_STOCK_LEVELS`: Niveles inválidos
- `403` - `INSUFFICIENT_PERMISSIONS`: Sin permisos para modificar

---

### Reservar Stock

Crea una reserva de stock para una orden.

```http
POST /api/v1/stock/reserve
```

**Request Body:**

```json
{
  "order_id": "order_789",
  "items": [
    {
      "variant_id": "var_456",
      "warehouse_id": "wh_789",
      "quantity": 10,
      "expires_in_minutes": 30
    },
    {
      "variant_id": "var_457",
      "warehouse_id": "wh_789",
      "quantity": 5,
      "expires_in_minutes": 30
    }
  ],
  "reservation_type": "order"
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `order_id` | UUID | Sí | ID de la orden |
| `items` | array | Sí | Items a reservar |
| `items[].variant_id` | UUID | Sí | ID de variante |
| `items[].warehouse_id` | UUID | Sí | ID de bodega |
| `items[].quantity` | integer | Sí | Cantidad a reservar |
| `items[].expires_in_minutes` | integer | No | Minutos hasta expiración (default: 30) |
| `reservation_type` | string | No | order, quote (default: order) |

**Respuesta Exitosa (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "reservation_id": "res_123",
    "order_id": "order_789",
    "status": "active",
    "items": [
      {
        "reservation_item_id": "resitem_456",
        "variant_id": "var_456",
        "warehouse_id": "wh_789",
        "quantity": 10,
        "stock_before": 120,
        "stock_after": 110,
        "reserved_at": "2025-11-23T15:00:00Z",
        "expires_at": "2025-11-23T15:30:00Z"
      },
      {
        "reservation_item_id": "resitem_457",
        "variant_id": "var_457",
        "warehouse_id": "wh_789",
        "quantity": 5,
        "stock_before": 85,
        "stock_after": 80,
        "reserved_at": "2025-11-23T15:00:00Z",
        "expires_at": "2025-11-23T15:30:00Z"
      }
    ],
    "created_at": "2025-11-23T15:00:00Z"
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/stock/reserve",
  "requestId": "req_res123"
}
```

**Códigos de Error:**
- `400` - `INSUFFICIENT_STOCK`: Stock insuficiente para reservar
- `404` - `VARIANT_NOT_FOUND`: Variante no existe
- `404` - `WAREHOUSE_NOT_FOUND`: Bodega no existe
- `409` - `RESERVATION_EXISTS`: Ya existe reserva para esta orden

**Evento Publicado:**
```json
{
  "event": "inventory.stock.reserved",
  "data": {
    "reservation_id": "res_123",
    "order_id": "order_789",
    "items": [...],
    "expires_at": "2025-11-23T15:30:00Z"
  }
}
```

---

### Liberar Reserva

Libera una reserva de stock existente.

```http
POST /api/v1/stock/reserve/{reservationId}/release
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `reservationId` | UUID | ID de la reserva |

**Request Body:**

```json
{
  "reason": "order_cancelled",
  "notes": "Cliente canceló la orden"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "reservation_id": "res_123",
    "order_id": "order_789",
    "status": "cancelled",
    "items_released": 2,
    "released_at": "2025-11-23T15:10:00Z"
  },
  "timestamp": "2025-11-23T15:10:00Z",
  "path": "/api/v1/stock/reserve/res_123/release",
  "requestId": "req_rel123"
}
```

**Códigos de Error:**
- `404` - `RESERVATION_NOT_FOUND`: Reserva no existe
- `409` - `RESERVATION_ALREADY_FULFILLED`: Reserva ya fue cumplida
- `409` - `RESERVATION_EXPIRED`: Reserva ya expiró

**Evento Publicado:**
```json
{
  "event": "inventory.stock.released",
  "data": {
    "reservation_id": "res_123",
    "order_id": "order_789",
    "reason": "order_cancelled"
  }
}
```

---

### Consultar Alertas de Stock Bajo

Obtiene lista de productos con stock bajo el nivel mínimo.

```http
GET /api/v1/stock/alerts
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `warehouse_id` | UUID | No | Filtrar por bodega |
| `local_id` | UUID | No | Filtrar por local |
| `alert_level` | string | No | warning, critical |
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
        "cursor": "YWxlcnRfMTIz",
        "node": {
          "stock_id": "stock_456",
          "variant_id": "var_789",
          "variant": {
            "sku": "PROD-001-RED",
            "name": "Producto Ejemplo - Rojo"
          },
          "warehouse_id": "wh_123",
          "warehouse": {
            "name": "Bodega Principal",
            "code": "WH-001"
          },
          "quantities": {
            "available": 15,
            "reserved": 5,
            "total": 20
          },
          "stock_levels": {
            "min_stock": 20,
            "reorder_point": 30
          },
          "quantity_needed": 15,
          "alert_level": "critical",
          "days_of_stock": 3,
          "last_movement_at": "2025-11-22T14:20:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "totalCount": 45
    }
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/stock/alerts",
  "requestId": "req_alerts123"
}
```

**Campos Calculados:**
- `quantity_needed`: `min_stock - available_quantity`
- `days_of_stock`: Días estimados basado en velocidad de venta promedio
- `alert_level`: "warning" (menor o igual a reorder_point) o "critical" (menor o igual a min_stock)

---

### Validar Disponibilidad

Valida si hay stock disponible para una lista de items sin crear reserva.

```http
POST /api/v1/stock/check-availability
```

**Request Body:**

```json
{
  "items": [
    {
      "variant_id": "var_456",
      "warehouse_id": "wh_789",
      "quantity": 25
    },
    {
      "variant_id": "var_457",
      "warehouse_id": "wh_789",
      "quantity": 10
    }
  ],
  "allow_partial": false
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "is_available": true,
    "items": [
      {
        "variant_id": "var_456",
        "warehouse_id": "wh_789",
        "requested_quantity": 25,
        "available_quantity": 120,
        "is_available": true,
        "can_fulfill": true
      },
      {
        "variant_id": "var_457",
        "warehouse_id": "wh_789",
        "requested_quantity": 10,
        "available_quantity": 85,
        "is_available": true,
        "can_fulfill": true
      }
    ],
    "all_available": true,
    "partially_available": false
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/stock/check-availability",
  "requestId": "req_check123"
}
```

**Respuesta con Stock Insuficiente:**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "is_available": false,
    "items": [
      {
        "variant_id": "var_456",
        "warehouse_id": "wh_789",
        "requested_quantity": 150,
        "available_quantity": 120,
        "is_available": false,
        "can_fulfill": false,
        "shortage": 30
      }
    ],
    "all_available": false,
    "partially_available": true
  }
}
```

---

## Permisos Requeridos

| Endpoint | Permiso Requerido |
|----------|-------------------|
| `GET /stock` | `inventory.stock.read` |
| `GET /stock/variant/{id}` | `inventory.stock.read` |
| `PATCH /stock/{id}/levels` | `inventory.stock.manage` |
| `POST /stock/reserve` | `inventory.stock.reserve` |
| `POST /stock/reserve/{id}/release` | `inventory.stock.reserve` |
| `GET /stock/alerts` | `inventory.stock.read` |
| `POST /stock/check-availability` | `inventory.stock.read` |

## Eventos Publicados

- `inventory.stock.updated` - Stock actualizado
- `inventory.stock.reserved` - Stock reservado
- `inventory.stock.released` - Reserva liberada
- `inventory.stock.low_level` - Stock bajo mínimo
- `inventory.stock.depleted` - Stock agotado

## Ejemplos de Uso

### Consultar Stock Multi-Bodega

```bash
curl -X GET "https://api.example.com/api/v1/stock/variant/var_456?local_id=local_123" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-ID: org_789"
```

### Reservar Stock para Orden

```bash
curl -X POST "https://api.example.com/api/v1/stock/reserve" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-ID: org_789" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "order_456",
    "items": [
      {
        "variant_id": "var_789",
        "warehouse_id": "wh_123",
        "quantity": 10,
        "expires_in_minutes": 30
      }
    ]
  }'
```

### Validar Disponibilidad

```bash
curl -X POST "https://api.example.com/api/v1/stock/check-availability" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-ID: org_789" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"variant_id": "var_456", "warehouse_id": "wh_789", "quantity": 25}
    ]
  }'
```

## Próximos Pasos

- [API: Movements](./api-movements)
- [API: Warehouses](./api-warehouses)
- [API: Transfers](./api-transfers)
- [Errores Comunes](./errores-comunes)
