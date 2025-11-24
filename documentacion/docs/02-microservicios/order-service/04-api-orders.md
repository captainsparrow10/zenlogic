---
sidebar_position: 4
---

# API: Orders

Endpoints para gestión completa de órdenes de venta.

## Base URL

```
POST   /api/v1/orders
GET    /api/v1/orders
GET    /api/v1/orders/{orderId}
PATCH  /api/v1/orders/{orderId}
POST   /api/v1/orders/{orderId}/cancel
POST   /api/v1/orders/from-cart
GET    /api/v1/orders/{orderId}/timeline
POST   /api/v1/orders/{orderId}/payments
```

## Crear Orden desde Carrito

```http
POST /api/v1/orders/from-cart
```

**Request Body:**

```json
{
  "cart_id": "cart_123",
  "shipping_address": {
    "recipient_name": "Juan Pérez",
    "phone": "+507 6000-0000",
    "address_line1": "Calle 50, Edificio Delta",
    "address_line2": "Piso 10, Oficina 1001",
    "city": "Ciudad de Panamá",
    "state": "Panamá",
    "postal_code": "00000",
    "country": "PA"
  },
  "billing_address": {
    "same_as_shipping": true
  },
  "shipping_method": "standard",
  "payment_method": "stripe",
  "notes": "Favor llamar antes de entregar"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "order_id": "order_789",
    "order_number": "ORD-2025-0001",
    "status": "pending",
    "customer": {
      "customer_id": "cust_456",
      "email": "juan@example.com",
      "name": "Juan Pérez"
    },
    "items": [
      {
        "order_item_id": "item_001",
        "variant_id": "var_789",
        "sku": "PROD-001-RED-M",
        "product_name": "Camiseta Roja M",
        "quantity": 2,
        "unit_price": 25.00,
        "subtotal": 50.00,
        "tax_amount": 3.50,
        "total": 53.50
      }
    ],
    "totals": {
      "subtotal": 100.00,
      "shipping_cost": 15.00,
      "tax_amount": 8.05,
      "discount_amount": 0.00,
      "total_amount": 123.05,
      "currency": "USD"
    },
    "shipping_address": {
      "recipient_name": "Juan Pérez",
      "address_line1": "Calle 50, Edificio Delta",
      "city": "Ciudad de Panamá",
      "country": "PA"
    },
    "reservation": {
      "reservation_id": "res_123",
      "expires_at": "2025-11-23T15:15:00Z",
      "ttl_minutes": 15
    },
    "payment_required": true,
    "placed_at": "2025-11-23T15:00:00Z",
    "created_at": "2025-11-23T15:00:00Z"
  },
  "timestamp": "2025-11-23T15:00:00Z"
}
```

## Listar Órdenes

