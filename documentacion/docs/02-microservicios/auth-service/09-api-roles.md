---
sidebar_position: 10
---

# API - Roles

CRUD de roles.

## GET /api/v1/roles

Listar roles de la organización.

**Auth**: Requiere `roles:read`

### Request
```http
GET /api/v1/roles
Authorization: Bearer {token}
X-Tenant-ID: org_123
```

### Response 200
```json
{
  "data": [
    {
      "id": "role_admin",
      "name": "Administrador",
      "description": "Acceso total al sistema",
      "permissions": ["catalog:read", "catalog:create", "catalog:edit"],
      "system_role": false
    }
  ]
}
```

## POST /api/v1/roles

Crear rol.

**Auth**: Requiere `roles:create`

### Request
```http
POST /api/v1/roles
Authorization: Bearer {token}
X-Tenant-ID: org_123
Content-Type: application/json

{
  "name": "Gerente de Ventas",
  "description": "Gestión de ventas y productos",
  "permission_ids": ["perm_catalog_read", "perm_orders_create"]
}
```

### Response 201
```json
{
  "id": "role_gerente_ventas",
  "name": "Gerente de Ventas",
  "permissions": ["catalog:read", "orders:create"]
}
```

## PUT /api/v1/roles/:id

Actualizar rol.

### Request
```http
PUT /api/v1/roles/role_gerente_ventas
Authorization: Bearer {token}
X-Tenant-ID: org_123
Content-Type: application/json

{
  "permission_ids": ["perm_catalog_read", "perm_catalog_edit", "perm_orders_create"]
}
```

### Response 200
```json
{
  "id": "role_gerente_ventas",
  "permissions": ["catalog:read", "catalog:edit", "orders:create"]
}
```

## DELETE /api/v1/roles/:id

Eliminar rol.

### Response 204
No content
