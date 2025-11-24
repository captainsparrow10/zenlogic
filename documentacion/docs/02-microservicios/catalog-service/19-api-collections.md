# Collections API

API REST para la gestión de colecciones jerárquicas de productos en el Catalog Service.

## Endpoints

### Listar Colecciones

```http
GET /api/v1/collections
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `first` | integer | No | Número de elementos a retornar (default: 20, max: 100) |
| `after` | string | No | Cursor para paginación hacia adelante |
| `last` | integer | No | Número de elementos anteriores a retornar |
| `before` | string | No | Cursor para paginación hacia atrás |
| `search` | string | No | Búsqueda por nombre o descripción |
| `parent_id` | string | No | Filtrar por colección padre (null para raíz) |
| `is_active` | boolean | No | Filtrar por estado activo/inactivo |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "edges": [
      {
        "cursor": "Y29sbGVjdGlvbl8xMjM=",
        "node": {
          "collection_id": "coll_123",
          "organization_id": "org_456",
          "parent_id": null,
          "name": "Electronics",
          "slug": "electronics",
          "description": "Electronic devices and accessories",
          "image_url": "https://cdn.example.com/collections/electronics.jpg",
          "sort_order": 1,
          "is_active": true,
          "metadata": {
            "featured": true,
            "show_in_menu": true
          },
          "products_count": 156,
          "children_count": 3,
          "created_at": "2025-01-10T10:00:00Z",
          "updated_at": "2025-11-20T14:30:00Z"
        }
      },
      {
        "cursor": "Y29sbGVjdGlvbl8xMjQ=",
        "node": {
          "collection_id": "coll_124",
          "organization_id": "org_456",
          "parent_id": "coll_123",
          "name": "Smartphones",
          "slug": "smartphones",
          "description": "Latest smartphones and mobile devices",
          "image_url": "https://cdn.example.com/collections/smartphones.jpg",
          "sort_order": 1,
          "is_active": true,
          "metadata": {
            "featured": true,
            "show_in_menu": true,
            "banner_text": "New arrivals"
          },
          "products_count": 45,
          "children_count": 0,
          "created_at": "2025-01-10T11:00:00Z",
          "updated_at": "2025-11-20T15:00:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "hasPreviousPage": false,
      "startCursor": "Y29sbGVjdGlvbl8xMjM=",
      "endCursor": "Y29sbGVjdGlvbl8xNDU=",
      "totalCount": 42
    }
  },
  "timestamp": "2025-11-23T10:40:00Z",
  "path": "/api/v1/collections",
  "requestId": "req_collections_list_abc123"
}
```

### Obtener Colección por ID

```http
GET /api/v1/collections/{collectionId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `collectionId` | string | ID único de la colección |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `include_children` | boolean | Incluir sub-colecciones (default: false) |
| `include_products` | boolean | Incluir productos de la colección (default: false) |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "collection_id": "coll_123",
    "organization_id": "org_456",
    "parent_id": null,
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic devices and accessories",
    "image_url": "https://cdn.example.com/collections/electronics.jpg",
    "sort_order": 1,
    "is_active": true,
    "metadata": {
      "featured": true,
      "show_in_menu": true
    },
    "products_count": 156,
    "children_count": 3,
    "children": [
      {
        "collection_id": "coll_124",
        "name": "Smartphones",
        "slug": "smartphones",
        "products_count": 45
      },
      {
        "collection_id": "coll_125",
        "name": "Laptops",
        "slug": "laptops",
        "products_count": 67
      }
    ],
    "created_at": "2025-01-10T10:00:00Z",
    "updated_at": "2025-11-20T14:30:00Z"
  },
  "timestamp": "2025-11-23T10:41:00Z",
  "path": "/api/v1/collections/coll_123",
  "requestId": "req_collection_get_xyz789"
}
```

**Response Error (404 Not Found):**

