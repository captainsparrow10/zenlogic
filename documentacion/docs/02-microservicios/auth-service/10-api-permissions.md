---
sidebar_position: 11
---

# API - Permissions

Gestión de permisos.

## GET /api/v1/permissions

Listar permisos disponibles.

**Auth**: Requiere `permissions:read`

### Request
```http
GET /api/v1/permissions?module=catalog
Authorization: Bearer {token}
X-Tenant-ID: org_123
```

### Response 200
```json
{
  "data": [
    {
      "id": "perm_catalog_read",
      "name": "catalog:read",
      "description": "Ver productos",
      "module": "catalog",
      "action": "read"
    },
    {
      "id": "perm_catalog_create",
      "name": "catalog:create",
      "description": "Crear productos",
      "module": "catalog",
      "action": "create"
    }
  ]
}
```

## GET /api/v1/permissions/modules

Listar módulos con sus permisos.

### Response 200
```json
{
  "modules": [
    {
      "id": "module_catalog",
      "name": "Catálogo",
      "permissions": [
        {"name": "catalog:read", "description": "Ver productos"},
        {"name": "catalog:create", "description": "Crear productos"}
      ]
    }
  ]
}
```
