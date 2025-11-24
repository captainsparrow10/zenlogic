---
sidebar_position: 15
---

# Flujos de Negocio

Diagramas de flujos principales del Catalog Service.

## Flujo de Creación de Producto

```mermaid
sequenceDiagram
    participant User
    participant API
    participant ProductService
    participant AuthClient
    participant ProductRepo
    participant EventPub
    participant Cache

    User->>API: POST /products<br/>{name, sku, price}
    API->>AuthClient: verify_token(token)
    AuthClient-->>API: user_data

    API->>ProductService: create_product(data)
    ProductService->>ProductRepo: check_sku_exists(sku, org_id)

    alt SKU ya existe
        ProductRepo-->>ProductService: SKU exists
        ProductService-->>API: 409 SKU_ALREADY_EXISTS
        API-->>User: 409 Conflict
    end

    ProductService->>ProductRepo: create(product)
    ProductRepo-->>ProductService: Product

    ProductService->>EventPub: publish("catalog.product.created")
    ProductService->>Cache: delete("product_list:org_id:*")

    ProductService-->>API: Product
    API-->>User: 201 Created + Product
```

## Flujo de Consulta con Cache

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Cache
    participant ProductRepo
    participant DB

    User->>API: GET /products/{id}
    API->>Cache: GET product:org_id:id

    alt Cache hit
        Cache-->>API: Product data
        API-->>User: 200 OK + Product
    else Cache miss
        Cache-->>API: None
        API->>ProductRepo: get_by_id(id, org_id)
        ProductRepo->>DB: SELECT * FROM products
        DB-->>ProductRepo: Product
        ProductRepo-->>API: Product

        API->>Cache: SET product:org_id:id<br/>TTL=600s

        API-->>User: 200 OK + Product
    end
```

## Flujo de Creación de Variantes

```mermaid
sequenceDiagram
    participant User
    participant API
    participant VariantService
    participant ProductRepo
    participant OptionRepo
    participant VariantRepo
    participant EventPub

    User->>API: POST /products/{id}/variants<br/>{sku, price, options}
    API->>VariantService: create_variant(data)

    VariantService->>ProductRepo: get_by_id(product_id)

    alt Producto no existe
        ProductRepo-->>VariantService: None
        VariantService-->>API: 404 PRODUCT_NOT_FOUND
        API-->>User: 404 Not Found
    end

    loop Para cada option
        VariantService->>OptionRepo: get_by_id(option_id)
        alt Opción no existe
            OptionRepo-->>VariantService: None
            VariantService-->>API: 404 OPTION_NOT_FOUND
            API-->>User: 404 Not Found
        end
    end

    VariantService->>VariantRepo: check_sku_exists(sku)

    alt SKU duplicado
        VariantRepo-->>VariantService: Exists
        VariantService-->>API: 409 SKU_EXISTS
        API-->>User: 409 Conflict
    end

    VariantService->>VariantRepo: create(variant)
    VariantRepo-->>VariantService: Variant

    VariantService->>EventPub: publish("catalog.variant.created")

    VariantService-->>API: Variant
    API-->>User: 201 Created + Variant
```

## Flujo de Validación de Local

```mermaid
sequenceDiagram
    participant User
    participant Middleware
    participant Cache
    participant AuthClient
    participant ProductService

    User->>Middleware: GET /products?local_id=123
    Middleware->>Cache: GET locals:org_id:user_id

    alt Cache hit
        Cache-->>Middleware: [local-1, local-2, local-3]
    else Cache miss
        Middleware->>AuthClient: GetUserLocals(user_id)
        AuthClient-->>Middleware: [local-1, local-2, local-3]
        Middleware->>Cache: SETEX locals:org_id:user_id
    end

    Middleware->>Middleware: Verificar local-123 en lista

    alt Local válido
        Middleware->>ProductService: Continuar request
        ProductService-->>User: 200 OK + Products
    else Local inválido
        Middleware-->>User: 403 LOCAL_ACCESS_DENIED
    end
