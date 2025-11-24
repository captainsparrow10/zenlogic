---
sidebar_position: 1
---

# Order Service - Overview

Servicio de gestión de órdenes de venta con soporte completo para carrito, checkout, pagos, fulfillment, envíos y devoluciones.

## Descripción

El **Order Service** es el microservicio central para gestionar todo el ciclo de vida de las órdenes de venta en el sistema ERP. Maneja desde la creación del carrito de compras hasta la entrega final, incluyendo procesamiento de pagos, fulfillment, envíos, facturación y devoluciones.

### Responsabilidades Principales

1. **Gestión de Carrito**
   - Agregar/remover productos del carrito
   - Aplicar descuentos y cupones
   - Calcular totales con impuestos
   - Persistencia de carrito (guest y usuarios autenticados)
   - Carrito abandonado con recuperación

2. **Procesamiento de Órdenes**
   - Creación de órdenes desde carrito
   - Validación de disponibilidad de stock (vía Inventory Service)
   - Reserva temporal de productos
   - Cálculo de costos de envío
   - Aplicación de reglas de negocio (mínimos, máximos, restricciones)

3. **Gestión de Pagos**
   - Integración con múltiples payment gateways (Stripe, PayPal, MercadoPago)
   - Procesamiento de pagos online
   - Pagos en tienda (cash, tarjeta local)
   - Reembolsos y cancelaciones
   - Detección de fraude básica

4. **Fulfillment y Picking**
   - Asignación de órdenes a bodegas
   - Generación de picking lists
   - Validación de packing
   - Confirmación de despacho
   - Integración con sistemas de warehouse

5. **Gestión de Envíos**
   - Creación de envíos y tracking
   - Integración con carriers (FedEx, UPS, DHL, local)
   - Notificaciones de estado de envío
   - Confirmación de entrega
   - Gestión de envíos fallidos

6. **Devoluciones y RMA**
   - Solicitudes de devolución
   - Generación de RMA (Return Merchandise Authorization)
   - Aprobación/rechazo de devoluciones
   - Reingreso a inventario
   - Procesamiento de reembolsos

7. **Facturación**
   - Generación de facturas electrónicas
   - Cumplimiento normativo (SII, SUNAT, SAT, etc.)
   - Notas de crédito y débito
   - Documentos tributarios
   - Integración con sistemas contables

## Características Principales

### Máquina de Estados de Orden

```mermaid
stateDiagram-v2
    [*] --> cart: Agregar productos
    cart --> pending: Checkout
    pending --> payment_pending: Crear orden
    payment_pending --> payment_failed: Pago fallido
    payment_pending --> confirmed: Pago exitoso
    payment_failed --> cancelled: Timeout/Cancel
    confirmed --> processing: Asignar fulfillment
    processing --> ready_to_ship: Picking completo
    ready_to_ship --> shipped: Enviar
    shipped --> delivered: Confirmar entrega
    delivered --> [*]

    confirmed --> cancelled: Cancelar (antes envío)
    processing --> cancelled: Cancelar (antes picking)
    delivered --> return_requested: Solicitar devolución
    return_requested --> returned: Devuelto
    returned --> refunded: Reembolsado
```

### Estados de Orden

| Estado | Descripción | Acciones Permitidas |
|--------|-------------|---------------------|
| `cart` | Productos en carrito | Agregar, remover, checkout |
| `pending` | Orden creada, esperando pago | Pagar, cancelar |
| `payment_pending` | Procesando pago | Esperar resultado |
| `payment_failed` | Pago rechazado | Reintentar, cancelar |
| `confirmed` | Pago confirmado | Asignar fulfillment, cancelar |
| `processing` | En proceso de picking | Cancelar (con aprobación) |
| `ready_to_ship` | Lista para envío | Enviar |
| `shipped` | Enviada | Actualizar tracking |
| `delivered` | Entregada | Solicitar devolución |
| `cancelled` | Cancelada | - |
| `return_requested` | Devolución solicitada | Aprobar/rechazar |
| `returned` | Productos devueltos | Procesar reembolso |
| `refunded` | Reembolso completado | - |

### Tipos de Orden

- **Online** - Compra desde e-commerce
- **POS** - Venta en tienda física
- **Phone** - Venta telefónica
- **B2B** - Orden corporativa
- **Subscription** - Suscripción recurrente

## Arquitectura Técnica

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| **Runtime** | Python | 3.11+ |
| **Framework** | FastAPI | 0.104+ |
| **ORM** | SQLAlchemy | 2.0+ |
| **Validación** | Pydantic | 2.0+ |
| **Base de Datos** | PostgreSQL | 15+ |
| **Cache** | Redis | 7.2+ |
| **Message Broker** | RabbitMQ | 3.12+ |
| **gRPC** | grpcio | 1.59+ |
| **Payment Gateway** | Stripe SDK | 7.0+ |
| **Task Queue** | Celery | 5.3+ |

