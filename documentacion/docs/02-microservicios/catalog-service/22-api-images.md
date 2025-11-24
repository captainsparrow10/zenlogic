# Images API

API REST para la gestión de imágenes de productos y variantes en el Catalog Service.

## Endpoints

### Listar Imágenes de Producto

```http
GET /api/v1/products/{productId}/images
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
    "images": [
      {
        "image_id": "img_prod_001",
        "product_id": "prod_123",
        "url": "https://cdn.zenlogic.com/products/prod_123/main.jpg",
        "alt_text": "Premium Wireless Headphones - Front View",
        "position": 0,
        "is_primary": true,
        "metadata": {
          "width": 1200,
          "height": 1200,
          "format": "jpg",
          "size_bytes": 245678
        },
        "created_at": "2025-01-10T10:00:00Z",
        "updated_at": "2025-11-20T14:30:00Z"
      },
      {
        "image_id": "img_prod_002",
        "product_id": "prod_123",
        "url": "https://cdn.zenlogic.com/products/prod_123/side.jpg",
        "alt_text": "Premium Wireless Headphones - Side View",
        "position": 1,
        "is_primary": false,
        "metadata": {
          "width": 1200,
          "height": 1200,
          "format": "jpg",
          "size_bytes": 198543
        },
        "created_at": "2025-01-10T10:01:00Z",
        "updated_at": "2025-11-20T14:30:00Z"
      }
    ],
    "total_images": 2
  },
  "timestamp": "2025-11-23T12:00:00Z",
  "path": "/api/v1/products/prod_123/images",
  "requestId": "req_product_images_abc123"
}
```

### Añadir Imagen a Producto

```http
POST /api/v1/products/{productId}/images
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |

**Request Body (Multipart Form Data):**

```
POST /api/v1/products/prod_123/images
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="image"; filename="product-image.jpg"
Content-Type: image/jpeg

[binary image data]
------WebKitFormBoundary
Content-Disposition: form-data; name="alt_text"

Premium Wireless Headphones - Top View
------WebKitFormBoundary
Content-Disposition: form-data; name="position"

2
------WebKitFormBoundary
Content-Disposition: form-data; name="is_primary"

false
------WebKitFormBoundary--
```

**Request Body (JSON con URL):**

```json
{
  "url": "https://external-cdn.com/image.jpg",
  "alt_text": "Premium Wireless Headphones - Top View",
  "position": 2,
  "is_primary": false,
  "metadata": {
    "source": "external",
    "original_url": "https://supplier.com/images/prod-123.jpg"
  }
}
```

**Validaciones:**

- `image` (file): Requerido si no se envía `url`, formatos permitidos: jpg, jpeg, png, webp
- `url`: Requerido si no se envía `image`, debe ser URL válida
- `alt_text`: Opcional, string (max 200 caracteres)
- `position`: Opcional, integer >= 0 (default: último + 1)
- `is_primary`: Opcional, boolean (default: false, solo una imagen puede ser primary)
- `metadata`: Opcional, objeto JSON
- Tamaño máximo de archivo: 5MB

**Response Success (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "image_id": "img_prod_003",
    "product_id": "prod_123",
    "url": "https://cdn.zenlogic.com/products/prod_123/img_prod_003.jpg",
    "alt_text": "Premium Wireless Headphones - Top View",
    "position": 2,
    "is_primary": false,
    "metadata": {
      "width": 1200,
      "height": 1200,
      "format": "jpg",
      "size_bytes": 234567
    },
    "created_at": "2025-11-23T12:01:00Z",
    "updated_at": "2025-11-23T12:01:00Z"
  },
  "timestamp": "2025-11-23T12:01:00Z",
  "path": "/api/v1/products/prod_123/images",
  "requestId": "req_product_image_create_xyz789"
}
```

