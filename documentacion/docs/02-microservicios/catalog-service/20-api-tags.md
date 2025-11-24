# Tags API

API REST para la gestión de etiquetas (tags) de productos en el Catalog Service.

## Endpoints

### Listar Tags

```http
GET /api/v1/tags
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `first` | integer | No | Número de elementos a retornar (default: 20, max: 100) |
| `after` | string | No | Cursor para paginación hacia adelante |
| `last` | integer | No | Número de elementos anteriores a retornar |
| `before` | string | No | Cursor para paginación hacia atrás |
| `search` | string | No | Búsqueda por nombre |
| `type` | string | No | Filtrar por tipo de tag (category, feature, promotion, custom) |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "edges": [
      {
        "cursor": "dGFnXzEyMw==",
        "node": {
          "tag_id": "tag_123",
          "organization_id": "org_456",
          "name": "Wireless",
          "slug": "wireless",
          "type": "feature",
          "color": "#3B82F6",
          "metadata": {
            "icon": "wifi",
            "description": "Wireless connectivity"
          },
          "products_count": 87,
          "created_at": "2025-01-10T10:00:00Z",
          "updated_at": "2025-11-20T14:30:00Z"
        }
      },
      {
        "cursor": "dGFnXzEyNA==",
        "node": {
          "tag_id": "tag_124",
          "organization_id": "org_456",
          "name": "Waterproof",
          "slug": "waterproof",
          "type": "feature",
          "color": "#0EA5E9",
          "metadata": {
            "icon": "droplet",
            "description": "Water resistant device"
          },
          "products_count": 34,
          "created_at": "2025-01-10T11:00:00Z",
          "updated_at": "2025-11-20T15:00:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "hasPreviousPage": false,
      "startCursor": "dGFnXzEyMw==",
      "endCursor": "dGFnXzE0NQ==",
      "totalCount": 53
    }
  },
  "timestamp": "2025-11-23T11:00:00Z",
  "path": "/api/v1/tags",
  "requestId": "req_tags_list_abc123"
}
```

### Obtener Tag por ID

```http
GET /api/v1/tags/{tagId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `tagId` | string | ID único del tag |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "tag_id": "tag_123",
    "organization_id": "org_456",
    "name": "Wireless",
    "slug": "wireless",
    "type": "feature",
    "color": "#3B82F6",
    "metadata": {
      "icon": "wifi",
      "description": "Wireless connectivity"
    },
    "products_count": 87,
    "created_at": "2025-01-10T10:00:00Z",
    "updated_at": "2025-11-20T14:30:00Z"
  },
  "timestamp": "2025-11-23T11:01:00Z",
  "path": "/api/v1/tags/tag_123",
  "requestId": "req_tag_get_xyz789"
}
```

**Response Error (404 Not Found):**

```json
{
  "status": "error",
  "statusCode": 404,
  "error": {
    "code": "TAG_NOT_FOUND",
    "message": "Tag with ID 'tag_123' not found",
    "details": {
      "tag_id": "tag_123"
    }
  },
  "timestamp": "2025-11-23T11:01:00Z",
  "path": "/api/v1/tags/tag_123",
  "requestId": "req_tag_get_xyz789"
}
```

### Crear Tag

```http
POST /api/v1/tags
```

**Request Body:**

```json
{
  "name": "5G Compatible",
  "slug": "5g-compatible",
  "type": "feature",
  "color": "#8B5CF6",
  "metadata": {
    "icon": "signal",
    "description": "Compatible with 5G networks"
  }
}
```

**Validaciones:**

- `name`: Requerido, string (1-50 caracteres), único por organización
- `slug`: Requerido, string (1-50 caracteres), formato slug, único por organización
- `type`: Requerido, enum (`category`, `feature`, `promotion`, `custom`)
- `color`: Opcional, string (formato hex color, default: `#6B7280`)
- `metadata`: Opcional, objeto JSON

**Response Success (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "tag_id": "tag_789",
    "organization_id": "org_456",
    "name": "5G Compatible",
    "slug": "5g-compatible",
    "type": "feature",
    "color": "#8B5CF6",
    "metadata": {
      "icon": "signal",
      "description": "Compatible with 5G networks"
    },
    "products_count": 0,
    "created_at": "2025-11-23T11:02:00Z",
    "updated_at": "2025-11-23T11:02:00Z"
  },
  "timestamp": "2025-11-23T11:02:00Z",
  "path": "/api/v1/tags",
  "requestId": "req_tag_create_def456"
}
```

**Response Error (409 Conflict):**

```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "TAG_SLUG_EXISTS",
    "message": "Tag with slug '5g-compatible' already exists in this organization",
    "details": {
      "slug": "5g-compatible",
      "existing_tag_id": "tag_111"
    }
  },
  "timestamp": "2025-11-23T11:02:00Z",
  "path": "/api/v1/tags",
  "requestId": "req_tag_create_def456"
}
```

**Response Error (400 Bad Request):**

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "INVALID_TAG_DATA",
    "message": "Invalid tag data provided",
    "details": {
      "validation_errors": [
        {
          "field": "type",
          "message": "Type must be one of: category, feature, promotion, custom"
        },
        {
          "field": "color",
          "message": "Color must be a valid hex color code (e.g., #FF5733)"
        }
      ]
    }
  },
  "timestamp": "2025-11-23T11:02:00Z",
  "path": "/api/v1/tags",
  "requestId": "req_tag_create_def456"
}
```