### Puertos

- **HTTP REST API**: `8004`
- **gRPC**: `50054`
- **Health Check**: `8004/health`
- **Metrics**: `8004/metrics`

### Variables de Entorno

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/order_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=40

# Redis Cache
REDIS_URL=redis://localhost:6379/3
CACHE_TTL_CART=3600           # Cart cache: 1 hora
CACHE_TTL_ORDER=300           # Order cache: 5 minutos

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE=order_events
RABBITMQ_QUEUE_ORDERS=order_updates
RABBITMQ_QUEUE_PAYMENTS=payment_updates

# gRPC Clients
INVENTORY_GRPC_HOST=localhost
INVENTORY_GRPC_PORT=50053
CATALOG_GRPC_HOST=localhost
CATALOG_GRPC_PORT=50051

# Payment Gateways
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
MERCADOPAGO_ACCESS_TOKEN=...

# Shipping Carriers
FEDEX_API_KEY=...
UPS_API_KEY=...
DHL_API_KEY=...

# Business Logic
ORDER_RESERVATION_TTL_MINUTES=15
CART_EXPIRY_DAYS=30
MAX_ITEMS_PER_ORDER=100
MIN_ORDER_AMOUNT=10.00
FREE_SHIPPING_THRESHOLD=50.00
PAYMENT_RETRY_ATTEMPTS=3
ABANDONED_CART_HOURS=24
```

## Integraciones

### Con Inventory Service

```mermaid
sequenceDiagram
    participant OS as Order Service
    participant IS as Inventory Service
    participant RMQ as RabbitMQ

    OS->>IS: gRPC: CheckAvailability
    IS-->>OS: Available: true

    OS->>IS: gRPC: ReserveStock(ttl=15min)
    IS-->>OS: Reservation ID

    Note over OS: Customer pays

    OS->>RMQ: Publish order.confirmed
    RMQ->>IS: Consume event
    IS->>IS: Confirm reservation

    Note over OS: Order shipped

    OS->>RMQ: Publish order.shipped
    RMQ->>IS: Consume event
    IS->>IS: Deduct stock
```

### Con Catalog Service

```mermaid
sequenceDiagram
    participant OS as Order Service
    participant CS as Catalog Service
    participant RMQ as RabbitMQ

    OS->>CS: gRPC: GetProductDetails
    CS-->>OS: Product info + pricing

    OS->>CS: gRPC: ValidateVariant
    CS-->>OS: Valid + Active

    CS->>RMQ: Publish product.price_updated
    RMQ->>OS: Consume event
    OS->>OS: Invalidate cart cache
```

### Con Payment Gateway

```mermaid
sequenceDiagram
    participant C as Customer
    participant OS as Order Service
    participant PG as Payment Gateway
    participant RMQ as RabbitMQ

    C->>OS: POST /orders/{id}/pay
    OS->>PG: Create payment intent
    PG-->>OS: client_secret

    OS-->>C: client_secret
    C->>PG: Complete payment (frontend)

    PG->>OS: Webhook: payment.succeeded
    OS->>OS: Update order status
    OS->>RMQ: Publish order.payment_confirmed
