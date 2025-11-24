---
sidebar_position: 9
---

# Integraciones

Integraciones del Customer Service mediante gRPC.

## Servicios que Consumen Customer Service

### POS Service

```python
# Obtener información de cliente
customer = await customer_client.GetCustomer(
    customer_id="cust_123",
    organization_id="org_001"
)

# Acumular puntos
points = await customer_client.AddLoyaltyPoints(
    customer_id="cust_123",
    transaction_id="txn_456",
    amount=100.00
)
```

### Order Service

```python
# Verificar crédito disponible
credit_available = await customer_client.CheckCreditAvailability(
    customer_id="cust_456",
    amount=5000.00
)

# Usar crédito
if credit_available:
    await customer_client.UseCreditLimit(
        customer_id="cust_456",
        order_id="order_789",
        amount=5000.00
    )
```

### Pricing Service

```python
# Obtener segmento para descuentos personalizados
segment = await customer_client.GetCustomerSegment(
    customer_id="cust_123"
)

# Obtener nivel de lealtad
tier = await customer_client.GetLoyaltyTier(
    customer_id="cust_123"
)
```

## gRPC Service Definition

```protobuf
syntax = "proto3";

package customer.v1;

service CustomerService {
  rpc GetCustomer(GetCustomerRequest) returns (GetCustomerResponse);
  rpc AddLoyaltyPoints(AddPointsRequest) returns (AddPointsResponse);
  rpc RedeemLoyaltyPoints(RedeemPointsRequest) returns (RedeemPointsResponse);
  rpc CheckCreditAvailability(CheckCreditRequest) returns (CheckCreditResponse);
  rpc UseCreditLimit(UseCreditRequest) returns (UseCreditResponse);
  rpc GetCustomerSegment(GetSegmentRequest) returns (GetSegmentResponse);
}

message GetCustomerRequest {
  string customer_id = 1;
  string organization_id = 2;
}

message GetCustomerResponse {
  string customer_id = 1;
  string first_name = 2;
  string last_name = 3;
  string email = 4;
  string phone = 5;
  LoyaltyAccount loyalty = 6;
  CreditAccount credit = 7;
}
```

## Próximos Pasos

- [Configuración](./09-configuracion.md)
- [Overview](./00-overview.md)
