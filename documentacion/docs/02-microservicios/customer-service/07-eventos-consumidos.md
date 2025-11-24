---
sidebar_position: 8
---

# Eventos Consumidos

Eventos de otros servicios que Customer Service consume.

## Configuración

```python
CONSUMER_CONFIG = {
    'customer_order_consumer': {
        'exchange': 'order_events',
        'queue': 'customer_order_queue',
        'routing_keys': [
            'order.completed',
            'order.cancelled'
        ]
    },
    'customer_pos_consumer': {
        'exchange': 'pos_events',
        'queue': 'customer_pos_queue',
        'routing_keys': [
            'pos.transaction.completed'
        ]
    },
    'customer_payment_consumer': {
        'exchange': 'payment_events',
        'queue': 'customer_payment_queue',
        'routing_keys': [
            'payment.received'
        ]
    }
}
```

## Order Events

### order.completed

**Acción:** Actualizar estadísticas del cliente y acumular puntos.

```python
async def handle_order_completed(event: dict):
    customer_id = event['data']['customer_id']
    order_id = event['data']['order_id']
    total_amount = event['data']['total_amount']

    # Actualizar estadísticas
    await customer_service.update_statistics(
        customer_id=customer_id,
        order_id=order_id,
        amount=total_amount
    )

    # Acumular puntos de lealtad
    await loyalty_service.add_points(
        customer_id=customer_id,
        transaction_id=order_id,
        amount=total_amount
    )

    # Recalcular segmento
    await segmentation_service.calculate_segment(customer_id)
```

## POS Events

### pos.transaction.completed

**Acción:** Similar a order.completed.

```python
async def handle_pos_transaction_completed(event: dict):
    customer_id = event['data'].get('customer_id')

    if not customer_id:
        return  # Venta anónima

    transaction_id = event['data']['transaction_id']
    total_amount = event['data']['totals']['total_amount']

    await customer_service.update_statistics(
        customer_id=customer_id,
        transaction_id=transaction_id,
        amount=total_amount
    )

    await loyalty_service.add_points(
        customer_id=customer_id,
        transaction_id=transaction_id,
        amount=total_amount
    )
```

## Payment Events

### payment.received

**Acción:** Liberar crédito utilizado.

```python
async def handle_payment_received(event: dict):
    customer_id = event['data']['customer_id']
    amount = event['data']['amount']
    payment_reference = event['data']['payment_reference']

    # Registrar pago en cuenta de crédito
    await credit_service.record_payment(
        customer_id=customer_id,
        amount=amount,
        payment_reference=payment_reference
    )

    # Liberar crédito
    await credit_service.release_credit(
        customer_id=customer_id,
        amount=amount
    )
```

## Próximos Pasos

- [Integraciones](./08-integraciones.md)
- [Configuración](./09-configuracion.md)