```json
{
  "status": "error",
  "statusCode": 404,
  "error": {
    "code": "COLLECTION_NOT_FOUND",
    "message": "Collection with ID 'coll_123' not found",
    "details": {
      "collection_id": "coll_123"
    }
  },
  "timestamp": "2025-11-23T10:41:00Z",
  "path": "/api/v1/collections/coll_123",
  "requestId": "req_collection_get_xyz789"
}
```

### Crear Colección

```http
POST /api/v1/collections
```

**Request Body:**

```json
{
  "parent_id": "coll_123",
  "name": "Tablets",
  "slug": "tablets",
  "description": "Tablets and iPad devices",
  "image_url": "https://cdn.example.com/collections/tablets.jpg",
  "sort_order": 2,
  "is_active": true,
  "metadata": {
    "featured": false,
    "show_in_menu": true
  }
}
```

**Validaciones:**

- `name`: Requerido, string (1-100 caracteres), único por organización y parent_id
- `slug`: Requerido, string (1-100 caracteres), formato slug, único por organización
- `parent_id`: Opcional, string (debe existir en la organización)
- `description`: Opcional, string (max 500 caracteres)
- `image_url`: Opcional, string (URL válida)
- `sort_order`: Opcional, integer (default: 0)
- `is_active`: Opcional, boolean (default: true)
- `metadata`: Opcional, objeto JSON

**Response Success (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "collection_id": "coll_126",
    "organization_id": "org_456",
    "parent_id": "coll_123",
    "name": "Tablets",
    "slug": "tablets",
    "description": "Tablets and iPad devices",
    "image_url": "https://cdn.example.com/collections/tablets.jpg",
    "sort_order": 2,
    "is_active": true,
    "metadata": {
      "featured": false,
      "show_in_menu": true
    },
    "products_count": 0,
    "children_count": 0,
    "created_at": "2025-11-23T10:42:00Z",
    "updated_at": "2025-11-23T10:42:00Z"
  },
  "timestamp": "2025-11-23T10:42:00Z",
  "path": "/api/v1/collections",
  "requestId": "req_collection_create_def456"
}
```

**Response Error (409 Conflict):**

```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "COLLECTION_SLUG_EXISTS",
    "message": "Collection with slug 'tablets' already exists in this organization",
    "details": {
      "slug": "tablets",
      "existing_collection_id": "coll_111"
    }
  },
  "timestamp": "2025-11-23T10:42:00Z",
  "path": "/api/v1/collections",
  "requestId": "req_collection_create_def456"
}
```

**Response Error (400 Bad Request - Circular Reference):**

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "CIRCULAR_COLLECTION_REFERENCE",
    "message": "Cannot set parent_id that would create a circular reference",
    "details": {
      "collection_id": "coll_123",
      "parent_id": "coll_126"
    }
  },
  "timestamp": "2025-11-23T10:42:00Z",
  "path": "/api/v1/collections",
  "requestId": "req_collection_create_def456"
}
```

### Actualizar Colección

```http
PUT /api/v1/collections/{collectionId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `collectionId` | string | ID único de la colección |

**Request Body:**

```json
{
  "name": "Tablets & iPads",
  "description": "All tablet devices including iPads",
  "sort_order": 1,
  "is_active": true,
  "metadata": {
    "featured": true,
    "show_in_menu": true,
    "promo_banner": "20% off on selected tablets"
  }
}
```

**Validaciones:**

- Todos los campos son opcionales
- Si se actualiza `parent_id`, validar que no cree referencia circular
- Si se envía `name` o `slug`, debe ser único

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "collection_id": "coll_126",
    "organization_id": "org_456",
    "parent_id": "coll_123",
    "name": "Tablets & iPads",
    "slug": "tablets",
    "description": "All tablet devices including iPads",
    "image_url": "https://cdn.example.com/collections/tablets.jpg",
    "sort_order": 1,
    "is_active": true,
    "metadata": {
      "featured": true,
      "show_in_menu": true,
      "promo_banner": "20% off on selected tablets"
    },
    "products_count": 0,
    "children_count": 0,
    "created_at": "2025-11-23T10:42:00Z",
    "updated_at": "2025-11-23T10:45:00Z"
  },
  "timestamp": "2025-11-23T10:45:00Z",
  "path": "/api/v1/collections/coll_126",
  "requestId": "req_collection_update_ghi789"
}
```

