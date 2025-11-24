---
sidebar_position: 5
---

# API de Órdenes de Compra

```http
POST   /api/v1/purchase-orders
GET    /api/v1/purchase-orders
GET    /api/v1/purchase-orders/{poId}
POST   /api/v1/purchase-orders/{poId}/approve
POST   /api/v1/purchase-orders/{poId}/cancel
```

## Crear Orden de Compra

```http
POST /api/v1/purchase-orders
```

**Request:**

```json
{
  "supplier_id": "supp_123",
  "delivery_date": "2025-12-01",
  "items": [
    {
      "variant_id": "var_789",
      "quantity": 100,
      "unit_cost": 10.00
    }
  ],
  "notes": "Entrega en bodega principal"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "po_id": "po_001",
    "po_number": "PO-2025-0001",
    "supplier": {
      "supplier_id": "supp_123",
      "name": "Distribuidora ABC S.A."
    },
    "status": "draft",
    "total_amount": 1000.00,
    "delivery_date": "2025-12-01",
    "items": [
      {
        "item_id": "item_001",
        "variant_id": "var_789",
        "product_name": "Producto X",
        "quantity_ordered": 100,
        "unit_cost": 10.00,
        "subtotal": 1000.00
      }
    ],
    "created_at": "2025-11-24T10:00:00Z"
  }
}
```

## Aprobar Orden de Compra

```http
POST /api/v1/purchase-orders/{poId}/approve
```

**Requiere permiso:** `procurement:approve`

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "po_id": "po_001",
    "status": "approved",
    "approved_by": "user_manager",
    "approved_at": "2025-11-24T11:00:00Z"
  }
}
```

## Listar Órdenes de Compra

```http
GET /api/v1/purchase-orders?status=approved&supplier_id=supp_123
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "purchase_orders": [
      {
        "po_id": "po_001",
        "po_number": "PO-2025-0001",
        "supplier_name": "Distribuidora ABC S.A.",
        "status": "approved",
        "total_amount": 1000.00,
        "delivery_date": "2025-12-01"
      }
    ]
  }
}
```

## Próximos Pasos

- [API Goods Receipts](./05-api-goods-receipts.md)
- [Eventos Publicados](./06-eventos-publicados.md)