```http
GET /api/v1/orders?status=confirmed&limit=20
```

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `status` | string | Filtrar por estado |
| `customer_id` | uuid | Filtrar por cliente |
| `date_from` | date | Desde fecha |
| `date_to` | date | Hasta fecha |
| `order_type` | string | Tipo de orden (online, pos, b2b) |
| `limit` | int | Resultados por página (default: 20, max: 100) |
| `cursor` | string | Cursor para paginación |

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "edges": [
      {
        "cursor": "b3JkZXJfNzg5",
        "node": {
          "order_id": "order_789",
          "order_number": "ORD-2025-0001",
          "status": "confirmed",
          "customer": {
            "customer_id": "cust_456",
            "name": "Juan Pérez",
            "email": "juan@example.com"
          },
          "total_amount": 123.05,
          "currency": "USD",
          "items_count": 3,
          "placed_at": "2025-11-23T15:00:00Z",
          "confirmed_at": "2025-11-23T15:05:00Z"
        }
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "hasPreviousPage": false,
      "startCursor": "b3JkZXJfNzg5",
      "endCursor": "b3JkZXJfNzg4",
      "totalCount": 150
    }
  }
}
```

## Obtener Orden por ID

```http
GET /api/v1/orders/{orderId}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "order_id": "order_789",
    "order_number": "ORD-2025-0001",
    "status": "shipped",
    "order_type": "online",
    "customer": {
      "customer_id": "cust_456",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "+507 6000-0000"
    },
    "items": [
      {
        "order_item_id": "item_001",
        "variant_id": "var_789",
        "sku": "PROD-001-RED-M",
        "product_name": "Camiseta Roja M",
        "quantity": 2,
        "unit_price": 25.00,
        "subtotal": 50.00,
        "tax_amount": 3.50,
        "discount_amount": 0.00,
        "total": 53.50,
        "fulfillment_status": "shipped"
      }
    ],
    "totals": {
      "subtotal": 100.00,
      "shipping_cost": 15.00,
      "tax_amount": 8.05,
      "discount_amount": 0.00,
      "total_amount": 123.05,
      "currency": "USD"
    },
    "shipping_address": {
      "recipient_name": "Juan Pérez",
      "phone": "+507 6000-0000",
      "address_line1": "Calle 50, Edificio Delta",
      "address_line2": "Piso 10",
      "city": "Ciudad de Panamá",
      "state": "Panamá",
      "postal_code": "00000",
      "country": "PA"
    },
    "billing_address": {
      "same_as_shipping": true
    },
    "payment": {
      "payment_id": "pay_123",
      "status": "succeeded",
      "payment_method": "stripe",
      "card_brand": "visa",
      "card_last4": "4242",
      "amount": 123.05,
      "currency": "USD",
      "paid_at": "2025-11-23T15:05:00Z"
    },
    "shipment": {
      "shipment_id": "ship_456",
      "status": "in_transit",
      "carrier": "FedEx",
      "carrier_service": "Ground",
      "tracking_number": "123456789",
      "tracking_url": "https://fedex.com/track/123456789",
      "estimated_delivery_date": "2025-11-26",
      "shipped_at": "2025-11-24T10:00:00Z"
    },
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2025-11-23T15:00:00Z",
        "description": "Orden creada"
      },
      {
        "status": "confirmed",
        "timestamp": "2025-11-23T15:05:00Z",
        "description": "Pago confirmado"
      },
      {
        "status": "processing",
        "timestamp": "2025-11-23T16:00:00Z",
        "description": "Fulfillment iniciado"
      },
      {
        "status": "shipped",
        "timestamp": "2025-11-24T10:00:00Z",
        "description": "Orden enviada"
      }
    ],
    "metadata": {
      "source": "web",
      "user_agent": "Mozilla/5.0...",
      "ip_address": "192.168.1.1"
    },
    "placed_at": "2025-11-23T15:00:00Z",
    "confirmed_at": "2025-11-23T15:05:00Z",
    "created_at": "2025-11-23T15:00:00Z",
    "updated_at": "2025-11-24T10:00:00Z"
  }
}
```

## Actualizar Orden

```http
PATCH /api/v1/orders/{orderId}
```

**Request Body:**

```json
{
  "shipping_address": {
    "address_line1": "Nueva dirección"
  },
  "notes": "Actualización de notas"
}
```

**Validaciones:**
- Solo se pueden actualizar órdenes en estado `pending` o `confirmed`
- Ciertos campos no pueden modificarse después de confirmación

**Response:** `200 OK`

## Cancelar Orden

```http
POST /api/v1/orders/{orderId}/cancel
```

**Request Body:**

```json
{
  "cancellation_reason": "customer_request",
  "notes": "Cliente solicitó cancelación por error en talla",
  "refund_payment": true
}
```

**Cancellation Reasons:**
- `customer_request` - Solicitud del cliente
- `payment_failed` - Pago fallido
- `out_of_stock` - Sin stock disponible
- `fraud_suspected` - Sospecha de fraude
- `duplicate_order` - Orden duplicada
- `other` - Otro motivo

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "order_id": "order_789",
    "status": "cancelled",
    "cancellation_reason": "customer_request",
    "cancelled_at": "2025-11-23T16:00:00Z",
    "refund": {
      "refund_id": "ref_123",
      "amount": 123.05,
      "status": "processing",
      "estimated_completion": "2025-11-25"
    },
    "stock_released": true
  }
}
```

