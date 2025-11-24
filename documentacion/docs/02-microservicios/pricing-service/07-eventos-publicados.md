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

## Próximos Pasos

- [Eventos Consumidos](./08-eventos-consumidos.md)
- [Integraciones](./09-integraciones.md)
