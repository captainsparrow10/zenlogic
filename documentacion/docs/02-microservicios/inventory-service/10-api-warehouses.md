---
sidebar_position: 10
---

# Warehouses API

API REST para gestión de bodegas (almacenes) con soporte para capacidad, ubicaciones y asignación a locales.

## Endpoints

### Listar Bodegas

Obtiene lista de bodegas con filtros.

```http
GET /api/v1/warehouses
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `local_id` | UUID | No | Filtrar por local |
| `warehouse_type` | string | No | main, branch, virtual |
| `is_active` | boolean | No | Solo activas (default: true) |
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
        "cursor": "d2hfMTIz",
        "node": {
          "warehouse_id": "wh_123",
          "name": "Bodega Principal",
          "code": "WH-001",
          "warehouse_type": "main",
          "is_active": true,
          "capacity": {
            "max_capacity": 10000,
            "current_capacity": 6500,
            "utilization_percentage": 65.0,
            "available_capacity": 3500
          },
          "local": {
            "local_id": "local_456",
            "name": "Local Principal"
          },
          "address": {
            "street": "Av. Principal 123",
            "city": "Ciudad de Panamá",
            "state": "Panamá",
            "country": "PA",
            "postal_code": "00001"
          },
          "contact": {
            "phone": "+507 123-4567",
            "email": "bodega@example.com"
          },
          "stats": {
            "total_variants": 450,
            "total_stock": 6500,
            "locations_count": 25
          },
          "created_at": "2025-01-15T08:00:00Z",
          "updated_at": "2025-11-23T10:00:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "totalCount": 8
    }
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/warehouses",
  "requestId": "req_wh123"
}
```

---

### Obtener Bodega por ID

```http
GET /api/v1/warehouses/{warehouseId}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "warehouse_id": "wh_123",
    "name": "Bodega Principal",
    "code": "WH-001",
    "warehouse_type": "main",
    "is_active": true,
    "local_id": "local_456",
    "local": {
      "local_id": "local_456",
      "name": "Local Principal",
      "code": "LOC-001"
    },
    "capacity": {
      "max_capacity": 10000,
      "current_capacity": 6500,
      "utilization_percentage": 65.0,
      "available_capacity": 3500
    },
    "address": {
      "street": "Av. Principal 123",
      "city": "Ciudad de Panamá",
      "state": "Panamá",
      "country": "PA",
      "postal_code": "00001",
      "coordinates": {
        "lat": 8.983333,
        "lng": -79.516667
      }
    },
    "contact": {
      "phone": "+507 123-4567",
      "email": "bodega@example.com"
    },
    "operating_hours": {
      "monday": {"open": "08:00", "close": "18:00"},
      "tuesday": {"open": "08:00", "close": "18:00"},
      "wednesday": {"open": "08:00", "close": "18:00"},
      "thursday": {"open": "08:00", "close": "18:00"},
      "friday": {"open": "08:00", "close": "18:00"},
      "saturday": {"open": "09:00", "close": "13:00"},
      "sunday": null
    },
    "stats": {
      "total_variants": 450,
      "total_stock": 6500,
      "locations_count": 25,
      "movements_last_30_days": 1250
    },
    "created_at": "2025-01-15T08:00:00Z",
    "updated_at": "2025-11-23T10:00:00Z"
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/warehouses/wh_123",
  "requestId": "req_getwh123"
}
```

**Códigos de Error:**
- `404` - `WAREHOUSE_NOT_FOUND`: Bodega no existe

---

### Crear Bodega

```http
POST /api/v1/warehouses
```

**Request Body:**

```json
{
  "name": "Bodega Sucursal Este",
  "code": "WH-005",
  "warehouse_type": "branch",
  "local_id": "local_789",
  "max_capacity": 5000,
  "address": {
    "street": "Calle 50 Este",
    "city": "Ciudad de Panamá",
    "state": "Panamá",
    "country": "PA",
    "postal_code": "00005",
    "coordinates": {
      "lat": 8.990000,
      "lng": -79.520000
    }
  },
  "contact_phone": "+507 234-5678",
  "contact_email": "este@example.com",
  "operating_hours": {
    "monday": {"open": "08:00", "close": "18:00"},
    "tuesday": {"open": "08:00", "close": "18:00"},
    "wednesday": {"open": "08:00", "close": "18:00"},
    "thursday": {"open": "08:00", "close": "18:00"},
    "friday": {"open": "08:00", "close": "18:00"},
    "saturday": {"open": "09:00", "close": "13:00"}
  }
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | Sí | Nombre de la bodega (max: 200) |
| `code` | string | Sí | Código único (max: 50) |
| `warehouse_type` | string | Sí | main, branch, virtual |
| `local_id` | UUID | Sí | Local al que pertenece |
| `max_capacity` | integer | No | Capacidad máxima |
| `address` | object | Sí | Dirección completa |
| `contact_phone` | string | No | Teléfono de contacto |
| `contact_email` | string | No | Email de contacto |
| `operating_hours` | object | No | Horarios de operación |

**Respuesta Exitosa (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "warehouse_id": "wh_new789",
    "name": "Bodega Sucursal Este",
    "code": "WH-005",
    "warehouse_type": "branch",
    "is_active": true,
    "local_id": "local_789",
    "max_capacity": 5000,
    "current_capacity": 0,
    "created_at": "2025-11-23T15:30:00Z"
  },
  "timestamp": "2025-11-23T15:30:00Z",
  "path": "/api/v1/warehouses",
  "requestId": "req_createwh789"
}
```

