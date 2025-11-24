# Price Tiers API

API REST para la gestión de niveles de precios (price tiers) por volumen en el Catalog Service.

## Endpoints

### Listar Price Tiers

```http
GET /api/v1/price-tiers
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `first` | integer | No | Número de elementos a retornar (default: 20, max: 100) |
| `after` | string | No | Cursor para paginación hacia adelante |
| `last` | integer | No | Número de elementos anteriores a retornar |
| `before` | string | No | Cursor para paginación hacia atrás |
| `search` | string | No | Búsqueda por nombre |
| `is_active` | boolean | No | Filtrar por estado activo/inactivo |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "edges": [
      {
        "cursor": "cHJpY2VfdGllcl8xMjM=",
        "node": {
          "price_tier_id": "pt_123",
          "organization_id": "org_456",
          "name": "Wholesale",
          "slug": "wholesale",
          "description": "Wholesale pricing for bulk orders",
          "priority": 1,
          "is_active": true,
          "metadata": {
            "customer_type": "B2B",
            "min_order_value": 1000
          },
          "rules_count": 5,
          "created_at": "2025-01-15T10:00:00Z",
          "updated_at": "2025-11-20T14:30:00Z"
        }
      },
      {
        "cursor": "cHJpY2VfdGllcl8xMjQ=",
        "node": {
          "price_tier_id": "pt_124",
          "organization_id": "org_456",
          "name": "Retail",
          "slug": "retail",
          "description": "Standard retail pricing",
          "priority": 2,
          "is_active": true,
          "metadata": {
            "customer_type": "B2C"
          },
          "rules_count": 3,
          "created_at": "2025-01-15T11:00:00Z",
          "updated_at": "2025-11-20T15:00:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": false,
      "hasPreviousPage": false,
      "startCursor": "cHJpY2VfdGllcl8xMjM=",
      "endCursor": "cHJpY2VfdGllcl8xMjQ=",
      "totalCount": 2
    }
  },
  "timestamp": "2025-11-23T11:20:00Z",
  "path": "/api/v1/price-tiers",
  "requestId": "req_price_tiers_list_abc123"
}
```

### Obtener Price Tier por ID

```http
GET /api/v1/price-tiers/{priceTierId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `priceTierId` | string | ID único del price tier |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `include_rules` | boolean | Incluir reglas de precios (default: true) |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "price_tier_id": "pt_123",
    "organization_id": "org_456",
    "name": "Wholesale",
    "slug": "wholesale",
    "description": "Wholesale pricing for bulk orders",
    "priority": 1,
    "is_active": true,
    "metadata": {
      "customer_type": "B2B",
      "min_order_value": 1000
    },
    "rules_count": 5,
    "rules": [
      {
        "rule_id": "ptr_001",
        "variant_id": "var_456",
        "min_qty": 10,
        "price": 45.00,
        "variant": {
          "variant_id": "var_456",
          "sku": "PROD-001-RED",
          "product_name": "Premium Headphones",
          "base_price": 50.00
        }
      },
      {
        "rule_id": "ptr_002",
        "variant_id": "var_456",
        "min_qty": 50,
        "price": 42.00,
        "variant": {
          "variant_id": "var_456",
          "sku": "PROD-001-RED",
          "product_name": "Premium Headphones",
          "base_price": 50.00
        }
      }
    ],
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-11-20T14:30:00Z"
  },
  "timestamp": "2025-11-23T11:21:00Z",
  "path": "/api/v1/price-tiers/pt_123",
  "requestId": "req_price_tier_get_xyz789"
}
```

**Response Error (404 Not Found):**

```json
{
  "status": "error",
  "statusCode": 404,
  "error": {
    "code": "PRICE_TIER_NOT_FOUND",
    "message": "Price tier with ID 'pt_123' not found",
    "details": {
      "price_tier_id": "pt_123"
    }
  },
  "timestamp": "2025-11-23T11:21:00Z",
  "path": "/api/v1/price-tiers/pt_123",
  "requestId": "req_price_tier_get_xyz789"
}
```

### Crear Price Tier

```http
POST /api/v1/price-tiers
```

**Request Body:**

```json
{
  "name": "VIP",
  "slug": "vip",
  "description": "VIP customer pricing with exclusive discounts",
  "priority": 0,
  "is_active": true,
  "metadata": {
    "customer_type": "VIP",
    "discount_percentage": 15
  }
}
```

**Validaciones:**

- `name`: Requerido, string (1-100 caracteres), único por organización
- `slug`: Requerido, string (1-100 caracteres), formato slug, único por organización
- `description`: Opcional, string (max 500 caracteres)
- `priority`: Opcional, integer (default: 0) - menor número = mayor prioridad
- `is_active`: Opcional, boolean (default: true)
- `metadata`: Opcional, objeto JSON

