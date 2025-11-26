---
sidebar_position: 13
---

# Integraciones

## Visión General

Order Service se integra con múltiples servicios internos y externos para procesar órdenes completas.

## Integraciones gRPC (Internas)

### Auth Service

```protobuf
service AuthService {
  rpc VerifyToken(VerifyTokenRequest) returns (VerifyTokenResponse);
  rpc GetUserPermissions(GetPermissionsRequest) returns (GetPermissionsResponse);
}
```

**Uso:** Validar tokens JWT y verificar permisos antes de procesar operaciones.

### Inventory Service

```protobuf
service InventoryService {
  rpc CheckStock(CheckStockRequest) returns (CheckStockResponse);
  rpc ReserveStock(ReserveStockRequest) returns (ReserveStockResponse);
  rpc ReleaseStock(ReleaseStockRequest) returns (ReleaseStockResponse);
}
```

**Uso:** Verificar disponibilidad y reservar stock antes de confirmar órdenes.

### Pricing Service

```protobuf
service PricingService {
  rpc GetPrice(GetPriceRequest) returns (GetPriceResponse);
  rpc GetPricesBatch(GetPricesBatchRequest) returns (GetPricesBatchResponse);
}
```

**Uso:** Obtener precios actualizados de productos al crear órdenes.

### Customer Service

```protobuf
service CustomerService {
  rpc GetCustomer(GetCustomerRequest) returns (GetCustomerResponse);
  rpc CheckCreditAvailability(CreditRequest) returns (CreditResponse);
}
```

**Uso:** Validar cliente y verificar límites de crédito.

## Integración con RabbitMQ

### Exchanges

| Exchange | Tipo | Descripción |
|----------|------|-------------|
| `order_events` | topic | Eventos de órdenes |

### Eventos Publicados

- `order.created`
- `order.confirmed`
- `order.cancelled`
- `order.shipped`
- `order.delivered`
- `order.payment.succeeded`
- `order.payment.failed`

### Eventos Consumidos

| Evento | Origen | Acción |
|--------|--------|--------|
| `inventory.stock.reserved` | Inventory | Confirmar reserva |
| `inventory.stock.unavailable` | Inventory | Cancelar orden |
| `pricing.price.updated` | Pricing | Invalidar cache |

## Integración con Redis

**Uso:** Cache de precios y sesiones de carrito.

```python
# Ejemplo de cache de carrito
CART_KEY = f"cart:{session_id}"
CART_TTL = 3600  # 1 hora
```

## Próximos Pasos

- [Eventos Publicados](./eventos-publicados)
- [Eventos Consumidos](./eventos-consumidos)
- [State Machine](./state-machine)