**Códigos de Error:**
- `400` - `INVALID_WAREHOUSE_DATA`: Datos inválidos
- `409` - `WAREHOUSE_CODE_EXISTS`: Código de bodega duplicado
- `404` - `LOCAL_NOT_FOUND`: Local no existe

**Evento Publicado:**
```json
{
  "event": "inventory.warehouse.created",
  "data": {
    "warehouse_id": "wh_new789",
    "name": "Bodega Sucursal Este",
    "code": "WH-005",
    "local_id": "local_789"
  }
}
```

---

### Actualizar Bodega

```http
PUT /api/v1/warehouses/{warehouseId}
```

**Request Body:**

```json
{
  "name": "Bodega Principal - Actualizada",
  "max_capacity": 12000,
  "contact_phone": "+507 999-8888",
  "contact_email": "nueva@example.com",
  "operating_hours": {
    "monday": {"open": "07:00", "close": "19:00"},
    "saturday": {"open": "08:00", "close": "14:00"}
  }
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "warehouse_id": "wh_123",
    "name": "Bodega Principal - Actualizada",
    "max_capacity": 12000,
    "contact_phone": "+507 999-8888",
    "updated_at": "2025-11-23T16:00:00Z"
  },
  "timestamp": "2025-11-23T16:00:00Z",
  "path": "/api/v1/warehouses/wh_123",
  "requestId": "req_updatewh123"
}
```

---

### Activar/Desactivar Bodega

```http
PATCH /api/v1/warehouses/{warehouseId}/status
```

**Request Body:**

```json
{
  "is_active": false,
  "reason": "Mantenimiento programado"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "warehouse_id": "wh_123",
    "is_active": false,
    "updated_at": "2025-11-23T16:30:00Z"
  },
  "timestamp": "2025-11-23T16:30:00Z",
  "path": "/api/v1/warehouses/wh_123/status",
  "requestId": "req_statuswh123"
}
```

**Validaciones:**
- No se puede desactivar si tiene stock
- No se puede desactivar si tiene transferencias pendientes

**Códigos de Error:**
- `409` - `WAREHOUSE_HAS_STOCK`: No se puede desactivar con stock
- `409` - `WAREHOUSE_HAS_PENDING_TRANSFERS`: Transferencias pendientes

---

### Obtener Stock de Bodega

```http
GET /api/v1/warehouses/{warehouseId}/stock
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `variant_id` | UUID | No | Filtrar por variante |
| `location_id` | UUID | No | Filtrar por ubicación |
| `stock_status` | string | No | in_stock, low_stock, out_of_stock |
| `cursor` | string | No | Cursor de paginación |
| `limit` | integer | No | Resultados por página |

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "warehouse_id": "wh_123",
    "warehouse_name": "Bodega Principal",
    "summary": {
      "total_variants": 450,
      "total_stock": 6500,
      "available_stock": 5800,
      "reserved_stock": 600,
      "damaged_stock": 100
    },
    "edges": [
      {
        "cursor": "c3RvY2tfMTIz",
        "node": {
          "stock_id": "stock_456",
          "variant_id": "var_789",
          "variant": {
            "sku": "PROD-001",
            "name": "Producto Ejemplo"
          },
          "quantities": {
            "total": 150,
            "available": 120,
            "reserved": 25,
            "damaged": 5
          },
          "stock_status": "in_stock"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "totalCount": 450
    }
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/warehouses/wh_123/stock",
  "requestId": "req_whstock123"
}
```

---

### Obtener Ubicaciones de Bodega

```http
GET /api/v1/warehouses/{warehouseId}/locations
```

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "warehouse_id": "wh_123",
    "warehouse_name": "Bodega Principal",
    "total_locations": 25,
    "tree": [
      {
        "location_id": "loc_001",
        "name": "Zona A",
        "code": "WH01-ZA",
        "type": "zone",
        "level": 0,
        "capacity": {
          "max_capacity": 2000,
          "current_capacity": 1200,
          "utilization": 60.0
        },
        "children": [
          {
            "location_id": "loc_002",
            "name": "Pasillo 1",
            "code": "WH01-ZA-P01",
            "type": "aisle",
            "level": 1,
            "children": [
              {
                "location_id": "loc_003",
                "name": "Estantería 1",
                "code": "WH01-ZA-P01-E01",
                "type": "rack",
                "level": 2
              }
            ]
          }
        ]
      }
    ]
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/warehouses/wh_123/locations",
  "requestId": "req_whloc123"
}
```

---

## Permisos Requeridos

| Endpoint | Permiso Requerido |
|----------|-------------------|
| `GET /warehouses` | `inventory.warehouses.read` |
| `GET /warehouses/{id}` | `inventory.warehouses.read` |
| `POST /warehouses` | `inventory.warehouses.create` |
| `PUT /warehouses/{id}` | `inventory.warehouses.update` |
| `PATCH /warehouses/{id}/status` | `inventory.warehouses.manage` |
| `GET /warehouses/{id}/stock` | `inventory.stock.read` |
| `GET /warehouses/{id}/locations` | `inventory.locations.read` |

## Eventos Publicados

- `inventory.warehouse.created` - Bodega creada
- `inventory.warehouse.updated` - Bodega actualizada
- `inventory.warehouse.activated` - Bodega activada
- `inventory.warehouse.deactivated` - Bodega desactivada

## Próximos Pasos

- [API: Locations](./api-locations)
- [API: Transfers](./api-transfers)
- [Errores Comunes](./errores-comunes)
