---
sidebar_position: 9
---

# API - Users

CRUD de usuarios.

## GET /api/v1/users

Listar usuarios de la organización.

**Auth**: Requiere `users:read`

### Request
```http
GET /api/v1/users?page=1&limit=20&active=true
Authorization: Bearer {token}
X-Tenant-ID: org_123
```

### Response 200
```json
{
  "data": [
    {
      "id": "user_001",
      "email": "admin@empresa.com",
      "first_name": "Admin",
      "last_name": "Sistema",
      "active": true,
      "roles": ["Admin"],
      "locals": ["local_01"],
      "last_login": "2025-11-23T10:30:00Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 45
}
```

## POST /api/v1/users

Crear usuario.

**Auth**: Requiere `users:create`

### Request
```http
POST /api/v1/users
Authorization: Bearer {token}
X-Tenant-ID: org_123
Content-Type: application/json

{
  "email": "newuser@empresa.com",
  "password": "SecurePass123",
  "first_name": "Nuevo",
  "last_name": "Usuario",
  "role_ids": ["role_vendedor"],
  "local_ids": ["local_01"]
}
```

### Response 201
```json
{
  "id": "user_002",
  "email": "newuser@empresa.com",
  "first_name": "Nuevo",
  "last_name": "Usuario",
  "organization_id": "org_123",
  "active": true,
  "roles": ["Vendedor"],
  "locals": ["local_01"],
  "created_date": "2025-11-23T11:00:00Z"
}
```

## PUT /api/v1/users/:id

Actualizar usuario.

**Auth**: Requiere `users:edit`

### Request
```http
PUT /api/v1/users/user_002
Authorization: Bearer {token}
X-Tenant-ID: org_123
Content-Type: application/json

{
  "first_name": "Nuevo Nombre",
  "role_ids": ["role_gerente"],
  "active": false
}
```

### Response 200
```json
{
  "id": "user_002",
  "email": "newuser@empresa.com",
  "first_name": "Nuevo Nombre",
  "active": false,
  "roles": ["Gerente"]
}
```

## DELETE /api/v1/users/:id

Eliminar usuario.

**Auth**: Requiere `users:delete`

### Request
```http
DELETE /api/v1/users/user_002
Authorization: Bearer {token}
X-Tenant-ID: org_123
```

### Response 204
No content

## Próximos Pasos

- [API Roles](/microservicios/auth-service/api-roles)
