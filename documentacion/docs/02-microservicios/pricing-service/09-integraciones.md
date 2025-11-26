---
sidebar_position: 10
---

# Integraciones

## gRPC Service

### CalculatePrice

```python
async def calculate_price(
    variant_id: UUID,
    quantity: Decimal,
    customer_id: Optional[UUID] = None
) -> PriceCalculation:
    async with pricing_channel as channel:
        stub = PricingServiceStub(channel)

        response = await stub.CalculatePrice(
            CalculatePriceRequest(
                variant_id=str(variant_id),
                quantity=float(quantity),
                customer_id=str(customer_id) if customer_id else None
            )
        )

        return PriceCalculation(
            unit_price=Decimal(str(response.unit_price)),
            discount_amount=Decimal(str(response.discount_amount)),
            final_price=Decimal(str(response.final_price))
        )
```

### GetActivePromotions

```python
async def get_active_promotions(
    local_id: UUID
) -> List[Promotion]:
    async with pricing_channel as channel:
        stub = PricingServiceStub(channel)

        response = await stub.GetActivePromotions(
            GetActivePromotionsRequest(
                local_id=str(local_id)
            )
        )

        return [
            Promotion.from_proto(p)
            for p in response.promotions
        ]
```

## Consumidores

- **POS Service**: Cálculo de precios en tiempo real
- **Order Service**: Aplicar promociones en checkout
- **Catalog Service**: Mostrar precios y descuentos

## Próximos Pasos

- [Tipos de Promociones](./10-tipos-promociones.md)
- [Configuración](./11-configuracion.md)