**Response Success (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "price_tier_id": "pt_789",
    "organization_id": "org_456",
    "name": "VIP",
    "slug": "vip",
    "description": "VIP customer pricing with exclusive discounts",
    "priority": 0,
    "is_active": true,
    "metadata": {
      "customer_type": "VIP",
      "discount_percentage": 15
    },
    "rules_count": 0,
    "created_at": "2025-11-23T11:22:00Z",
    "updated_at": "2025-11-23T11:22:00Z"
  },
  "timestamp": "2025-11-23T11:22:00Z",
  "path": "/api/v1/price-tiers",
  "requestId": "req_price_tier_create_def456"
}
```

**Response Error (409 Conflict):**

```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "PRICE_TIER_SLUG_EXISTS",
    "message": "Price tier with slug 'vip' already exists in this organization",
    "details": {
      "slug": "vip",
      "existing_price_tier_id": "pt_111"
    }
  },
  "timestamp": "2025-11-23T11:22:00Z",
  "path": "/api/v1/price-tiers",
  "requestId": "req_price_tier_create_def456"
}
```

### Actualizar Price Tier

```http
PUT /api/v1/price-tiers/{priceTierId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `priceTierId` | string | ID único del price tier |

**Request Body:**

```json
{
  "name": "VIP Gold",
  "description": "VIP Gold tier with 20% discount",
  "priority": 0,
  "is_active": true,
  "metadata": {
    "customer_type": "VIP_GOLD",
    "discount_percentage": 20
  }
}
```

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "price_tier_id": "pt_789",
    "organization_id": "org_456",
    "name": "VIP Gold",
    "slug": "vip",
    "description": "VIP Gold tier with 20% discount",
    "priority": 0,
    "is_active": true,
    "metadata": {
      "customer_type": "VIP_GOLD",
      "discount_percentage": 20
    },
    "rules_count": 0,
    "created_at": "2025-11-23T11:22:00Z",
    "updated_at": "2025-11-23T11:25:00Z"
  },
  "timestamp": "2025-11-23T11:25:00Z",
  "path": "/api/v1/price-tiers/pt_789",
  "requestId": "req_price_tier_update_ghi789"
}
```

### Eliminar Price Tier

```http
DELETE /api/v1/price-tiers/{priceTierId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `priceTierId` | string | ID único del price tier |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `force` | boolean | Forzar eliminación aunque tenga reglas asociadas |

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
    "code": "PRICE_TIER_HAS_RULES",
    "message": "Cannot delete price tier with associated rules",
    "details": {
      "price_tier_id": "pt_789",
      "rules_count": 15,
      "suggestion": "Use force=true parameter to delete all rules and the price tier"
    }
  },
  "timestamp": "2025-11-23T11:26:00Z",
  "path": "/api/v1/price-tiers/pt_789",
  "requestId": "req_price_tier_delete_jkl012"
}
```

## Price Tier Rules

### Listar Reglas de un Price Tier

```http
GET /api/v1/price-tiers/{priceTierId}/rules
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `priceTierId` | string | ID único del price tier |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `first` | integer | Número de reglas a retornar (default: 20, max: 100) |
| `after` | string | Cursor para paginación |
| `variant_id` | string | Filtrar por variante específica |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "price_tier": {
      "price_tier_id": "pt_123",
      "name": "Wholesale",
      "slug": "wholesale"
    },
    "rules": {
      "edges": [
        {
          "cursor": "cnVsZV8wMDE=",
          "node": {
            "rule_id": "ptr_001",
            "price_tier_id": "pt_123",
            "variant_id": "var_456",
            "min_qty": 10,
            "price": 45.00,
            "variant": {
              "variant_id": "var_456",
              "sku": "PROD-001-RED",
              "product_name": "Premium Headphones",
              "base_price": 50.00
            },
            "created_at": "2025-01-15T10:00:00Z",
            "updated_at": "2025-11-20T14:30:00Z"
          }
        }
      ],
      "pageInfo": {
        "hasNextPage": true,
        "hasPreviousPage": false,
        "startCursor": "cnVsZV8wMDE=",
        "endCursor": "cnVsZV8wMDU=",
        "totalCount": 5
      }
    }
  },
  "timestamp": "2025-11-23T11:27:00Z",
  "path": "/api/v1/price-tiers/pt_123/rules",
  "requestId": "req_price_tier_rules_mno345"
}
```

### Crear Regla de Precio

```http
POST /api/v1/price-tiers/{priceTierId}/rules
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `priceTierId` | string | ID único del price tier |

**Request Body:**

```json
{
  "variant_id": "var_456",
  "min_qty": 100,
  "price": 40.00
}
```

**Validaciones:**

