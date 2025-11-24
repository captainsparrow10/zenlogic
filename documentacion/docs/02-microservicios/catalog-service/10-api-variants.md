# Variants API

API REST para la gestión completa de variantes de productos en el Catalog Service.

## Endpoints

### Listar Variantes de un Producto

```http
GET /api/v1/products/{productId}/variants
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `is_active` | boolean | Filtrar por estado activo/inactivo |
| `option_value` | string | Filtrar por valor de opción |
| `min_price` | decimal | Precio mínimo |
| `max_price` | decimal | Precio máximo |
| `in_stock` | boolean | Filtrar solo con stock disponible |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "product": {
      "product_id": "prod_123",
      "name": "Premium Wireless Headphones",
      "sku": "HEADPHONE-001"
    },
    "variants": [
      {
        "variant_id": "var_456",
        "product_id": "prod_123",
        "sku": "HEADPHONE-001-BLACK",
        "barcode": "8801234567892",
        "option_name": "Color",
        "option_value": "Black",
        "price": 299.99,
        "cost_price": 180.00,
        "compare_at_price": 349.99,
        "tax": 15.00,
        "weight": 0.25,
        "dimensions": {
          "length": 20.5,
          "width": 18.0,
          "height": 8.5,
          "unit": "cm"
        },
        "lot_number": "LOT-2025-001",
        "stock": {
          "total": 45,
          "available": 40,
          "reserved": 5,
          "damaged": 0
        },
        "vendor": "Sony Corporation",
        "is_active": true,
        "images": [
          {
            "image_id": "img_var_001",
            "url": "https://cdn.zenlogic.com/variants/var_456/black-main.jpg",
            "alt_text": "Black Wireless Headphones",
            "position": 0,
            "is_primary": true
          }
        ],
        "price_tiers": [
          {
            "price_tier_id": "pt_123",
            "tier_name": "Wholesale",
            "min_qty": 10,
            "price": 270.00
          },
          {
            "price_tier_id": "pt_123",
            "tier_name": "Wholesale",
            "min_qty": 50,
            "price": 255.00
          }
        ],
        "metadata": {
          "color_hex": "#000000",
          "material": "Plastic + Leather"
        },
        "created_at": "2025-01-15T10:10:00Z",
        "updated_at": "2025-11-20T14:40:00Z"
      },
      {
        "variant_id": "var_457",
        "product_id": "prod_123",
        "sku": "HEADPHONE-001-WHITE",
        "barcode": "8801234567893",
        "option_name": "Color",
        "option_value": "White",
        "price": 299.99,
        "cost_price": 180.00,
        "compare_at_price": 349.99,
        "tax": 15.00,
        "weight": 0.25,
        "dimensions": {
          "length": 20.5,
          "width": 18.0,
          "height": 8.5,
          "unit": "cm"
        },
        "lot_number": "LOT-2025-002",
        "stock": {
          "total": 50,
          "available": 45,
          "reserved": 3,
          "damaged": 2
        },
        "vendor": "Sony Corporation",
        "is_active": true,
        "images": [
          {
            "image_id": "img_var_002",
            "url": "https://cdn.zenlogic.com/variants/var_457/white-main.jpg",
            "alt_text": "White Wireless Headphones",
            "position": 0,
            "is_primary": true
          }
        ],
        "price_tiers": [
          {
            "price_tier_id": "pt_123",
            "tier_name": "Wholesale",
            "min_qty": 10,
            "price": 270.00
          }
        ],
        "metadata": {
          "color_hex": "#FFFFFF",
          "material": "Plastic + Leather"
        },
        "created_at": "2025-01-15T10:15:00Z",
        "updated_at": "2025-11-20T14:45:00Z"
      }
    ],
    "total_variants": 2
  },
  "timestamp": "2025-11-23T14:00:00Z",
  "path": "/api/v1/products/prod_123/variants",
  "requestId": "req_variants_list_abc123"
}
```