```

## Flujo de Consumo de Eventos

```mermaid
sequenceDiagram
    participant AuthService
    participant RabbitMQ
    participant CatalogConsumer
    participant Cache
    participant ProductRepo

    AuthService->>RabbitMQ: publish("auth.organization.suspended")
    RabbitMQ->>CatalogConsumer: deliver message

    CatalogConsumer->>CatalogConsumer: handle_organization_suspended(event)

    CatalogConsumer->>ProductRepo: suspend_all_products(org_id)
    ProductRepo-->>CatalogConsumer: Updated count

    CatalogConsumer->>Cache: delete_pattern("*:org_id:*")

    CatalogConsumer->>CatalogConsumer: Log warning
    CatalogConsumer->>RabbitMQ: ACK message
```

## Flujo de Creación de Brand

```mermaid
sequenceDiagram
    participant User
    participant API
    participant BrandService
    participant BrandRepo
    participant EventPub
    participant Cache

    User->>API: POST /brands<br/>{name, slug, logo_url}
    API->>BrandService: create_brand(data, org_id)

    BrandService->>BrandService: validate_brand_data(data)

    alt Datos inválidos
        BrandService-->>API: 400 INVALID_BRAND_DATA
        API-->>User: 400 Bad Request
    end

    BrandService->>BrandRepo: check_slug_exists(slug, org_id)

    alt Slug duplicado
        BrandRepo-->>BrandService: True
        BrandService-->>API: 409 BRAND_SLUG_EXISTS
        API-->>User: 409 Conflict
    end

    BrandService->>BrandRepo: create(brand)
    BrandRepo-->>BrandService: Brand

    BrandService->>EventPub: publish("catalog.brand.created")
    BrandService->>Cache: delete("brand_list:org_id:*")

    BrandService-->>API: Brand
    API-->>User: 201 Created + Brand
```

## Flujo de Jerarquía de Collections

```mermaid
sequenceDiagram
    participant User
    participant API
    participant CollectionService
    participant CollectionRepo
    participant EventPub

    User->>API: POST /collections<br/>{name, parent_id}
    API->>CollectionService: create_collection(data)

    alt parent_id proporcionado
        CollectionService->>CollectionRepo: get_by_id(parent_id)

        alt Parent no existe
            CollectionRepo-->>CollectionService: None
            CollectionService-->>API: 404 COLLECTION_NOT_FOUND
            API-->>User: 404 Not Found
        end

        CollectionService->>CollectionRepo: get_descendants(parent_id)
        CollectionRepo-->>CollectionService: [descendant_ids]

        CollectionService->>CollectionService: Verificar referencia circular

        alt Referencia circular detectada
            CollectionService-->>API: 400 CIRCULAR_COLLECTION_REFERENCE
            API-->>User: 400 Bad Request
        end
    end

    CollectionService->>CollectionRepo: check_slug_exists(slug)

    alt Slug duplicado
        CollectionRepo-->>CollectionService: True
        CollectionService-->>API: 409 COLLECTION_SLUG_EXISTS
        API-->>User: 409 Conflict
    end

    CollectionService->>CollectionRepo: create(collection)
    CollectionRepo-->>CollectionService: Collection

    CollectionService->>EventPub: publish("catalog.collection.created")

    CollectionService-->>API: Collection
    API-->>User: 201 Created + Collection
