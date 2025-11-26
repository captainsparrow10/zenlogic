---
sidebar_position: 5
---

# API de Precios

```http
POST   /api/v1/price-lists/{priceListId}/prices
GET    /api/v1/price-lists/{priceListId}/prices
PATCH  /api/v1/prices/{priceId}
POST   /api/v1/prices/bulk-update
```

## Agregar Precio

```http
POST /api/v1/price-lists/{priceListId}/prices
```

**Request:**

```json
{
  "variant_id": "var_789",
  "price": 25.00,
  "cost": 15.00,
  "valid_from": "2025-01-01"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "price_id": "price_001",
    "variant_id": "var_789",
    "price": 25.00,
    "margin_percentage": 40.00,
    "created_at": "2025-11-24T10:00:00Z"
  }
}
```

## Actualización Masiva

```http
POST /api/v1/prices/bulk-update
```

**Request:**

```json
{
  "price_list_id": "plist_001",
  "adjustment_type": "percentage",
  "adjustment_value": 10.0,
  "category_filter": "bebidas"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "prices_updated": 45,
    "average_increase": 10.0
  }
}
```

## Próximos Pasos

- [API Promotions](./05-api-promotions.md)
- [API Calculation](./06-api-calculation.md)