### Actualizar Tag

```http
PUT /api/v1/tags/{tagId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `tagId` | string | ID único del tag |

**Request Body:**

```json
{
  "name": "5G & WiFi 6",
  "color": "#A855F7",
  "metadata": {
    "icon": "signal",
    "description": "Compatible with 5G networks and WiFi 6"
  }
}
```

**Validaciones:**

- Todos los campos son opcionales
- Si se envía `name` o `slug`, debe ser único por organización
- `type` debe ser uno de los valores válidos
- `color` debe ser formato hex válido

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "tag_id": "tag_789",
    "organization_id": "org_456",
    "name": "5G & WiFi 6",
    "slug": "5g-compatible",
    "type": "feature",
    "color": "#A855F7",
    "metadata": {
      "icon": "signal",
      "description": "Compatible with 5G networks and WiFi 6"
    },
    "products_count": 0,
    "created_at": "2025-11-23T11:02:00Z",
    "updated_at": "2025-11-23T11:05:00Z"
  },
  "timestamp": "2025-11-23T11:05:00Z",
  "path": "/api/v1/tags/tag_789",
  "requestId": "req_tag_update_ghi789"
}
```

### Eliminar Tag

```http
DELETE /api/v1/tags/{tagId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `tagId` | string | ID único del tag |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `force` | boolean | Forzar eliminación aunque tenga productos asociados |

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
    "code": "TAG_HAS_PRODUCTS",
    "message": "Cannot delete tag with associated products",
    "details": {
      "tag_id": "tag_789",
      "products_count": 12,
      "suggestion": "Use force=true parameter to remove tag from all products and delete it"
    }
  },
  "timestamp": "2025-11-23T11:06:00Z",
  "path": "/api/v1/tags/tag_789",
  "requestId": "req_tag_delete_jkl012"
}
```

### Añadir Tags a Producto

```http
POST /api/v1/products/{productId}/tags
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |

**Request Body:**

```json
{
  "tag_ids": [
    "tag_123",
    "tag_124",
    "tag_789"
  ]
}
```

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "product_id": "prod_456",
    "tags_added": 3,
    "tags_count": 5,
    "tags": [
      {
        "tag_id": "tag_123",
        "name": "Wireless",
        "slug": "wireless",
        "type": "feature",
        "color": "#3B82F6"
      },
      {
        "tag_id": "tag_124",
        "name": "Waterproof",
        "slug": "waterproof",
        "type": "feature",
        "color": "#0EA5E9"
      },
      {
        "tag_id": "tag_789",
        "name": "5G & WiFi 6",
        "slug": "5g-compatible",
        "type": "feature",
        "color": "#A855F7"
      }
    ]
  },
  "timestamp": "2025-11-23T11:07:00Z",
  "path": "/api/v1/products/prod_456/tags",
  "requestId": "req_product_add_tags_mno345"
}
```

### Remover Tags de Producto

```http
DELETE /api/v1/products/{productId}/tags
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |

**Request Body:**

```json
{
  "tag_ids": [
    "tag_123",
    "tag_124"
  ]
}
```

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "product_id": "prod_456",
    "tags_removed": 2,
    "tags_count": 3
  },
  "timestamp": "2025-11-23T11:08:00Z",
  "path": "/api/v1/products/prod_456/tags",
  "requestId": "req_product_remove_tags_pqr678"
}
```

### Obtener Productos por Tag

```http
GET /api/v1/tags/{tagId}/products
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `tagId` | string | ID único del tag |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `first` | integer | Número de productos a retornar (default: 20, max: 100) |
| `after` | string | Cursor para paginación |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "tag": {
      "tag_id": "tag_123",
      "name": "Wireless",
      "slug": "wireless"
    },
    "products": {
      "edges": [
        {
          "cursor": "cHJvZF80NTY=",
          "node": {
            "product_id": "prod_456",
            "name": "Wireless Headphones",
            "sku": "WH-1000XM5",
            "base_price": 349.99,
            "is_active": true
          }
        }
      ],
      "pageInfo": {
        "hasNextPage": true,
        "hasPreviousPage": false,
        "startCursor": "cHJvZF80NTY=",
        "endCursor": "cHJvZF81MjM=",
        "totalCount": 87
      }
    }
  },
  "timestamp": "2025-11-23T11:09:00Z",
  "path": "/api/v1/tags/tag_123/products",
  "requestId": "req_tag_products_stu901"
}
```

