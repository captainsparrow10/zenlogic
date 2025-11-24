---
sidebar_position: 14
---

# Errores Comunes

Catálogo completo de códigos de error del Order Service con causas, soluciones y ejemplos de respuesta.

## Formato de Respuesta de Error

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "ORD-1001",
    "type": "INSUFFICIENT_STOCK",
    "message": "Stock insuficiente para completar la orden",
    "details": {
      "variant_id": "var_789",
      "requested": 5,
      "available": 2
    }
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/orders",
  "requestId": "req_abc123"
}
```

## Errores de Orden (ORD-1xxx)

### ORD-1001: INSUFFICIENT_STOCK

**HTTP Status:** `400 Bad Request`

**Descripción:** No hay stock suficiente para uno o más productos en la orden.

```json
{
  "error": {
    "code": "ORD-1001",
    "type": "INSUFFICIENT_STOCK",
    "details": {
      "out_of_stock_items": [
        {
          "variant_id": "var_789",
          "requested": 5,
          "available": 2,
          "warehouse_id": "wh_101"
        }
      ]
    }
  }
}
```

**Solución:** Reducir cantidad o esperar reabastecimiento.

### ORD-1002: ORDER_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** La orden especificada no existe.

### ORD-1003: INVALID_ORDER_STATE

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** No se puede realizar la acción en el estado actual de la orden.

```json
{
  "error": {
    "code": "ORD-1003",
    "type": "INVALID_ORDER_STATE",
    "message": "No se puede cancelar una orden ya enviada",
    "details": {
      "current_state": "shipped",
      "requested_action": "cancel",
      "allowed_states": ["pending", "confirmed"]
    }
  }
}
```

### ORD-1004: ORDER_MINIMUM_NOT_MET

**HTTP Status:** `400 Bad Request`

**Descripción:** El total de la orden no alcanza el mínimo requerido.

```json
{
  "error": {
    "code": "ORD-1004",
    "details": {
      "order_total": 8.50,
      "minimum_required": 10.00,
      "missing_amount": 1.50
    }
  }
}
```

### ORD-1005: ORDER_ALREADY_CANCELLED

**HTTP Status:** `409 Conflict`

**Descripción:** La orden ya fue cancelada previamente.

### ORD-1006: CANCELLATION_WINDOW_EXPIRED

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** Expiró la ventana de tiempo para cancelar la orden.

```json
{
  "error": {
    "code": "ORD-1006",
    "details": {
      "confirmed_at": "2025-11-23T15:00:00Z",
      "cancellation_deadline": "2025-11-23T17:00:00Z",
      "current_time": "2025-11-23T18:00:00Z",
      "window_hours": 2
    }
  }
}
```

### ORD-1007: DUPLICATE_ORDER

**HTTP Status:** `409 Conflict`

**Descripción:** Ya existe una orden con los mismos datos (posible duplicación).

## Errores de Carrito (ORD-2xxx)

### ORD-2001: CART_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** El carrito especificado no existe.

### ORD-2002: CART_EXPIRED

**HTTP Status:** `410 Gone`

**Descripción:** El carrito expiró y fue eliminado.

```json
{
  "error": {
    "code": "ORD-2002",
    "type": "CART_EXPIRED",
    "details": {
      "cart_id": "cart_123",
      "expired_at": "2025-10-23T00:00:00Z",
      "expiry_days": 30
    }
  }
}
```

### ORD-2003: CART_ALREADY_CONVERTED

**HTTP Status:** `409 Conflict`

**Descripción:** El carrito ya fue convertido a orden.

```json
{
  "error": {
    "code": "ORD-2003",
    "details": {
      "cart_id": "cart_123",
      "order_id": "order_456",
      "converted_at": "2025-11-23T15:00:00Z"
    }
  }
}
```

### ORD-2004: CART_EMPTY

**HTTP Status:** `400 Bad Request`

**Descripción:** No se puede hacer checkout de un carrito vacío.

### ORD-2005: MAX_CART_ITEMS_EXCEEDED

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** Se excedió el número máximo de items permitidos en el carrito.

```json
{
  "error": {
    "code": "ORD-2005",
    "details": {
      "current_items": 101,
      "max_allowed": 100
    }
  }
}
```

### ORD-2006: PRODUCT_NO_LONGER_AVAILABLE

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** Un producto en el carrito ya no está disponible.

```json
{
  "error": {
    "code": "ORD-2006",
    "details": {
      "unavailable_items": [
        {
          "variant_id": "var_789",
          "reason": "discontinued"
        }
      ]
    }
  }
}
```

## Errores de Pago (ORD-3xxx)

### ORD-3001: PAYMENT_FAILED

**HTTP Status:** `402 Payment Required`

**Descripción:** El pago fue rechazado por el gateway o banco.

```json
{
  "error": {
    "code": "ORD-3001",
    "type": "PAYMENT_FAILED",
    "message": "Su tarjeta fue rechazada",
    "details": {
      "gateway_code": "card_declined",
      "gateway_message": "Insufficient funds",
      "retries_remaining": 2
    }
  }
}
```

### ORD-3002: PAYMENT_METHOD_INVALID

**HTTP Status:** `400 Bad Request`

**Descripción:** Método de pago inválido o no soportado.

### ORD-3003: PAYMENT_AMOUNT_MISMATCH

**HTTP Status:** `400 Bad Request`

**Descripción:** El monto del pago no coincide con el total de la orden.

```json
{
  "error": {
    "code": "ORD-3003",
    "details": {
      "order_total": 125.50,
      "payment_amount": 120.00,
      "difference": 5.50
    }
  }
}
```

### ORD-3004: PAYMENT_ALREADY_PROCESSED

**HTTP Status:** `409 Conflict`

**Descripción:** La orden ya tiene un pago exitoso.

### ORD-3005: PAYMENT_GATEWAY_ERROR

**HTTP Status:** `503 Service Unavailable`

**Descripción:** Error en el gateway de pago.

```json
{
  "error": {
    "code": "ORD-3005",
    "type": "PAYMENT_GATEWAY_ERROR",
    "message": "El servicio de pagos está temporalmente no disponible",
    "details": {
      "gateway": "stripe",
      "error": "Connection timeout",
      "retry_after": 60
    }
  }
}
```

### ORD-3006: REFUND_FAILED

**HTTP Status:** `500 Internal Server Error`

**Descripción:** Falló el procesamiento del reembolso.

### ORD-3007: REFUND_AMOUNT_EXCEEDS_PAYMENT

**HTTP Status:** `400 Bad Request`

**Descripción:** El monto del reembolso excede el pago original.

## Errores de Envío (ORD-4xxx)

### ORD-4001: SHIPMENT_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** El envío especificado no existe.

### ORD-4002: INVALID_SHIPPING_ADDRESS

**HTTP Status:** `400 Bad Request`

**Descripción:** Dirección de envío inválida o incompleta.

```json
{
  "error": {
    "code": "ORD-4002",
    "details": {
      "missing_fields": ["postal_code", "country"],
      "invalid_fields": ["phone"]
    }
  }
}
```

### ORD-4003: SHIPPING_NOT_AVAILABLE

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** No hay métodos de envío disponibles para la dirección.

```json
{
  "error": {
    "code": "ORD-4003",
    "message": "No enviamos a esta ubicación",
    "details": {
      "country": "North Korea",
      "reason": "restricted_region"
    }
  }
}
```

### ORD-4004: CARRIER_API_ERROR

**HTTP Status:** `503 Service Unavailable`

**Descripción:** Error al comunicarse con el carrier.

### ORD-4005: LABEL_CREATION_FAILED

**HTTP Status:** `500 Internal Server Error`

**Descripción:** Falló la creación de la etiqueta de envío.

### ORD-4006: TRACKING_NUMBER_INVALID

**HTTP Status:** `400 Bad Request`

**Descripción:** Número de tracking inválido.

## Errores de Devolución (ORD-5xxx)

### ORD-5001: RETURN_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** La devolución especificada no existe.

### ORD-5002: RETURN_WINDOW_EXPIRED

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** Expiró la ventana para solicitar devolución.

```json
{
  "error": {
    "code": "ORD-5002",
    "details": {
      "delivered_at": "2025-10-23T00:00:00Z",
      "return_deadline": "2025-11-22T00:00:00Z",
      "current_date": "2025-11-25",
      "window_days": 30
    }
  }
}
```

### ORD-5003: RETURN_ALREADY_REQUESTED

**HTTP Status:** `409 Conflict`

**Descripción:** Ya existe una solicitud de devolución para esta orden.

### ORD-5004: ITEM_NOT_ELIGIBLE_FOR_RETURN

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** El producto no es elegible para devolución.

```json
{
  "error": {
    "code": "ORD-5004",
    "details": {
      "variant_id": "var_digital_123",
      "reason": "digital_product_final_sale"
    }
  }
}
```

### ORD-5005: RETURN_APPROVAL_REQUIRED

**HTTP Status:** `403 Forbidden`

**Descripción:** La devolución requiere aprobación de gerencia.

## Errores de Fulfillment (ORD-6xxx)

### ORD-6001: WAREHOUSE_NOT_ASSIGNED

**HTTP Status:** `400 Bad Request`

**Descripción:** No se ha asignado bodega a la orden.

### ORD-6002: PICKER_NOT_AVAILABLE

**HTTP Status:** `503 Service Unavailable`

**Descripción:** No hay personal disponible para picking.

### ORD-6003: ITEM_LOCATION_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** No se encontró la ubicación del producto en la bodega.

### ORD-6004: PICKING_ALREADY_COMPLETED

**HTTP Status:** `409 Conflict`

**Descripción:** El picking ya fue completado para esta orden.

### ORD-6005: PACKING_VALIDATION_FAILED

**HTTP Status:** `400 Bad Request`

**Descripción:** Validación de empaque falló.

```json
{
  "error": {
    "code": "ORD-6005",
    "details": {
      "expected_items": 3,
      "scanned_items": 2,
      "missing_items": ["var_789"]
    }
  }
}
```

## Errores de Validación (ORD-7xxx)

### ORD-7001: INVALID_CUSTOMER

**HTTP Status:** `400 Bad Request`

**Descripción:** Cliente inválido o no existe.

### ORD-7002: INVALID_VARIANT

**HTTP Status:** `400 Bad Request`

**Descripción:** Variante de producto inválida.

### ORD-7003: INVALID_QUANTITY

**HTTP Status:** `400 Bad Request`

**Descripción:** Cantidad inválida (cero, negativa, o excede máximo).

```json
{
  "error": {
    "code": "ORD-7003",
    "details": {
      "provided_quantity": 0,
      "min_quantity": 1,
      "max_quantity": 100
    }
  }
}
```

### ORD-7004: INVALID_CURRENCY

**HTTP Status:** `400 Bad Request`

**Descripción:** Moneda no soportada.

### ORD-7005: COUPON_INVALID

**HTTP Status:** `400 Bad Request`

**Descripción:** Cupón de descuento inválido o expirado.

```json
{
  "error": {
    "code": "ORD-7005",
    "details": {
      "coupon_code": "SAVE20",
      "reason": "expired",
      "expired_at": "2025-11-20T00:00:00Z"
    }
  }
}
```

### ORD-7006: ORGANIZATION_MISMATCH

**HTTP Status:** `403 Forbidden`

**Descripción:** Recursos pertenecen a diferentes organizaciones.

## Errores de Permisos (ORD-8xxx)

### ORD-8001: INSUFFICIENT_PERMISSIONS

**HTTP Status:** `403 Forbidden`

**Descripción:** Usuario no tiene permisos para la acción.

### ORD-8002: ORDER_ACCESS_DENIED

**HTTP Status:** `403 Forbidden`

**Descripción:** No tiene acceso a esta orden.

```json
{
  "error": {
    "code": "ORD-8002",
    "message": "No tiene acceso a esta orden",
    "details": {
      "order_id": "order_456",
      "owner_id": "cust_789",
      "requesting_user": "user_999"
    }
  }
}
```

### ORD-8003: ACTION_REQUIRES_APPROVAL

**HTTP Status:** `403 Forbidden`

**Descripción:** La acción requiere aprobación de un superior.

## Errores de Sistema (ORD-9xxx)

### ORD-9001: DATABASE_ERROR

**HTTP Status:** `500 Internal Server Error`

**Descripción:** Error interno de base de datos.

### ORD-9002: INVENTORY_SERVICE_UNAVAILABLE

**HTTP Status:** `503 Service Unavailable`

**Descripción:** Inventory Service no disponible.

```json
{
  "error": {
    "code": "ORD-9002",
    "message": "Servicio de inventario no disponible",
    "details": {
      "service": "inventory-service",
      "retry_after": 30
    }
  }
}
```

### ORD-9003: CATALOG_SERVICE_UNAVAILABLE

**HTTP Status:** `503 Service Unavailable`

**Descripción:** Catalog Service no disponible.

### ORD-9004: QUEUE_PUBLISH_FAILED

**HTTP Status:** `500 Internal Server Error`

**Descripción:** Falló publicación de evento a RabbitMQ.

### ORD-9005: CONCURRENT_MODIFICATION

**HTTP Status:** `409 Conflict`

**Descripción:** La orden fue modificada por otro proceso.

```json
{
  "error": {
    "code": "ORD-9005",
    "type": "CONCURRENT_MODIFICATION",
    "details": {
      "order_id": "order_456",
      "expected_version": 5,
      "current_version": 6
    }
  }
}
```

## Tabla Resumen de Errores

| Código | Tipo | HTTP | Descripción |
|--------|------|------|-------------|
| **Order Errors** |
| ORD-1001 | INSUFFICIENT_STOCK | 400 | Stock insuficiente |
| ORD-1002 | ORDER_NOT_FOUND | 404 | Orden no encontrada |
| ORD-1003 | INVALID_ORDER_STATE | 422 | Estado inválido |
| ORD-1004 | ORDER_MINIMUM_NOT_MET | 400 | No alcanza mínimo |
| ORD-1005 | ORDER_ALREADY_CANCELLED | 409 | Ya cancelada |
| ORD-1006 | CANCELLATION_WINDOW_EXPIRED | 422 | Ventana expirada |
| ORD-1007 | DUPLICATE_ORDER | 409 | Orden duplicada |
| **Cart Errors** |
| ORD-2001 | CART_NOT_FOUND | 404 | Carrito no encontrado |
| ORD-2002 | CART_EXPIRED | 410 | Carrito expirado |
| ORD-2003 | CART_ALREADY_CONVERTED | 409 | Ya convertido |
| ORD-2004 | CART_EMPTY | 400 | Carrito vacío |
| ORD-2005 | MAX_CART_ITEMS_EXCEEDED | 422 | Máximo excedido |
| ORD-2006 | PRODUCT_NO_LONGER_AVAILABLE | 422 | Producto no disponible |
| **Payment Errors** |
| ORD-3001 | PAYMENT_FAILED | 402 | Pago fallido |
| ORD-3002 | PAYMENT_METHOD_INVALID | 400 | Método inválido |
| ORD-3003 | PAYMENT_AMOUNT_MISMATCH | 400 | Monto no coincide |
| ORD-3004 | PAYMENT_ALREADY_PROCESSED | 409 | Ya procesado |
| ORD-3005 | PAYMENT_GATEWAY_ERROR | 503 | Error gateway |
| ORD-3006 | REFUND_FAILED | 500 | Reembolso fallido |
| ORD-3007 | REFUND_AMOUNT_EXCEEDS_PAYMENT | 400 | Excede pago |
| **Shipment Errors** |
| ORD-4001 | SHIPMENT_NOT_FOUND | 404 | Envío no encontrado |
| ORD-4002 | INVALID_SHIPPING_ADDRESS | 400 | Dirección inválida |
| ORD-4003 | SHIPPING_NOT_AVAILABLE | 422 | Envío no disponible |
| ORD-4004 | CARRIER_API_ERROR | 503 | Error carrier |
| ORD-4005 | LABEL_CREATION_FAILED | 500 | Etiqueta fallida |
| ORD-4006 | TRACKING_NUMBER_INVALID | 400 | Tracking inválido |
| **Return Errors** |
| ORD-5001 | RETURN_NOT_FOUND | 404 | Devolución no encontrada |
| ORD-5002 | RETURN_WINDOW_EXPIRED | 422 | Ventana expirada |
| ORD-5003 | RETURN_ALREADY_REQUESTED | 409 | Ya solicitada |
| ORD-5004 | ITEM_NOT_ELIGIBLE_FOR_RETURN | 422 | No elegible |
| ORD-5005 | RETURN_APPROVAL_REQUIRED | 403 | Requiere aprobación |
| **Fulfillment Errors** |
| ORD-6001 | WAREHOUSE_NOT_ASSIGNED | 400 | Sin bodega asignada |
| ORD-6002 | PICKER_NOT_AVAILABLE | 503 | Sin picker disponible |
| ORD-6003 | ITEM_LOCATION_NOT_FOUND | 404 | Ubicación no encontrada |
| ORD-6004 | PICKING_ALREADY_COMPLETED | 409 | Ya completado |
| ORD-6005 | PACKING_VALIDATION_FAILED | 400 | Validación fallida |

**Total:** 42 códigos de error documentados

## Próximos Pasos

- [Flujos de Negocio](./flujos-negocio)
- [State Machine](./state-machine)
- [API: Orders](./api-orders)
