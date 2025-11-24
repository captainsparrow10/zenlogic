---
sidebar_position: 5
---

# API: Cart

Endpoints para gestión de carrito de compras.

## Base URL

```
POST   /api/v1/cart
GET    /api/v1/cart
POST   /api/v1/cart/items
DELETE /api/v1/cart/items/{itemId}
PATCH  /api/v1/cart/items/{itemId}
DELETE /api/v1/cart
POST   /api/v1/cart/checkout
POST   /api/v1/cart/coupons
DELETE /api/v1/cart/coupons/{couponCode}
```

## Crear o Obtener Carrito

```http
POST /api/v1/cart
```

**Request Body:**

```json
{
  "session_id": "sess_abc123"
}
```

**Response:** `201 Created` o `200 OK` si ya existe

```json
{
  "status": "success",
  "data": {
    "cart_id": "cart_123",
    "organization_id": "org_123",
    "customer_id": null,
    "session_id": "sess_abc123",
    "status": "active",
    "items": [],
    "totals": {
      "subtotal": 0.00,
      "shipping_cost": 0.00,
      "tax_amount": 0.00,
      "discount_amount": 0.00,
      "total": 0.00,
      "currency": "USD"
    },
    "items_count": 0,
    "expires_at": "2025-12-23T15:00:00Z",
    "created_at": "2025-11-23T15:00:00Z"
  }
}
```

## Obtener Carrito Actual

```http
GET /api/v1/cart
```

