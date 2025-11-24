---
sidebar_position: 11
---

# Tipos de Promociones

## 1. Descuento Porcentual

```json
{
  "promotion_type": "percentage",
  "discount_value": 20.0,
  "applies_to": {
    "categories": ["electronics"],
    "min_purchase": 100.00
  }
}
```

**Ejemplo:** 20% de descuento en electrónica con compra mínima de $100

## 2. Descuento Fijo

```json
{
  "promotion_type": "fixed_amount",
  "discount_value": 10.00,
  "applies_to": {
    "all_products": true,
    "min_purchase": 50.00
  }
}
```

**Ejemplo:** $10 de descuento en compras sobre $50

## 3. Compra X Lleva Y (2x1, 3x2)

```json
{
  "promotion_type": "buy_x_get_y",
  "rules": {
    "buy_quantity": 2,
    "get_quantity": 1,
    "pay_for": 2
  },
  "applies_to": {
    "products": ["var_789", "var_456"]
  }
}
```

**Ejemplo:** Compra 2 y lleva 3 (paga 2)

## 4. Descuento por Volumen

```json
{
  "promotion_type": "volume_discount",
  "rules": {
    "tiers": [
      {"min_quantity": 10, "discount_percentage": 5},
      {"min_quantity": 50, "discount_percentage": 10},
      {"min_quantity": 100, "discount_percentage": 15}
    ]
  }
}
```

**Ejemplo:** 5% en 10+, 10% en 50+, 15% en 100+ unidades

## 5. Bundle (Paquete)

```json
{
  "promotion_type": "bundle",
  "rules": {
    "required_products": [
      {"variant_id": "var_001", "quantity": 1},
      {"variant_id": "var_002", "quantity": 1}
    ],
    "bundle_price": 45.00
  }
}
```

**Ejemplo:** Combo hamburguesa + bebida por $45 (normalmente $50)

## Priorización de Promociones

Cuando múltiples promociones aplican:

1. **Exclusivas**: Se aplica solo una (la de mayor descuento)
2. **Acumulables**: Se aplican todas secuencialmente
3. **Prioridad**: Campo `priority` define orden de aplicación

```python
if promotion.is_exclusive:
    return apply_best_promotion(applicable_promotions)
else:
    return apply_all_promotions(applicable_promotions)
```

## Próximos Pasos

- [Configuración](./11-configuracion.md)
- [API Calculation](./06-api-calculation.md)
