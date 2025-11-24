---
sidebar_position: 7
---

# API de Cálculo de Precios

```http
POST   /api/v1/pricing/calculate
POST   /api/v1/pricing/calculate-cart
GET    /api/v1/pricing/promotions/active
```

## Calcular Precio de Producto

```http
POST /api/v1/pricing/calculate
```

**Request:**

```json
{
  "variant_id": "var_789",
  "quantity": 3,
  "customer_id": "cust_123",
  "price_list_id": "plist_001"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "variant_id": "var_789",
    "quantity": 3,
    "unit_price": 25.00,
    "subtotal": 75.00,
    "discount_amount": 7.50,
    "final_price": 67.50,
    "promotions_applied": [
      {
        "promotion_id": "promo_001",
        "name": "10% OFF Bebidas",
        "discount_amount": 7.50
      }
    ]
  }
}
```

## Calcular Carrito Completo

```http
POST /api/v1/pricing/calculate-cart
```

**Request:**

```json
{
  "items": [
    {
      "variant_id": "var_789",
      "quantity": 2
    },
    {
      "variant_id": "var_456",
      "quantity": 1
    }
  ],
  "customer_id": "cust_123"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "variant_id": "var_789",
        "quantity": 2,
        "unit_price": 25.00,
        "subtotal": 50.00,
        "discount_amount": 0.00,
        "total": 50.00
      }
    ],
    "cart_totals": {
      "subtotal": 100.00,
      "discount_amount": 10.00,
      "total": 90.00
    },
    "promotions_applied": []
  }
}
```

## Obtener Promociones Activas

```http
GET /api/v1/pricing/promotions/active?local_id={localId}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "promotions": [
      {
        "promotion_id": "promo_001",
        "name": "Black Friday 20% OFF",
        "promotion_type": "percentage",
        "discount_value": 20.0,
        "end_date": "2025-11-29T23:59:59Z"
      }
    ]
  }
}
```

## Próximos Pasos

- [Eventos Publicados](./07-eventos-publicados.md)
- [Tipos de Promociones](./10-tipos-promociones.md)
