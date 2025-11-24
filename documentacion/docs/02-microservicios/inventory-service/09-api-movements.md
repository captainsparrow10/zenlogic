---
sidebar_position: 9
---

# Movements API

API REST para registrar y consultar movimientos de inventario con soporte para trazabilidad completa, lot tracking y serial tracking.

## Endpoints

### Listar Movimientos

Obtiene historial de movimientos con filtros avanzados.

```http
GET /api/v1/movements
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `stock_id` | UUID | No | Filtrar por stock específico |
| `variant_id` | UUID | No | Filtrar por variante |
| `warehouse_id` | UUID | No | Filtrar por bodega |
| `type` | string | No | in, out, transfer, adjustment |
| `reason` | string | No | Motivo del movimiento |
| `lot_number` | string | No | Filtrar por lote |
| `serial_number` | string | No | Filtrar por número de serie |
| `reference_id` | UUID | No | ID de referencia (orden, transferencia, etc.) |
| `reference_type` | string | No | Tipo de referencia |
| `created_by` | UUID | No | Usuario que creó el movimiento |
| `date_from` | date | No | Fecha desde (YYYY-MM-DD) |
| `date_to` | date | No | Fecha hasta (YYYY-MM-DD) |
| `cursor` | string | No | Cursor de paginación |
| `limit` | integer | No | Resultados por página (max: 100) |

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
        "cursor": "bW92XzEyMw==",
        "node": {
          "movement_id": "mov_123",
          "stock_id": "stock_456",
          "stock": {
            "variant_id": "var_789",
            "warehouse_id": "wh_101",
            "warehouse_name": "Bodega Principal"
          },
          "type": "in",
          "reason": "purchase",
          "quantities": {
            "quantity_before": 100,
            "quantity_after": 150,
            "quantity_change": 50
          },
          "tracking": {
            "lot_number": "LOT-2025-001",
            "serial_number": null,
            "expiry_date": "2026-12-31"
          },
          "reference": {
            "reference_id": "po_789",
            "reference_type": "purchase_order"
          },
          "created_by": {
            "user_id": "user_456",
            "name": "Juan Pérez"
          },
          "notes": "Recepción de compra - Proveedor XYZ",
          "created_at": "2025-11-23T10:30:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "hasPreviousPage": false,
      "totalCount": 342
    }
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/movements",
  "requestId": "req_mov123"
}
```

**Tipos de Movimientos:**
- `in`: Entrada de mercancía
- `out`: Salida de mercancía
- `transfer`: Transferencia entre ubicaciones
- `adjustment`: Ajuste de inventario

**Motivos Comunes:**

**Para type=in:**
- `purchase`: Compra a proveedor
- `return`: Devolución de cliente
- `production`: Producción interna
- `found`: Inventario encontrado
- `adjustment`: Ajuste positivo

**Para type=out:**
- `sale`: Venta
- `transfer`: Transferencia
- `damage`: Producto dañado
- `loss`: Pérdida
- `sample`: Muestra
- `donation`: Donación

---

### Obtener Movimiento por ID

Consulta detalles completos de un movimiento específico.

```http
GET /api/v1/movements/{movementId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `movementId` | UUID | ID del movimiento |

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "movement_id": "mov_123",
    "stock_id": "stock_456",
    "variant": {
      "variant_id": "var_789",
      "sku": "PROD-001-RED",
      "name": "Producto Ejemplo - Rojo",
      "barcode": "8801234567890"
    },
    "warehouse": {
      "warehouse_id": "wh_101",
      "name": "Bodega Principal",
      "code": "WH-001"
    },
    "type": "in",
    "reason": "purchase",
    "quantities": {
      "quantity_before": 100,
      "quantity_after": 150,
      "quantity_change": 50
    },
    "tracking": {
      "lot_number": "LOT-2025-001",
      "serial_number": null,
      "expiry_date": "2026-12-31"
    },
    "reference": {
      "reference_id": "po_789",
      "reference_type": "purchase_order",
      "reference_number": "PO-2025-0123"
    },
    "created_by": {
      "user_id": "user_456",
      "name": "Juan Pérez",
      "email": "juan.perez@example.com"
    },
    "notes": "Recepción de compra - Proveedor XYZ - Factura FAC-12345",
    "metadata": {
      "invoice_number": "FAC-12345",
      "supplier": "Proveedor XYZ"
    },
    "created_at": "2025-11-23T10:30:00Z"
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/movements/mov_123",
  "requestId": "req_getmov123"
}
```

