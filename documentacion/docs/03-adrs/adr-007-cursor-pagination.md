---
sidebar_position: 8
---

# ADR-007: Cursor-based Pagination

**Estado**: Aceptado
**Fecha**: 2025-11-23
**Decisores**: Equipo de Arquitectura zenLogic

## Contexto

Catalog Service necesita paginar productos, variantes y opciones. Los requisitos son:

### Requisitos

1. **Escalabilidad**: Funcionar con millones de productos
2. **Performance**: Respuesta `<100ms` incluso en página 10,000
3. **Consistencia**: Evitar duplicados o items faltantes al paginar
4. **API-friendly**: Compatible con REST + GraphQL
5. **Sorting flexible**: Ordenar por diferentes campos (created_at, name, price)

### Problema con Offset Pagination

```sql
-- Página 1 (rápido)
SELECT * FROM products ORDER BY created_at DESC LIMIT 50 OFFSET 0;
-- Index scan: ~2ms

-- Página 100 (lento)
SELECT * FROM products ORDER BY created_at DESC LIMIT 50 OFFSET 5000;
-- PostgreSQL debe escanear 5000 rows + descartar + retornar 50
-- Time: ~50ms

-- Página 10,000 (muy lento)
SELECT * FROM products ORDER BY created_at DESC LIMIT 50 OFFSET 500000;
-- Time: ~2000ms (2 segundos!)
```

**Problema**: OFFSET es O(n) - escala linealmente con página number.

### Problema con Datasets Dinámicos

```python
# Usuario está en página 3
GET /products?limit=50&offset=100

# Entre requests, se crea un producto nuevo al inicio
# Resultado: Página 3 muestra items que ya vio en página 2 (duplicados)
# O peor: salta items sin mostrarlos
```

## Decisión

**Usaremos Cursor-based Pagination** (estilo Shopify/GraphQL Relay) para todas las listas en APIs REST.

### Formato de Cursor

```yaml
Cursor: Base64-encoded JSON con información de posición

Ejemplo:
  Cursor string: "eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI1LTExLTIzVDEwOjAwOjAwWiJ9"
  Decoded: {"id": "123", "created_at": "2025-11-23T10:00:00Z"}

Response format:
  {
    "data": [...],
    "page_info": {
      "has_next_page": true,
      "has_previous_page": false,
      "start_cursor": "abc...",
      "end_cursor": "xyz..."
    }
  }
```

## Alternativas Consideradas

### 1. Offset-based Pagination

**Formato**:
```
GET /products?limit=50&offset=100
```

**Pros**:
- Simple de implementar
- Usuarios entienden "página 5 de 100"
- Puede saltar a página arbitraria

**Contras**:
- **Performance O(n)**: Página 10,000 = escanear 500k rows
- **Inconsistencia**: Duplicados/faltantes si data cambia
- **No escala**: `>1M rows` = segundos de latencia
- **DB overhead**: OFFSET fuerza full scan

**Razón de rechazo**: No escala para millones de productos.

### 2. Keyset Pagination (WHERE > last_id)

**Formato**:
```sql
-- Primera página
SELECT * FROM products ORDER BY id LIMIT 50;

-- Siguiente página (last_id = 50)
SELECT * FROM products WHERE id > 50 ORDER BY id LIMIT 50;
```

**Pros**:
- **Performance O(1)**: Siempre rápido, usa índice
- **Consistente**: No duplicados
- Simple de implementar

**Contras**:
- **Solo funciona con IDs secuenciales**: UUID no es ordenado
- **Sorting limitado**: Solo puede ordenar por campo en WHERE
- **No backward pagination**: Difícil ir a página anterior
- **No sorting multi-campo**: ORDER BY created_at, name imposible

**Razón de rechazo**: UUIDs + sorting flexible requerido.

### 3. Elasticsearch Scroll API

**Formato**:
```json
POST /products/_search?scroll=1m
{
  "size": 50,
  "query": { "match_all": {} }
}
```

**Pros**:
- Diseñado para deep pagination
- Performance excelente
- Full-text search incluido

**Contras**:
- **Requiere Elasticsearch**: Stack adicional
- **Eventual consistency**: Elasticsearch no es source of truth
- **Scroll stateful**: Mantiene contexto en server (overhead)
- **Overkill**: No necesitamos full-text search en todos los endpoints

