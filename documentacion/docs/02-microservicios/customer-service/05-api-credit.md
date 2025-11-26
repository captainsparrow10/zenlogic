---
sidebar_position: 6
---

# API de Crédito

Endpoints para gestión de crédito comercial (B2B).

## Base URL

```
POST   /api/v1/customers/{customerId}/credit/request
POST   /api/v1/customers/{customerId}/credit/approve
GET    /api/v1/customers/{customerId}/credit
POST   /api/v1/customers/{customerId}/credit/use
POST   /api/v1/customers/{customerId}/credit/payment
```

## Solicitar Crédito

```http
POST /api/v1/customers/{customerId}/credit/request
```

**Request Body:**

```json
{
  "requested_limit": 10000.00,
  "payment_term_days": 30,
  "business_info": {
    "business_name": "Constructora ABC",
    "tax_id": "RUC-123-456",
    "years_in_business": 5
  }
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "credit_account_id": "credit_001",
    "status": "pending",
    "requested_limit": 10000.00,
    "payment_term_days": 30,
    "created_at": "2025-11-24T10:00:00Z"
  }
}
```

## Aprobar Crédito

```http
POST /api/v1/customers/{customerId}/credit/approve
```

**Request Body:**

```json
{
  "credit_limit": 10000.00,
  "payment_term_days": 30,
  "approval_notes": "Cliente con buen historial"
}
```

**Requiere permiso:** `credit:approve`

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "credit_account_id": "credit_001",
    "status": "approved",
    "credit_limit": 10000.00,
    "credit_available": 10000.00,
    "payment_term_days": 30,
    "approved_at": "2025-11-24T11:00:00Z",
    "approved_by": "user_manager"
  }
}
```

## Usar Crédito

```http
POST /api/v1/customers/{customerId}/credit/use
```

**Request Body:**

```json
{
  "order_id": "order_789",
  "amount": 5000.00
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "usage_id": "usage_001",
    "amount": 5000.00,
    "credit_used": 5000.00,
    "credit_available": 5000.00,
    "due_date": "2025-12-24"
  }
}
```

## Registrar Pago

```http
POST /api/v1/customers/{customerId}/credit/payment
```

**Request Body:**

```json
{
  "amount": 2500.00,
  "payment_reference": "PAY-123456",
  "payment_date": "2025-11-24"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "payment_id": "payment_001",
    "amount": 2500.00,
    "credit_used": 2500.00,
    "credit_available": 7500.00
  }
}
```

## Próximos Pasos

- [Eventos Publicados](./06-eventos-publicados.md)
- [Integraciones](./08-integraciones.md)
