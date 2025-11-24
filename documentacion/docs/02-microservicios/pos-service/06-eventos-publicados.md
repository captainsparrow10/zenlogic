---
sidebar_position: 7
---

# Eventos Publicados

Eventos que POS Service publica a RabbitMQ.

## Configuración

**Exchange:** `pos_events`
**Exchange Type:** `topic`
**Routing Key Pattern:** `pos.{entity}.{action}`

## Transaction Events

### pos.transaction.created

```json
{
  "event": "pos.transaction.created",
  "version": "1.0",
  "timestamp": "2025-11-24T10:25:00Z",
  "organization_id": "org_001",
  "data": {
    "transaction_id": "txn_123",
    "transaction_number": "POS-2025-001234",
    "cashier_id": "user_456",
    "local_id": "local_101",
    "customer_id": "cust_789",
    "status": "open"
  }
}
```

### pos.transaction.completed

Publicado cuando se completa una venta exitosamente.

```json
{
  "event": "pos.transaction.completed",
  "version": "1.0",
  "timestamp": "2025-11-24T10:30:00Z",
  "organization_id": "org_001",
  "data": {
    "transaction_id": "txn_123",
    "transaction_number": "POS-2025-001234",
    "cashier_id": "user_456",
    "local_id": "local_101",
    "customer_id": "cust_789",
    "items": [
      {
        "variant_id": "var_789",
        "quantity": 2,
        "unit_price": 2.50,
        "total": 5.35
      }
    ],
    "totals": {
      "subtotal": 100.00,
      "tax_amount": 7.00,
      "discount_amount": 10.00,
      "total_amount": 97.00
    },
    "payments": [
      {
        "payment_method": "cash",
        "amount": 97.00
      }
    ],
    "completed_at": "2025-11-24T10:30:00Z"
  }
}
```

**Consumidores:**
- Inventory Service (ya descontado en tiempo real)
- Customer Service (puntos de lealtad ya agregados)
- Analytics Service (reportes y estadísticas)
- Reports Service (reportes de ventas)

### pos.transaction.voided

```json
{
  "event": "pos.transaction.voided",
  "version": "1.0",
  "timestamp": "2025-11-24T11:00:00Z",
  "organization_id": "org_001",
  "data": {
    "transaction_id": "txn_123",
    "transaction_number": "POS-2025-001234",
    "void_reason": "Error en entrada de producto",
    "authorized_by": "supervisor_123",
    "items_to_restock": [
      {
        "variant_id": "var_789",
        "quantity": 2,
        "local_id": "local_101"
      }
    ],
    "refund_amount": 97.00,
    "voided_at": "2025-11-24T11:00:00Z"
  }
}
```

**Consumidores:**
- Inventory Service (restaurar stock)
- Customer Service (restar puntos si aplica)
- Reports Service (actualizar estadísticas)

## Payment Events

### pos.payment.processed

```json
{
  "event": "pos.payment.processed",
  "version": "1.0",
  "timestamp": "2025-11-24T10:30:00Z",
  "organization_id": "org_001",
  "data": {
    "payment_id": "pay_001",
    "transaction_id": "txn_123",
    "payment_method": "cash",
    "amount": 97.00,
    "received": 100.00,
    "change_due": 3.00,
    "cashier_id": "user_456",
    "local_id": "local_101"
  }
}
```

## Return Events

### pos.return.processed

```json
{
  "event": "pos.return.processed",
  "version": "1.0",
  "timestamp": "2025-11-24T14:00:00Z",
  "organization_id": "org_001",
  "data": {
    "return_id": "ret_001",
    "transaction_id": "txn_123",
    "return_number": "RET-2025-0001",
    "reason": "defective",
    "authorized_by": "supervisor_123",
    "items": [
      {
        "variant_id": "var_789",
        "quantity": 1,
        "refund_amount": 2.50,
        "condition": "defective"
      }
    ],
    "refund_amount": 2.50,
    "refund_method": "cash"
  }
}
```

**Consumidores:**
- Inventory Service (reingresar producto)
- Customer Service (ajustar puntos)
- Reports Service (estadísticas de devoluciones)

## Resumen de Eventos

| Evento | Cuándo | Consumidores Principales |
|--------|--------|--------------------------|
| `pos.transaction.created` | Nueva transacción iniciada | Analytics |
| `pos.transaction.completed` | Venta completada | Inventory, Customer, Analytics, Reports |
| `pos.transaction.voided` | Transacción anulada | Inventory, Customer, Reports |
| `pos.payment.processed` | Pago procesado | Reports, Analytics |
| `pos.return.processed` | Devolución procesada | Inventory, Customer, Reports |

## Próximos Pasos

- [Eventos Consumidos](./07-eventos-consumidos.md)
- [Integraciones](./08-integraciones.md)
