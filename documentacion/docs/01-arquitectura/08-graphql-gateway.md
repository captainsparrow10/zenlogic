---
sidebar_position: 9
---

# GraphQL Gateway con Strawberry

API unificada GraphQL para el frontend usando Strawberry (Python).

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend                                        │
│                          (Web / Mobile)                                      │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ GraphQL
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GraphQL Gateway                                       │
│                     (Strawberry + FastAPI)                                   │
│                          Port: 8000                                          │
│                                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Query    │  │  Mutation  │  │Subscription│  │  DataLoader│            │
│  │  Resolver  │  │  Resolver  │  │  Resolver  │  │   (N+1)    │            │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       ┌──────────┐       ┌──────────┐       ┌──────────┐
       │  Auth    │       │ Catalog  │       │Inventory │
       │ Service  │       │ Service  │       │ Service  │
       │  gRPC    │       │  gRPC    │       │  gRPC    │
       └──────────┘       └──────────┘       └──────────┘
```

## ¿Por qué Strawberry?

| Característica | Strawberry | Graphene | Ariadne |
|---------------|------------|----------|---------|
| Python 3.10+ | Nativo | Parcial | Sí |
| Type hints | Nativo | Decoradores | Schema-first |
| Async nativo | Sí | Plugin | Sí |
| DataLoaders | Integrado | Manual | Manual |
| FastAPI | Integrado | Plugin | Plugin |
| Federation | Sí | No | No |

**Elegimos Strawberry por**:
- Type hints nativos de Python
- Integración nativa con FastAPI
- DataLoaders para evitar N+1
- Soporte de Federation para escalar

## Configuración Base

### pyproject.toml

```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.1"
strawberry-graphql = {extras = ["fastapi"], version = "^0.215.0"}
uvicorn = {extras = ["standard"], version = "^0.24.0"}
grpcio = "^1.59.0"
grpcio-tools = "^1.59.0"
redis = "^5.0.0"
```

### main.py

```python
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
from app.schema import schema
from app.context import get_context

app = FastAPI(title="GraphQL Gateway")

graphql_app = GraphQLRouter(
    schema,
    context_getter=get_context,
    graphiql=True  # Playground en desarrollo
)

app.include_router(graphql_app, prefix="/graphql")

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

## Schema Definition

### Types

```python
# app/types/product.py
import strawberry
from typing import Optional, List
from decimal import Decimal

@strawberry.type
class ProductVariant:
    id: str
    sku: str
    barcode: Optional[str]
    sale_price: Decimal
    cost_price: Optional[Decimal]
    attributes: strawberry.JSON
    is_active: bool

    # Resolvers para campos relacionados
    @strawberry.field
    async def stock(self, info) -> Optional["Stock"]:
        """Obtener stock de Inventory Service."""
        loader = info.context.stock_loader
        return await loader.load(self.id)

    @strawberry.field
    async def current_price(self, info) -> "PriceInfo":
        """Obtener precio actual de Pricing Service."""
        loader = info.context.price_loader
        return await loader.load(self.id)

@strawberry.type
class Product:
    id: str
    title: str
    sku: str
    description: Optional[str]
    status: str
    product_type: Optional[str]
    has_variants: bool
    is_composite: bool

    @strawberry.field
    async def variants(self, info) -> List[ProductVariant]:
        """Cargar variantes del producto."""
        loader = info.context.variants_loader
        return await loader.load(self.id)

    @strawberry.field
    async def brand(self, info) -> Optional["Brand"]:
        """Cargar marca del producto."""
        if not self.brand_id:
            return None
        loader = info.context.brand_loader
        return await loader.load(self.brand_id)

@strawberry.type
class Stock:
    variant_id: str
    warehouse_id: str
    available_quantity: int
    reserved_quantity: int
    min_stock: int
    max_stock: int
    is_low_stock: bool

@strawberry.type
class PriceInfo:
    variant_id: str
    base_price: Decimal
    final_price: Decimal
    discount_amount: Decimal
    active_promotions: List[str]
```

