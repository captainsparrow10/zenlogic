---
sidebar_position: 14
---

# Estrategia de Cache

Implementación de cache con Redis para optimizar performance.

## Niveles de Cache

### 1. Cache de Entidades Completas

```python
# Pattern: {entity}:{org_id}:{entity_id}
"product:org-123:product-456"
"variant:org-123:variant-789"
"option:org-123:option-abc"
```

**TTL**: 10 minutos (600s)

### 2. Cache de Listados

```python
# Pattern: {entity}_list:{org_id}:{filters_hash}
"product_list:org-123:7a8b9c"
```

**TTL**: 5 minutos (300s)

### 3. Cache de Relaciones

```python
# Pattern: {entity}_by_{relation}:{org_id}:{relation_id}
"variants_by_product:org-123:product-456"
```

**TTL**: 10 minutos (600s)

### 4. Cache de Validaciones

```python
# Pattern: locals:{org_id}:{user_id}
"locals:org-123:user-456"
```

**TTL**: 1 hora (3600s)

## Implementación

### Redis Client

```python
import redis.asyncio as redis
import json
from typing import Optional, Any
from config.settings import settings

class RedisCache:
    def __init__(self):
        self.client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )

    async def get(self, key: str) -> Optional[Any]:
        """Obtener valor del cache."""
        value = await self.client.get(key)
        return json.loads(value) if value else None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int = 300
    ):
        """Guardar valor en cache."""
        await self.client.setex(
            key,
            ttl,
            json.dumps(value, default=str)
        )

    async def delete(self, key: str):
        """Eliminar clave del cache."""
        await self.client.delete(key)

    async def delete_pattern(self, pattern: str):
        """Eliminar todas las claves que coincidan con el patrón."""
        async for key in self.client.scan_iter(match=pattern):
            await self.client.delete(key)
```

### Cache Decorator

```python
from functools import wraps

def cached(key_prefix: str, ttl: int = 300):
    """Decorator para cachear resultados de funciones."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Construir cache key
            cache_key = f"{key_prefix}:{args[1]}"  # org_id

            # Intentar obtener del cache
            cached_value = await cache.get(cache_key)
            if cached_value:
                return cached_value

            # Ejecutar función
            result = await func(*args, **kwargs)

            # Guardar en cache
            await cache.set(cache_key, result, ttl)

            return result
        return wrapper
    return decorator

# Uso
@cached(key_prefix="product", ttl=600)
async def get_product(self, product_id: str, org_id: str):
    return await self.db.query(Product).get(product_id)
```

## Invalidación de Cache

### Por Evento

```python
async def handle_product_updated(event: dict):
    """Invalidar cache cuando se actualiza un producto."""
    product_id = event["payload"]["product_id"]
    org_id = event["payload"]["organization_id"]

    # Invalidar producto específico
    await cache.delete(f"product:{org_id}:{product_id}")

    # Invalidar listados relacionados
    await cache.delete_pattern(f"product_list:{org_id}:*")

    # Invalidar variantes del producto
    await cache.delete_pattern(f"variants_by_product:{org_id}:{product_id}")
```

### Cache-Aside Pattern

```python
async def update_product(product_id: str, data: dict, org_id: str):
    """Actualizar producto e invalidar cache."""

    # 1. Actualizar en DB
    product = await product_repo.update(product_id, data, org_id)

    # 2. Invalidar cache
    await cache.delete(f"product:{org_id}:{product_id}")

    # 3. Publicar evento (para otros servicios)
    await event_publisher.publish("catalog.product.updated", {...})

    return product
```

## Métricas

```python
from prometheus_client import Counter, Histogram

cache_hits = Counter("catalog_cache_hits_total", "Cache hits", ["entity"])
cache_misses = Counter("catalog_cache_misses_total", "Cache misses", ["entity"])

async def get_with_metrics(key: str, entity: str):
    value = await cache.get(key)
    if value:
        cache_hits.labels(entity=entity).inc()
    else:
        cache_misses.labels(entity=entity).inc()
    return value
```

## Próximos Pasos

- [Eventos Consumidos](/microservicios/catalog-service/eventos-consumidos)
- [Validación de Locales](/microservicios/catalog-service/validacion-locales)