### Obtener Variante por ID

```http
GET /api/v1/variants/{variantId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | string | ID único de la variante |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `include_product` | boolean | Incluir información del producto (default: false) |
| `include_stock` | boolean | Incluir detalles de stock (default: true) |
| `include_price_tiers` | boolean | Incluir price tiers (default: false) |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "variant_id": "var_456",
    "product_id": "prod_123",
    "product": {
      "product_id": "prod_123",
      "name": "Premium Wireless Headphones",
      "sku": "HEADPHONE-001",
      "brand": {
        "brand_id": "brand_789",
        "name": "Sony",
        "slug": "sony"
      }
    },
    "sku": "HEADPHONE-001-BLACK",
    "barcode": "8801234567892",
    "option_name": "Color",
    "option_value": "Black",
    "price": 299.99,
    "cost_price": 180.00,
    "compare_at_price": 349.99,
    "tax": 15.00,
    "weight": 0.25,
    "dimensions": {
      "length": 20.5,
      "width": 18.0,
      "height": 8.5,
      "unit": "cm"
    },
    "lot_number": "LOT-2025-001",
    "stock": {
      "total": 45,
      "available": 40,
      "reserved": 5,
      "damaged": 0,
      "below_alert": false,
      "alert_threshold": 10
    },
    "vendor": "Sony Corporation",
    "is_active": true,
    "images": [
      {
        "image_id": "img_var_001",
        "url": "https://cdn.zenlogic.com/variants/var_456/black-main.jpg",
        "alt_text": "Black Wireless Headphones",
        "position": 0,
        "is_primary": true
      }
    ],
    "price_tiers": [
      {
        "price_tier_id": "pt_123",
        "tier_name": "Wholesale",
        "slug": "wholesale",
        "min_qty": 10,
        "price": 270.00,
        "discount_percentage": 10
      },
      {
        "price_tier_id": "pt_123",
        "tier_name": "Wholesale",
        "slug": "wholesale",
        "min_qty": 50,
        "price": 255.00,
        "discount_percentage": 15
      }
    ],
    "metadata": {
      "color_hex": "#000000",
      "material": "Plastic + Leather",
      "warranty_months": 24
    },
    "created_at": "2025-01-15T10:10:00Z",
    "updated_at": "2025-11-20T14:40:00Z"
  },
  "timestamp": "2025-11-23T14:01:00Z",
  "path": "/api/v1/variants/var_456",
  "requestId": "req_variant_get_xyz789"
}
```

**Response Error (404 Not Found):**

```json
{
  "status": "error",
  "statusCode": 404,
  "error": {
    "code": "VARIANT_NOT_FOUND",
    "message": "Variant with ID 'var_456' not found",
    "details": {
      "variant_id": "var_456"
    }
  },
  "timestamp": "2025-11-23T14:01:00Z",
  "path": "/api/v1/variants/var_456",
  "requestId": "req_variant_get_xyz789"
}
```

### Crear Variante