**Response Error (400 Bad Request):**

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "INVALID_IMAGE_FORMAT",
    "message": "Invalid image format. Allowed formats: jpg, jpeg, png, webp",
    "details": {
      "provided_format": "gif",
      "allowed_formats": ["jpg", "jpeg", "png", "webp"]
    }
  },
  "timestamp": "2025-11-23T12:01:00Z",
  "path": "/api/v1/products/prod_123/images",
  "requestId": "req_product_image_create_xyz789"
}
```

**Response Error (413 Payload Too Large):**

```json
{
  "status": "error",
  "statusCode": 413,
  "error": {
    "code": "IMAGE_TOO_LARGE",
    "message": "Image file exceeds maximum size limit",
    "details": {
      "file_size_bytes": 6291456,
      "max_size_bytes": 5242880,
      "max_size_mb": 5
    }
  },
  "timestamp": "2025-11-23T12:01:00Z",
  "path": "/api/v1/products/prod_123/images",
  "requestId": "req_product_image_create_xyz789"
}
```

### Actualizar Imagen de Producto

```http
PUT /api/v1/products/{productId}/images/{imageId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |
| `imageId` | string | ID único de la imagen |

**Request Body:**

```json
{
  "alt_text": "Premium Wireless Headphones - Updated Description",
  "position": 0,
  "is_primary": true
}
```

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "image_id": "img_prod_003",
    "product_id": "prod_123",
    "url": "https://cdn.zenlogic.com/products/prod_123/img_prod_003.jpg",
    "alt_text": "Premium Wireless Headphones - Updated Description",
    "position": 0,
    "is_primary": true,
    "metadata": {
      "width": 1200,
      "height": 1200,
      "format": "jpg",
      "size_bytes": 234567
    },
    "created_at": "2025-11-23T12:01:00Z",
    "updated_at": "2025-11-23T12:05:00Z"
  },
  "timestamp": "2025-11-23T12:05:00Z",
  "path": "/api/v1/products/prod_123/images/img_prod_003",
  "requestId": "req_product_image_update_def456"
}
```

### Eliminar Imagen de Producto

```http
DELETE /api/v1/products/{productId}/images/{imageId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |
| `imageId` | string | ID único de la imagen |

**Response Success (204 No Content):**

```http
HTTP/1.1 204 No Content
```

### Reordenar Imágenes de Producto

```http
PUT /api/v1/products/{productId}/images/reorder
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |

**Request Body:**

```json
{
  "image_order": [
    "img_prod_003",
    "img_prod_001",
    "img_prod_002"
  ]
}
```

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "product_id": "prod_123",
    "images_reordered": 3,
    "new_order": [
      {
        "image_id": "img_prod_003",
        "position": 0
      },
      {
        "image_id": "img_prod_001",
        "position": 1
      },
      {
        "image_id": "img_prod_002",
        "position": 2
      }
    ]
  },
  "timestamp": "2025-11-23T12:06:00Z",
  "path": "/api/v1/products/prod_123/images/reorder",
  "requestId": "req_product_images_reorder_ghi789"
}
```

## Variant Images

### Listar Imágenes de Variante

```http
GET /api/v1/variants/{variantId}/images
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | string | ID único de la variante |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "variant_id": "var_456",
    "images": [
      {
        "image_id": "img_var_001",
        "variant_id": "var_456",
        "url": "https://cdn.zenlogic.com/variants/var_456/red-main.jpg",
        "alt_text": "Premium Wireless Headphones - Red Color",
        "position": 0,
        "is_primary": true,
        "metadata": {
          "width": 1200,
          "height": 1200,
          "format": "jpg",
          "size_bytes": 198765,
          "color_hex": "#FF0000"
        },
        "created_at": "2025-01-10T10:10:00Z",
        "updated_at": "2025-11-20T14:40:00Z"
      }
    ],
    "total_images": 1
  },
  "timestamp": "2025-11-23T12:10:00Z",
  "path": "/api/v1/variants/var_456/images",
  "requestId": "req_variant_images_jkl012"
}
```

### Añadir Imagen a Variante

```http
POST /api/v1/variants/{variantId}/images
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | string | ID único de la variante |

**Request Body (Multipart Form Data o JSON):**

Similar a la creación de imágenes de producto.

**Response Success (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "image_id": "img_var_002",
    "variant_id": "var_456",
    "url": "https://cdn.zenlogic.com/variants/var_456/red-side.jpg",
    "alt_text": "Premium Wireless Headphones - Red Side View",
    "position": 1,
    "is_primary": false,
    "metadata": {
      "width": 1200,
      "height": 1200,
      "format": "jpg",
      "size_bytes": 187654,
      "color_hex": "#FF0000"
    },
    "created_at": "2025-11-23T12:11:00Z",
    "updated_at": "2025-11-23T12:11:00Z"
  },
  "timestamp": "2025-11-23T12:11:00Z",
  "path": "/api/v1/variants/var_456/images",
  "requestId": "req_variant_image_create_mno345"
}
```

### Actualizar Imagen de Variante

```http
PUT /api/v1/variants/{variantId}/images/{imageId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | string | ID único de la variante |
| `imageId` | string | ID único de la imagen |

**Request Body:**

```json
{
  "alt_text": "Updated alt text",
  "position": 0,
  "is_primary": true
}
```

**Response**: Similar a actualización de imagen de producto.

### Eliminar Imagen de Variante

```http
DELETE /api/v1/variants/{variantId}/images/{imageId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | string | ID único de la variante |
| `imageId` | string | ID único de la imagen |

**Response Success (204 No Content):**

```http
HTTP/1.1 204 No Content
```

### Reordenar Imágenes de Variante

```http
PUT /api/v1/variants/{variantId}/images/reorder
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | string | ID único de la variante |

**Request Body:**

```json
{
  "image_order": [
    "img_var_002",
    "img_var_001"
  ]
}
```

**Response**: Similar a reordenamiento de imágenes de producto.

## Eventos Publicados

### product.image.created

```json
{
  "event_id": "evt_product_image_created_abc123",
  "event_type": "product.image.created",
  "timestamp": "2025-11-23T12:01:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "image_id": "img_prod_003",
    "product_id": "prod_123",
    "organization_id": "org_456",
    "url": "https://cdn.zenlogic.com/products/prod_123/img_prod_003.jpg",
    "position": 2,
    "is_primary": false
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_product_image_create_xyz789"
  }
}
```

### product.image.updated

```json
{
  "event_id": "evt_product_image_updated_def456",
  "event_type": "product.image.updated",
  "timestamp": "2025-11-23T12:05:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "image_id": "img_prod_003",
    "product_id": "prod_123",
    "organization_id": "org_456",
    "changes": {
      "is_primary": {
        "old": false,
        "new": true
      },
      "position": {
        "old": 2,
        "new": 0
      }
    }
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_product_image_update_def456"
  }
}
```

### product.image.deleted

```json
{
  "event_id": "evt_product_image_deleted_ghi789",
  "event_type": "product.image.deleted",
  "timestamp": "2025-11-23T12:07:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "image_id": "img_prod_003",
    "product_id": "prod_123",
    "organization_id": "org_456"
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_product_image_delete_pqr678"
  }
}
```

### variant.image.created

```json
{
  "event_id": "evt_variant_image_created_jkl012",
  "event_type": "variant.image.created",
  "timestamp": "2025-11-23T12:11:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "image_id": "img_var_002",
    "variant_id": "var_456",
    "product_id": "prod_123",
    "organization_id": "org_456",
    "url": "https://cdn.zenlogic.com/variants/var_456/red-side.jpg",
    "position": 1,
    "is_primary": false
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_variant_image_create_mno345"
  }
}
```

## Permisos Requeridos

| Endpoint | Permiso |
|----------|---------|
| `GET /api/v1/products/{id}/images` | `catalog.products.read` |
| `POST /api/v1/products/{id}/images` | `catalog.products.update` |
| `PUT /api/v1/products/{id}/images/{imageId}` | `catalog.products.update` |
| `DELETE /api/v1/products/{id}/images/{imageId}` | `catalog.products.update` |
| `PUT /api/v1/products/{id}/images/reorder` | `catalog.products.update` |
| `GET /api/v1/variants/{id}/images` | `catalog.variants.read` |
| `POST /api/v1/variants/{id}/images` | `catalog.variants.update` |
| `PUT /api/v1/variants/{id}/images/{imageId}` | `catalog.variants.update` |
| `DELETE /api/v1/variants/{id}/images/{imageId}` | `catalog.variants.update` |
| `PUT /api/v1/variants/{id}/images/reorder` | `catalog.variants.update` |

## Storage y CDN

### Almacenamiento

Las imágenes se almacenan en un bucket de S3 compatible con la siguiente estructura:

```
s3://zenlogic-media/
├── {organization_id}/
│   ├── products/
│   │   ├── {product_id}/
│   │   │   ├── {image_id}_original.jpg
│   │   │   ├── {image_id}_large.jpg (1200x1200)
│   │   │   ├── {image_id}_medium.jpg (600x600)
│   │   │   └── {image_id}_thumb.jpg (150x150)
│   │
│   └── variants/
│       ├── {variant_id}/
│       │   ├── {image_id}_original.jpg
│       │   ├── {image_id}_large.jpg
│       │   ├── {image_id}_medium.jpg
│       │   └── {image_id}_thumb.jpg
```

### CDN

Las URLs retornadas por la API apuntan al CDN de CloudFront:

```
https://cdn.zenlogic.com/products/{product_id}/{image_id}.jpg
https://cdn.zenlogic.com/variants/{variant_id}/{image_id}.jpg
```

### Transformaciones

Se pueden solicitar transformaciones on-the-fly usando query parameters:

```
# Redimensionar
https://cdn.zenlogic.com/products/prod_123/img_001.jpg?w=800&h=800