**Validaciones:**
- Estado actual debe permitir cancelación
- Ventana de cancelación no debe haber expirado
- Requiere aprobación si ya está en fulfillment

## Obtener Timeline de Orden

```http
GET /api/v1/orders/{orderId}/timeline
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "order_id": "order_789",
    "order_number": "ORD-2025-0001",
    "current_status": "shipped",
    "events": [
      {
        "event_id": "evt_001",
        "status": "cart",
        "timestamp": "2025-11-23T14:30:00Z",
        "description": "Carrito creado",
        "metadata": {
          "cart_id": "cart_123"
        }
      },
      {
        "event_id": "evt_002",
        "status": "pending",
        "timestamp": "2025-11-23T15:00:00Z",
        "description": "Orden creada desde carrito",
        "user": {
          "user_id": "cust_456",
          "name": "Juan Pérez"
        }
      },
      {
        "event_id": "evt_003",
        "status": "payment_pending",
        "timestamp": "2025-11-23T15:02:00Z",
        "description": "Procesando pago",
        "metadata": {
          "payment_method": "stripe"
        }
      },
      {
        "event_id": "evt_004",
        "status": "confirmed",
        "timestamp": "2025-11-23T15:05:00Z",
        "description": "Pago confirmado exitosamente",
        "metadata": {
          "payment_id": "pay_123",
          "amount": 123.05
        }
      },
      {
        "event_id": "evt_005",
        "status": "processing",
        "timestamp": "2025-11-23T16:00:00Z",
        "description": "Fulfillment iniciado en bodega principal",
        "metadata": {
          "warehouse_id": "wh_101",
          "warehouse_name": "Bodega Principal"
        }
      },
      {
        "event_id": "evt_006",
        "status": "ready_to_ship",
        "timestamp": "2025-11-23T17:30:00Z",
        "description": "Picking y packing completados",
        "user": {
          "user_id": "picker_123",
          "name": "Roberto García"
        }
      },
      {
        "event_id": "evt_007",
        "status": "shipped",
        "timestamp": "2025-11-24T10:00:00Z",
        "description": "Orden enviada con FedEx",
        "metadata": {
          "carrier": "FedEx",
          "tracking_number": "123456789",
          "shipment_id": "ship_456"
        }
      }
    ],
    "total_events": 7,
    "duration_hours": 19.5
  }
}
```

## Procesar Pago

```http
POST /api/v1/orders/{orderId}/payments
```

**Request Body:**

```json
{
  "payment_method": "stripe",
  "payment_method_id": "pm_1234567890",
  "amount": 123.05,
  "currency": "USD",
  "save_payment_method": true
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "payment_id": "pay_123",
    "order_id": "order_789",
    "status": "succeeded",
    "payment_method": "stripe",
    "amount": 123.05,
    "currency": "USD",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2026
    },
    "gateway_payment_id": "pi_1234567890",
    "paid_at": "2025-11-23T15:05:00Z",
    "receipt_url": "https://stripe.com/receipts/..."
  }
}
```

## Errores Comunes

### ORD-1001: INSUFFICIENT_STOCK

Stock insuficiente para completar la orden.

```json
{
  "error": {
    "code": "ORD-1001",
    "type": "INSUFFICIENT_STOCK",
    "details": {
      "out_of_stock_items": [
        {"variant_id": "var_789", "requested": 5, "available": 2}
      ]
    }
  }
}
```

### ORD-1003: INVALID_ORDER_STATE

Acción no permitida en el estado actual.

```json
{
  "error": {
    "code": "ORD-1003",
    "message": "No se puede cancelar una orden ya enviada",
    "details": {
      "current_state": "shipped",
      "allowed_states": ["pending", "confirmed"]
    }
  }
}
```

## Próximos Pasos

- [API: Cart](./api-cart)
- [API: Payments](./api-payments)
- [State Machine](./state-machine)
- [Errores Comunes](./errores-comunes)
