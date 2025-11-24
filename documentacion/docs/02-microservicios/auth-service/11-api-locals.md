---
sidebar_position: 12
---

# API - Locals

CRUD de locales/sucursales.

## GET /api/v1/locals

Listar locales de la organización.

**Auth**: Requiere `locals:read`

### Request
```http
GET /api/v1/locals?status=active
Authorization: Bearer {token}
X-Tenant-ID: org_123
```

### Response 200
```json
{
  "data": [
    {
      "id": "local_01",
      "name": "Sucursal Centro",
      "code": "SC-01",
      "address": "Av. Principal 123",
      "status": "active",
      "organization_id": "org_123"
    }
  ]
}
```

## POST /api/v1/locals

Crear local.

**Auth**: Requiere `locals:create`

### Request
```http
POST /api/v1/locals
Authorization: Bearer {token}
X-Tenant-ID: org_123
Content-Type: application/json

{
  "name": "Sucursal Norte",
  "code": "SN-02",
  "address": "Calle Norte 456"
}
```

### Response 201
```json
{
  "id": "local_02",
  "name": "Sucursal Norte",
  "code": "SN-02",
  "status": "active"
}
```

## PUT /api/v1/locals/:id

Actualizar local.

### Response 200

## DELETE /api/v1/locals/:id

Eliminar local.

### Response 204
