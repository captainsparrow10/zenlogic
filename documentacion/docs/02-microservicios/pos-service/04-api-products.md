---
sidebar_position: 5
---

# API de Productos

Endpoints para búsqueda de productos en POS.

## Base URL

```
GET    /api/v1/pos/products/search
GET    /api/v1/pos/products/barcode/{barcode}
GET    /api/v1/pos/products/{variantId}
GET    /api/v1/pos/products/popular
```

## Buscar Producto por Código de Barras

```http
GET /api/v1/pos/products/barcode/{barcode}
```

**Ejemplo:**

```http
GET /api/v1/pos/products/barcode/7501234567890
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "variant_id": "var_789",
    "sku": "PROD-001",
    "barcode": "7501234567890",
    "product_name": "Coca Cola 2L",
    "category": "Bebidas",
    "brand": "Coca Cola",
    "unit_price": 2.50,
    "currency": "USD",
    "tax_rate": 0.0700,
    "stock_available": 150,
    "is_active": true,
    "image_url": "https://cdn.zenlogic.com/products/coca-cola-2l.jpg",
    "promotions": [
      {
        "promotion_id": "promo_001",
        "name": "2x1 en Bebidas",
        "discount_type": "buy_x_get_y",
        "conditions": {
          "buy": 2,
          "get": 1,
          "pay": 2
        }
      }
    ]
  }
}
```

## Búsqueda de Productos

```http
GET /api/v1/pos/products/search?q=coca&limit=20
```

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `q` | string | Término de búsqueda |
| `category` | string | Filtrar por categoría |
| `brand` | string | Filtrar por marca |
| `local_id` | uuid | Buscar stock en local específico |
| `limit` | int | Resultados (default: 20, max: 50) |

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "variant_id": "var_789",
        "sku": "PROD-001",
        "barcode": "7501234567890",
        "product_name": "Coca Cola 2L",
        "category": "Bebidas",
        "brand": "Coca Cola",
        "unit_price": 2.50,
        "stock_available": 150,
        "image_url": "https://..."
      }
    ],
    "total_results": 5,
    "query": "coca"
  }
}
```

## Productos Populares

Lista de productos más vendidos para acceso rápido.

```http
GET /api/v1/pos/products/popular?local_id={localId}&limit=50
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "variant_id": "var_789",
        "product_name": "Coca Cola 2L",
        "unit_price": 2.50,
        "sales_count_7d": 450,
        "rank": 1
      }
    ],
    "period": "last_7_days",
    "updated_at": "2025-11-24T00:00:00Z"
  }
}
```

## Próximos Pasos

- [API de Pagos](./05-api-payments.md)
- [Eventos Publicados](./06-eventos-publicados.md)