**Razón de rechazo**: Over-engineering. PostgreSQL es suficiente.

## Consecuencias

### Positivas

1. **Performance O(1) Constante**

```sql
-- Primera página (sin cursor)
SELECT * FROM products
ORDER BY created_at DESC, id ASC
LIMIT 51;  -- +1 para detectar has_next_page
-- Time: 2ms (index scan)

-- Página siguiente (cursor = {created_at: "2025-11-23", id: "uuid-123"})
SELECT * FROM products
WHERE (created_at, id) < ('2025-11-23T10:00:00Z', 'uuid-123')
ORDER BY created_at DESC, id ASC
LIMIT 51;
-- Time: 2ms (index scan)

-- Página 10,000 (mismo query pattern)
-- Time: SIGUE SIENDO 2ms! 🎉
```

**Índice requerido**:
```sql
CREATE INDEX idx_products_cursor ON products(created_at DESC, id ASC);
```

2. **Consistencia Total**

```python
# Request 1: Primera página
response = GET /products?limit=50
# Retorna productos 1-50 + end_cursor

# Entre requests: Se crean 100 productos nuevos

# Request 2: Siguiente página (usando end_cursor de request 1)
response = GET /products?after=cursor_from_request_1&limit=50
# Retorna productos 51-100 del snapshot original
# No duplicados, no faltantes ✅
```

3. **Sorting Flexible**

```python
# Ordenar por created_at DESC
GET /products?order_by=created_at&direction=desc&limit=50

# Ordenar por price ASC
GET /products?order_by=price&direction=asc&limit=50

# Cursor automáticamente incluye campo de sorting
# {created_at, id} vs {price, id}
```

4. **Backward Pagination**

```python
# Forward: después de cursor
GET /products?after=cursor_A&limit=50

# Backward: antes de cursor
GET /products?before=cursor_B&limit=50

# Implementación:
if before:
    query = query.where((created_at, id) > (cursor_created_at, cursor_id))
    query = query.order_by(created_at.asc(), id.asc())  # Reversed
    results = list(reversed(results))  # Re-reverse para user
```

5. **GraphQL Relay Compatible**

```graphql
query {
  products(first: 50, after: "cursor_abc") {
    edges {
      cursor
      node {
        id
        name
        price
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

### Negativas

1. **No "Jump to Page N"**

```python
# ❌ IMPOSIBLE con cursors
GET /products?page=100

# Solo puedes ir:
# - Primera página (sin cursor)
# - Siguiente página (after=cursor)
# - Página anterior (before=cursor)
```

**Mitigación**:
- Para UIs que necesitan "página 100", usar offset en backend
- Exponer cursor pagination en API pública
- UI muestra "Load More" o "Next/Previous", no "Page 5 of 100"

2. **Cursors Son Opacos para Usuarios**

```python
# Usuario no entiende qué significa cursor
after: "eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI1LTExLTIzVDEwOjAwOjAwWiJ9"

# vs offset que es intuitivo
offset: 100
```

**Mitigación**:
- Documentación clara
- UI abstrae cursors (botón "Next" maneja cursor internamente)

3. **Cursor Invalidation**

```python
# Cursor apunta a producto que fue eliminado
# Query: WHERE (created_at, id) < ('2025-11-23', 'deleted-product-id')
# Resultado: Funciona igual, el cursor sigue siendo válido
# Solo "salta" el producto eliminado

# PERO: Si campo de sorting cambia significativamente
# Ejemplo: producto tenía created_at = 2025-11-23, ahora = 2025-11-01
# Cursor puede retornar resultados inesperados
```

**Mitigación**:
- No actualizar campos de sorting (created_at es immutable)
- Si es necesario, invalidar cursors (retornar error, forzar primera página)

4. **Índice por Cada Combinación de Sorting**

```sql
-- Sorting por created_at
CREATE INDEX idx_products_created ON products(created_at DESC, id ASC);

-- Sorting por price
CREATE INDEX idx_products_price ON products(price ASC, id ASC);

-- Sorting por name
CREATE INDEX idx_products_name ON products(name ASC, id ASC);