# Formato
https://cdn.zenlogic.com/products/prod_123/img_001.jpg?format=webp

# Calidad
https://cdn.zenlogic.com/products/prod_123/img_001.jpg?q=80

# Combinado
https://cdn.zenlogic.com/products/prod_123/img_001.jpg?w=600&format=webp&q=85
```

## Caché

- **Lista de imágenes**: TTL 15 minutos
- **URLs de CDN**: TTL 1 año (immutable)
- **Invalidación**: Al crear, actualizar, eliminar o reordenar imágenes

**Cache Keys:**

```
images:product:{product_id}
images:variant:{variant_id}
cdn:{url_path} (CloudFront cache)
```

## Rate Limiting

- **Lectura**: 100 requests/minuto por usuario
- **Escritura**: 20 requests/minuto por usuario
- **Upload**: 10 uploads/minuto por usuario

## Ejemplos de Uso

### Subir imagen desde archivo

```bash
curl -X POST "https://api.zenlogic.com/api/v1/products/prod_123/images" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -F "image=@/path/to/image.jpg" \
  -F "alt_text=Product main image" \
  -F "is_primary=true"
```

### Añadir imagen desde URL externa

```bash
curl -X POST "https://api.zenlogic.com/api/v1/products/prod_123/images" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://supplier.com/images/product.jpg",
    "alt_text": "Product from supplier",
    "position": 1
  }'