### Input Types

```python
# app/types/inputs.py
import strawberry
from typing import Optional, List
from decimal import Decimal

@strawberry.input
class ProductFilterInput:
    status: Optional[str] = None
    product_type: Optional[str] = None
    brand_id: Optional[str] = None
    collection_id: Optional[str] = None
    search: Optional[str] = None

@strawberry.input
class CreateProductInput:
    title: str
    sku: str
    description: Optional[str] = None
    product_type: Optional[str] = None
    brand_id: Optional[str] = None
    has_variants: bool = True

@strawberry.input
class CreateVariantInput:
    product_id: str
    sku: str
    barcode: Optional[str] = None
    sale_price: Decimal
    cost_price: Optional[Decimal] = None
    attributes: strawberry.JSON = strawberry.field(default_factory=dict)

@strawberry.input
class SaleItemInput:
    variant_id: str
    quantity: int
    warehouse_id: str

@strawberry.input
class CreateSaleInput:
    local_id: str
    customer_id: Optional[str] = None
    items: List[SaleItemInput]
    payment_method: str
    coupon_code: Optional[str] = None
```

### Queries

```python
# app/schema/queries.py
import strawberry
from typing import List, Optional
from app.types import Product, ProductVariant, Stock, Customer
from app.services import catalog_client, inventory_client, customer_client

@strawberry.type
class Query:
    @strawberry.field
    async def products(
        self,
        info,
        filter: Optional[ProductFilterInput] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Product]:
        """Listar productos con filtros opcionales."""
        ctx = info.context
        return await catalog_client.list_products(
            organization_id=ctx.organization_id,
            filter=filter,
            limit=limit,
            offset=offset
        )

    @strawberry.field
    async def product(self, info, id: str) -> Optional[Product]:
        """Obtener producto por ID."""
        ctx = info.context
        return await catalog_client.get_product(
            organization_id=ctx.organization_id,
            product_id=id
        )

    @strawberry.field
    async def variant_by_barcode(
        self,
        info,
        barcode: str
    ) -> Optional[ProductVariant]:
        """Buscar variante por código de barras (para POS)."""
        ctx = info.context
        return await catalog_client.get_variant_by_barcode(
            organization_id=ctx.organization_id,
            barcode=barcode
        )

    @strawberry.field
    async def stock_availability(
        self,
        info,
        variant_ids: List[str],
        warehouse_id: str
    ) -> List[Stock]:
        """Verificar disponibilidad de stock."""
        ctx = info.context
        return await inventory_client.check_availability(
            organization_id=ctx.organization_id,
            variant_ids=variant_ids,
            warehouse_id=warehouse_id
        )

    @strawberry.field
    async def customer(self, info, id: str) -> Optional[Customer]:
        """Obtener cliente por ID."""
        ctx = info.context
        return await customer_client.get_customer(
            organization_id=ctx.organization_id,
            customer_id=id
        )

    @strawberry.field
    async def search_customers(
        self,
        info,
        query: str,
        limit: int = 10
    ) -> List[Customer]:
        """Buscar clientes por nombre, email o teléfono."""
        ctx = info.context
        return await customer_client.search(
            organization_id=ctx.organization_id,
            query=query,
            limit=limit
        )
```

### Mutations