-- Múltiples índices = más storage, más overhead en writes
```

**Mitigación**:
- Solo índices para sortings comunes (created_at, updated_at)
- Sortings raros (price, name) pueden usar offset fallback
- Monitorear uso de índices, eliminar los no usados

### Riesgos

1. **Cursor Tampering**

```python
# Usuario modifica cursor manualmente
# Original: {"id": "product-123", "created_at": "2025-11-23"}
# Modified: {"id": "product-999", "created_at": "2025-12-31"}

# Resultado: Query retorna desde posición falsa
# Impacto: Usuario ve datos incorrectos (pero solo SUS datos por RLS)
```

**Mitigación**:
- Firmar cursors con HMAC
  ```python
  import hmac
  import hashlib

  def sign_cursor(cursor_data: dict, secret: str) -> str:
      payload = json.dumps(cursor_data).encode()
      signature = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
      return base64.b64encode(payload + b':' + signature.encode()).decode()

  def verify_cursor(cursor: str, secret: str) -> dict:
      decoded = base64.b64decode(cursor)
      payload, signature = decoded.split(b':')
      expected_sig = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
      if signature.decode() != expected_sig:
          raise ValueError("Invalid cursor signature")
      return json.loads(payload)
  ```

2. **Complex Sorting = Complex Cursors**

```python
# Sorting por múltiples campos: ORDER BY price ASC, name ASC, id ASC
# Cursor: {"price": 19.99, "name": "Camiseta", "id": "uuid-123"}
# Query: WHERE (price, name, id) > (19.99, 'Camiseta', 'uuid-123')

# ✅ PostgreSQL soporta tuple comparison
# Pero debugging se complica
```

**Mitigación**:
- Limitar sorting a 2 campos max: [sort_field, id]
- Documentar claramente formato de cursor

## Implementación

### Encode/Decode Cursor

```python
# app/utils/cursor.py
import base64
import json
from typing import Any, Dict

def encode_cursor(data: Dict[str, Any]) -> str:
    """Encode cursor data to base64 string."""
    json_str = json.dumps(data, default=str)  # default=str para datetime
    return base64.b64encode(json_str.encode()).decode()

def decode_cursor(cursor: str) -> Dict[str, Any]:
    """Decode base64 cursor to dict."""
    try:
        json_str = base64.b64decode(cursor.encode()).decode()
        return json.loads(json_str)
    except Exception as e:
        raise ValueError(f"Invalid cursor: {e}")

# Ejemplo
cursor_data = {"id": "product-123", "created_at": "2025-11-23T10:00:00Z"}
cursor = encode_cursor(cursor_data)
# "eyJpZCI6InByb2R1Y3QtMTIzIiwiY3JlYXRlZF9hdCI6IjIwMjUtMTEtMjNUMTA6MDA6MDBaIn0="

decoded = decode_cursor(cursor)
# {"id": "product-123", "created_at": "2025-11-23T10:00:00Z"}
```

### Repository Method

```python
# app/repositories/product_repository.py
from typing import List, Optional
from sqlalchemy import select, and_, tuple_
from app.models.product import Product
from app.utils.cursor import encode_cursor, decode_cursor

class ProductRepository:
    async def find_paginated(
        self,
        organization_id: str,
        limit: int = 50,
        after: Optional[str] = None,
        order_by: str = "created_at",
        direction: str = "desc"
    ) -> Dict[str, Any]:
        """Cursor-based pagination."""

        # Base query
        query = select(Product).where(Product.organization_id == organization_id)

        # Aplicar cursor si existe
        if after:
            cursor_data = decode_cursor(after)
            cursor_value = cursor_data.get(order_by)
            cursor_id = cursor_data.get("id")

            # Tuple comparison: (created_at, id) < (cursor_created_at, cursor_id)
            if direction == "desc":
                query = query.where(
                    tuple_(
                        getattr(Product, order_by),
                        Product.id
                    ) < (cursor_value, cursor_id)
                )
            else:
                query = query.where(
                    tuple_(
                        getattr(Product, order_by),
                        Product.id
                    ) > (cursor_value, cursor_id)
                )

        # Ordenar
        if direction == "desc":
            query = query.order_by(
                getattr(Product, order_by).desc(),
                Product.id.desc()
            )
        else:
            query = query.order_by(
                getattr(Product, order_by).asc(),
                Product.id.asc()
            )

        # +1 para detectar has_next_page
        query = query.limit(limit + 1)

        # Ejecutar
        result = await self.db.execute(query)
        products = result.scalars().all()

        # Determinar has_next_page
        has_next_page = len(products) > limit
        if has_next_page:
            products = products[:limit]

        # Generar cursors
        start_cursor = None
        end_cursor = None
        if products:
            start_cursor = encode_cursor({
                "id": str(products[0].id),
                order_by: getattr(products[0], order_by).isoformat()
            })
            end_cursor = encode_cursor({
                "id": str(products[-1].id),
                order_by: getattr(products[-1], order_by).isoformat()
            })

        return {
            "data": products,
            "page_info": {
                "has_next_page": has_next_page,
                "has_previous_page": after is not None,
                "start_cursor": start_cursor,
                "end_cursor": end_cursor
            }
        }
