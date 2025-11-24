---
sidebar_position: 13
---

# API - Organizations

Gestión de organizaciones (tenants).

## GET /api/v1/organizations

Listar organizaciones (solo admin global).

**Auth**: Requiere `admin:global`

### Request
```http
GET /api/v1/organizations
Authorization: Bearer {token}
```

### Response 200
```json
{
  "data": [
    {
      "id": "org_123",
      "name": "Mi Empresa S.A.",
      "slug": "mi-empresa",
      "plan": "pro",
      "status": "active",
      "modules_enabled": ["catalog", "inventory", "orders"],
      "limits": {
        "max_users": 50,
        "max_locals": 5
      }
    }
  ]
}
```

## GET /api/v1/organizations/:id

Obtener organización.

### Response 200
```json
{
  "id": "org_123",
  "name": "Mi Empresa S.A.",
  "plan": "pro",
  "status": "active",
  "modules_enabled": ["catalog", "inventory"],
  "created_date": "2025-11-01T00:00:00Z"
}
```

## POST /api/v1/organizations

Crear organización (solo admin global).

### Request
```http
POST /api/v1/organizations
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nueva Empresa",
  "slug": "nueva-empresa",
  "plan": "basic",
  "modules": ["catalog"]
}
```

### Response 201
```json
{
  "id": "org_456",
  "name": "Nueva Empresa",
  "slug": "nueva-empresa",
  "plan": "basic",
  "status": "active"
}
```

## PUT /api/v1/organizations/:id

Actualizar organización.

### Request
```http
PUT /api/v1/organizations/org_123
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan": "enterprise",
  "modules_enabled": ["catalog", "inventory", "orders", "pricing"]
}
```

### Response 200
```json
{
  "id": "org_123",
  "plan": "enterprise",
  "modules_enabled": ["catalog", "inventory", "orders", "pricing"]
}
```

## PUT /api/v1/organizations/:id/suspend

Suspender organización.

### Response 200
```json
{
  "id": "org_123",
  "status": "suspended"
}
```