**Códigos de Error:**
- `404` - `MOVEMENT_NOT_FOUND`: Movimiento no existe

---

### Crear Movimiento de Entrada

Registra una entrada de mercancía al inventario.

```http
POST /api/v1/movements/in
```

**Request Body:**

```json
{
  "variant_id": "var_789",
  "warehouse_id": "wh_101",
  "location_id": "loc_202",
  "quantity": 50,
  "reason": "purchase",
  "reference_id": "po_789",
  "reference_type": "purchase_order",
  "lot_number": "LOT-2025-001",
  "expiry_date": "2026-12-31",
  "notes": "Recepción de orden de compra PO-2025-0123",
  "metadata": {
    "invoice_number": "FAC-12345",
    "supplier": "Proveedor XYZ"
  }
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `variant_id` | UUID | Sí | ID de la variante |
| `warehouse_id` | UUID | Sí | ID de la bodega |
| `location_id` | UUID | No | Ubicación específica |
| `quantity` | integer | Sí | Cantidad a ingresar (mayor a 0) |
| `reason` | string | Sí | Motivo del ingreso |
| `reference_id` | UUID | No | ID de documento relacionado |
| `reference_type` | string | No | Tipo de documento |
| `lot_number` | string | No | Número de lote |
| `serial_number` | string | No | Número de serie |
| `expiry_date` | date | No | Fecha de vencimiento |
| `notes` | text | No | Notas adicionales |
| `metadata` | object | No | Metadata adicional |

**Respuesta Exitosa (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "movement_id": "mov_new123",
    "stock_id": "stock_456",
    "type": "in",
    "reason": "purchase",
    "quantities": {
      "quantity_before": 100,
      "quantity_after": 150,
      "quantity_change": 50
    },
    "tracking": {
      "lot_number": "LOT-2025-001",
      "expiry_date": "2026-12-31"
    },
    "created_at": "2025-11-23T11:00:00Z"
  },
  "timestamp": "2025-11-23T11:00:00Z",
  "path": "/api/v1/movements/in",
  "requestId": "req_movein123"
}
```

**Códigos de Error:**
- `400` - `INVALID_QUANTITY`: Cantidad inválida
- `404` - `VARIANT_NOT_FOUND`: Variante no existe
- `404` - `WAREHOUSE_NOT_FOUND`: Bodega no existe
- `404` - `LOCATION_NOT_FOUND`: Ubicación no existe
- `400` - `INVALID_REASON`: Motivo no válido

**Evento Publicado:**
```json
{
  "event": "inventory.movement.in",
  "data": {
    "movement_id": "mov_new123",
    "variant_id": "var_789",
    "warehouse_id": "wh_101",
    "quantity": 50,
    "lot_number": "LOT-2025-001"
  }
}
```

---

### Crear Movimiento de Salida

Registra una salida de mercancía del inventario.

```http
POST /api/v1/movements/out
```

**Request Body:**

```json
{
  "variant_id": "var_789",
  "warehouse_id": "wh_101",
  "quantity": 25,
  "reason": "sale",
  "reference_id": "order_456",
  "reference_type": "sales_order",
  "lot_number": "LOT-2025-001",
  "notes": "Despacho de orden SO-2025-0456"
}
```

**Validaciones:**
- Stock disponible debe ser mayor o igual a quantity
- Si hay lot_number, debe existir stock de ese lote
- Si hay serial_number, debe existir y estar disponible

