---
sidebar_position: 7
---

# Eventos Publicados

## Configuración

**Exchange:** `procurement_events`
**Type:** `topic`

## Eventos

### procurement.po.created

```json
{
  "event": "procurement.po.created",
  "version": "1.0",
  "timestamp": "2025-11-24T10:00:00Z",
  "data": {
    "po_id": "po_001",
    "po_number": "PO-2025-0001",
    "supplier_id": "supp_123",
    "total_amount": 1000.00,
    "delivery_date": "2025-12-01"
  }
}
```

### procurement.po.approved

```json
{
  "event": "procurement.po.approved",
  "version": "1.0",
  "timestamp": "2025-11-24T11:00:00Z",
  "data": {
    "po_id": "po_001",
    "po_number": "PO-2025-0001",
    "approved_by": "user_manager",
    "total_amount": 1000.00
  }
}
```

### procurement.goods_receipt.created

```json
{
  "event": "procurement.goods_receipt.created",
  "version": "1.0",
  "timestamp": "2025-12-01T09:00:00Z",
  "data": {
    "receipt_id": "gr_001",
    "receipt_number": "GR-2025-0001",
    "po_id": "po_001",
    "warehouse_id": "wh_101",
    "items": [
      {
        "variant_id": "var_789",
        "quantity_received": 100
      }
    ]
  }
}
```

**Consumidores:** Inventory Service (ya actualizado), Analytics

## Próximos Pasos

- [Eventos Consumidos](./07-eventos-consumidos.md)
- [Integraciones](./08-integraciones.md)
