# Errores Comunes

Catálogo completo de códigos de error del Catalog Service con soluciones y ejemplos.

## Tabla de Códigos de Error

| Código HTTP | Error Code | Tipo | Entidad | Descripción |
|-------------|-----------|------|---------|-------------|
| 400 | `CAT-1001` | INVALID_PRODUCT_DATA | Product | Datos de producto inválidos |
| 400 | `CAT-1002` | INVALID_VARIANT_DATA | Variant | Datos de variante inválidos |
| 400 | `CAT-1003` | INVALID_BRAND_DATA | Brand | Datos de marca inválidos |
| 400 | `CAT-1004` | INVALID_COLLECTION_DATA | Collection | Datos de colección inválidos |
| 400 | `CAT-1005` | INVALID_TAG_DATA | Tag | Datos de tag inválidos |
| 400 | `CAT-1006` | INVALID_PRICE_TIER_DATA | Price Tier | Datos de price tier inválidos |
| 400 | `CAT-1007` | INVALID_PRICE_TIER_RULE | Price Tier | Regla de precio inválida |
| 400 | `CAT-1008` | INVALID_IMAGE_FORMAT | Image | Formato de imagen no válido |
| 400 | `CAT-1009` | CIRCULAR_COLLECTION_REFERENCE | Collection | Referencia circular en colecciones |
| 401 | `CAT-2001` | UNAUTHORIZED | General | Token inválido o expirado |
| 403 | `CAT-2002` | FORBIDDEN | General | Sin permisos para esta operación |
| 403 | `CAT-2003` | LOCAL_ACCESS_DENIED | General | Sin acceso a este local |
| 404 | `CAT-3001` | PRODUCT_NOT_FOUND | Product | Producto no encontrado |
| 404 | `CAT-3002` | VARIANT_NOT_FOUND | Variant | Variante no encontrada |
| 404 | `CAT-3003` | BRAND_NOT_FOUND | Brand | Marca no encontrada |
| 404 | `CAT-3004` | COLLECTION_NOT_FOUND | Collection | Colección no encontrada |
| 404 | `CAT-3005` | TAG_NOT_FOUND | Tag | Tag no encontrado |
| 404 | `CAT-3006` | PRICE_TIER_NOT_FOUND | Price Tier | Price tier no encontrado |
| 404 | `CAT-3007` | IMAGE_NOT_FOUND | Image | Imagen no encontrada |
| 409 | `CAT-4001` | PRODUCT_SKU_EXISTS | Product | SKU de producto duplicado |
| 409 | `CAT-4002` | VARIANT_SKU_EXISTS` | Variant | SKU de variante duplicado |
| 409 | `CAT-4003` | PRODUCT_SLUG_EXISTS | Product | Slug de producto duplicado |
| 409 | `CAT-4004` | BRAND_SLUG_EXISTS | Brand | Slug de marca duplicado |
| 409 | `CAT-4005` | COLLECTION_SLUG_EXISTS | Collection | Slug de colección duplicado |
| 409 | `CAT-4006` | TAG_SLUG_EXISTS | Tag | Slug de tag duplicado |
| 409 | `CAT-4007` | PRICE_TIER_SLUG_EXISTS | Price Tier | Slug de price tier duplicado |
| 409 | `CAT-4008` | PRODUCT_HAS_VARIANTS | Product | No se puede eliminar producto con variantes |
| 409 | `CAT-4009` | VARIANT_HAS_STOCK | Variant | No se puede eliminar variante con stock |
| 409 | `CAT-4010` | BRAND_HAS_PRODUCTS | Brand | No se puede eliminar marca con productos |
| 409 | `CAT-4011` | COLLECTION_HAS_PRODUCTS | Collection | No se puede eliminar colección con productos |
| 409 | `CAT-4012` | COLLECTION_HAS_CHILDREN | Collection | No se puede eliminar colección con sub-colecciones |
| 409 | `CAT-4013` | TAG_HAS_PRODUCTS | Tag | No se puede eliminar tag con productos |
| 409 | `CAT-4014` | PRICE_TIER_HAS_RULES | Price Tier | No se puede eliminar price tier con reglas |
| 409 | `CAT-4015` | PRICE_TIER_RULE_EXISTS | Price Tier | Ya existe regla para esta variante y cantidad |
| 413 | `CAT-5001` | IMAGE_TOO_LARGE | Image | Imagen excede tamaño máximo (5MB) |
| 422 | `CAT-5002` | IMAGE_TOO_SMALL | Image | Dimensiones de imagen muy pequeñas |
| 422 | `CAT-5003` | MAX_IMAGES_EXCEEDED | Image | Máximo de imágenes alcanzado |
| 422 | `CAT-5004` | IMAGE_UPLOAD_FAILED | Image | Error al subir imagen |
| 422 | `CAT-5005` | PRIMARY_IMAGE_REQUIRED | Image | Producto debe tener imagen principal |
| 500 | `CAT-9001` | INTERNAL_SERVER_ERROR | General | Error interno del servidor |
| 503 | `CAT-9002` | SERVICE_UNAVAILABLE | General | Servicio temporalmente no disponible |

## Errores de Validación (400)

### CAT-1001: INVALID_PRODUCT_DATA

**HTTP Status:** `400 Bad Request`

**Descripción:** Datos de producto no válidos durante creación o actualización.

**Ejemplo de Error:**
```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "CAT-1001",
    "type": "INVALID_PRODUCT_DATA",
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
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/products",
  "requestId": "req_abc123"
}
```

**Causas Comunes:**
- `base_price` menor o igual a 0
- `slug` con caracteres no permitidos
- `sku` vacío o excede 50 caracteres
- `brand_id` no existe

**Solución:**
```javascript
const validateProductData = (data) => {
  const errors = [];
  if (!data.sku || data.sku.length > 50) {
    errors.push({ field: 'sku', message: 'SKU required, max 50 chars' });
  }
  if (!data.base_price || data.base_price <= 0) {
    errors.push({ field: 'base_price', message: 'Price must be > 0' });
  }
  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push({ field: 'slug', message: 'Invalid slug format' });
  }
  return errors;
};
```

### CIRCULAR_COLLECTION_REFERENCE

**Ejemplo:**
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
  }
}
```

