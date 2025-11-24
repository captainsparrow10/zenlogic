---
sidebar_position: 4
---

# API de Clientes

Endpoints para gestión de clientes.

## Base URL

```
POST   /api/v1/customers
GET    /api/v1/customers
GET    /api/v1/customers/{customerId}
PATCH  /api/v1/customers/{customerId}
DELETE /api/v1/customers/{customerId}
GET    /api/v1/customers/search
POST   /api/v1/customers/{customerId}/addresses
```

## Crear Cliente

```http
POST /api/v1/customers
```

**Request Body:**

```json
{
  "customer_type": "b2c",
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan.perez@example.com",
  "phone": "+507 6000-0000",
  "document_type": "cedula",
  "document_number": "8-123-456",
  "birth_date": "1990-05-15",
  "marketing_consent": true
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "customer_id": "cust_123",
    "customer_type": "b2c",
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan.perez@example.com",
    "phone": "+507 6000-0000",
    "status": "active",
    "loyalty_account": {
      "loyalty_account_id": "loy_456",
      "points_balance": 0,
      "tier": "bronze"
    },
    "created_at": "2025-11-24T10:00:00Z"
  }
}
```

## Buscar Clientes

```http
GET /api/v1/customers/search?q=juan&limit=20
```

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `q` | string | Búsqueda por nombre, email, teléfono |
| `customer_type` | string | Filtrar por tipo (b2c, b2b) |
| `status` | string | Filtrar por estado |
| `tier` | string | Filtrar por nivel de lealtad |
| `limit` | int | Resultados (default: 20, max: 100) |

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "customer_id": "cust_123",
        "name": "Juan Pérez",
        "email": "juan.perez@example.com",
        "phone": "+507 6000-0000",
        "loyalty_tier": "bronze",
        "points_balance": 0
      }
    ],
    "total_results": 1
  }
}
```

## Obtener Cliente

```http
GET /api/v1/customers/{customerId}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "customer_id": "cust_123",
    "customer_type": "b2c",
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan.perez@example.com",
    "phone": "+507 6000-0000",
    "status": "active",
    "loyalty_account": {
      "points_balance": 450,
      "tier": "silver",
      "lifetime_points": 1250
    },
    "credit_account": null,
    "addresses": [
      {
        "address_id": "addr_001",
        "address_type": "shipping",
        "address_line1": "Calle 50, Edificio Delta",
        "city": "Ciudad de Panamá",
        "is_default": true
      }
    ],
    "statistics": {
      "total_orders": 15,
      "lifetime_value": 1250.00,
      "average_order_value": 83.33,
      "last_purchase_at": "2025-11-20T14:30:00Z"
    },
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

## Próximos Pasos

- [API de Lealtad](./04-api-loyalty.md)
- [API de Crédito](./05-api-credit.md)