### Eliminar Colección

```http
DELETE /api/v1/collections/{collectionId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `collectionId` | string | ID único de la colección |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `force` | boolean | Forzar eliminación aunque tenga productos o sub-colecciones |
| `reassign_to` | string | ID de colección a la que reasignar productos/sub-colecciones |

**Response Success (204 No Content):**

```http
HTTP/1.1 204 No Content
```

**Response Error (409 Conflict - Has Products):**

```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "COLLECTION_HAS_PRODUCTS",
    "message": "Cannot delete collection with associated products",
    "details": {
      "collection_id": "coll_126",
      "products_count": 23,
      "suggestion": "Use reassign_to parameter to move products to another collection"
    }
  },
  "timestamp": "2025-11-23T10:46:00Z",
  "path": "/api/v1/collections/coll_126",
  "requestId": "req_collection_delete_jkl012"
}
```

**Response Error (409 Conflict - Has Children):**

```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "COLLECTION_HAS_CHILDREN",
    "message": "Cannot delete collection with sub-collections",
    "details": {
      "collection_id": "coll_123",
      "children_count": 3,
      "suggestion": "Delete or reassign child collections first"
    }
  },
  "timestamp": "2025-11-23T10:46:00Z",
  "path": "/api/v1/collections/coll_123",
  "requestId": "req_collection_delete_jkl012"
}
```

### Obtener Árbol de Colecciones

```http
GET /api/v1/collections/tree
```

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `max_depth` | integer | Profundidad máxima del árbol (default: 3) |
| `include_counts` | boolean | Incluir conteos de productos (default: true) |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": [
    {
      "collection_id": "coll_123",
      "name": "Electronics",
      "slug": "electronics",
      "products_count": 156,
      "children": [
        {
          "collection_id": "coll_124",
          "name": "Smartphones",
          "slug": "smartphones",
          "products_count": 45,
          "children": []
        },
        {
          "collection_id": "coll_125",
          "name": "Laptops",
          "slug": "laptops",
          "products_count": 67,
          "children": [
            {
              "collection_id": "coll_127",
              "name": "Gaming Laptops",
              "slug": "gaming-laptops",
              "products_count": 23,
              "children": []
            }
          ]
        }
      ]
    },
    {
      "collection_id": "coll_200",
      "name": "Clothing",
      "slug": "clothing",
      "products_count": 342,
      "children": []
    }
  ],
  "timestamp": "2025-11-23T10:47:00Z",
  "path": "/api/v1/collections/tree",
  "requestId": "req_collections_tree_mno345"
}
```

### Añadir Productos a Colección

```http
POST /api/v1/collections/{collectionId}/products
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `collectionId` | string | ID único de la colección |

**Request Body:**

```json
{
  "product_ids": [
    "prod_123",
    "prod_124",
    "prod_125"
  ]
}
```

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "collection_id": "coll_126",
    "products_added": 3,
    "products_count": 26
  },
  "timestamp": "2025-11-23T10:48:00Z",
  "path": "/api/v1/collections/coll_126/products",
  "requestId": "req_collection_add_products_pqr678"
}
```

### Remover Productos de Colección

```http
DELETE /api/v1/collections/{collectionId}/products
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `collectionId` | string | ID único de la colección |

**Request Body:**

```json
{
  "product_ids": [
    "prod_123",
    "prod_124"
  ]
}
```

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "collection_id": "coll_126",
    "products_removed": 2,
    "products_count": 24
  },
  "timestamp": "2025-11-23T10:49:00Z",
  "path": "/api/v1/collections/coll_126/products",
  "requestId": "req_collection_remove_products_stu901"
}
```