**Solución:** No establecer como padre a una colección descendiente.

## Errores de Conflicto (409)

### PRODUCT_SKU_EXISTS

**Ejemplo:**
```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "PRODUCT_SKU_EXISTS",
    "message": "Product with SKU 'PROD-001' already exists",
    "details": {
      "sku": "PROD-001",
      "existing_product_id": "prod_456"
    }
  }
}
```

**Solución:**
```javascript
// Generar SKU único
const generateSKU = (prefix, seq) => `${prefix}-${String(seq).padStart(6, '0')}`;
const sku = generateSKU('PROD', 123); // PROD-000123
```

### PRODUCT_HAS_VARIANTS

**Ejemplo:**
```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "PRODUCT_HAS_VARIANTS",
    "message": "Cannot delete product with existing variants",
    "details": {
      "product_id": "prod_123",
      "variants_count": 5,
      "suggestion": "Use force=true parameter to soft-delete"
    }
  }
}
```

**Solución:**
```bash
# Soft delete forzado
DELETE /api/v1/products/prod_123?force=true
```

### VARIANT_HAS_STOCK

**Ejemplo:**
```json
{
  "status": "error",
  "statusCode": 409,
  "error": {
    "code": "VARIANT_HAS_STOCK",
    "message": "Cannot delete variant with existing stock",
    "details": {
      "variant_id": "var_456",
      "stock_total": 45
    }
  }
}
```

### IMAGE_TOO_LARGE

**Ejemplo:**
```json
{
  "status": "error",
  "statusCode": 413,
  "error": {
    "code": "IMAGE_TOO_LARGE",
    "message": "Image file exceeds maximum size limit",
    "details": {
      "file_size_bytes": 6291456,
      "max_size_mb": 5
    }
  }
}
```

**Solución:**
```javascript
const resizeImage = async (file, maxSizeMB = 5) => {
  if (file.size > maxSizeMB * 1024 * 1024) {
    return await compressImage(file, { quality: 0.8, maxWidth: 2000 });
  }
  return file;
};
```

## Errores de gRPC

### Circuit Breaker Abierto

**Error:** `Circuit Breaker is OPEN`

**Causa:** Múltiples fallos consecutivos en llamadas gRPC

**Solución:**
1. Verificar que Auth Service esté corriendo
2. Revisar logs de Auth Service
3. El sistema automáticamente usa fallback a REST

### Timeout de gRPC

**Error:** `grpc.StatusCode.DEADLINE_EXCEEDED`

**Solución:**
- Incrementar timeout: `AUTH_GRPC_TIMEOUT=10`
- Verificar latencia de red

## Errores de Cache

### Cache Desincronizado

**Síntoma:** Datos viejos después de actualizar

**Solución:**
```bash
# Limpiar cache específico
redis-cli DEL "product:org-123:product-456"

# Limpiar cache de organización
redis-cli KEYS "*:org-123:*" | xargs redis-cli DEL
```

## Errores de RabbitMQ

### Eventos No Se Publican

**Debugging:**
```bash
rabbitmqadmin list exchanges
rabbitmqadmin list bindings
rabbitmqadmin get queue=catalog_events_queue
```

**Solución:**
- Verificar conexión a RabbitMQ
- Verificar que exchange `catalog_events` exista

## Mejores Prácticas

### 1. Validación del Cliente

```javascript
const validateBeforeSubmit = (data) => {
  const errors = validateProductData(data);
  if (errors.length > 0) {
    showErrors(errors);
    return false;
  }
  return true;
};
```

### 2. Manejo con Retry

```javascript
const apiCall = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const error = await response.json();
        // No reintentar errores 4xx (excepto 429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw error;
        }
        // Reintentar 5xx y 429
        if (i < maxRetries - 1) {
          await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
          continue;
        }
        throw error;
      }
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
};
```

### 3. Mensajes de Error Amigables

```javascript
const errorMessages = {
  'PRODUCT_SKU_EXISTS': 'Este SKU ya está en uso',
  'INVALID_PRODUCT_DATA': 'Datos inválidos, revisa el formulario',
  'PRODUCT_NOT_FOUND': 'Producto no encontrado',
  'UNAUTHORIZED': 'Sesión expirada, inicia sesión nuevamente'
};

const handleError = (error) => {
  const message = errorMessages[error.error?.code] || 'Error inesperado';
  showNotification({ type: 'error', message });
};
```

## Debugging

### Logs Útiles

```python
# Habilitar logs DEBUG
LOG_LEVEL=DEBUG

# Logs estructurados
logger.info("product_created", product_id=product.id, org_id=org_id)
```

### Health Checks

```bash
curl http://localhost:8002/health
curl http://localhost:8002/health/ready
```

## Próximos Pasos

- [Testing](./testing)
- [Configuración](./configuracion)
- [API Products](./api-products)
- [API Variants](./api-variants)
