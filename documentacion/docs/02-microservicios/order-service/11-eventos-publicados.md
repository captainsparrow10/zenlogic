---
sidebar_position: 11
---

# Eventos Publicados

Eventos que el Order Service publica a RabbitMQ para notificar cambios a otros servicios.

## Configuración

**Exchange:** `order_events`
**Exchange Type:** `topic`
**Routing Key Pattern:** `order.{entity}.{action}`

## Order Events

### order.created

```json
{
  "event": "order.created",
  "version": "1.0",
  "timestamp": "2025-11-23T15:00:00Z",
  "organization_id": "org_123",
  "data": {
    "order_id": "order_456",
    "order_number": "ORD-2025-0001",
    "customer_id": "cust_789",
    "total_amount": 125.50,
    "currency": "USD",
    "items_count": 3,
    "status": "pending"
  }
}
```

### order.placed

Publicado cuando se coloca una orden (antes de confirmación de pago). Inventory Service usa este evento para reservar stock temporalmente.

```json
{
  "event": "order.placed",
  "version": "1.0",
  "timestamp": "2025-11-23T15:00:00Z",
  "organization_id": "org_123",
  "data": {
    "order_id": "order_456",
    "customer_id": "cust_789",
    "local_id": "local_101",
    "items": [
      {
        "variant_id": "var_789",
        "quantity": 2,
        "preferred_warehouse_id": "wh_101"
      }
    ],
    "reservation_ttl_minutes": 15
  }
}
```

**Consumidores:** Inventory Service (reserve stock)

### order.confirmed

```json
{
  "event": "order.confirmed",
  "version": "1.0",
  "timestamp": "2025-11-23T15:05:00Z",
  "organization_id": "org_123",
  "data": {
    "order_id": "order_456",
    "order_number": "ORD-2025-0001",
    "reservation_id": "res_123",
    "confirmed_at": "2025-11-23T15:05:00Z",
    "payment_id": "pay_123",
    "items": [
      {
        "variant_id": "var_789",
        "quantity": 2,
        "warehouse_id": "wh_101"
      }
    ]
  }
}
```

**Consumidores:** Inventory Service, Notification Service, Analytics

### order.cancelled

```json
{
  "event": "order.cancelled",
  "version": "1.0",
  "timestamp": "2025-11-23T16:00:00Z",
  "organization_id": "org_123",
  "data": {
    "order_id": "order_456",
    "reservation_id": "res_123",
    "cancellation_reason": "customer_request",
    "cancelled_by": "user_789",
    "refund_required": true,
    "stock_to_release": [
      {
        "variant_id": "var_789",
        "quantity": 2,
        "warehouse_id": "wh_101"
      }
    ]
  }
}
```

### order.processing

```json
{
  "event": "order.processing",
  "data": {
    "order_id": "order_456",
    "warehouse_id": "wh_101",
    "fulfillment_started_at": "2025-11-23T16:00:00Z"
  }
}
```

### order.shipped

```json
{
  "event": "order.shipped",
  "version": "1.0",
  "timestamp": "2025-11-24T10:00:00Z",
  "organization_id": "org_123",
  "data": {
    "order_id": "order_456",
    "shipment_id": "ship_789",
    "carrier": "FedEx",
    "tracking_number": "123456789",
    "shipped_at": "2025-11-24T10:00:00Z",
    "estimated_delivery": "2025-11-26",
    "shipped_items": [
      {
        "variant_id": "var_789",
        "quantity": 2,
        "warehouse_id": "wh_101"
      }
    ]
  }
}
```

**Consumidores:** Inventory Service (deduct stock), Notification Service (send tracking), Customer App

### order.delivered

```json
{
  "event": "order.delivered",
  "data": {
    "order_id": "order_456",
    "delivered_at": "2025-11-26T14:30:00Z",
    "signature": "Juan Pérez",
    "delivery_photo_url": "https://..."
  }
}
```

## Payment Events

### payment.pending