- `variant_id`: Requerido, debe existir en la organización
- `min_qty`: Requerido, integer > 0
- `price`: Requerido, decimal > 0
- No puede existir otra regla para el mismo price_tier + variant + min_qty

**Response Success (201 Created):**

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "rule_id": "ptr_003",
    "price_tier_id": "pt_123",
    "variant_id": "var_456",
    "min_qty": 100,
    "price": 40.00,
    "variant": {
      "variant_id": "var_456",
      "sku": "PROD-001-RED",
      "product_name": "Premium Headphones",
      "base_price": 50.00
    },
    "created_at": "2025-11-23T11:28:00Z",
    "updated_at": "2025-11-23T11:28:00Z"
  },
  "timestamp": "2025-11-23T11:28:00Z",
  "path": "/api/v1/price-tiers/pt_123/rules",
  "requestId": "req_price_tier_rule_create_pqr678"
}
```

**Response Error (409 Conflict):**

```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "PRICE_TIER_RULE_EXISTS",
    "message": "A rule already exists for this variant and quantity",
    "details": {
      "price_tier_id": "pt_123",
      "variant_id": "var_456",
      "min_qty": 100,
      "existing_rule_id": "ptr_002"
    }
  },
  "timestamp": "2025-11-23T11:28:00Z",
  "path": "/api/v1/price-tiers/pt_123/rules",
  "requestId": "req_price_tier_rule_create_pqr678"
}
```

**Response Error (400 Bad Request):**

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "INVALID_PRICE_TIER_RULE",
    "message": "Invalid price tier rule data",
    "details": {
      "validation_errors": [
        {
          "field": "min_qty",
          "message": "Minimum quantity must be greater than 0"
        },
        {
          "field": "price",
          "message": "Price must be greater than 0"
        }
      ]
    }
  },
  "timestamp": "2025-11-23T11:28:00Z",
  "path": "/api/v1/price-tiers/pt_123/rules",
  "requestId": "req_price_tier_rule_create_pqr678"
}
```

### Actualizar Regla de Precio

```http
PUT /api/v1/price-tiers/{priceTierId}/rules/{ruleId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `priceTierId` | string | ID único del price tier |
| `ruleId` | string | ID único de la regla |

**Request Body:**

```json
{
  "min_qty": 120,
  "price": 38.50
}
```

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "rule_id": "ptr_003",
    "price_tier_id": "pt_123",
    "variant_id": "var_456",
    "min_qty": 120,
    "price": 38.50,
    "variant": {
      "variant_id": "var_456",
      "sku": "PROD-001-RED",
      "product_name": "Premium Headphones",
      "base_price": 50.00
    },
    "created_at": "2025-11-23T11:28:00Z",
    "updated_at": "2025-11-23T11:30:00Z"
  },
  "timestamp": "2025-11-23T11:30:00Z",
  "path": "/api/v1/price-tiers/pt_123/rules/ptr_003",
  "requestId": "req_price_tier_rule_update_stu901"
}
```

### Eliminar Regla de Precio