**Headers:**
- `X-Session-ID`: Session ID del carrito (para usuarios guest)
- `Authorization`: Bearer token (para usuarios autenticados)

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "cart_id": "cart_123",
    "customer_id": "cust_456",
    "status": "active",
    "items": [
      {
        "cart_item_id": "item_001",
        "variant_id": "var_789",
        "sku": "PROD-001-RED-M",
        "product_name": "Camiseta Roja M",
        "product_image": "https://cdn.example.com/products/...",
        "quantity": 2,
        "unit_price": 25.00,
        "subtotal": 50.00,
        "available_stock": 10,
        "in_stock": true,
        "added_at": "2025-11-23T14:30:00Z"
      },
      {
        "cart_item_id": "item_002",
        "variant_id": "var_456",
        "sku": "PROD-002-BLUE-L",
        "product_name": "Pantalón Azul L",
        "quantity": 1,
        "unit_price": 50.00,
        "subtotal": 50.00,
        "available_stock": 5,
        "in_stock": true,
        "added_at": "2025-11-23T14:45:00Z"
      }
    ],
    "totals": {
      "subtotal": 100.00,
      "shipping_cost": 0.00,
      "tax_amount": 7.00,
      "discount_amount": 0.00,
      "total": 107.00,
      "currency": "USD"
    },
    "applied_coupons": [],
    "items_count": 3,
    "expires_at": "2025-12-23T15:00:00Z",
    "last_activity_at": "2025-11-23T14:45:00Z",
    "created_at": "2025-11-23T14:30:00Z",
    "updated_at": "2025-11-23T14:45:00Z"
  }
}
```

## Agregar Producto al Carrito

```http
POST /api/v1/cart/items
```

**Request Body:**

```json
{
  "variant_id": "var_789",
  "quantity": 2
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "cart_item_id": "item_001",
    "variant_id": "var_789",
    "sku": "PROD-001-RED-M",
    "product_name": "Camiseta Roja M",
    "quantity": 2,
    "unit_price": 25.00,
    "subtotal": 50.00,
    "added_at": "2025-11-23T14:30:00Z"
  },
  "meta": {
    "cart_totals": {
      "subtotal": 100.00,
      "total": 107.00,
      "items_count": 3
    }
  }
}
```

**Validaciones:**
- Producto debe existir y estar activo
- Stock disponible suficiente
- Cantidad debe ser mayor a 0
- No exceder límite de items (100)

## Actualizar Cantidad de Item

```http
PATCH /api/v1/cart/items/{itemId}
```

**Request Body:**

```json
{
  "quantity": 3
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "cart_item_id": "item_001",
    "quantity": 3,
    "unit_price": 25.00,
    "subtotal": 75.00,
    "updated_at": "2025-11-23T15:00:00Z"
  },
  "meta": {
    "cart_totals": {
      "subtotal": 125.00,
      "total": 132.00,
      "items_count": 4
    }
  }
}
```

**Validación de Stock:**

Si no hay stock suficiente:

```json
{
  "error": {
    "code": "ORD-2006",
    "type": "INSUFFICIENT_STOCK",
    "message": "Stock insuficiente para la cantidad solicitada",
    "details": {
      "variant_id": "var_789",
      "requested": 10,
      "available": 5,
      "suggestion": "Reduce la cantidad a 5 unidades"
    }
  }
}
```

## Remover Item del Carrito

```http
DELETE /api/v1/cart/items/{itemId}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Item removido del carrito",
  "data": {
    "cart_id": "cart_123",
    "items_count": 2,
    "totals": {
      "subtotal": 50.00,
      "total": 57.00
    }
  }
}
```

## Vaciar Carrito

```http
DELETE /api/v1/cart
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Carrito vaciado exitosamente",
  "data": {
    "cart_id": "cart_123",
    "items_count": 0,
    "totals": {
      "total": 0.00
    }
  }
}
```

## Aplicar Cupón de Descuento

```http
POST /api/v1/cart/coupons
```

**Request Body:**

```json
{
  "coupon_code": "SAVE20"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "coupon": {
      "coupon_code": "SAVE20",
      "discount_type": "percentage",
      "discount_value": 20,
      "discount_amount": 20.00,
      "applied_at": "2025-11-23T15:00:00Z"
    },
    "cart_totals": {
      "subtotal": 100.00,
      "shipping_cost": 0.00,
      "tax_amount": 5.60,
      "discount_amount": 20.00,
      "total": 85.60,
      "currency": "USD"
    }
  }
}
```

**Tipos de Cupón:**
- `percentage` - Porcentaje de descuento (ej: 20%)
- `fixed_amount` - Monto fijo (ej: $10)
- `free_shipping` - Envío gratis
- `buy_x_get_y` - Compra X lleva Y gratis

**Validaciones de Cupón:**

```json
{
  "error": {
    "code": "ORD-7005",
    "type": "COUPON_INVALID",
    "details": {
      "coupon_code": "SAVE20",
      "reason": "expired",
      "expired_at": "2025-11-20T00:00:00Z"
    }
  }
}
```

## Remover Cupón

```http
DELETE /api/v1/cart/coupons/{couponCode}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Cupón removido",
  "data": {
    "cart_totals": {
      "subtotal": 100.00,
      "discount_amount": 0.00,
      "total": 107.00
    }
  }
}
```

## Checkout (Proceder a Pago)

```http
POST /api/v1/cart/checkout
```

**Request Body:**

```json
{
  "shipping_address": {
    "recipient_name": "Juan Pérez",
    "phone": "+507 6000-0000",
    "address_line1": "Calle 50, Edificio Delta",
    "city": "Ciudad de Panamá",
    "country": "PA"
  },
  "billing_address": {
    "same_as_shipping": true
  },
  "shipping_method": "standard"
}
```

**Response:** `201 Created`

Redirige a la creación de orden (ver [API: Orders](./api-orders))

```json
{
  "status": "success",
  "data": {
    "order_id": "order_789",
    "order_number": "ORD-2025-0001",
    "status": "pending",
    "total_amount": 107.00,
    "payment_required": true,
    "reservation": {
      "expires_at": "2025-11-23T15:15:00Z"
    }
  }
}
```

## Validar Stock antes de Checkout

```http
POST /api/v1/cart/validate
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "valid": true,
    "issues": [],
    "cart_totals": {
      "total": 107.00
    }
  }
}
```

**Si hay problemas:**

```json
{
  "status": "success",
  "data": {
    "valid": false,
    "issues": [
      {
        "type": "insufficient_stock",
        "cart_item_id": "item_001",
        "variant_id": "var_789",
        "message": "Solo quedan 3 unidades disponibles",
        "requested": 5,
        "available": 3
      },
      {
        "type": "product_unavailable",
        "cart_item_id": "item_002",
        "variant_id": "var_456",
        "message": "Producto ya no está disponible",
        "reason": "discontinued"
      },
      {
        "type": "price_changed",
        "cart_item_id": "item_003",
        "variant_id": "var_123",
        "message": "El precio cambió",
        "old_price": 25.00,
        "new_price": 27.00
      }
    ]
  }
}
```

## Recuperar Carrito Abandonado

```http
GET /api/v1/cart/abandoned/{cartId}/recover
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "cart_id": "cart_123",
    "status": "active",
    "items": [...],
    "totals": {...},
    "recovered_at": "2025-11-24T10:00:00Z",
    "abandoned_duration_hours": 20
  }
}
```

## Merge Carritos (Guest → Autenticado)

```http
POST /api/v1/cart/merge
```

Cuando un usuario guest se autentica, combina su carrito anónimo con su carrito de usuario.

**Request Body:**

```json
{
  "guest_cart_id": "cart_guest_123",
  "user_cart_id": "cart_user_456"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "cart_id": "cart_user_456",
    "items": [...],
    "items_added_from_guest": 2,
    "items_count": 5,
    "totals": {...}
  }
}
```

## Eventos Publicados

### cart.item_added

```json
{
  "event": "cart.item_added",
  "data": {
    "cart_id": "cart_123",
    "variant_id": "var_789",
    "quantity": 2
  }
}
```

### cart.abandoned

```json
{
  "event": "cart.abandoned",
  "data": {
    "cart_id": "cart_123",
    "customer_id": "cust_456",
    "items_count": 3,
    "total_value": 107.00,
    "abandoned_at": "2025-11-24T00:00:00Z",
    "recovery_url": "https://store.com/cart/recover/cart_123"
  }
}
```

## Próximos Pasos

- [API: Orders](./api-orders)
- [Eventos Publicados](./eventos-publicados)
- [Errores Comunes](./errores-comunes)
