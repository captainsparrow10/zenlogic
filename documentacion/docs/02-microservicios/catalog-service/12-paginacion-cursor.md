---
sidebar_position: 13
---

# Paginación con Cursor

Implementación de paginación estilo Shopify usando cursores para escalabilidad.

## Concepto

La paginación basada en cursor usa un puntero al último registro en lugar de número de página:

**Ventajas**:
- Rendimiento constante O(1) sin importar el offset
- No hay resultados duplicados al agregar/eliminar registros
- Ideal para APIs públicas y feeds infinitos

**Desventajas**:
- No se puede saltar a página específica
- No hay número total de páginas

## Estructura de Response

```json
{
  "data": [...],
  "pagination": {
    "has_next": true,
    "has_previous": false,
    "next_cursor": "eyJpZCI6ImFiYy0xMjMiLCJjcmVhdGVkX2F0IjoiMjAyNS0xMS0yMyJ9",
    "previous_cursor": null,
    "count": 20
  }
}
```

## Implementación

### Cursor Encoding

```python
import base64
import json
from typing import Optional

def encode_cursor(product_id: str, created_at: str) -> str:
    """Codificar cursor en base64."""
    cursor_data = {
        "id": product_id,
        "created_at": created_at
    }
    json_str = json.dumps(cursor_data)
    return base64.b64encode(json_str.encode()).decode()

def decode_cursor(cursor: str) -> dict:
    """Decodificar cursor desde base64."""
    json_str = base64.b64decode(cursor.encode()).decode()
    return json.loads(json_str)
```

### Repository Query

```python
from sqlalchemy import select, and_
from typing import List, Tuple

class ProductRepository:
    async def list_with_cursor(
        self,
        organization_id: str,
        cursor: Optional[str] = None,
        limit: int = 20,
        direction: str = "next"
    ) -> Tuple[List[Product], Optional[str], Optional[str]]:
        """Listar productos con paginación por cursor."""

        query = select(Product).where(
            Product.organization_id == organization_id
        )

        # Aplicar cursor si existe
        if cursor:
            cursor_data = decode_cursor(cursor)
            cursor_id = cursor_data["id"]
            cursor_created = cursor_data["created_at"]

            if direction == "next":
                query = query.where(
                    and_(
                        Product.created_at >= cursor_created,
                        Product.id > cursor_id
                    )
                )
            else:  # previous
                query = query.where(
                    and_(
                        Product.created_at <= cursor_created,
                        Product.id < cursor_id
                    )
                ).order_by(Product.created_at.desc(), Product.id.desc())

        # Ordenar y limitar
        query = query.order_by(Product.created_at.asc(), Product.id.asc())
        query = query.limit(limit + 1)  # +1 para saber si hay más

        # Ejecutar
        result = await self.db.execute(query)
        products = list(result.scalars().all())

        # Calcular cursores
        has_next = len(products) > limit
        products = products[:limit]  # Remover el registro extra

        next_cursor = None
        previous_cursor = None

        if has_next and products:
            last_product = products[-1]
            next_cursor = encode_cursor(
                str(last_product.id),
                last_product.created_at.isoformat()
            )

        if cursor:  # Si hay cursor, hay página previa
            first_product = products[0]
            previous_cursor = encode_cursor(
                str(first_product.id),
                first_product.created_at.isoformat()
            )

        return products, next_cursor, previous_cursor
```

## Uso en Endpoint

```python
@router.get("/products")
async def list_products(
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    product_repo: ProductRepository = Depends()
):
    products, next_cursor, prev_cursor = await product_repo.list_with_cursor(
        organization_id=org_id,
        cursor=cursor,
        limit=limit
    )

    return {
        "data": products,
        "pagination": {
            "has_next": next_cursor is not None,
            "has_previous": prev_cursor is not None,
            "next_cursor": next_cursor,
            "previous_cursor": prev_cursor,
            "count": len(products)
        }
    }
```

## Próximos Pasos

- [API Products](/microservicios/catalog-service/api-products)
- [Cache Strategy](/microservicios/catalog-service/cache-strategy)
