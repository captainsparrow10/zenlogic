---
sidebar_position: 23
---

# Integraciones

## Visión General

Catalog Service se integra con otros servicios del ERP mediante gRPC y eventos.

## Integraciones gRPC

### Auth Service (Cliente)

```protobuf
service AuthService {
  rpc VerifyToken(VerifyTokenRequest) returns (VerifyTokenResponse);
}
```

**Uso:** Validar tokens JWT en cada request.

### Como gRPC Server

Catalog Service expone endpoints gRPC para otros servicios:

```protobuf
service CatalogService {
  rpc GetProduct(GetProductRequest) returns (ProductResponse);
  rpc GetProductsBatch(GetProductsBatchRequest) returns (ProductsBatchResponse);
  rpc GetVariant(GetVariantRequest) returns (VariantResponse);
  rpc SearchProducts(SearchRequest) returns (SearchResponse);
}
```

**Consumidores:**
- POS Service - Búsqueda rápida de productos
- Order Service - Validar existencia de productos
- Inventory Service - Obtener info de variantes

## Integración con RabbitMQ

### Exchange

| Exchange | Tipo | Descripción |
|----------|------|-------------|
| `catalog_events` | topic | Eventos del catálogo |

### Eventos Publicados

| Evento | Cuándo |
|--------|--------|
| `catalog.product.created` | Nuevo producto |
| `catalog.product.updated` | Producto modificado |
| `catalog.product.deleted` | Producto eliminado |
| `catalog.variant.created` | Nueva variante |
| `catalog.variant.updated` | Variante modificada |
| `catalog.price_tier.updated` | Precio por volumen actualizado |

### Eventos Consumidos

| Evento | Origen | Acción |
|--------|--------|--------|
| `auth.user.deactivated` | Auth | Invalidar cache de permisos |
| `pricing.price.updated` | Pricing | Invalidar cache de precios |

## Integración con Redis

**Uso:** Cache de productos y variantes frecuentemente consultados.

```python
PRODUCT_CACHE_KEY = f"product:{organization_id}:{product_id}"
PRODUCT_CACHE_TTL = 3600  # 1 hora

VARIANT_CACHE_KEY = f"variant:{organization_id}:{variant_id}"
VARIANT_CACHE_TTL = 3600
```

## Integración con PostgreSQL

Base de datos principal para almacenamiento persistente.

**Tablas principales:**
- `products`
- `product_variants`
- `product_options`
- `product_option_values`
- `brands`
- `collections`
- `product_tags`

## Próximos Pasos

- [Eventos Publicados](./eventos-publicados)
- [Eventos Consumidos](./eventos-consumidos)
- [gRPC Server](./grpc-server)