```

### API Endpoint

```python
# app/api/products.py
from fastapi import APIRouter, Query
from app.schemas.pagination import PaginatedResponse

router = APIRouter()

@router.get("/products", response_model=PaginatedResponse[ProductResponse])
async def list_products(
    after: Optional[str] = Query(None, description="Cursor for pagination"),
    limit: int = Query(50, ge=1, le=100),
    order_by: str = Query("created_at", regex="^(created_at|name|base_price)$"),
    direction: str = Query("desc", regex="^(asc|desc)$"),
    organization_id: str = Depends(get_organization_id),
    product_repo: ProductRepository = Depends()
):
    """List products with cursor pagination."""

    result = await product_repo.find_paginated(
        organization_id=organization_id,
        limit=limit,
        after=after,
        order_by=order_by,
        direction=direction
    )

    return result
```

### Response Schema

```python
# app/schemas/pagination.py
from typing import Generic, TypeVar, List
from pydantic import BaseModel

T = TypeVar('T')

class PageInfo(BaseModel):
    has_next_page: bool
    has_previous_page: bool
    start_cursor: Optional[str]
    end_cursor: Optional[str]

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    page_info: PageInfo
```

## Ejemplo de Uso

### Request/Response

```bash
# Primera página
GET /api/v1/products?limit=50

{
  "data": [
    {
      "id": "prod-1",
      "name": "Camiseta A",
      "created_at": "2025-11-23T10:00:00Z"
    },
    // ... 49 more
  ],
  "page_info": {
    "has_next_page": true,
    "has_previous_page": false,
    "start_cursor": "eyJpZCI6InByb2QtMSIsImNyZWF0ZWRfYXQiOiIyMDI1LTExLTIzVDEwOjAwOjAwWiJ9",
    "end_cursor": "eyJpZCI6InByb2QtNTAiLCJjcmVhdGVkX2F0IjoiMjAyNS0xMS0yM1QwOTowMDowMFoifQ=="
  }
}

# Siguiente página
GET /api/v1/products?limit=50&after=eyJpZCI6InByb2QtNTAiLCJjcmVhdGVkX2F0IjoiMjAyNS0xMS0yM1QwOTowMDowMFoifQ==

{
  "data": [...],  // Productos 51-100
  "page_info": {
    "has_next_page": true,
    "has_previous_page": true,
    "start_cursor": "...",
    "end_cursor": "..."
  }
}
```

## Revisión Futura

Este ADR debe revisarse si:

1. Performance de cursor pagination supera 100ms p99
2. Usuarios demandan "saltar a página N" (considerar hybrid approach)
3. Sorting requirements se vuelven muy complejos

**Fecha de próxima revisión**: 2026-11-23 (1 año)

## Referencias

- [Shopify API Pagination](https://shopify.dev/api/usage/pagination-graphql)
- [GraphQL Relay Cursor Connections](https://relay.dev/graphql/connections.htm)
- [Postgres Row Comparison](https://www.postgresql.org/docs/current/functions-comparisons.html#ROW-WISE-COMPARISON)

## Próximos Pasos

- [Catalog Service - Paginación](/microservicios/catalog-service/paginacion-cursor)
- [Catalog Service - API Products](/microservicios/catalog-service/api-products)