```http
POST /api/v1/products/{productId}/variants
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `productId` | string | ID único del producto |

**Request Body:**

```json
{
  "sku": "HEADPHONE-001-BLUE",
  "barcode": "8801234567894",
  "option_id": "opt_color_123",
  "option_value": "Blue",
  "price": 299.99,
  "cost_price": 180.00,
  "compare_at_price": 349.99,
  "tax": 15.00,
  "weight": 0.25,
  "dimensions": {
    "length": 20.5,
    "width": 18.0,
    "height": 8.5,
    "unit": "cm"
  },
  "lot_number": "LOT-2025-003",
  "vendor": "Sony Corporation",
  "is_active": true,
  "metadata": {
    "color_hex": "#0000FF",
    "material": "Plastic + Leather"
  }
}
```

**Validaciones:**

- `sku`: Requerido, string (1-50 caracteres), único por organización
- `barcode`: Opcional, string (max 50 caracteres), único si se proporciona
- `option_id`: Requerido, debe existir y pertenecer al producto
- `option_value`: Requerido, string (1-100 caracteres)
- `price`: Requerido, decimal > 0
- `cost_price`: Opcional, decimal >= 0
- `compare_at_price`: Opcional, decimal >= 0
- `tax`: Opcional, decimal >= 0 (porcentaje)
- `weight`: Opcional, decimal >= 0 (en kg)
- `dimensions`: Opcional, objeto con length, width, height (decimales >= 0) y unit
- `lot_number`: Opcional, string (max 50 caracteres)
- `vendor`: Opcional, string (max 200 caracteres)
- `is_active`: Opcional, boolean (default: true)
- `metadata`: Opcional, objeto JSON

**Response Success (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "variant_id": "var_789",
    "product_id": "prod_123",
    "sku": "HEADPHONE-001-BLUE",
    "barcode": "8801234567894",
    "option_name": "Color",
    "option_value": "Blue",
    "price": 299.99,
    "cost_price": 180.00,
    "compare_at_price": 349.99,
    "tax": 15.00,
    "weight": 0.25,
    "dimensions": {
      "length": 20.5,
      "width": 18.0,
      "height": 8.5,
      "unit": "cm"
    },
    "lot_number": "LOT-2025-003",
    "stock": {
      "total": 0,
      "available": 0,
      "reserved": 0,
      "damaged": 0
    },
    "vendor": "Sony Corporation",
    "is_active": true,
    "images": [],
    "price_tiers": [],
    "metadata": {
      "color_hex": "#0000FF",
      "material": "Plastic + Leather"
    },
    "created_at": "2025-11-23T14:02:00Z",
    "updated_at": "2025-11-23T14:02:00Z"
  },
  "timestamp": "2025-11-23T14:02:00Z",
  "path": "/api/v1/products/prod_123/variants",
  "requestId": "req_variant_create_def456"
}
```

**Response Error (409 Conflict - SKU Duplicado):**

```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "VARIANT_SKU_EXISTS",
    "message": "Variant with SKU 'HEADPHONE-001-BLUE' already exists in this organization",
    "details": {
      "sku": "HEADPHONE-001-BLUE",
      "existing_variant_id": "var_111"
    }
  },
  "timestamp": "2025-11-23T14:02:00Z",
  "path": "/api/v1/products/prod_123/variants",
  "requestId": "req_variant_create_def456"
}
```