## Eventos Publicados

### collection.created

```json
{
  "event_id": "evt_collection_created_abc123",
  "event_type": "collection.created",
  "timestamp": "2025-11-23T10:42:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "collection_id": "coll_126",
    "organization_id": "org_456",
    "parent_id": "coll_123",
    "name": "Tablets",
    "slug": "tablets",
    "is_active": true
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_collection_create_def456"
  }
}
```

### collection.updated

```json
{
  "event_id": "evt_collection_updated_def456",
  "event_type": "collection.updated",
  "timestamp": "2025-11-23T10:45:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "collection_id": "coll_126",
    "organization_id": "org_456",
    "changes": {
      "name": {
        "old": "Tablets",
        "new": "Tablets & iPads"
      }
    }
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_collection_update_ghi789"
  }
}
```

### collection.deleted

```json
{
  "event_id": "evt_collection_deleted_ghi789",
  "event_type": "collection.deleted",
  "timestamp": "2025-11-23T10:46:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "collection_id": "coll_126",
    "organization_id": "org_456"
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_collection_delete_jkl012"
  }
}
```

### collection.products.added

```json
{
  "event_id": "evt_collection_products_added_jkl012",
  "event_type": "collection.products.added",
  "timestamp": "2025-11-23T10:48:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "collection_id": "coll_126",
    "organization_id": "org_456",
    "product_ids": ["prod_123", "prod_124", "prod_125"],
    "products_count": 26
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_collection_add_products_pqr678"
  }
}
```

## Permisos Requeridos

| Endpoint | Permiso |
|----------|---------|
| `GET /api/v1/collections` | `catalog.collections.read` |
| `GET /api/v1/collections/{id}` | `catalog.collections.read` |
| `GET /api/v1/collections/tree` | `catalog.collections.read` |
| `POST /api/v1/collections` | `catalog.collections.create` |
| `PUT /api/v1/collections/{id}` | `catalog.collections.update` |
| `DELETE /api/v1/collections/{id}` | `catalog.collections.delete` |
| `POST /api/v1/collections/{id}/products` | `catalog.collections.update` |
| `DELETE /api/v1/collections/{id}/products` | `catalog.collections.update` |

## Caché

- **Lista de colecciones**: TTL 5 minutos
- **Colección individual**: TTL 15 minutos
- **Árbol de colecciones**: TTL 10 minutos
- **Invalidación**: Al crear, actualizar o eliminar colecciones

**Cache Keys:**

```
collections:list:{organization_id}:{hash(query_params)}
collections:detail:{collection_id}
collections:tree:{organization_id}:{max_depth}
collections:by_slug:{organization_id}:{slug}
```

## Rate Limiting

- **Lectura**: 100 requests/minuto por usuario
- **Escritura**: 20 requests/minuto por usuario

## Ejemplos de Uso

### Listar colecciones raíz

```bash
curl -X GET "https://api.zenlogic.com/api/v1/collections?parent_id=null&first=20" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

### Obtener árbol completo de colecciones

```bash
curl -X GET "https://api.zenlogic.com/api/v1/collections/tree?max_depth=5" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

### Crear sub-colección

```bash
curl -X POST "https://api.zenlogic.com/api/v1/collections" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "parent_id": "coll_123",
    "name": "Smart Watches",
    "slug": "smart-watches",
    "is_active": true
  }'
```

### Añadir productos a colección

```bash
curl -X POST "https://api.zenlogic.com/api/v1/collections/coll_126/products" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "product_ids": ["prod_123", "prod_124", "prod_125"]
  }'
```

### Eliminar colección reasignando productos

```bash
curl -X DELETE "https://api.zenlogic.com/api/v1/collections/coll_126?reassign_to=coll_123" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```
