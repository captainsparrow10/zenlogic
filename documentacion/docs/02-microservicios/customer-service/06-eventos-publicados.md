---
sidebar_position: 7
---

# Eventos Publicados

Eventos que Customer Service publica a RabbitMQ.

## Configuración

**Exchange:** `customer_events`
**Exchange Type:** `topic`
**Routing Key Pattern:** `customer.{entity}.{action}`

## Customer Events

### customer.created

```json
{
  "event": "customer.created",
  "version": "1.0",
  "timestamp": "2025-11-24T10:00:00Z",
  "organization_id": "org_001",
  "data": {
    "customer_id": "cust_123",
    "customer_type": "b2c",
    "email": "juan@example.com",
    "phone": "+507 6000-0000",
    "loyalty_account_created": true
  }
}
```

### customer.updated

```json
{
  "event": "customer.updated",
  "version": "1.0",
  "timestamp": "2025-11-24T11:00:00Z",
  "organization_id": "org_001",
  "data": {
    "customer_id": "cust_123",
    "changes": {
      "email": "new.email@example.com",
      "phone": "+507 6111-1111"
    }
  }
}
```

## Loyalty Events

### customer.loyalty.points_earned

```json
{
  "event": "customer.loyalty.points_earned",
  "version": "1.0",
  "timestamp": "2025-11-24T12:00:00Z",
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

**Consumidores:** Analytics, Notification Service

### customer.loyalty.points_redeemed

```json
{
  "event": "customer.loyalty.points_redeemed",
  "version": "1.0",
  "timestamp": "2025-11-24T13:00:00Z",
  "organization_id": "org_001",
  "data": {
    "customer_id": "cust_123",
    "transaction_id": "loy_txn_002",
    "points_redeemed": 100,
    "points_balance": 450,
    "discount_value": 1.00
  }
}
```

### customer.loyalty.tier_upgraded

```json
{
  "event": "customer.loyalty.tier_upgraded",
  "version": "1.0",
  "timestamp": "2025-11-24T14:00:00Z",
  "organization_id": "org_001",
  "data": {
    "customer_id": "cust_123",
    "previous_tier": "silver",
    "new_tier": "gold",
    "lifetime_points": 1000
  }
}
```

**Consumidores:** Notification Service (enviar felicitación), Pricing Service (actualizar descuentos)

## Credit Events

### customer.credit.approved

```json
{
  "event": "customer.credit.approved",
  "version": "1.0",
  "timestamp": "2025-11-24T11:00:00Z",
  "organization_id": "org_001",
  "data": {
    "customer_id": "cust_456",
    "credit_account_id": "credit_001",
    "credit_limit": 10000.00,
    "payment_term_days": 30,
    "approved_by": "user_manager"
  }
}
```

**Consumidores:** Order Service (habilitar pago a crédito), Notification Service

### customer.credit.used

```json
{
  "event": "customer.credit.used",
  "version": "1.0",
  "timestamp": "2025-11-24T15:00:00Z",
  "organization_id": "org_001",
  "data": {
    "customer_id": "cust_456",
    "usage_id": "usage_001",
    "order_id": "order_789",
    "amount": 5000.00,
    "credit_available": 5000.00,
    "due_date": "2025-12-24"
  }
}
```

### customer.credit.limit_exceeded

```json
{
  "event": "customer.credit.limit_exceeded",
  "version": "1.0",
  "timestamp": "2025-11-24T16:00:00Z",
  "organization_id": "org_001",
  "data": {
    "customer_id": "cust_456",
    "attempted_amount": 6000.00,
    "credit_available": 5000.00,
    "shortfall": 1000.00
  }
}
```

**Consumidores:** Notification Service (alertar al cliente y gerente de crédito)

## Resumen de Eventos

| Evento (routing key) | Cuándo | Consumidores |
|--------|--------|--------------|
| `customer.created` | Nuevo cliente | Analytics |
| `customer.updated` | Info actualizada | CRM, Analytics |
| `customer.loyalty.points_earned` | Puntos acumulados | Analytics, Notification |
| `customer.loyalty.points_redeemed` | Puntos canjeados | Analytics |
| `customer.loyalty.tier_upgraded` | Nivel mejorado | Pricing, Notification |
| `customer.credit.approved` | Crédito aprobado | Order, Notification |
| `customer.credit.used` | Crédito utilizado | Analytics |
| `customer.credit.limit_exceeded` | Límite excedido | Notification |

> **Nota:** Todos los eventos siguen el patrón `customer.{entidad}.{accion}` según el estándar de mensajería del ERP.

## Próximos Pasos

- [Eventos Consumidos](./07-eventos-consumidos.md)
- [Integraciones](./08-integraciones.md)