**Respuesta Exitosa (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "movement_id": "mov_out456",
    "stock_id": "stock_456",
    "type": "out",
    "reason": "sale",
    "quantities": {
      "quantity_before": 150,
      "quantity_after": 125,
      "quantity_change": -25
    },
    "tracking": {
      "lot_number": "LOT-2025-001"
    },
    "created_at": "2025-11-23T12:00:00Z"
  },
  "timestamp": "2025-11-23T12:00:00Z",
  "path": "/api/v1/movements/out",
  "requestId": "req_movout456"
}
```

**Códigos de Error:**
- `400` - `INSUFFICIENT_STOCK`: Stock insuficiente
- `404` - `LOT_NOT_FOUND`: Lote no existe
- `404` - `SERIAL_NOT_FOUND`: Número de serie no existe
- `409` - `SERIAL_ALREADY_USED`: Número de serie ya usado

**Evento Publicado:**
```json
{
  "event": "inventory.movement.out",
  "data": {
    "movement_id": "mov_out456",
    "variant_id": "var_789",
    "warehouse_id": "wh_101",
    "quantity": -25,
    "reason": "sale"
  }
}
```

---

### Obtener Historial por Variante

Consulta todos los movimientos de una variante específica.

```http
GET /api/v1/movements/variant/{variantId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | UUID | ID de la variante |

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `warehouse_id` | UUID | No | Filtrar por bodega |
| `type` | string | No | Filtrar por tipo |
| `date_from` | date | No | Fecha desde |
| `date_to` | date | No | Fecha hasta |
| `cursor` | string | No | Cursor de paginación |
| `limit` | integer | No | Resultados por página |

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "variant_id": "var_789",
    "variant": {
      "sku": "PROD-001-RED",
      "name": "Producto Ejemplo - Rojo"
    },
    "summary": {
      "total_movements": 125,
      "total_in": 500,
      "total_out": 350,
      "net_change": 150,
      "movements_by_type": {
        "in": 45,
        "out": 68,
        "transfer": 10,
        "adjustment": 2
      }
    },
    "edges": [
      {
        "cursor": "bW92XzEyMw==",
        "node": {
          "movement_id": "mov_123",
          "type": "in",
          "warehouse_name": "Bodega Principal",
          "quantity_change": 50,
          "reason": "purchase",
          "created_at": "2025-11-23T10:30:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "totalCount": 125
    }
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/movements/variant/var_789",
  "requestId": "req_varmov789"
}
```

---

### Obtener Movimientos por Lote

Rastrea todos los movimientos de un lote específico.

```http
GET /api/v1/movements/lot/{lotNumber}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `lotNumber` | string | Número de lote |

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "lot_number": "LOT-2025-001",
    "expiry_date": "2026-12-31",
    "summary": {
      "initial_quantity": 100,
      "current_quantity": 75,
      "total_in": 100,
      "total_out": 25,
      "warehouses": [
        {
          "warehouse_id": "wh_101",
          "warehouse_name": "Bodega Principal",
          "current_quantity": 50
        },
        {
          "warehouse_id": "wh_102",
          "warehouse_name": "Bodega Sucursal",
          "current_quantity": 25
        }
      ]
    },
    "movements": [
      {
        "movement_id": "mov_123",
        "type": "in",
        "variant_id": "var_789",
        "warehouse_id": "wh_101",
        "quantity_change": 100,
        "reason": "purchase",
        "created_at": "2025-11-20T10:00:00Z"
      },
      {
        "movement_id": "mov_456",
        "type": "out",
        "variant_id": "var_789",
        "warehouse_id": "wh_101",
        "quantity_change": -25,
        "reason": "sale",
        "created_at": "2025-11-22T14:30:00Z"
      }
    ]
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/movements/lot/LOT-2025-001",
  "requestId": "req_lotmov001"
}
```

**Códigos de Error:**
- `404` - `LOT_NOT_FOUND`: Lote no encontrado

---

### Reporte de Movimientos

Genera reporte agregado de movimientos con métricas.

```http
GET /api/v1/movements/report
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `date_from` | date | Sí | Fecha desde (YYYY-MM-DD) |
| `date_to` | date | Sí | Fecha hasta (YYYY-MM-DD) |
| `warehouse_id` | UUID | No | Filtrar por bodega |
| `variant_id` | UUID | No | Filtrar por variante |
| `group_by` | string | No | type, reason, warehouse, variant, date |

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
      "total_movements": 1250,
      "total_quantity_in": 5000,
      "total_quantity_out": 3800,
      "net_change": 1200,
      "unique_variants": 145,
      "unique_lots": 78
    },
    "by_type": [
      {
        "type": "in",
        "count": 450,
        "quantity": 5000,
        "percentage": 36.0
      },
      {
        "type": "out",
        "count": 680,
        "quantity": 3800,
        "percentage": 54.4
      },
      {
        "type": "transfer",
        "count": 100,
        "quantity": 0,
        "percentage": 8.0
      },
      {
        "type": "adjustment",
        "count": 20,
        "quantity": 0,
        "percentage": 1.6
      }
    ],
    "by_reason": [
      {
        "reason": "purchase",
        "type": "in",
        "count": 350,
        "quantity": 4200
      },
      {
        "reason": "sale",
        "type": "out",
        "count": 580,
        "quantity": 3500
      },
      {
        "reason": "damage",
        "type": "out",
        "count": 50,
        "quantity": 200
      }
    ],
    "top_variants": [
      {
        "variant_id": "var_789",
        "sku": "PROD-001-RED",
        "movements_count": 85,
        "total_in": 350,
        "total_out": 280,
        "net_change": 70
      }
    ]
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/movements/report",
  "requestId": "req_report123"
}
```

---

## Batch Operations

### Crear Múltiples Movimientos

Crea varios movimientos en una sola transacción.

```http
POST /api/v1/movements/batch
```

**Request Body:**

```json
{
  "type": "in",
  "warehouse_id": "wh_101",
  "reason": "purchase",
  "reference_id": "po_789",
  "reference_type": "purchase_order",
  "items": [
    {
      "variant_id": "var_001",
      "quantity": 50,
      "lot_number": "LOT-2025-001",
      "expiry_date": "2026-12-31"
    },
    {
      "variant_id": "var_002",
      "quantity": 30,
      "lot_number": "LOT-2025-002",
      "expiry_date": "2027-06-30"
    },
    {
      "variant_id": "var_003",
      "quantity": 75,
      "lot_number": "LOT-2025-003"
    }
  ],
  "notes": "Recepción de orden de compra PO-2025-0789"
}
```

**Respuesta Exitosa (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "batch_id": "batch_123",
    "total_items": 3,
    "successful": 3,
    "failed": 0,
    "movements": [
      {
        "movement_id": "mov_001",
        "variant_id": "var_001",
        "quantity": 50,
        "status": "success"
      },
      {
        "movement_id": "mov_002",
        "variant_id": "var_002",
        "quantity": 30,
        "status": "success"
      },
      {
        "movement_id": "mov_003",
        "variant_id": "var_003",
        "quantity": 75,
        "status": "success"
      }
    ],
    "created_at": "2025-11-23T13:00:00Z"
  },
  "timestamp": "2025-11-23T13:00:00Z",
  "path": "/api/v1/movements/batch",
  "requestId": "req_batch123"
}
```

