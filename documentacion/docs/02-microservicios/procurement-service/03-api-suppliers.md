---
sidebar_position: 4
---

# API de Proveedores

```http
POST   /api/v1/suppliers
GET    /api/v1/suppliers
GET    /api/v1/suppliers/{supplierId}
PATCH  /api/v1/suppliers/{supplierId}
DELETE /api/v1/suppliers/{supplierId}
```

## Crear Proveedor

```http
POST /api/v1/suppliers
```

**Request:**

```json
{
  "name": "Distribuidora ABC S.A.",
  "tax_id": "RUC-123-456-789",
  "email": "ventas@abc.com",
  "phone": "+507 6000-0000",
  "payment_term_days": 30,
  "address": {
    "address_line1": "Ave. Balboa",
    "city": "Ciudad de Panamá",
    "country": "PA"
  }
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "supplier_id": "supp_123",
    "name": "Distribuidora ABC S.A.",
    "tax_id": "RUC-123-456-789",
    "payment_term_days": 30,
    "is_active": true,
    "created_at": "2025-11-24T10:00:00Z"
  }
}
```

## Listar Proveedores

```http
GET /api/v1/suppliers?status=active
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "suppliers": [
      {
        "supplier_id": "supp_123",
        "name": "Distribuidora ABC S.A.",
        "email": "ventas@abc.com",
        "payment_term_days": 30,
        "total_purchases_ytd": 50000.00
      }
    ]
  }
}
```

## Próximos Pasos

- [API Purchases](./04-api-purchases.md)
- [API Goods Receipts](./05-api-goods-receipts.md)
