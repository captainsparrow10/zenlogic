---
sidebar_position: 4
---

# API de Listas de Precios

```http
POST   /api/v1/price-lists
GET    /api/v1/price-lists
GET    /api/v1/price-lists/{priceListId}
PATCH  /api/v1/price-lists/{priceListId}
DELETE /api/v1/price-lists/{priceListId}
```

## Crear Lista de Precios

```http
POST /api/v1/price-lists
```

**Request:**

```json
{
  "name": "Precios Mayoristas",
  "currency": "USD",
  "is_default": false,
  "valid_from": "2025-01-01",
  "valid_until": "2025-12-31"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "price_list_id": "plist_123",
    "name": "Precios Mayoristas",
    "currency": "USD",
    "is_default": false,
    "created_at": "2025-11-24T10:00:00Z"
  }
}
```

## Listar Listas de Precios

```http
GET /api/v1/price-lists
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "price_lists": [
      {
        "price_list_id": "plist_001",
        "name": "Precios Minoristas",
        "is_default": true,
        "prices_count": 150
      },
      {
        "price_list_id": "plist_002",
        "name": "Precios Mayoristas",
        "is_default": false,
        "prices_count": 150
      }
    ]
  }
}
```

## Próximos Pasos

- [API Prices](./04-api-prices.md)
- [API Promotions](./05-api-promotions.md)