**Response Error (400 Bad Request):**

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "INVALID_VARIANT_DATA",
    "message": "Invalid variant data provided",
    "details": {
      "validation_errors": [
        {
          "field": "price",
          "message": "Price must be greater than 0"
        },
        {
          "field": "option_id",
          "message": "Option does not belong to this product"
        }
      ]
    }
  },
  "timestamp": "2025-11-23T14:02:00Z",
  "path": "/api/v1/products/prod_123/variants",
  "requestId": "req_variant_create_def456"
}
```

### Actualizar Variante

```http
PUT /api/v1/variants/{variantId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | string | ID único de la variante |

**Request Body:**

```json
{
  "price": 279.99,
  "cost_price": 170.00,
  "compare_at_price": 329.99,
  "tax": 18.00,
  "weight": 0.23,
  "lot_number": "LOT-2025-004",
  "vendor": "Sony Corporation - Updated",
  "metadata": {
    "color_hex": "#0000FF",
    "material": "Recycled Plastic + Leather",
    "eco_friendly": true
  }
}
```

**Validaciones:**

- Todos los campos son opcionales
- Si se envía `sku` o `barcode`, debe ser único
- `option_id` no se puede cambiar después de crear la variante
- `price`, `cost_price`, `tax`, `weight` deben ser >= 0

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "variant_id": "var_789",
    "product_id": "prod_123",
    "sku": "HEADPHONE-001-BLUE",
    "barcode": "8801234567894",
    "option_name": "Color",
    "option_value": "Blue",
    "price": 279.99,
    "cost_price": 170.00,
    "compare_at_price": 329.99,
    "tax": 18.00,
    "weight": 0.23,
    "dimensions": {
      "length": 20.5,
      "width": 18.0,
      "height": 8.5,
      "unit": "cm"
    },
    "lot_number": "LOT-2025-004",
    "stock": {
      "total": 0,
      "available": 0,
      "reserved": 0,
      "damaged": 0
    },
    "vendor": "Sony Corporation - Updated",
    "is_active": true,
    "images": [],
    "price_tiers": [],
    "metadata": {
      "color_hex": "#0000FF",
      "material": "Recycled Plastic + Leather",
      "eco_friendly": true
    },
    "created_at": "2025-11-23T14:02:00Z",
    "updated_at": "2025-11-23T14:05:00Z"
  },
  "timestamp": "2025-11-23T14:05:00Z",
  "path": "/api/v1/variants/var_789",
  "requestId": "req_variant_update_ghi789"
}
```

### Eliminar Variante

```http
DELETE /api/v1/variants/{variantId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | string | ID único de la variante |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `force` | boolean | Forzar eliminación aunque tenga stock (soft delete) |

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
    "code": "VARIANT_HAS_STOCK",
    "message": "Cannot delete variant with existing stock",
    "details": {
      "variant_id": "var_789",
      "stock_total": 45,
      "stock_available": 40,
      "suggestion": "Use force=true parameter to soft-delete the variant"
    }
  },
  "timestamp": "2025-11-23T14:06:00Z",
  "path": "/api/v1/variants/var_789",
  "requestId": "req_variant_delete_jkl012"
}
```

### Activar/Desactivar Variante

```http
PATCH /api/v1/variants/{variantId}/activate
PATCH /api/v1/variants/{variantId}/deactivate
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
    "variant_id": "var_789",
    "is_active": true,
    "updated_at": "2025-11-23T14:07:00Z"
  },
  "timestamp": "2025-11-23T14:07:00Z",
  "path": "/api/v1/variants/var_789/activate",
  "requestId": "req_variant_activate_mno345"
}
```

### Calcular Precio con Price Tier

```http
GET /api/v1/variants/{variantId}/calculate-price
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | string | ID único de la variante |

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `quantity` | integer | Sí | Cantidad para calcular precio |
| `price_tier_id` | string | No | Price tier específico a aplicar |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "variant_id": "var_456",
    "sku": "HEADPHONE-001-BLACK",
    "base_price": 299.99,
    "quantity": 75,
    "applied_price_tier": {
      "price_tier_id": "pt_123",
      "tier_name": "Wholesale",
      "slug": "wholesale"
    },
    "applied_rule": {
      "rule_id": "ptr_002",
      "min_qty": 50,
      "price": 270.00
    },
    "unit_price": 270.00,
    "subtotal": 20250.00,
    "tax_amount": 3037.50,
    "total": 23287.50,
    "savings": {
      "amount_saved": 2249.25,
      "percentage_saved": 10
    },
    "next_tier": {
      "min_qty": 100,
      "price": 255.00,
      "additional_qty_needed": 25,
      "additional_savings": 1125.00
    }
  },
  "timestamp": "2025-11-23T14:08:00Z",
  "path": "/api/v1/variants/var_456/calculate-price",
  "requestId": "req_variant_price_calc_pqr678"
}
```

### Obtener Stock de Variante

```http
GET /api/v1/variants/{variantId}/stock
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
    "sku": "HEADPHONE-001-BLACK",
    "product_name": "Premium Wireless Headphones",
    "option_value": "Black",
    "stock": {
      "total": 45,
      "available": 40,
      "reserved": 5,
      "damaged": 0,
      "in_transit": 20
    },
    "alert_threshold": 10,
    "below_alert": false,
    "lot_number": "LOT-2025-001",
    "last_stock_update": "2025-11-23T10:30:00Z",
    "stock_movements_today": 3
  },
  "timestamp": "2025-11-23T14:09:00Z",
  "path": "/api/v1/variants/var_456/stock",
  "requestId": "req_variant_stock_stu901"
}
```

## Eventos Publicados

### variant.created

```json
{
  "event_id": "evt_variant_created_abc123",
  "event_type": "variant.created",
  "timestamp": "2025-11-23T14:02:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "variant_id": "var_789",
    "product_id": "prod_123",
    "organization_id": "org_456",
    "sku": "HEADPHONE-001-BLUE",
    "option_value": "Blue",
    "price": 299.99,
    "is_active": true
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_variant_create_def456"
  }
}
```

### variant.updated

```json
{
  "event_id": "evt_variant_updated_def456",
  "event_type": "variant.updated",
  "timestamp": "2025-11-23T14:05:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "variant_id": "var_789",
    "product_id": "prod_123",
    "organization_id": "org_456",
    "changes": {
      "price": {
        "old": 299.99,
        "new": 279.99
      },
      "cost_price": {
        "old": 180.00,
        "new": 170.00
      }
    }
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_variant_update_ghi789"
  }
}
```

### variant.deleted

```json
{
  "event_id": "evt_variant_deleted_ghi789",
  "event_type": "variant.deleted",
  "timestamp": "2025-11-23T14:06:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "variant_id": "var_789",
    "product_id": "prod_123",
    "organization_id": "org_456",
    "soft_delete": true
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_variant_delete_jkl012"
  }
}
```

### variant.price.changed

```json
{
  "event_id": "evt_variant_price_changed_jkl012",
  "event_type": "variant.price.changed",
  "timestamp": "2025-11-23T14:05:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "variant_id": "var_789",
    "product_id": "prod_123",
    "organization_id": "org_456",
    "old_price": 299.99,
    "new_price": 279.99,
    "change_percentage": -6.67
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_variant_update_ghi789"
  }
}
```

## Permisos Requeridos

| Endpoint | Permiso |
|----------|---------|
| `GET /api/v1/products/{id}/variants` | `catalog.variants.read` |
| `GET /api/v1/variants/{id}` | `catalog.variants.read` |
| `GET /api/v1/variants/{id}/stock` | `catalog.variants.read`, `inventory.stock.read` |
| `GET /api/v1/variants/{id}/calculate-price` | `catalog.variants.read` |
| `POST /api/v1/products/{id}/variants` | `catalog.variants.create` |
| `PUT /api/v1/variants/{id}` | `catalog.variants.update` |
| `DELETE /api/v1/variants/{id}` | `catalog.variants.delete` |
| `PATCH /api/v1/variants/{id}/activate` | `catalog.variants.update` |
| `PATCH /api/v1/variants/{id}/deactivate` | `catalog.variants.update` |

## Caché

- **Lista de variantes por producto**: TTL 5 minutos
- **Variante individual**: TTL 15 minutos
- **Stock de variante**: TTL 1 minuto
- **Cálculo de precio**: TTL 5 minutos
- **Invalidación**: Al crear, actualizar o eliminar variantes

**Cache Keys:**

```
variants:list:{product_id}:{hash(query_params)}
variants:detail:{variant_id}
variants:by_sku:{organization_id}:{sku}
variants:stock:{variant_id}
variants:price:{variant_id}:{price_tier_id}:{quantity}
```

## Rate Limiting

- **Lectura**: 100 requests/minuto por usuario
- **Escritura**: 20 requests/minuto por usuario

## Ejemplos de Uso

### Listar variantes activas con stock

```bash
curl -X GET "https://api.zenlogic.com/api/v1/products/prod_123/variants?is_active=true&in_stock=true" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

