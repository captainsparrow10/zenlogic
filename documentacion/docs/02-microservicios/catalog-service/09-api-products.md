# Products API

API REST para la gestión completa de productos en el Catalog Service.

## Endpoints

### Listar Productos

```http
GET /api/v1/products
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `first` | integer | No | Número de elementos a retornar (default: 20, max: 100) |
| `after` | string | No | Cursor para paginación hacia adelante |
| `last` | integer | No | Número de elementos anteriores a retornar |
| `before` | string | No | Cursor para paginación hacia atrás |
| `search` | string | No | Búsqueda por nombre, SKU o barcode |
| `brand_id` | string | No | Filtrar por marca |
| `collection_id` | string | No | Filtrar por colección |
| `tag_ids` | string | No | Filtrar por tags (comma-separated) |
| `product_type` | string | No | Filtrar por tipo de producto |
| `is_active` | boolean | No | Filtrar por estado activo/inactivo |
| `local_id` | string | No | Filtrar por local |
| `min_price` | decimal | No | Precio base mínimo |
| `max_price` | decimal | No | Precio base máximo |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "edges": [
      {
        "cursor": "cHJvZHVjdF8xMjM=",
        "node": {
          "product_id": "prod_123",
          "organization_id": "org_456",
          "local_id": "local_001",
          "name": "Premium Wireless Headphones",
          "slug": "premium-wireless-headphones",
          "sku": "HEADPHONE-001",
          "barcode": "8801234567890",
          "product_type": "electronics",
          "description": "High-quality wireless headphones with active noise cancellation",
          "unit_of_measure": "unit",
          "base_price": 299.99,
          "alert_stock": 10,
          "is_active": true,
          "brand": {
            "brand_id": "brand_789",
            "name": "Sony",
            "slug": "sony"
          },
          "collections": [
            {
              "collection_id": "coll_123",
              "name": "Electronics",
              "slug": "electronics"
            },
            {
              "collection_id": "coll_124",
              "name": "Audio Devices",
              "slug": "audio-devices"
            }
          ],
          "tags": [
            {
              "tag_id": "tag_001",
              "name": "Wireless",
              "slug": "wireless",
              "type": "feature",
              "color": "#3B82F6"
            },
            {
              "tag_id": "tag_002",
              "name": "Noise Cancelling",
              "slug": "noise-cancelling",
              "type": "feature",
              "color": "#8B5CF6"
            }
          ],
          "images": [
            {
              "image_id": "img_prod_001",
              "url": "https://cdn.zenlogic.com/products/prod_123/main.jpg",
              "alt_text": "Premium Wireless Headphones - Front View",
              "position": 0,
              "is_primary": true
            },
            {
              "image_id": "img_prod_002",
              "url": "https://cdn.zenlogic.com/products/prod_123/side.jpg",
              "alt_text": "Premium Wireless Headphones - Side View",
              "position": 1,
              "is_primary": false
            }
          ],
          "variants_count": 3,
          "total_stock": 145,
          "metadata": {
            "warranty_months": 24,
            "manufacturer": "Sony Corporation"
          },
          "created_at": "2025-01-15T10:00:00Z",
          "updated_at": "2025-11-20T14:30:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "hasPreviousPage": false,
      "startCursor": "cHJvZHVjdF8xMjM=",
      "endCursor": "cHJvZHVjdF8xNDU=",
      "totalCount": 342
    }
  },
  "timestamp": "2025-11-23T13:00:00Z",
  "path": "/api/v1/products",
  "requestId": "req_products_list_abc123"
}
```

### Obtener Producto por ID