```

### Actualizar imagen principal

```bash
curl -X PUT "https://api.zenlogic.com/api/v1/products/prod_123/images/img_prod_002" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "is_primary": true
  }'
```

### Reordenar imágenes

```bash
curl -X PUT "https://api.zenlogic.com/api/v1/products/prod_123/images/reorder" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "image_order": ["img_prod_003", "img_prod_001", "img_prod_002"]
  }'
```

### Eliminar imagen

```bash
curl -X DELETE "https://api.zenlogic.com/api/v1/products/prod_123/images/img_prod_002" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

## Validaciones y Límites

### Formatos Permitidos

- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **WebP** (.webp)

### Límites

- **Tamaño máximo por imagen**: 5 MB
- **Dimensiones máximas**: 4000x4000 px
- **Dimensiones mínimas**: 200x200 px
- **Imágenes por producto**: 10 máximo
- **Imágenes por variante**: 5 máximo

### Procesamiento Automático

Al subir una imagen, el sistema automáticamente:

1. **Valida** formato y tamaño
2. **Optimiza** la imagen (compresión)
3. **Genera thumbnails** (large, medium, thumb)
4. **Extrae metadata** (dimensiones, formato, tamaño)
5. **Sube a S3** todas las versiones
6. **Invalida cache** de CDN si es necesario

## Códigos de Error Específicos

| Código | Mensaje | Solución |
|--------|---------|----------|
| `INVALID_IMAGE_FORMAT` | Formato de imagen no válido | Usar jpg, png o webp |
| `IMAGE_TOO_LARGE` | Imagen excede tamaño máximo | Reducir tamaño a menos de 5MB |
| `IMAGE_TOO_SMALL` | Dimensiones muy pequeñas | Mínimo 200x200 px |
| `MAX_IMAGES_EXCEEDED` | Máximo de imágenes alcanzado | Eliminar imágenes antes de añadir nuevas |
| `IMAGE_NOT_FOUND` | Imagen no encontrada | Verificar image_id |
| `IMAGE_UPLOAD_FAILED` | Error al subir imagen | Reintentar |
| `PRIMARY_IMAGE_REQUIRED` | Producto debe tener imagen principal | Marcar una imagen como primary |