```json
{
  "event": "payment.pending",
  "data": {
    "payment_id": "pay_123",
    "order_id": "order_456",
    "amount": 125.50,
    "currency": "USD",
    "payment_method": "stripe",
    "gateway_payment_id": "pi_xxx"
  }
}
```

### payment.succeeded

```json
{
  "event": "payment.succeeded",
  "data": {
    "payment_id": "pay_123",
    "order_id": "order_456",
    "amount": 125.50,
    "paid_at": "2025-11-23T15:05:00Z",
    "payment_method": "stripe",
    "card_last4": "4242"
  }
}
```

### payment.failed

```json
{
  "event": "payment.failed",
  "data": {
    "payment_id": "pay_123",
    "order_id": "order_456",
    "error_code": "card_declined",
    "error_message": "Your card was declined",
    "retries_remaining": 2
  }
}
```

### payment.refunded

```json
{
  "event": "payment.refunded",
  "data": {
    "payment_id": "pay_123",
    "order_id": "order_456",
    "refund_amount": 125.50,
    "refund_reason": "customer_return",
    "refunded_at": "2025-11-28T10:00:00Z"
  }
}
```

## Shipment Events

### shipment.created

```json
{
  "event": "shipment.created",
  "data": {
    "shipment_id": "ship_789",
    "order_id": "order_456",
    "carrier": "FedEx",
    "service": "Ground",
    "shipping_cost": 15.00
  }
}
```

### shipment.label_created

```json
{
  "event": "shipment.label_created",
  "data": {
    "shipment_id": "ship_789",
    "tracking_number": "123456789",
    "label_url": "https://...",
    "carrier_cost": 12.50
  }
}
```

### shipment.dispatched

```json
{
  "event": "shipment.dispatched",
  "data": {
    "shipment_id": "ship_789",
    "dispatched_at": "2025-11-24T10:00:00Z",
    "warehouse_id": "wh_101"
  }
}
```

### shipment.in_transit

```json
{
  "event": "shipment.in_transit",
  "data": {
    "shipment_id": "ship_789",
    "tracking_number": "123456789",
    "current_location": "Memphis, TN",
    "status_description": "In transit to destination"
  }
}
```

### shipment.delivered

```json
{
  "event": "shipment.delivered",
  "data": {
    "shipment_id": "ship_789",
    "delivered_at": "2025-11-26T14:30:00Z",
    "recipient": "Juan Pérez",
    "signature_required": true
  }
}
```

## Return Events

### return.requested

```json
{
  "event": "return.requested",
  "data": {
    "return_id": "ret_123",
    "order_id": "order_456",
    "rma_number": "RMA-2025-0001",
    "reason": "wrong_size",
    "items": [
      {
        "order_item_id": "item_789",
        "variant_id": "var_123",
        "quantity": 1
      }
    ],
    "requested_at": "2025-11-27T09:00:00Z"
  }
}
```

**Consumidores:** Notification Service, Customer Service, Warehouse

### return.approved

```json
{
  "event": "return.approved",
  "data": {
    "return_id": "ret_123",
    "rma_number": "RMA-2025-0001",
    "approved_by": "user_manager",
    "return_shipping_label_url": "https://...",
    "refund_amount": 50.00
  }
}
```

### return.received

```json
{
  "event": "return.received",
  "version": "1.0",
  "timestamp": "2025-11-28T14:00:00Z",
  "organization_id": "org_123",
  "data": {
    "return_id": "ret_123",
    "order_id": "order_456",
    "rma_number": "RMA-2025-0001",
    "received_at": "2025-11-28T14:00:00Z",
    "warehouse_id": "wh_101",
    "returned_items": [
      {
        "variant_id": "var_789",
        "quantity": 1,
        "condition": "good",
        "return_reason": "wrong_size"
      }
    ]
  }
}
```

**Consumidores:** Inventory Service (restock items)

### return.refunded

```json
{
  "event": "return.refunded",
  "data": {
    "return_id": "ret_123",
    "refund_amount": 50.00,
    "refund_method": "original_payment",
    "refunded_at": "2025-11-28T15:00:00Z"
  }
}
```

