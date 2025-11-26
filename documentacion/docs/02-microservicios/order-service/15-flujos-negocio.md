---
sidebar_position: 15
---

# Flujos de Negocio

## Flujo de Creación de Orden

```mermaid
sequenceDiagram
    participant Cliente
    participant OrderAPI
    participant Pricing
    participant Inventory
    participant Customer
    participant DB
    participant RabbitMQ

    Cliente->>OrderAPI: POST /orders
    OrderAPI->>Pricing: GetPricesBatch()
    Pricing-->>OrderAPI: Precios actuales
    OrderAPI->>Inventory: CheckStock()
    Inventory-->>OrderAPI: Stock disponible
    OrderAPI->>Customer: GetCustomer()
    Customer-->>OrderAPI: Info cliente
    OrderAPI->>DB: Crear orden (status: pending)
    OrderAPI->>RabbitMQ: order.created
    OrderAPI-->>Cliente: 201 Created
```

## Flujo de Confirmación con Pago

```mermaid
sequenceDiagram
    participant Cliente
    participant OrderAPI
    participant Inventory
    participant PaymentGateway
    participant DB
    participant RabbitMQ

    Cliente->>OrderAPI: POST /orders/{id}/confirm
    OrderAPI->>Inventory: ReserveStock()
    Inventory-->>OrderAPI: Stock reservado
    OrderAPI->>PaymentGateway: Process payment
    PaymentGateway-->>OrderAPI: Payment succeeded
    OrderAPI->>DB: Update status: confirmed
    OrderAPI->>RabbitMQ: order.confirmed
    OrderAPI-->>Cliente: 200 OK
```

## Flujo de Cancelación

```mermaid
sequenceDiagram
    participant Cliente
    participant OrderAPI
    participant Inventory
    participant PaymentGateway
    participant DB
    participant RabbitMQ

    Cliente->>OrderAPI: POST /orders/{id}/cancel
    OrderAPI->>DB: Verificar estado
    OrderAPI->>Inventory: ReleaseStock()
    Inventory-->>OrderAPI: Stock liberado

    alt Orden pagada
        OrderAPI->>PaymentGateway: Refund
        PaymentGateway-->>OrderAPI: Refund completed
    end

    OrderAPI->>DB: Update status: cancelled
    OrderAPI->>RabbitMQ: order.cancelled
    OrderAPI-->>Cliente: 200 OK
```

## Estados de la Orden

| Estado | Descripción | Transiciones Válidas |
|--------|-------------|---------------------|
| `pending` | Orden creada, esperando confirmación | confirmed, cancelled |
| `confirmed` | Orden confirmada y pagada | processing, cancelled |
| `processing` | En preparación | shipped, cancelled |
| `shipped` | Enviada | delivered |
| `delivered` | Entregada | - |
| `cancelled` | Cancelada | - |

## Próximos Pasos

- [State Machine](./state-machine)
- [Eventos Publicados](./eventos-publicados)
- [API Orders](./api-orders)