```http
DELETE /api/v1/price-tiers/{priceTierId}/rules/{ruleId}
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `priceTierId` | string | ID único del price tier |
| `ruleId` | string | ID único de la regla |

**Response Success (204 No Content):**

```http
HTTP/1.1 204 No Content
```

### Obtener Precio por Variante y Cantidad

```http
GET /api/v1/variants/{variantId}/price
```

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `variantId` | string | ID único de la variante |

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `quantity` | integer | Cantidad para calcular precio |
| `price_tier_id` | string | Price tier a aplicar (opcional) |

**Response Success (200 OK):**

```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "variant_id": "var_456",
    "sku": "PROD-001-RED",
    "base_price": 50.00,
    "quantity": 75,
    "applied_price_tier": {
      "price_tier_id": "pt_123",
      "name": "Wholesale",
      "slug": "wholesale"
    },
    "applied_rule": {
      "rule_id": "ptr_002",
      "min_qty": 50,
      "price": 42.00
    },
    "final_price": 42.00,
    "total_amount": 3150.00,
    "savings": {
      "amount_saved": 600.00,
      "percentage_saved": 16
    },
    "next_tier": {
      "min_qty": 100,
      "price": 40.00,
      "additional_qty_needed": 25
    }
  },
  "timestamp": "2025-11-23T11:31:00Z",
  "path": "/api/v1/variants/var_456/price",
  "requestId": "req_variant_price_calc_vwx234"
}
```

## Eventos Publicados

### price_tier.created

```json
{
  "event_id": "evt_price_tier_created_abc123",
  "event_type": "price_tier.created",
  "timestamp": "2025-11-23T11:22:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "price_tier_id": "pt_789",
    "organization_id": "org_456",
    "name": "VIP",
    "slug": "vip",
    "priority": 0
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_price_tier_create_def456"
  }
}
```

### price_tier.updated

```json
{
  "event_id": "evt_price_tier_updated_def456",
  "event_type": "price_tier.updated",
  "timestamp": "2025-11-23T11:25:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "price_tier_id": "pt_789",
    "organization_id": "org_456",
    "changes": {
      "name": {
        "old": "VIP",
        "new": "VIP Gold"
      }
    }
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_price_tier_update_ghi789"
  }
}
```

### price_tier.rule.created

```json
{
  "event_id": "evt_price_tier_rule_created_ghi789",
  "event_type": "price_tier.rule.created",
  "timestamp": "2025-11-23T11:28:00Z",
  "service": "catalog-service",
  "version": "1.0",
  "payload": {
    "rule_id": "ptr_003",
    "price_tier_id": "pt_123",
    "variant_id": "var_456",
    "min_qty": 100,
    "price": 40.00
  },
  "metadata": {
    "user_id": "user_123",
    "local_id": "local_001",
    "correlation_id": "req_price_tier_rule_create_pqr678"
  }
}
```

## Permisos Requeridos

| Endpoint | Permiso |
|----------|---------|
| `GET /api/v1/price-tiers` | `catalog.price_tiers.read` |
| `GET /api/v1/price-tiers/{id}` | `catalog.price_tiers.read` |
| `GET /api/v1/price-tiers/{id}/rules` | `catalog.price_tiers.read` |
| `GET /api/v1/variants/{id}/price` | `catalog.variants.read` |
| `POST /api/v1/price-tiers` | `catalog.price_tiers.create` |
| `PUT /api/v1/price-tiers/{id}` | `catalog.price_tiers.update` |
| `DELETE /api/v1/price-tiers/{id}` | `catalog.price_tiers.delete` |
| `POST /api/v1/price-tiers/{id}/rules` | `catalog.price_tiers.update` |
| `PUT /api/v1/price-tiers/{id}/rules/{ruleId}` | `catalog.price_tiers.update` |
| `DELETE /api/v1/price-tiers/{id}/rules/{ruleId}` | `catalog.price_tiers.update` |

## Caché

- **Lista de price tiers**: TTL 10 minutos
- **Price tier individual**: TTL 15 minutos
- **Reglas de precios**: TTL 15 minutos
- **Cálculo de precios**: TTL 5 minutos
- **Invalidación**: Al crear, actualizar o eliminar price tiers o reglas

**Cache Keys:**

```
price_tiers:list:{organization_id}:{hash(query_params)}
price_tiers:detail:{price_tier_id}
price_tiers:rules:{price_tier_id}:{variant_id}
variants:price:{variant_id}:{price_tier_id}:{quantity}
```

## Rate Limiting

- **Lectura**: 100 requests/minuto por usuario
- **Escritura**: 20 requests/minuto por usuario
- **Cálculo de precios**: 200 requests/minuto por usuario

## Ejemplos de Uso

### Crear price tier con múltiples reglas

```bash
# 1. Crear price tier
curl -X POST "https://api.zenlogic.com/api/v1/price-tiers" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wholesale",
    "slug": "wholesale",
    "description": "Bulk pricing for wholesalers",
    "priority": 1
  }'

# 2. Añadir reglas
curl -X POST "https://api.zenlogic.com/api/v1/price-tiers/pt_123/rules" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_id": "var_456",
    "min_qty": 10,
    "price": 45.00
  }'
```

### Calcular precio para cantidad específica

```bash
curl -X GET "https://api.zenlogic.com/api/v1/variants/var_456/price?quantity=75&price_tier_id=pt_123" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

### Listar todas las reglas de un variant

```bash
curl -X GET "https://api.zenlogic.com/api/v1/price-tiers/pt_123/rules?variant_id=var_456" \
  -H "Authorization: Bearer {token}" \
  -H "X-Organization-ID: org_456"
```

## Lógica de Aplicación de Price Tiers

### Prioridad

Los price tiers se aplican según su campo `priority`:
- **0**: Mayor prioridad (VIP, contratos especiales)
- **1**: Prioridad media (Wholesale)
- **2+**: Prioridad baja (Retail)

### Selección de Regla

Para una variante y cantidad dada:
1. Filtrar reglas del price tier para la variante
2. Ordenar reglas por `min_qty` descendente
3. Seleccionar la primera regla donde `quantity >= min_qty`
4. Si no hay match, usar `base_price` de la variante

### Ejemplo

**Reglas para variant_id "var_456" en price tier "Wholesale":**
- min_qty: 10, price: 45.00
- min_qty: 50, price: 42.00
- min_qty: 100, price: 40.00

**Aplicación:**
- Quantity 5 → base_price (50.00)
- Quantity 15 → 45.00
- Quantity 75 → 42.00
- Quantity 150 → 40.00
