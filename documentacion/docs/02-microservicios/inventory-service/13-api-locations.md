---
sidebar_position: 13
---

# Locations API

API REST para gestión de ubicaciones físicas dentro de las bodegas con estructura jerárquica.

## Endpoints

### Listar Ubicaciones

```http
GET /api/v1/locations
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `warehouse_id` | UUID | Sí | Bod ega a consultar |
| `parent_location_id` | UUID | No | Ubicación padre |
| `location_type` | string | No | zone, aisle, rack, shelf, bin |
| `is_active` | boolean | No | Solo activas (default: true) |

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "edges": [
      {
        "cursor": "bG9jXzEyMw==",
        "node": {
          "location_id": "loc_123",
          "warehouse_id": "wh_001",
          "parent_location_id": null,
          "name": "Zona A",
          "code": "WH01-ZA",
          "location_type": "zone",
          "level": 0,
          "capacity": {
            "max_capacity": 2000,
            "current_capacity": 1200,
            "utilization_percentage": 60.0
          },
          "is_active": true,
          "children_count": 5,
          "stock_count": 0
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": false,
      "totalCount": 25
    }
  }
}
```

---

### Obtener Árbol de Ubicaciones

```http
GET /api/v1/locations/tree
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `warehouse_id` | UUID | Sí | Bodega a consultar |
| `max_depth` | integer | No | Profundidad máxima (default: 5) |

**Respuesta:**

```json
{
  "status": "success",
  "data": {
    "warehouse_id": "wh_001",
    "total_locations": 125,
    "tree": [
      {
        "location_id": "loc_001",
        "name": "Zona A",
        "code": "WH01-ZA",
        "type": "zone",
        "level": 0,
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
                "level": 2,
                "children": []
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

### Crear Ubicación

```http
POST /api/v1/locations
```

**Request Body:**

```json
{
  "warehouse_id": "wh_001",
  "parent_location_id": "loc_002",
  "name": "Estantería 5",
  "code": "WH01-ZA-P01-E05",
  "location_type": "rack",
  "max_capacity": 200
}
```

**Respuesta (201):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "location_id": "loc_new456",
    "name": "Estantería 5",
    "code": "WH01-ZA-P01-E05",
    "location_type": "rack",
    "level": 2,
    "created_at": "2025-11-23T16:00:00Z"
  }
}
```

**Códigos de Error:**
- `404` - `WAREHOUSE_NOT_FOUND`
- `404` - `PARENT_LOCATION_NOT_FOUND`
- `409` - `LOCATION_CODE_EXISTS`

---

### Actualizar Ubicación

```http
PUT /api/v1/locations/{locationId}
```

**Request Body:**

```json
{
  "name": "Estantería 5 - Renovada",
  "max_capacity": 250,
  "is_active": true
}
```

---

### Obtener Stock de Ubicación

```http
GET /api/v1/locations/{locationId}/stock
```

**Respuesta:**

```json
{
  "status": "success",
  "data": {
    "location_id": "loc_123",
    "location_name": "Estantería 1",
    "total_variants": 45,
    "total_quantity": 680,
    "stock_items": [
      {
        "stock_id": "stock_456",
        "variant_id": "var_789",
        "variant_sku": "PROD-001",
        "quantity": 150
      }
    ]
  }
}
```

---

## Jerarquía de Tipos

```
Warehouse (Bodega)
└── Zone (Zona de almacenamiento)
    └── Aisle (Pasillo)
        └── Rack (Estantería)
            └── Shelf (Estante)
                └── Bin (Contenedor/Casillero)
```

**Niveles:**
- Level 0: Zone
- Level 1: Aisle
- Level 2: Rack
- Level 3: Shelf
- Level 4: Bin

**Convención de Códigos:**
```
WH01-ZA-P05-E03-S02-B01
│    │  │   │   │   └── Bin 01
│    │  │   │   └────── Shelf 02
│    │  │   └────────── Rack (Estantería) 03
│    │  └────────────── Pasillo (Aisle) 05
│    └───────────────── Zona A
└────────────────────── Warehouse 01
```

---

## Permisos Requeridos

| Endpoint | Permiso |
|----------|---------|
| `GET /locations` | `inventory.locations.read` |
| `GET /locations/tree` | `inventory.locations.read` |
| `POST /locations` | `inventory.locations.create` |
| `PUT /locations/{id}` | `inventory.locations.update` |
| `GET /locations/{id}/stock` | `inventory.stock.read` |

## Próximos Pasos

- [Eventos Publicados](./eventos-publicados)
- [Errores Comunes](./errores-comunes)