```http
GET /api/v1/products/{productId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `include_variants` | boolean | Incluir variantes del producto (default: false) |
| `include_stock` | boolean | Incluir información de stock (default: false) |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "product_id": "prod_123",
    "organization_id": "org_456",
    "local_id": "local_001",
    "name": "Premium Wireless Headphones",
    "slug": "premium-wireless-headphones",
    "sku": "HEADPHONE-001",
    "barcode": "8801234567890",
    "product_type": "electronics",
    "description": "High-quality wireless headphones with active noise cancellation",
    "unit_of_measure": "unit",
    "base_price": 299.99,
    "alert_stock": 10,
    "is_active": true,
    "brand": {
      "brand_id": "brand_789",
      "name": "Sony",
      "slug": "sony",
      "logo_url": "https://cdn.zenlogic.com/brands/sony-logo.png"
    },
    "collections": [
      {
        "collection_id": "coll_123",
        "name": "Electronics",
        "slug": "electronics",
        "image_url": "https://cdn.zenlogic.com/collections/electronics.jpg"
      }
    ],
    "tags": [
      {
        "tag_id": "tag_001",
        "name": "Wireless",
        "slug": "wireless",
        "type": "feature",
        "color": "#3B82F6"
      }
    ],
    "images": [
      {
        "image_id": "img_prod_001",
        "url": "https://cdn.zenlogic.com/products/prod_123/main.jpg",
        "alt_text": "Premium Wireless Headphones - Front View",
        "position": 0,
        "is_primary": true
      }
    ],
    "variants": [
      {
        "variant_id": "var_456",
        "sku": "HEADPHONE-001-BLACK",
        "option_name": "Color",
        "option_value": "Black",
        "price": 299.99,
        "stock_total": 45,
        "is_active": true
      },
      {
        "variant_id": "var_457",
        "sku": "HEADPHONE-001-WHITE",
        "option_name": "Color",
        "option_value": "White",
        "price": 299.99,
        "stock_total": 50,
        "is_active": true
      }
    ],
    "variants_count": 3,
    "total_stock": 145,
    "metadata": {
      "warranty_months": 24,
      "manufacturer": "Sony Corporation",
      "weight_kg": 0.25
    },
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-11-20T14:30:00Z"
  },
  "timestamp": "2025-11-23T13:01:00Z",
  "path": "/api/v1/products/prod_123",
  "requestId": "req_product_get_xyz789"
}
```

**Response Error (404 Not Found):**

```json
{
  "status": "error",
  "statusCode": 404,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID 'prod_123' not found",
    "details": {
      "product_id": "prod_123"
    }
  },
  "timestamp": "2025-11-23T13:01:00Z",
  "path": "/api/v1/products/prod_123",
  "requestId": "req_product_get_xyz789"
}
```

### Crear Producto

```http
POST /api/v1/products
```

**Request Body:**

```json
{
  "local_id": "local_001",
  "name": "Wireless Mouse",
  "slug": "wireless-mouse",
  "sku": "MOUSE-001",
  "barcode": "8801234567891",
  "product_type": "electronics",
  "description": "Ergonomic wireless mouse with precision tracking",
  "unit_of_measure": "unit",
  "base_price": 49.99,
  "alert_stock": 15,
  "is_active": true,
  "brand_id": "brand_789",
  "collection_ids": ["coll_123", "coll_125"],
  "tag_ids": ["tag_001", "tag_003"],
  "metadata": {
    "warranty_months": 12,
    "color": "Black"
  }
}
```

**Validaciones:**

- `local_id`: Requerido, debe existir y pertenecer a la organización
- `name`: Requerido, string (1-200 caracteres)
- `slug`: Requerido, string (1-200 caracteres), formato slug, único por organización
- `sku`: Requerido, string (1-50 caracteres), único por organización
- `barcode`: Opcional, string (max 50 caracteres), único si se proporciona
- `product_type`: Requerido, string (max 50 caracteres)
- `description`: Opcional, string (max 2000 caracteres)
- `unit_of_measure`: Requerido, string (ej: `unit`, `kg`, `liter`, `meter`)
- `base_price`: Requerido, decimal > 0
- `alert_stock`: Opcional, integer >= 0 (default: 0)
- `is_active`: Opcional, boolean (default: true)
- `brand_id`: Opcional, debe existir en la organización
- `collection_ids`: Opcional, array de collection IDs válidos
- `tag_ids`: Opcional, array de tag IDs válidos
- `metadata`: Opcional, objeto JSON

