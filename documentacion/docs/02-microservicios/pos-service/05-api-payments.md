---
sidebar_position: 6
---

# API de Pagos

Endpoints para gestión de pagos en transacciones POS.

## Métodos de Pago Soportados

| Método | Código | Características |
|--------|--------|-----------------|
| Efectivo | `cash` | Requiere `received` y calcula `change_due` |
| Tarjeta | `card` | Requiere `card_last4` y `authorization_code` |
| Yappy | `yappy` | Requiere `reference` (número de transacción) |
| Transferencia | `transfer` | Requiere `reference` (número de comprobante) |
| Crédito | `credit` | Solo para clientes con crédito aprobado |

## Procesar Pago

Incluido en el endpoint de completar transacción.

```http
POST /api/v1/pos/transactions/{transactionId}/complete
```

**Request Body - Efectivo:**

```json
{
  "payments": [
    {
      "payment_method": "cash",
      "amount": 100.00,
      "received": 150.00
    }
  ]
}
```

**Request Body - Tarjeta:**

```json
{
  "payments": [
    {
      "payment_method": "card",
      "amount": 100.00,
      "card_brand": "visa",
      "card_last4": "4242",
      "authorization_code": "AUTH_123456",
      "terminal_id": "TERM_001"
    }
  ]
}
```

**Request Body - Pago Mixto:**

```json
{
  "payments": [
    {
      "payment_method": "cash",
      "amount": 50.00,
      "received": 50.00
    },
    {
      "payment_method": "yappy",
      "amount": 50.00,
      "reference": "YAPPY-123456789",
      "phone": "+507 6000-0000"
    }
  ]
}
```

## Calcular Vuelto

```http
POST /api/v1/pos/payments/calculate-change
```

**Request Body:**

```json
{
  "total_amount": 97.50,
  "received": 100.00
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "total_amount": 97.50,
    "received": 100.00,
    "change_due": 2.50,
    "bills_breakdown": {
      "1.00": 2,
      "0.50": 1
    }
  }
}
```

## Validaciones

### Pago Insuficiente

```json
{
  "error": {
    "code": "POS-2001",
    "type": "INSUFFICIENT_PAYMENT",
    "message": "Total de pagos es menor al total de la transacción",
    "details": {
      "required": 100.00,
      "provided": 95.00,
      "missing": 5.00
    }
  }
}
```

### Pago Excesivo

```json
{
  "error": {
    "code": "POS-2002",
    "type": "EXCESS_PAYMENT",
    "message": "Total de pagos excede el total de la transacción",
    "details": {
      "required": 100.00,
      "provided": 110.00,
      "excess": 10.00
    }
  }
}
```

### Crédito No Disponible

```json
{
  "error": {
    "code": "POS-2003",
    "type": "CREDIT_NOT_AVAILABLE",
    "message": "Cliente no tiene crédito disponible",
    "details": {
      "credit_limit": 500.00,
      "credit_used": 450.00,
      "credit_available": 50.00,
      "required": 100.00
    }
  }
}
```

## Próximos Pasos

- [Eventos Publicados](./06-eventos-publicados.md)
- [Integraciones](./08-integraciones.md)
