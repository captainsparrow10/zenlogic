---
sidebar_position: 6
---

# API de Promociones

```http
POST   /api/v1/promotions
GET    /api/v1/promotions
GET    /api/v1/promotions/{promotionId}
PATCH  /api/v1/promotions/{promotionId}
POST   /api/v1/promotions/{promotionId}/activate
POST   /api/v1/promotions/{promotionId}/deactivate
```

## Crear Promoción

```http
POST /api/v1/promotions
```

**Promoción Porcentual:**

```json
{
  "name": "Black Friday 20% OFF",
  "promotion_type": "percentage",
  "discount_value": 20.0,
  "start_date": "2025-11-29T00:00:00Z",
  "end_date": "2025-11-29T23:59:59Z",
  "applies_to": {
    "categories": ["electronics"],
    "min_purchase": 100.00
  }
}
```

**Promoción 2x1:**

```json
{
  "name": "2x1 en Bebidas",
  "promotion_type": "buy_x_get_y",
  "rules": {
    "buy_quantity": 2,
    "get_quantity": 1,
    "pay_for": 2
  },
  "start_date": "2025-12-01T00:00:00Z",
  "end_date": "2025-12-31T23:59:59Z",
  "applies_to": {
    "categories": ["bebidas"]
  }
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "promotion_id": "promo_001",
    "name": "Black Friday 20% OFF",
    "promotion_type": "percentage",
    "is_active": false,
    "created_at": "2025-11-24T10:00:00Z"
  }
}
```

## Activar Promoción

```http
POST /api/v1/promotions/{promotionId}/activate
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "promotion_id": "promo_001",
    "is_active": true,
    "activated_at": "2025-11-24T10:05:00Z"
  }
}
```

## Próximos Pasos

- [API Calculation](./06-api-calculation.md)
- [Tipos de Promociones](./10-tipos-promociones.md)