**Response Success (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "product_id": "prod_789",
    "organization_id": "org_456",
    "local_id": "local_001",
    "name": "Wireless Mouse",
    "slug": "wireless-mouse",
    "sku": "MOUSE-001",
    "barcode": "8801234567891",
    "product_type": "electronics",
    "description": "Ergonomic wireless mouse with precision tracking",
    "unit_of_measure": "unit",
    "base_price": 49.99,
    "alert_stock": 15,
    "is_active": true,
    "brand": {
      "brand_id": "brand_789",
      "name": "Sony",
      "slug": "sony"
    },
    "collections": [
      {
        "collection_id": "coll_123",
        "name": "Electronics",
        "slug": "electronics"
      }
    ],
    "tags": [
      {
        "tag_id": "tag_001",
        "name": "Wireless",
        "slug": "wireless",
        "type": "feature",
        "color": "#3B82F6"
      }
    ],
    "images": [],
    "variants_count": 0,
    "total_stock": 0,
    "metadata": {
      "warranty_months": 12,
      "color": "Black"
    },
    "created_at": "2025-11-23T13:02:00Z",
    "updated_at": "2025-11-23T13:02:00Z"
  },
  "timestamp": "2025-11-23T13:02:00Z",
  "path": "/api/v1/products",
  "requestId": "req_product_create_def456"
}
```

**Response Error (409 Conflict - SKU Duplicado):**

```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "PRODUCT_SKU_EXISTS",
    "message": "Product with SKU 'MOUSE-001' already exists in this organization",
    "details": {
      "sku": "MOUSE-001",
      "existing_product_id": "prod_111"
    }
  },
  "timestamp": "2025-11-23T13:02:00Z",
  "path": "/api/v1/products",
  "requestId": "req_product_create_def456"
}
```

**Response Error (400 Bad Request):**

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "INVALID_PRODUCT_DATA",
    "message": "Invalid product data provided",
    "details": {
      "validation_errors": [
        {
          "field": "base_price",
          "message": "Base price must be greater than 0"
        },
        {
          "field": "slug",
          "message": "Slug must contain only lowercase letters, numbers, and hyphens"
        }
      ]
    }
  },
  "timestamp": "2025-11-23T13:02:00Z",
  "path": "/api/v1/products",
  "requestId": "req_product_create_def456"
}
```

### Actualizar Producto

```http
PUT /api/v1/products/{productId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |

**Request Body:**

```json
{
  "name": "Wireless Mouse Pro",
  "description": "Updated description with new features",
  "base_price": 59.99,
  "alert_stock": 20,
  "brand_id": "brand_999",
  "collection_ids": ["coll_123"],
  "tag_ids": ["tag_001", "tag_003", "tag_005"],
  "metadata": {
    "warranty_months": 24,
    "color": "Black",
    "features": ["Ergonomic", "Rechargeable"]
  }
}
```

**Validaciones:**

- Todos los campos son opcionales
- Si se envía `sku` o `slug`, debe ser único
- `brand_id`, `collection_ids`, `tag_ids` deben existir en la organización
- No se puede cambiar `local_id` después de crear el producto

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "product_id": "prod_789",
    "organization_id": "org_456",
    "local_id": "local_001",
    "name": "Wireless Mouse Pro",
    "slug": "wireless-mouse",
    "sku": "MOUSE-001",
    "barcode": "8801234567891",
    "product_type": "electronics",
    "description": "Updated description with new features",
    "unit_of_measure": "unit",
    "base_price": 59.99,
    "alert_stock": 20,
    "is_active": true,
    "brand": {
      "brand_id": "brand_999",
      "name": "Logitech",
      "slug": "logitech"
    },
    "collections": [
      {
        "collection_id": "coll_123",
        "name": "Electronics",
        "slug": "electronics"
      }
    ],
    "tags": [
      {
        "tag_id": "tag_001",
        "name": "Wireless",
        "slug": "wireless",
        "type": "feature",
        "color": "#3B82F6"
      },
      {
        "tag_id": "tag_003",
        "name": "Ergonomic",
        "slug": "ergonomic",
        "type": "feature",
        "color": "#10B981"
      }
    ],
    "images": [],
    "variants_count": 0,
    "total_stock": 0,
    "metadata": {
      "warranty_months": 24,
      "color": "Black",
      "features": ["Ergonomic", "Rechargeable"]
    },
    "created_at": "2025-11-23T13:02:00Z",
    "updated_at": "2025-11-23T13:05:00Z"
  },
  "timestamp": "2025-11-23T13:05:00Z",
  "path": "/api/v1/products/prod_789",
  "requestId": "req_product_update_ghi789"
}
```