```python
# app/schema/mutations.py
import strawberry
from typing import Optional
from app.types import Product, ProductVariant, Sale, SaleResult
from app.types.inputs import CreateProductInput, CreateVariantInput, CreateSaleInput

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_product(
        self,
        info,
        input: CreateProductInput
    ) -> Product:
        """Crear nuevo producto."""
        ctx = info.context
        ctx.require_permission("catalog:write")

        return await catalog_client.create_product(
            organization_id=ctx.organization_id,
            user_id=ctx.user_id,
            data=input
        )

    @strawberry.mutation
    async def create_variant(
        self,
        info,
        input: CreateVariantInput
    ) -> ProductVariant:
        """Crear nueva variante de producto."""
        ctx = info.context
        ctx.require_permission("catalog:write")

        return await catalog_client.create_variant(
            organization_id=ctx.organization_id,
            user_id=ctx.user_id,
            data=input
        )

    @strawberry.mutation
    async def create_sale(
        self,
        info,
        input: CreateSaleInput
    ) -> SaleResult:
        """
        Crear venta completa.

        Este mutation:
        1. Valida stock disponible
        2. Calcula precios con Pricing Service
        3. Reserva stock
        4. Crea orden en Order Service
        5. Descuenta inventario
        """
        ctx = info.context
        ctx.require_permission("pos:sell")

        # Validar stock
        for item in input.items:
            stock = await inventory_client.check_availability(
                organization_id=ctx.organization_id,
                variant_id=item.variant_id,
                warehouse_id=item.warehouse_id,
                quantity=item.quantity
            )
            if not stock.available:
                raise GraphQLError(f"Stock insuficiente para {item.variant_id}")

        # Calcular precios
        pricing = await pricing_client.calculate_cart(
            organization_id=ctx.organization_id,
            items=input.items,
            customer_id=input.customer_id,
            coupon_code=input.coupon_code
        )

        # Crear orden
        order = await order_client.create_sale(
            organization_id=ctx.organization_id,
            local_id=input.local_id,
            user_id=ctx.user_id,
            customer_id=input.customer_id,
            items=pricing.items,
            totals=pricing.totals,
            payment_method=input.payment_method
        )

        return SaleResult(
            order_id=order.id,
            order_number=order.order_number,
            total=pricing.totals.total,
            items_count=len(input.items)
        )

    @strawberry.mutation
    async def cancel_sale(
        self,
        info,
        order_id: str,
        reason: str
    ) -> bool:
        """Cancelar una venta."""
        ctx = info.context
        ctx.require_permission("pos:cancel")

        await order_client.cancel_order(
            organization_id=ctx.organization_id,
            order_id=order_id,
            user_id=ctx.user_id,
            reason=reason
        )

        return True
```

## DataLoaders (Evitar N+1)

```python
# app/dataloaders.py
from strawberry.dataloader import DataLoader
from typing import List, Optional
from app.services import catalog_client, inventory_client, pricing_client

async def load_variants(keys: List[str]) -> List[List[ProductVariant]]:
    """Cargar variantes por product_ids en batch."""
    variants_map = await catalog_client.get_variants_batch(keys)
    return [variants_map.get(key, []) for key in keys]

async def load_stock(keys: List[str]) -> List[Optional[Stock]]:
    """Cargar stock por variant_ids en batch."""
    stock_map = await inventory_client.get_stock_batch(keys)
    return [stock_map.get(key) for key in keys]

async def load_prices(keys: List[str]) -> List[PriceInfo]:
    """Cargar precios por variant_ids en batch."""
    prices_map = await pricing_client.get_prices_batch(keys)
    return [prices_map.get(key) for key in keys]

async def load_brands(keys: List[str]) -> List[Optional[Brand]]:
    """Cargar marcas por brand_ids en batch."""
    brands_map = await catalog_client.get_brands_batch(keys)
    return [brands_map.get(key) for key in keys]

def create_dataloaders():
    return {
        "variants_loader": DataLoader(load_fn=load_variants),
        "stock_loader": DataLoader(load_fn=load_stock),
        "price_loader": DataLoader(load_fn=load_prices),
        "brand_loader": DataLoader(load_fn=load_brands),
    }
```

## Context

