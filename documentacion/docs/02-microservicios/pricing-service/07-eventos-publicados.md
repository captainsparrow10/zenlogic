---
sidebar_position: 8
---

# Eventos Publicados

## Configuración

**Exchange:** `pricing_events`
**Type:** `topic`

## Eventos

### pricing.promotion.activated

```json
{
  "event": "pricing.promotion.activated",
  "version": "1.0",
  "timestamp": "2025-11-24T10:00:00Z",
  "data": {
    "promotion_id": "promo_001",
    "name": "Black Friday 20% OFF",
    "promotion_type": "percentage",
    "discount_value": 20.0,
    "start_date": "2025-11-29T00:00:00Z",
    "end_date": "2025-11-29T23:59:59Z"
  }
}
```

**Consumidores:** POS Service, Catalog Service, Notification Service

### pricing.promotion.deactivated

```json
{
  "event": "pricing.promotion.deactivated",
  "version": "1.0",
  "timestamp": "2025-11-30T00:00:00Z",
  "data": {
    "promotion_id": "promo_001",
    "reason": "expired"
  }
}
```

### pricing.price.updated

```json
{
  "event": "pricing.price.updated",
  "version": "1.0",
  "timestamp": "2025-11-24T12:00:00Z",
  "data": {
    "price_id": "price_001",
    "variant_id": "var_789",
    "old_price": 20.00,
    "new_price": 25.00,
    "change_percentage": 25.0
  }
}
```

**Consumidores:** POS Service (invalidar cache), Catalog Service

### pricing.coupon.redeemed

```json
{
  "event": "pricing.coupon.redeemed",
  "version": "1.0",
  "timestamp": "2025-11-24T14:00:00Z",
  "organization_id": "org_001",
  "data": {
    "coupon_id": "coupon_001",
    "coupon_code": "SAVE10",
    "customer_id": "cust_123",
    "order_id": "order_456",
    "discount_applied": 10.00,
    "discount_type": "percentage"
  }
}
```

**Consumidores:** Analytics, Customer Service

### pricing.loyalty.points_earned

```json
{
  "event": "pricing.loyalty.points_earned",
  "version": "1.0",
  "timestamp": "2025-11-24T15:00:00Z",
  "organization_id": "org_001",
  "data": {
    "customer_id": "cust_123",
    "transaction_id": "loy_txn_001",
    "points_earned": 100,
    "points_balance": 550,
    "tier": "silver",
    "reference_type": "purchase",
    "reference_id": "order_789"
  }
}
```

**Consumidores:** Customer Service (actualizar tier), Notification Service

### pricing.loyalty.points_redeemed

```json
{
  "event": "pricing.loyalty.points_redeemed",
  "version": "1.0",
  "timestamp": "2025-11-24T16:00:00Z",
  "organization_id": "org_001",
  "data": {
    "customer_id": "cust_123",
    "transaction_id": "loy_txn_002",
    "points_redeemed": 100,
    "points_balance": 450,
    "discount_value": 1.00,
    "order_id": "order_789"
  }
}
```

**Consumidores:** Customer Service, Analytics

## Resumen de Eventos

| Evento | Cuándo | Consumidores |
|--------|--------|--------------|
| `pricing.promotion.activated` | Promoción iniciada | POS, Catalog, Notification |
| `pricing.promotion.deactivated` | Promoción finalizada | POS, Catalog |
| `pricing.price.updated` | Precio modificado | POS, Catalog |
| `pricing.coupon.redeemed` | Cupón canjeado | Analytics, Customer |
| `pricing.loyalty.points_earned` | Puntos acumulados | Customer, Notification |
| `pricing.loyalty.points_redeemed` | Puntos canjeados | Customer, Analytics |

> **Nota:** Pricing Service es la fuente única de verdad para precios, promociones y programa de lealtad (puntos).

## Próximos Pasos

- [Eventos Consumidos](./08-eventos-consumidos.md)
- [Integraciones](./09-integraciones.md)