```

## Modelo de Datos Resumen

### Entidades Principales

1. **Order** - Orden principal
2. **OrderItem** - Líneas de orden
3. **Cart** - Carrito de compras
4. **CartItem** - Productos en carrito
5. **Payment** - Transacciones de pago
6. **Shipment** - Envíos y tracking
7. **Return** - Devoluciones y RMA
8. **Invoice** - Facturas electrónicas
9. **FulfillmentTask** - Tareas de picking/packing

### Relaciones Clave

```mermaid
erDiagram
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o{ PAYMENT : has
    ORDER ||--o{ SHIPMENT : has
    ORDER ||--o{ RETURN : has
    ORDER ||--|| INVOICE : generates
    ORDER ||--o{ FULFILLMENT_TASK : requires
    CART ||--o{ CART_ITEM : contains
    SHIPMENT ||--o{ TRACKING_EVENT : has
    RETURN ||--o{ RETURN_ITEM : contains
```

## Eventos Publicados

### Order Events

- `order.created` - Orden creada
- `order.confirmed` - Pago confirmado
- `order.cancelled` - Orden cancelada
- `order.processing` - En fulfillment
- `order.shipped` - Enviada
- `order.delivered` - Entregada
- `order.refunded` - Reembolsada

### Payment Events

- `payment.pending` - Pago pendiente
- `payment.succeeded` - Pago exitoso
- `payment.failed` - Pago fallido
- `payment.refunded` - Reembolso procesado

### Shipment Events

- `shipment.created` - Envío creado
- `shipment.dispatched` - Despachado
- `shipment.in_transit` - En tránsito
- `shipment.delivered` - Entregado
- `shipment.failed` - Entrega fallida

### Return Events

- `return.requested` - Devolución solicitada
- `return.approved` - Devolución aprobada
- `return.received` - Producto recibido
- `return.refunded` - Reembolso completado

### Cart Events

- `cart.abandoned` - Carrito abandonado
- `cart.recovered` - Carrito recuperado

## Eventos Consumidos

- `inventory.stock.updated` - Actualizar disponibilidad
- `inventory.stock.depleted` - Producto agotado
- `catalog.product.updated` - Actualizar info producto
- `catalog.variant.updated` - Actualizar precios y detalles de variantes
- `payment.webhook.*` - Webhooks de payment gateway

## Casos de Uso Principales

### 1. Crear Orden desde Carrito

```http
POST /api/v1/orders/from-cart
{
  "cart_id": "cart_123",
  "shipping_address_id": "addr_456",
  "billing_address_id": "addr_456",
  "shipping_method": "standard",
  "payment_method": "stripe"
}
```

**Respuesta:**

```json
{
  "status": "success",
  "data": {
    "order_id": "order_789",
    "order_number": "ORD-2025-0001",
    "status": "pending",
    "total": 125.50,
    "items_count": 3,
    "reservation_expires_at": "2025-11-23T15:15:00Z",
    "payment_required": true
  }
}
```

### 2. Procesar Pago

```http
POST /api/v1/orders/{orderId}/payments
{
  "payment_method": "stripe",
  "payment_method_id": "pm_xxx",
  "amount": 125.50,
  "currency": "USD"
}
```

### 3. Consultar Estado de Orden

```http
GET /api/v1/orders/{orderId}
```

**Respuesta:**

```json
{
  "status": "success",
  "data": {
    "order_id": "order_789",
    "order_number": "ORD-2025-0001",
    "status": "shipped",
    "customer": {
      "customer_id": "cust_456",
      "name": "Juan Pérez",
      "email": "juan@example.com"
    },
    "items": [
      {
        "variant_id": "var_123",
        "sku": "PROD-001-RED-M",
        "product_name": "Camiseta Roja M",
        "quantity": 2,
        "unit_price": 25.00,
        "subtotal": 50.00
      }
    ],
    "totals": {
      "subtotal": 100.00,
      "shipping": 15.00,
      "tax": 10.50,
      "discount": 0.00,
      "total": 125.50
    },
    "payment": {
      "status": "paid",
      "method": "stripe",
      "paid_at": "2025-11-23T15:05:00Z"
    },
    "shipment": {
      "carrier": "FedEx",
      "tracking_number": "123456789",
      "status": "in_transit",
      "estimated_delivery": "2025-11-25"
    },
    "timeline": [
      {
        "status": "created",
        "timestamp": "2025-11-23T15:00:00Z"
      },
      {
        "status": "confirmed",
        "timestamp": "2025-11-23T15:05:00Z"
      },
      {
        "status": "shipped",
        "timestamp": "2025-11-24T10:00:00Z"
      }
    ]
  }
}
```

### 4. Solicitar Devolución

```http
POST /api/v1/orders/{orderId}/returns
{
  "reason": "wrong_size",
  "items": [
    {
      "order_item_id": "item_123",
      "quantity": 1,
      "reason_detail": "Talla muy pequeña"
    }
  ],
  "refund_method": "original_payment"
}
```

## Seguridad y Permisos

### Roles y Permisos

| Rol | Orders | Payments | Fulfillment | Returns |
|-----|--------|----------|-------------|---------|
| `order.customer` | Own only | Own only | View | Create |
| `order.operator` | Read, Update | Read | All | Approve |
| `order.manager` | All | All | All | All |
| `order.admin` | All | All | All | All |

### Validaciones de Seguridad

- Multi-tenancy por `organization_id`
- Clientes solo ven sus propias órdenes
- Validación de ownership en pagos
- Cifrado de información de pago (PCI DSS)
- Rate limiting en APIs públicas
- Validación de webhooks con firmas

## Métricas y Monitoring

### KPIs Principales

- **Conversion Rate** - Tasa de conversión de carritos a órdenes
- **Average Order Value (AOV)** - Valor promedio de orden
- **Cart Abandonment Rate** - Tasa de abandono de carrito
- **Order Fulfillment Time** - Tiempo desde orden a envío
- **Payment Success Rate** - Tasa de éxito de pagos
- **Return Rate** - Tasa de devoluciones

### Health Checks

```bash
# Basic health
GET /health

# Detailed readiness
GET /health/ready

# Database connectivity
GET /health/db

# External services
GET /health/integrations
```

## Próximos Pasos

- [Arquitectura](./arquitectura)
- [Modelo de Datos](./modelo-datos)
- [API: Orders](./api-orders)
- [API: Cart](./api-cart)
- [API: Payments](./api-payments)
- [State Machine](./state-machine)