**Comportamiento Transaccional:**
- Si falla algún item, se hace rollback de todos
- Se valida stock antes de aplicar cambios
- Se publican eventos solo si toda la operación es exitosa

---

## Permisos Requeridos

| Endpoint | Permiso Requerido |
|----------|-------------------|
| `GET /movements` | `inventory.movements.read` |
| `GET /movements/{id}` | `inventory.movements.read` |
| `POST /movements/in` | `inventory.movements.create` |
| `POST /movements/out` | `inventory.movements.create` |
| `GET /movements/variant/{id}` | `inventory.movements.read` |
| `GET /movements/lot/{number}` | `inventory.movements.read` |
| `GET /movements/report` | `inventory.movements.read` |
| `POST /movements/batch` | `inventory.movements.create` |

## Eventos Publicados

- `inventory.movement.created` - Movimiento creado
- `inventory.movement.in` - Entrada de mercancía
- `inventory.movement.out` - Salida de mercancía
- `inventory.stock.updated` - Stock actualizado (automático)

## Ejemplos de Uso

### Registrar Entrada de Compra

```bash
curl -X POST "https://api.example.com/api/v1/movements/in" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-ID: org_789" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_id": "var_789",
    "warehouse_id": "wh_101",
    "quantity": 100,
    "reason": "purchase",
    "reference_id": "po_456",
    "reference_type": "purchase_order",
    "lot_number": "LOT-2025-001",
    "expiry_date": "2026-12-31",
    "notes": "Orden de compra PO-2025-0456"
  }'
```

### Consultar Movimientos por Fecha

```bash
curl -X GET "https://api.example.com/api/v1/movements?date_from=2025-11-01&date_to=2025-11-30&type=in" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-ID: org_789"
```

### Rastrear Lote

```bash
curl -X GET "https://api.example.com/api/v1/movements/lot/LOT-2025-001" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-ID: org_789"
```

## Próximos Pasos

- [API: Warehouses](./api-warehouses)
- [API: Transfers](./api-transfers)
- [API: Adjustments](./api-adjustments)
- [Eventos Publicados](./eventos-publicados)