## Cart Events

### cart.created

```json
{
  "event": "cart.created",
  "data": {
    "cart_id": "cart_123",
    "customer_id": "cust_789",
    "session_id": "sess_456",
    "organization_id": "org_123"
  }
}
```

### cart.item_added

```json
{
  "event": "cart.item_added",
  "data": {
    "cart_id": "cart_123",
    "variant_id": "var_789",
    "quantity": 2,
    "unit_price": 25.00
  }
}
```

### cart.abandoned

```json
{
  "event": "cart.abandoned",
  "data": {
    "cart_id": "cart_123",
    "customer_id": "cust_789",
    "items_count": 3,
    "total_value": 125.50,
    "abandoned_at": "2025-11-23T18:00:00Z",
    "last_activity_at": "2025-11-22T18:00:00Z"
  }
}
```

**Consumidores:** Marketing Service (email recovery campaign)

### cart.converted

```json
{
  "event": "cart.converted",
  "data": {
    "cart_id": "cart_123",
    "order_id": "order_456",
    "converted_at": "2025-11-23T15:00:00Z",
    "cart_value": 125.50
  }
}
```

## Fulfillment Events

### fulfillment.started

```json
{
  "event": "fulfillment.started",
  "data": {
    "order_id": "order_456",
    "warehouse_id": "wh_101",
    "assigned_to": "picker_user_123",
    "started_at": "2025-11-23T16:00:00Z"
  }
}
```

### fulfillment.item_picked

```json
{
  "event": "fulfillment.item_picked",
  "data": {
    "order_id": "order_456",
    "order_item_id": "item_789",
    "variant_id": "var_123",
    "quantity_picked": 2,
    "picked_by": "picker_user_123",
    "picked_at": "2025-11-23T16:15:00Z"
  }
}
```

### fulfillment.packed

```json
{
  "event": "fulfillment.packed",
  "data": {
    "order_id": "order_456",
    "package_count": 1,
    "total_weight": 2.5,
    "packed_by": "packer_user_456",
    "packed_at": "2025-11-23T16:30:00Z"
  }
}
```

## Invoice Events

### invoice.created

```json
{
  "event": "invoice.created",
  "data": {
    "invoice_id": "inv_123",
    "order_id": "order_456",
    "invoice_number": "INV-2025-0001",
    "total_amount": 125.50,
    "issued_at": "2025-11-23T15:10:00Z"
  }
}
```

### invoice.sent

```json
{
  "event": "invoice.sent",
  "data": {
    "invoice_id": "inv_123",
    "recipient_email": "customer@example.com",
    "pdf_url": "https://...",
    "sent_at": "2025-11-23T15:15:00Z"
  }
}
```

## Resumen de Eventos

| Categoría | Total | Eventos |
|-----------|-------|---------|
| Orders | 7 | created, placed, confirmed, cancelled, processing, shipped, delivered |
| Payments | 4 | pending, succeeded, failed, refunded |
| Shipments | 5 | created, label_created, dispatched, in_transit, delivered |
| Returns | 4 | requested, approved, received, refunded |
| Cart | 4 | created, item_added, abandoned, converted |
| Fulfillment | 3 | started, item_picked, packed |
| Invoices | 2 | created, sent |
| **Total** | **29** | |

## Configuración de Consumidores

```python
# Event consumer configuration
CONSUMER_CONFIG = {
    'order_events': {
        'exchange': 'order_events',
        'queues': {
            'inventory_order_consumer': [
                'order.confirmed',
                'order.cancelled',
                'order.shipped'
            ],
            'notification_order_consumer': [
                'order.created',
                'order.confirmed',
                'order.shipped',
                'order.delivered',
                'return.approved'
            ],
            'analytics_order_consumer': [
                'order.created',
                'order.confirmed',
                'cart.abandoned',
                'cart.converted'
            ]
        }
    }
}
```

## Próximos Pasos

- [Eventos Consumidos](./eventos-consumidos)
- [Integraciones](./integraciones)
- [Flujos de Negocio](./flujos-negocio)