```

## Flujo de Asignación de Tags

```mermaid
sequenceDiagram
    participant User
    participant API
    participant ProductService
    participant ProductRepo
    participant TagRepo
    participant ProductTagRepo
    participant EventPub
    participant Cache

    User->>API: POST /products/{id}/tags<br/>{tag_ids: [1, 2, 3]}
    API->>ProductService: add_tags_to_product(product_id, tag_ids)

    ProductService->>ProductRepo: get_by_id(product_id, org_id)

    alt Producto no existe
        ProductRepo-->>ProductService: None
        ProductService-->>API: 404 PRODUCT_NOT_FOUND
        API-->>User: 404 Not Found
    end

    loop Para cada tag_id
        ProductService->>TagRepo: get_by_id(tag_id, org_id)

        alt Tag no existe
            TagRepo-->>ProductService: None
            ProductService-->>API: 404 TAG_NOT_FOUND
            API-->>User: 404 Not Found
        end
    end

    ProductService->>ProductTagRepo: get_existing_tags(product_id)
    ProductTagRepo-->>ProductService: [existing_tag_ids]

    ProductService->>ProductService: filter_new_tags(tag_ids, existing)

    loop Para cada nuevo tag
        ProductService->>ProductTagRepo: create(product_id, tag_id)
    end

    ProductService->>EventPub: publish("catalog.product.tags.added")
    ProductService->>Cache: delete("product:org_id:product_id")

    ProductService-->>API: {added_count: 2}
    API-->>User: 200 OK + resultado
```

## Flujo de Cálculo de Price Tier

```mermaid
sequenceDiagram
    participant User
    participant API
    participant PricingService
    participant VariantRepo
    participant PriceTierRepo
    participant Cache

    User->>API: GET /variants/{id}/calculate-price?quantity=75
    API->>PricingService: calculate_price(variant_id, quantity, org_id)

    PricingService->>Cache: GET price:variant_id:quantity

    alt Cache hit
        Cache-->>PricingService: calculated_price
        PricingService-->>API: price_data
        API-->>User: 200 OK + price
    end

    PricingService->>VariantRepo: get_by_id(variant_id, org_id)

    alt Variante no existe
        VariantRepo-->>PricingService: None
        PricingService-->>API: 404 VARIANT_NOT_FOUND
        API-->>User: 404 Not Found
    end

    VariantRepo-->>PricingService: Variant(base_price)

    PricingService->>PriceTierRepo: get_rules_for_variant(variant_id)
    PriceTierRepo-->>PricingService: [rules ordered by min_qty DESC]

    PricingService->>PricingService: Filtrar rules donde quantity >= min_qty
    PricingService->>PricingService: Seleccionar primera regla (mayor min_qty)

    alt Regla encontrada
        PricingService->>PricingService: use rule.price
    else Sin regla
        PricingService->>PricingService: use variant.price
    end

    PricingService->>PricingService: calculate_total(price, quantity, tax)

    PricingService->>Cache: SETEX price:variant_id:quantity<br/>TTL=300s

    PricingService-->>API: {unit_price, quantity, subtotal, tax, total}
    API-->>User: 200 OK + cálculo completo
```

## Flujo de Upload de Imagen

```mermaid
sequenceDiagram
    participant User
    participant API
    participant ImageService
    participant ProductRepo
    participant S3Client
    participant ThumbnailService
    participant ImageRepo
    participant EventPub
    participant CDN

    User->>API: POST /products/{id}/images<br/>multipart/form-data
    API->>ImageService: upload_image(file, product_id)

    ImageService->>ImageService: validate_file(size, format, dimensions)

    alt Archivo inválido
        ImageService-->>API: 400/413/422 Error
        API-->>User: Error de validación
    end

    ImageService->>ProductRepo: get_by_id(product_id)

    alt Producto no existe
        ProductRepo-->>ImageService: None
        ImageService-->>API: 404 PRODUCT_NOT_FOUND
        API-->>User: 404 Not Found
    end

    ImageService->>ImageRepo: count_images(product_id)

    alt Límite alcanzado (10 imágenes)
        ImageRepo-->>ImageService: count=10
        ImageService-->>API: 422 MAX_IMAGES_EXCEEDED
        API-->>User: 422 Unprocessable
    end

    ImageService->>ImageService: generate_filename(uuid + ext)

    ImageService->>S3Client: upload(file, bucket, key)
    S3Client-->>ImageService: s3_url

    par Generar thumbnails
        ImageService->>ThumbnailService: create_thumbnail(file, "large", 1200x1200)
        ThumbnailService->>S3Client: upload(large_thumb)
        and
        ImageService->>ThumbnailService: create_thumbnail(file, "medium", 600x600)
        ThumbnailService->>S3Client: upload(medium_thumb)
        and
        ImageService->>ThumbnailService: create_thumbnail(file, "thumb", 150x150)
        ThumbnailService->>S3Client: upload(thumb)
    end

    ImageService->>CDN: invalidate_cache(product_id)

    ImageService->>ImageRepo: create(image_data)
    ImageRepo-->>ImageService: Image

    ImageService->>EventPub: publish("catalog.product.image.uploaded")

    ImageService-->>API: Image + CDN URLs
    API-->>User: 201 Created + Image
