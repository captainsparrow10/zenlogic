---
sidebar_position: 5
---

# API de Lealtad

Endpoints para gestión del programa de lealtad.

## Base URL

```
GET    /api/v1/customers/{customerId}/loyalty
POST   /api/v1/customers/{customerId}/loyalty/points/earn
POST   /api/v1/customers/{customerId}/loyalty/points/redeem
GET    /api/v1/customers/{customerId}/loyalty/transactions
GET    /api/v1/loyalty/tiers
```

## Acumular Puntos

```http
POST /api/v1/customers/{customerId}/loyalty/points/earn
```

**Request Body:**

```json
{
  "transaction_id": "txn_123",
  "amount": 100.00,
  "description": "Compra en tienda"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "transaction_id": "loy_txn_001",
    "points_earned": 100,
    "points_balance": 550,
    "tier": "silver",
    "tier_progress": {
      "current_tier": "silver",
      "next_tier": "gold",
      "points_to_next": 450
    }
  }
}
```

## Redimir Puntos

```http
POST /api/v1/customers/{customerId}/loyalty/points/redeem
```

**Request Body:**

```json
{
  "points": 100,
  "reason": "Descuento en compra",
  "reference_id": "order_789"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "transaction_id": "loy_txn_002",
    "points_redeemed": 100,
    "points_balance": 450,
    "discount_value": 1.00
  }
}
```

## Niveles de Lealtad

```http
GET /api/v1/loyalty/tiers
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "tiers": [
      {
        "tier": "bronze",
        "points_required": 0,
        "benefits": ["1 punto por $1", "Ofertas exclusivas"]
      },
      {
        "tier": "silver",
        "points_required": 500,
        "benefits": ["1.2 puntos por $1", "Envío gratis"]
      },
      {
        "tier": "gold",
        "points_required": 1000,
        "benefits": ["1.5 puntos por $1", "Descuento 5%"]
      },
      {
        "tier": "platinum",
        "points_required": 5000,
        "benefits": ["2 puntos por $1", "Descuento 10%", "Atención prioritaria"]
      }
    ]
  }
}
```

## Próximos Pasos

- [API de Crédito](./05-api-credit.md)
- [Eventos Publicados](./06-eventos-publicados.md)