## Eventos Publicados

### tag.created

```json
{
  "event_id": "evt_tag_created_abc123",
  "event_type": "tag.created",
  "timestamp": "2025-11-23T11:02:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "tag_id": "tag_789",
    "organization_id": "org_456",
    "name": "5G Compatible",
    "slug": "5g-compatible",
    "type": "feature"
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_tag_create_def456"
  }
}
```

### tag.updated

```json
{
  "event_id": "evt_tag_updated_def456",
  "event_type": "tag.updated",
  "timestamp": "2025-11-23T11:05:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "tag_id": "tag_789",
    "organization_id": "org_456",
    "changes": {
      "name": {
        "old": "5G Compatible",
        "new": "5G & WiFi 6"
      }
    }
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_tag_update_ghi789"
  }
}
```

### tag.deleted

```json
{
  "event_id": "evt_tag_deleted_ghi789",
  "event_type": "tag.deleted",
  "timestamp": "2025-11-23T11:06:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "tag_id": "tag_789",
    "organization_id": "org_456"
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_tag_delete_jkl012"
  }
}
```

### product.tags.added

```json
{
  "event_id": "evt_product_tags_added_jkl012",
  "event_type": "product.tags.added",
  "timestamp": "2025-11-23T11:07:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "product_id": "prod_456",
    "organization_id": "org_456",
    "tag_ids": ["tag_123", "tag_124", "tag_789"],
    "tags_count": 5
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_product_add_tags_mno345"
  }
}
```

## Permisos Requeridos

| Endpoint | Permiso |
|----------|---------|
| `GET /api/v1/tags` | `catalog.tags.read` |
| `GET /api/v1/tags/{id}` | `catalog.tags.read` |
| `GET /api/v1/tags/{id}/products` | `catalog.tags.read`, `catalog.products.read` |
| `POST /api/v1/tags` | `catalog.tags.create` |
| `PUT /api/v1/tags/{id}` | `catalog.tags.update` |
| `DELETE /api/v1/tags/{id}` | `catalog.tags.delete` |
| `POST /api/v1/products/{id}/tags` | `catalog.products.update` |
| `DELETE /api/v1/products/{id}/tags` | `catalog.products.update` |

## Caché

- **Lista de tags**: TTL 5 minutos
- **Tag individual**: TTL 15 minutos
- **Productos por tag**: TTL 5 minutos
- **Invalidación**: Al crear, actualizar o eliminar tags

**Cache Keys:**

```
tags:list:{organization_id}:{hash(query_params)}
tags:detail:{tag_id}
tags:by_slug:{organization_id}:{slug}
tags:products:{tag_id}:{hash(query_params)}
```

## Rate Limiting

- **Lectura**: 100 requests/minuto por usuario
- **Escritura**: 20 requests/minuto por usuario

## Ejemplos de Uso

### Listar tags por tipo

```bash
curl -X GET "https://api.zenlogic.com/api/v1/tags?type=feature&first=20" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

### Crear tag de promoción

```bash
curl -X POST "https://api.zenlogic.com/api/v1/tags" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Black Friday",
    "slug": "black-friday",
    "type": "promotion",
    "color": "#000000",
    "metadata": {
      "start_date": "2025-11-28",
      "end_date": "2025-11-30"
    }
  }'
```

### Añadir múltiples tags a un producto

```bash
curl -X POST "https://api.zenlogic.com/api/v1/products/prod_456/tags" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_ids": ["tag_123", "tag_124", "tag_789"]
  }'
```

### Obtener productos con tag específico

```bash
curl -X GET "https://api.zenlogic.com/api/v1/tags/tag_123/products?first=50" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

### Eliminar tag forzado

```bash
curl -X DELETE "https://api.zenlogic.com/api/v1/tags/tag_789?force=true" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

## Tipos de Tags

### category
Tags que representan categorías o clasificaciones de productos.

**Ejemplos**: `electronics`, `clothing`, `home-appliances`

### feature
Tags que representan características técnicas o funcionales.

**Ejemplos**: `wireless`, `waterproof`, `5g-compatible`, `bluetooth`

### promotion
Tags para promociones, ofertas o campañas de marketing.

**Ejemplos**: `black-friday`, `clearance`, `new-arrival`, `best-seller`

### custom
Tags personalizados definidos por la organización.

**Ejemplos**: `fragile`, `eco-friendly`, `made-to-order`
