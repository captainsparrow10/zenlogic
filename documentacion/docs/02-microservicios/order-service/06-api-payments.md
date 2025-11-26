---
sidebar_position: 6
---

# API Payments

## Visión General

Endpoints para gestión de pagos de órdenes.

## Endpoints

### Registrar Pago

```http
POST /api/v1/orders/{order_id}/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_method": "card",
  "amount": 150.00,
  "currency": "USD",
  "gateway": "stripe",
  "gateway_payment_id": "pi_1234567890"
}
```

**Respuesta exitosa (201):**

```json
{
  "payment_id": "pay_123",
  "order_id": "order_456",
  "status": "pending",
  "amount": 150.00,
  "currency": "USD",
  "payment_method": "card",
  "gateway": "stripe",
  "created_at": "2025-11-25T10:00:00Z"
}
```

### Confirmar Pago

```http
POST /api/v1/orders/{order_id}/payments/{payment_id}/confirm
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**

```json
{
  "payment_id": "pay_123",
  "status": "succeeded",
  "confirmed_at": "2025-11-25T10:05:00Z"
}
```

### Solicitar Reembolso

```http
POST /api/v1/orders/{order_id}/payments/{payment_id}/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50.00,
  "reason": "partial_return"
}
```

### Listar Pagos de una Orden

```http
GET /api/v1/orders/{order_id}/payments
Authorization: Bearer <token>
```

## Métodos de Pago Soportados

| Método | Código | Gateway |
|--------|--------|---------|
| Tarjeta de Crédito | `card` | Stripe |
| Efectivo | `cash` | POS |
| Transferencia | `bank_transfer` | Manual |
| Crédito de Cliente | `customer_credit` | Interno |

## Eventos Publicados

- `order.payment.pending` - Pago registrado
- `order.payment.succeeded` - Pago confirmado
- `order.payment.failed` - Pago fallido
- `order.payment.refunded` - Reembolso procesado

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `PAYMENT_NOT_FOUND` | Pago no existe |
| `INVALID_AMOUNT` | Monto inválido |
| `ORDER_ALREADY_PAID` | Orden ya pagada |
| `REFUND_EXCEEDS_PAYMENT` | Reembolso excede el pago |

## Próximos Pasos

- [API Orders](./api-orders)
- [State Machine](./state-machine)
- [Eventos Publicados](./eventos-publicados)