```

## Flujo de Reordenamiento de Imágenes

```mermaid
sequenceDiagram
    participant User
    participant API
    participant ImageService
    participant ProductRepo
    participant ImageRepo
    participant EventPub
    participant Cache

    User->>API: PUT /products/{id}/images/reorder<br/>{order: [img3, img1, img2]}
    API->>ImageService: reorder_images(product_id, image_order)

    ImageService->>ProductRepo: get_by_id(product_id, org_id)

    alt Producto no existe
        ProductRepo-->>ImageService: None
        ImageService-->>API: 404 PRODUCT_NOT_FOUND
        API-->>User: 404 Not Found
    end

    ImageService->>ImageRepo: get_all_by_product(product_id)
    ImageRepo-->>ImageService: [existing_images]

    ImageService->>ImageService: validate_image_ids(order, existing)

    alt IDs inválidos
        ImageService-->>API: 400 INVALID_IMAGE_IDS
        API-->>User: 400 Bad Request
    end

    ImageService->>ImageRepo: begin_transaction()

    loop Para cada imagen con nuevo índice
        ImageService->>ImageRepo: update(image_id, sort_order=index)
    end

    alt Primera imagen cambió
        ImageService->>ProductRepo: update_primary_image(product_id, new_first_id)
    end

    ImageService->>ImageRepo: commit_transaction()

    ImageService->>EventPub: publish("catalog.product.images.reordered")
    ImageService->>Cache: delete("product:org_id:product_id")

    ImageService-->>API: {reordered_count: 5}
    API-->>User: 200 OK + resultado
```

## Mejores Prácticas

### Validación de Integridad

```python
# Validar referencias circulares en colecciones
def check_circular_reference(collection_id: UUID, parent_id: UUID) -> bool:
    visited = set()
    current = parent_id

    while current:
        if current == collection_id:
            return True  # Circular reference detected
        if current in visited:
            break
        visited.add(current)
        current = get_parent_id(current)

    return False
```

### Optimización de Consultas

```python
# Usar selectinload para evitar N+1 en relaciones
from sqlalchemy.orm import selectinload

products = db.query(Product)\
    .options(
        selectinload(Product.brand),
        selectinload(Product.tags),
        selectinload(Product.images)
    )\
    .filter(Product.organization_id == org_id)\
    .all()
```

### Manejo de Transacciones

```python
# Reordenamiento atómico de imágenes
async def reorder_images(product_id: UUID, image_order: list[UUID]):
    async with db.begin():  # Transaction context
        for index, image_id in enumerate(image_order):
            await db.execute(
                update(ProductImage)
                .where(ProductImage.image_id == image_id)
                .values(sort_order=index)
            )

        # Actualizar imagen principal si cambió
        first_image = image_order[0]
        await update_primary_image(product_id, first_image)
```

### Cache con Invalidación Inteligente

```python
# Invalidar solo caches relacionadas
async def invalidate_product_caches(product_id: UUID, org_id: UUID):
    patterns = [
        f"product:{org_id}:{product_id}",
        f"product_list:{org_id}:*",
        f"collection_products:{org_id}:*",
    ]

    for pattern in patterns:
        await cache.delete_pattern(pattern)
```

## Próximos Pasos

- [Eventos Publicados](/microservicios/catalog-service/eventos-publicados)
- [Eventos Consumidos](/microservicios/catalog-service/eventos-consumidos)
- [Arquitectura](/microservicios/catalog-service/arquitectura)
