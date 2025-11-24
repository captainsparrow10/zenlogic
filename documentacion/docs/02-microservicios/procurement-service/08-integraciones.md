---
sidebar_position: 9
---

# Integraciones

## Inventory Service Integration

### AddStock (al recibir mercancía)

```python
async def add_stock_from_receipt(
    receipt: GoodsReceipt
) -> bool:
    async with inventory_channel as channel:
        stub = InventoryServiceStub(channel)

        additions = [
            StockAddition(
                variant_id=str(item.variant_id),
                quantity=item.quantity_received,
                warehouse_id=str(receipt.warehouse_id),
                reason="goods_receipt",
                reference_id=str(receipt.receipt_id),
                unit_cost=item.unit_cost
            )
            for item in receipt.items
        ]

        response = await stub.AddStockBatch(
            AddStockBatchRequest(
                additions=additions
            )
        )

        return response.success
```

## Catalog Service Integration

### GetProductInfo

```python
async def get_product_for_po(
    variant_id: UUID
) -> ProductInfo:
    async with catalog_channel as channel:
        stub = CatalogServiceStub(channel)

        response = await stub.GetProduct(
            GetProductRequest(
                variant_id=str(variant_id)
            )
        )

        return ProductInfo.from_proto(response)
```

## Próximos Pasos

- [Configuración](./09-configuracion.md)
- [Overview](./00-overview.md)