### Eliminar Producto

```http
DELETE /api/v1/products/{productId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `force` | boolean | Forzar eliminación aunque tenga variantes (soft delete) |

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
    "code": "PRODUCT_HAS_VARIANTS",
    "message": "Cannot delete product with existing variants",
    "details": {
      "product_id": "prod_789",
      "variants_count": 5,
      "suggestion": "Use force=true parameter to soft-delete the product and all variants"
    }
  },
  "timestamp": "2025-11-23T13:06:00Z",
  "path": "/api/v1/products/prod_789",
  "requestId": "req_product_delete_jkl012"
}
```

### Activar/Desactivar Producto

```http
PATCH /api/v1/products/{productId}/activate
PATCH /api/v1/products/{productId}/deactivate
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "product_id": "prod_789",
    "is_active": true,
    "updated_at": "2025-11-23T13:07:00Z"
  },
  "timestamp": "2025-11-23T13:07:00Z",
  "path": "/api/v1/products/prod_789/activate",
  "requestId": "req_product_activate_mno345"
}
```

### Obtener Stock de Producto

```http
GET /api/v1/products/{productId}/stock
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "product_id": "prod_123",
    "product_name": "Premium Wireless Headphones",
    "total_stock": 145,
    "alert_stock": 10,
    "below_alert": false,
    "variants": [
      {
        "variant_id": "var_456",
        "sku": "HEADPHONE-001-BLACK",
        "option_value": "Black",
        "stock_total": 45,
        "stock_available": 40,
        "stock_reserved": 5,
        "stock_damaged": 0
      },
      {
        "variant_id": "var_457",
        "sku": "HEADPHONE-001-WHITE",
        "option_value": "White",
        "stock_total": 50,
        "stock_available": 45,
        "stock_reserved": 3,
        "stock_damaged": 2
      }
    ]
  },
  "timestamp": "2025-11-23T13:08:00Z",
  "path": "/api/v1/products/prod_123/stock",
  "requestId": "req_product_stock_pqr678"
}
```

## Eventos Publicados

### product.created

```json
{
  "event_id": "evt_product_created_abc123",
  "event_type": "product.created",
  "timestamp": "2025-11-23T13:02:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "product_id": "prod_789",
    "organization_id": "org_456",
    "local_id": "local_001",
    "name": "Wireless Mouse",
    "sku": "MOUSE-001",
    "base_price": 49.99,
    "brand_id": "brand_789",
    "is_active": true
  },
  "metadata": {
    "user_id": "user_123",
    "correlation_id": "req_product_create_def456"
  }
}
```

### product.updated

```json
{
  "event_id": "evt_product_updated_def456",
  "event_type": "product.updated",
  "timestamp": "2025-11-23T13:05:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "product_id": "prod_789",
    "organization_id": "org_456",
    "changes": {
      "name": {
        "old": "Wireless Mouse",
        "new": "Wireless Mouse Pro"
      },
      "base_price": {
        "old": 49.99,
        "new": 59.99
      }
    }
  },
  "metadata": {
    "user_id": "user_123",
    "correlation_id": "req_product_update_ghi789"
  }
}
```

### product.deleted

```json
{
  "event_id": "evt_product_deleted_ghi789",
  "event_type": "product.deleted",
  "timestamp": "2025-11-23T13:06:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "product_id": "prod_789",
    "organization_id": "org_456",
    "soft_delete": true
  },
  "metadata": {
    "user_id": "user_123",
    "correlation_id": "req_product_delete_jkl012"
  }
}
```