### Crear variante completa

```bash
curl -X POST "https://api.zenlogic.com/api/v1/products/prod_123/variants" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "HEADPHONE-001-RED",
    "barcode": "8801234567895",
    "option_id": "opt_color_123",
    "option_value": "Red",
    "price": 299.99,
    "cost_price": 180.00,
    "weight": 0.25,
    "vendor": "Sony Corporation",
    "metadata": {
      "color_hex": "#FF0000"
    }
  }'
```

### Actualizar precio y costo

```bash
curl -X PUT "https://api.zenlogic.com/api/v1/variants/var_789" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 279.99,
    "cost_price": 170.00
  }'
```

### Calcular precio con cantidad

```bash
curl -X GET "https://api.zenlogic.com/api/v1/variants/var_456/calculate-price?quantity=75&price_tier_id=pt_123" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

### Obtener stock detallado

```bash
curl -X GET "https://api.zenlogic.com/api/v1/variants/var_456/stock" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

## Integración con Otros Servicios

### Inventory Service

Al crear una variante, el Catalog Service publica el evento `variant.created` que es consumido por el Inventory Service para:
- Inicializar registros de stock con valores en 0
- Configurar alertas de inventario según el `alert_stock` del producto
- Crear ubicaciones de almacenamiento para la variante

### Order Service

