# Brands API

API REST para la gestión de marcas comerciales en el Catalog Service.

## Endpoints

### Listar Marcas

```http
GET /api/v1/brands
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `first` | integer | No | Número de elementos a retornar (default: 20, max: 100) |
| `after` | string | No | Cursor para paginación hacia adelante |
| `last` | integer | No | Número de elementos anteriores a retornar |
| `before` | string | No | Cursor para paginación hacia atrás |
| `search` | string | No | Búsqueda por nombre o descripción |
| `is_active` | boolean | No | Filtrar por estado activo/inactivo |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "edges": [
      {
        "cursor": "YnJhbmRfMTIz",
        "node": {
          "brand_id": "brand_123",
          "organization_id": "org_456",
          "name": "Nike",
          "slug": "nike",
          "description": "Just Do It",
          "logo_url": "https://cdn.example.com/brands/nike-logo.png",
          "website": "https://www.nike.com",
          "is_active": true,
          "metadata": {
            "country": "USA",
            "founded_year": 1964
          },
          "products_count": 342,
          "created_at": "2025-01-15T10:00:00Z",
          "updated_at": "2025-11-20T14:30:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "hasPreviousPage": false,
      "startCursor": "YnJhbmRfMTIz",
      "endCursor": "YnJhbmRfMTQ1",
      "totalCount": 87
    }
  },
  "timestamp": "2025-11-23T10:30:00Z",
  "path": "/api/v1/brands",
  "requestId": "req_brands_list_abc123"
}
```

### Obtener Marca por ID

```http
GET /api/v1/brands/{brandId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `brandId` | string | ID único de la marca |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "brand_id": "brand_123",
    "organization_id": "org_456",
    "name": "Nike",
    "slug": "nike",
    "description": "Just Do It",
    "logo_url": "https://cdn.example.com/brands/nike-logo.png",
    "website": "https://www.nike.com",
    "is_active": true,
    "metadata": {
      "country": "USA",
      "founded_year": 1964
    },
    "products_count": 342,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-11-20T14:30:00Z"
  },
  "timestamp": "2025-11-23T10:31:00Z",
  "path": "/api/v1/brands/brand_123",
  "requestId": "req_brand_get_xyz789"
}
```

**Response Error (404 Not Found):**

```json
{
  "status": "error",
  "statusCode": 404,
  "error": {
    "code": "BRAND_NOT_FOUND",
    "message": "Brand with ID 'brand_123' not found",
    "details": {
      "brand_id": "brand_123"
    }
  },
  "timestamp": "2025-11-23T10:31:00Z",
  "path": "/api/v1/brands/brand_123",
  "requestId": "req_brand_get_xyz789"
}
```

### Crear Marca

```http
POST /api/v1/brands
```

**Request Body:**

```json
{
  "name": "Adidas",
  "slug": "adidas",
  "description": "Impossible is Nothing",
  "logo_url": "https://cdn.example.com/brands/adidas-logo.png",
  "website": "https://www.adidas.com",
  "is_active": true,
  "metadata": {
    "country": "Germany",
    "founded_year": 1949
  }
}
```

**Validaciones:**

- `name`: Requerido, string (1-100 caracteres), único por organización
- `slug`: Requerido, string (1-100 caracteres), formato slug, único por organización
- `description`: Opcional, string (max 500 caracteres)
- `logo_url`: Opcional, string (URL válida)
- `website`: Opcional, string (URL válida)
- `is_active`: Opcional, boolean (default: true)
- `metadata`: Opcional, objeto JSON

**Response Success (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "brand_id": "brand_789",
    "organization_id": "org_456",
    "name": "Adidas",
    "slug": "adidas",
    "description": "Impossible is Nothing",
    "logo_url": "https://cdn.example.com/brands/adidas-logo.png",
    "website": "https://www.adidas.com",
    "is_active": true,
    "metadata": {
      "country": "Germany",
      "founded_year": 1949
    },
    "products_count": 0,
    "created_at": "2025-11-23T10:32:00Z",
    "updated_at": "2025-11-23T10:32:00Z"
  },
  "timestamp": "2025-11-23T10:32:00Z",
  "path": "/api/v1/brands",
  "requestId": "req_brand_create_def456"
}
```

**Response Error (409 Conflict):**

```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "BRAND_SLUG_EXISTS",
    "message": "Brand with slug 'adidas' already exists in this organization",
    "details": {
      "slug": "adidas",
      "existing_brand_id": "brand_111"
    }
  },
  "timestamp": "2025-11-23T10:32:00Z",
  "path": "/api/v1/brands",
  "requestId": "req_brand_create_def456"
}
```

**Response Error (400 Bad Request):**

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "INVALID_BRAND_DATA",
    "message": "Invalid brand data provided",
    "details": {
      "validation_errors": [
        {
          "field": "name",
          "message": "Name is required"
        },
        {
          "field": "slug",
          "message": "Slug must contain only lowercase letters, numbers, and hyphens"
        }
      ]
    }
  },
  "timestamp": "2025-11-23T10:32:00Z",
  "path": "/api/v1/brands",
  "requestId": "req_brand_create_def456"
}
```