```python
# app/context.py
from strawberry.fastapi import BaseContext
from fastapi import Request, HTTPException
from typing import Optional
from app.dataloaders import create_dataloaders
from app.services import auth_client

class Context(BaseContext):
    def __init__(self, request: Request):
        self.request = request
        self._user = None
        self._loaders = create_dataloaders()

    @property
    def variants_loader(self):
        return self._loaders["variants_loader"]

    @property
    def stock_loader(self):
        return self._loaders["stock_loader"]

    @property
    def price_loader(self):
        return self._loaders["price_loader"]

    @property
    def brand_loader(self):
        return self._loaders["brand_loader"]

    @property
    def organization_id(self) -> str:
        return self._user["organization_id"]

    @property
    def user_id(self) -> str:
        return self._user["user_id"]

    @property
    def permissions(self) -> list[str]:
        return self._user.get("permissions", [])

    def require_permission(self, permission: str):
        if permission not in self.permissions:
            raise PermissionError(f"Missing permission: {permission}")

async def get_context(request: Request) -> Context:
    ctx = Context(request)

    # Validar token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Missing authorization token")

    token = auth_header.split(" ")[1]

    # Validar con Auth Service
    user_info = await auth_client.verify_token(token)
    if not user_info:
        raise HTTPException(401, "Invalid token")

    ctx._user = user_info
    return ctx
```

## Schema Completo

```python
# app/schema/__init__.py
import strawberry
from app.schema.queries import Query
from app.schema.mutations import Mutation
from app.schema.subscriptions import Subscription

schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
    extensions=[
        # Tracing para debugging
        # strawberry.extensions.Tracing(),
    ]
)
```

## Subscriptions (WebSocket)

```python
# app/schema/subscriptions.py
import strawberry
from typing import AsyncGenerator
from app.types import StockAlert, OrderUpdate

@strawberry.type
class Subscription:
    @strawberry.subscription
    async def stock_alerts(
        self,
        info,
        warehouse_id: str
    ) -> AsyncGenerator[StockAlert, None]:
        """Alertas de stock bajo en tiempo real."""
        ctx = info.context
        async for alert in inventory_client.subscribe_alerts(
            organization_id=ctx.organization_id,
            warehouse_id=warehouse_id
        ):
            yield alert

    @strawberry.subscription
    async def order_updates(
        self,
        info,
        local_id: str
    ) -> AsyncGenerator[OrderUpdate, None]:
        """Actualizaciones de órdenes en tiempo real."""
        ctx = info.context
        async for update in order_client.subscribe_updates(
            organization_id=ctx.organization_id,
            local_id=local_id
        ):
            yield update
```

## Ejemplo de Query

```graphql
# Obtener producto con variantes, stock y precios
query GetProduct($id: ID!) {
  product(id: $id) {
    id
    title
    sku
    status
    brand {
      id
      name
    }
    variants {
      id
      sku
      barcode
      attributes
      stock {
        availableQuantity
        reservedQuantity
        isLowStock
      }
      currentPrice {
        basePrice
        finalPrice
        discountAmount
        activePromotions
      }
    }
  }
}

# Buscar variante por código de barras (POS)
query ScanBarcode($barcode: String!) {
  variantByBarcode(barcode: $barcode) {
    id
    sku
    product {
      title
    }
    currentPrice {
      finalPrice
    }
    stock {
      availableQuantity
    }
  }
}

# Crear venta
mutation CreateSale($input: CreateSaleInput!) {
  createSale(input: $input) {
    orderId
    orderNumber
    total
    itemsCount
  }
}
```

## Docker Compose

```yaml
services:
  graphql-gateway:
    build:
      context: ./graphql-gateway
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - AUTH_SERVICE_URL=auth-service:50051
      - CATALOG_SERVICE_URL=catalog-service:50052
      - INVENTORY_SERVICE_URL=inventory-service:50053
      - PRICING_SERVICE_URL=pricing-service:50058
      - ORDER_SERVICE_URL=order-service:50055
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - auth-service
      - catalog-service
      - inventory-service
    networks:
      - erp-network
```

## Próximos Pasos

- [API Gateway (Envoy)](./07-api-gateway.md)
- [Comunicación gRPC](./03-comunicacion-microservicios.md)
- [Catalog Service](/microservicios/catalog-service/overview)