El Order Service consulta variantes vía:
- gRPC para validaciones síncronas (verificar variante existe, está activa, tiene stock)
- API REST para mostrar detalles de variantes en órdenes
- Endpoint de cálculo de precio para aplicar price tiers automáticamente

### Price Tier Integration

Cuando se consulta el precio de una variante:
1. Se verifica si hay price tiers activos para la variante
2. Se ordena por `min_qty` descendente
3. Se selecciona el primer tier donde `quantity >= min_qty`
4. Se retorna información del siguiente tier disponible para incentivar compras mayores

## Validaciones de Negocio

### SKU Único

El SKU debe ser único a nivel de organización, incluso entre diferentes productos.

### Barcode Único

Si se proporciona un barcode, debe ser único a nivel de organización.

### Option Consistency

La opción (option_id) debe pertenecer al producto. No se pueden crear variantes con opciones de otros productos.

### Price Validations

- `price` debe ser mayor que 0
- `cost_price` debe ser menor o igual a `price` (warning, no error)
- `compare_at_price` debe ser mayor a `price` (sugerencia, no error)

### Stock Management

Las variantes no manejan stock directamente en el Catalog Service. El stock es responsabilidad del Inventory Service, pero se consulta vía gRPC para mostrar información actualizada.

### Dimensions

Si se proporcionan dimensiones, todas (length, width, height) deben ser mayores a 0.

## Campos de Variante

### Campos de Identificación

- `variant_id`: UUID único
- `product_id`: Referencia al producto padre
- `sku`: Código único de la variante
- `barcode`: Código de barras (EAN, UPC, etc.)

### Campos de Opciones

- `option_id`: ID de la opción del producto (ej: "Color")
- `option_name`: Nombre de la opción (denormalizado)
- `option_value`: Valor específico (ej: "Red", "Large")

### Campos de Precio

- `price`: Precio de venta al público
- `cost_price`: Costo de adquisición
- `compare_at_price`: Precio de comparación (precio tachado)
- `tax`: Porcentaje de impuesto

### Campos Físicos

- `weight`: Peso en kg
- `dimensions`: Objeto con length, width, height, unit
- `lot_number`: Número de lote o batch

### Campos de Inventario (readonly)

- `stock`: Objeto con total, available, reserved, damaged (desde Inventory Service)

### Campos Comerciales

- `vendor`: Proveedor o fabricante
- `is_active`: Estado activo/inactivo

### Relaciones

- `images`: Array de imágenes de la variante
- `price_tiers`: Array de price tiers aplicables

### Metadata

- `metadata`: JSON libre para campos personalizados

## Próximos Pasos

- [API Products](./api-products)
- [API Options](./api-options)
- [API Price Tiers](./api-price-tiers)
- [API Images](./api-images)
- [Modelo de Datos](./modelo-datos)
- [Cache Strategy](./cache-strategy)