## Permisos Requeridos

| Endpoint | Permiso |
|----------|---------|
| `GET /api/v1/products` | `catalog.products.read` |
| `GET /api/v1/products/{id}` | `catalog.products.read` |
| `GET /api/v1/products/{id}/stock` | `catalog.products.read`, `inventory.stock.read` |
| `POST /api/v1/products` | `catalog.products.create` |
| `PUT /api/v1/products/{id}` | `catalog.products.update` |
| `DELETE /api/v1/products/{id}` | `catalog.products.delete` |
| `PATCH /api/v1/products/{id}/activate` | `catalog.products.update` |
| `PATCH /api/v1/products/{id}/deactivate` | `catalog.products.update` |

## Caché

- **Lista de productos**: TTL 5 minutos
- **Producto individual**: TTL 15 minutos
- **Stock de producto**: TTL 1 minuto
- **Invalidación**: Al crear, actualizar o eliminar productos

**Cache Keys:**

```
products:list:{organization_id}:{local_id}:{hash(query_params)}
products:detail:{product_id}
products:by_sku:{organization_id}:{sku}
products:stock:{product_id}
```

## Rate Limiting

- **Lectura**: 100 requests/minuto por usuario
- **Escritura**: 20 requests/minuto por usuario

## Ejemplos de Uso

### Listar productos por marca y colección

```bash
curl -X GET "https://api.zenlogic.com/api/v1/products?brand_id=brand_789&collection_id=coll_123&first=20" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

### Buscar productos

```bash
curl -X GET "https://api.zenlogic.com/api/v1/products?search=wireless&is_active=true&first=50" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

### Crear producto completo

```bash
curl -X POST "https://api.zenlogic.com/api/v1/products" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "local_id": "local_001",
    "name": "Wireless Keyboard",
    "slug": "wireless-keyboard",
    "sku": "KB-001",
    "product_type": "electronics",
    "base_price": 79.99,
    "brand_id": "brand_789",
    "collection_ids": ["coll_123"],
    "tag_ids": ["tag_001", "tag_004"]
  }'
```

### Actualizar producto

```bash
curl -X PUT "https://api.zenlogic.com/api/v1/products/prod_789" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "base_price": 69.99,
    "description": "Updated description"
  }'
```

### Obtener stock detallado

```bash
curl -X GET "https://api.zenlogic.com/api/v1/products/prod_123/stock" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

### Eliminar producto con variantes

```bash
curl -X DELETE "https://api.zenlogic.com/api/v1/products/prod_789?force=true" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

## Integración con Otros Servicios

### Inventory Service

Al crear un producto, el Catalog Service publica el evento `product.created` que es consumido por el Inventory Service para:
- Inicializar registros de stock
- Configurar alertas de inventario
- Establecer políticas de reorden

### Order Service

El Order Service consulta la información de productos vía:
- gRPC para validaciones síncronas (verificar producto existe y está activo)
- API REST para mostrar detalles de productos en órdenes
- Eventos para mantener cache local actualizado

## Validaciones de Negocio

### SKU Único

El SKU debe ser único a nivel de organización. El sistema valida esto antes de crear o actualizar productos.

### Slug Único

El slug debe ser único a nivel de organización para permitir URLs amigables.

### Brand Existence

Si se proporciona un `brand_id`, el sistema valida que la marca existe y pertenece a la organización.

### Collections & Tags

Los IDs de colecciones y tags deben existir y estar activos en la organización.

### Local Assignment

Un producto debe estar asignado a un local válido que pertenezca a la organización.

## Próximos Pasos

- [API Variants](./api-variants)
- [API Brands](./api-brands)
- [API Collections](./api-collections)
- [API Tags](./api-tags)
- [API Price Tiers](./api-price-tiers)
- [API Images](./api-images)
- [Paginación Cursor](./paginacion-cursor)
- [Modelo de Datos](./modelo-datos)