### Actualizar Marca

```http
PUT /api/v1/brands/{brandId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `brandId` | string | ID único de la marca |

**Request Body:**

```json
{
  "name": "Adidas Originals",
  "description": "All Day I Dream About Sports",
  "logo_url": "https://cdn.example.com/brands/adidas-new-logo.png",
  "is_active": true,
  "metadata": {
    "country": "Germany",
    "founded_year": 1949,
    "headquarters": "Herzogenaurach"
  }
}
```

**Validaciones:**

- Todos los campos son opcionales
- Si se envía `name` o `slug`, debe ser único por organización
- `slug` debe tener formato válido (lowercase, números, guiones)

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "brand_id": "brand_789",
    "organization_id": "org_456",
    "name": "Adidas Originals",
    "slug": "adidas",
    "description": "All Day I Dream About Sports",
    "logo_url": "https://cdn.example.com/brands/adidas-new-logo.png",
    "website": "https://www.adidas.com",
    "is_active": true,
    "metadata": {
      "country": "Germany",
      "founded_year": 1949,
      "headquarters": "Herzogenaurach"
    },
    "products_count": 0,
    "created_at": "2025-11-23T10:32:00Z",
    "updated_at": "2025-11-23T10:35:00Z"
  },
  "timestamp": "2025-11-23T10:35:00Z",
  "path": "/api/v1/brands/brand_789",
  "requestId": "req_brand_update_ghi789"
}
```

### Eliminar Marca

```http
DELETE /api/v1/brands/{brandId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `brandId` | string | ID único de la marca |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `force` | boolean | Forzar eliminación aunque tenga productos asociados (soft delete) |

**Response Success (204 No Content):**

```http
HTTP/1.1 204 No Content
```

**Response Error (409 Conflict):**

```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "BRAND_HAS_PRODUCTS",
    "message": "Cannot delete brand with associated products",
    "details": {
      "brand_id": "brand_789",
      "products_count": 42,
      "suggestion": "Use force=true parameter to soft-delete the brand"
    }
  },
  "timestamp": "2025-11-23T10:36:00Z",
  "path": "/api/v1/brands/brand_789",
  "requestId": "req_brand_delete_jkl012"
}
```

## Eventos Publicados

### brand.created

```json
{
  "event_id": "evt_brand_created_abc123",
  "event_type": "brand.created",
  "timestamp": "2025-11-23T10:32:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "brand_id": "brand_789",
    "organization_id": "org_456",
    "name": "Adidas",
    "slug": "adidas",
    "is_active": true
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_brand_create_def456"
  }
}
```

### brand.updated

```json
{
  "event_id": "evt_brand_updated_def456",
  "event_type": "brand.updated",
  "timestamp": "2025-11-23T10:35:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "brand_id": "brand_789",
    "organization_id": "org_456",
    "changes": {
      "name": {
        "old": "Adidas",
        "new": "Adidas Originals"
      },
      "description": {
        "old": "Impossible is Nothing",
        "new": "All Day I Dream About Sports"
      }
    }
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_brand_update_ghi789"
  }
}
```

### brand.deleted

```json
{
  "event_id": "evt_brand_deleted_ghi789",
  "event_type": "brand.deleted",
  "timestamp": "2025-11-23T10:36:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "brand_id": "brand_789",
    "organization_id": "org_456",
    "soft_delete": true
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_brand_delete_jkl012"
  }
}
```

## Permisos Requeridos

| Endpoint | Permiso |
|----------|---------|
| `GET /api/v1/brands` | `catalog.brands.read` |
| `GET /api/v1/brands/{brandId}` | `catalog.brands.read` |
| `POST /api/v1/brands` | `catalog.brands.create` |
| `PUT /api/v1/brands/{brandId}` | `catalog.brands.update` |
| `DELETE /api/v1/brands/{brandId}` | `catalog.brands.delete` |

## Caché

- **Lista de marcas**: TTL 5 minutos
- **Marca individual**: TTL 15 minutos
- **Invalidación**: Al crear, actualizar o eliminar una marca

**Cache Keys:**

```
brands:list:{organization_id}:{hash(query_params)}
brands:detail:{brand_id}
brands:by_slug:{organization_id}:{slug}
```

## Rate Limiting

- **Lectura**: 100 requests/minuto por usuario
- **Escritura**: 20 requests/minuto por usuario

## Ejemplos de Uso

### Listar marcas activas con búsqueda

```bash
curl -X GET "https://api.zenlogic.com/api/v1/brands?first=20&is_active=true&search=nike" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

### Crear nueva marca

```bash
curl -X POST "https://api.zenlogic.com/api/v1/brands" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Puma",
    "slug": "puma",
    "description": "Forever Faster",
    "is_active": true
  }'
```

### Actualizar marca

```bash
curl -X PUT "https://api.zenlogic.com/api/v1/brands/brand_789" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "is_active": false
  }'
```

### Eliminar marca con productos (soft delete)

```bash
curl -X DELETE "https://api.zenlogic.com/api/v1/brands/brand_789?force=true" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```
