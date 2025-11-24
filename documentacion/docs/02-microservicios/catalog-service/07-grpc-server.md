---
sidebar_position: 7
---

# gRPC Server

Servidor gRPC del Catalog Service para comunicación síncrona con otros microservicios.

## Configuración

**Puerto gRPC**: `50052`
**Servicio**: `CatalogService`

```python
# config/settings.py
GRPC_PORT = 50052
GRPC_MAX_WORKERS = 10
GRPC_REFLECTION = True  # Solo en desarrollo
```

## Proto Definition

```protobuf
syntax = "proto3";

package catalog;

service CatalogService {
    // Validar disponibilidad de variante
    rpc ValidateVariant(ValidateVariantRequest) returns (ValidateVariantResponse);

    // Obtener detalles completos de producto
    rpc GetProductDetails(GetProductDetailsRequest) returns (GetProductDetailsResponse);

    // Obtener múltiples variantes (batch)
    rpc GetVariantsBatch(GetVariantsBatchRequest) returns (GetVariantsBatchResponse);

    // Validar múltiples variantes (batch)
    rpc ValidateVariantsBatch(ValidateVariantsBatchRequest) returns (ValidateVariantsBatchResponse);
}

// ============================================================================
// ValidateVariant - Usado por Inventory Service
// ============================================================================

message ValidateVariantRequest {
    string organization_id = 1;
    string variant_id = 2;
}

message ValidateVariantResponse {
    bool exists = 1;
    bool is_active = 2;
    string variant_id = 3;
    string product_id = 4;
    string sku = 5;
    string barcode = 6;
    string warehouse_id = 7;
    bool track_inventory = 8;
    int32 default_min_stock = 9;
    int32 default_max_stock = 10;
    double price = 11;
    string message = 12;
}

// ============================================================================
// GetProductDetails - Usado por Order Service y otros
// ============================================================================

message GetProductDetailsRequest {
    string organization_id = 1;
    string product_id = 2;
    bool include_variants = 3;  // default: true
    bool include_images = 4;    // default: true
}

message GetProductDetailsResponse {
    bool success = 1;
    Product product = 2;
    string message = 3;
}

message Product {
    string product_id = 1;
    string organization_id = 2;
    string local_id = 3;
    string title = 4;
    string sku = 5;
    string barcode = 6;
    string description = 7;
    string status = 8;
    string product_type = 9;
    string unit_of_measure = 10;
    int32 alert_stock = 11;
    Brand brand = 12;
    repeated ProductImage images = 13;
    repeated Variant variants = 14;
    repeated Tag tags = 15;
    repeated Collection collections = 16;
}

message Brand {
    string brand_id = 1;
    string name = 2;
    string slug = 3;
    string description = 4;
}

message ProductImage {
    string image_id = 1;
    string url = 2;
    string alt = 3;
    int32 position = 4;
}

message Variant {
    string variant_id = 1;
    string product_id = 2;
    string sku = 3;
    string barcode = 4;
    double sale_price = 5;
    double cost_price = 6;
    double tax = 7;
    double weight = 8;
    Dimensions dimensions = 9;
    string lot_number = 10;
    int32 stock_total = 11;
    int32 stock_available = 12;
    int32 stock_reserved = 13;
    string warehouse_id = 14;
    string vendor = 15;
    bool track_inventory = 16;
    int32 default_min_stock = 17;
    int32 default_max_stock = 18;
    repeated VariantImage images = 19;
}

message Dimensions {
    double length = 1;
    double width = 2;
    double height = 3;
}

message VariantImage {
    string image_id = 1;
    string url = 2;
    string alt = 3;
    int32 position = 4;
}

message Tag {
    string tag_id = 1;
    string name = 2;
}

message Collection {
    string collection_id = 1;
    string name = 2;
    string slug = 3;
}

// ============================================================================
// Batch Operations
// ============================================================================

message GetVariantsBatchRequest {
    string organization_id = 1;
    repeated string variant_ids = 2;
}

message GetVariantsBatchResponse {
    bool success = 1;
    repeated Variant variants = 2;
    repeated string not_found_ids = 3;
    string message = 4;
}

message ValidateVariantsBatchRequest {
    string organization_id = 1;
    repeated string variant_ids = 2;
}

message VariantValidation {
    string variant_id = 1;
    bool exists = 2;
    bool is_active = 3;
    string sku = 4;
    string barcode = 5;
    string warehouse_id = 6;
    bool track_inventory = 7;
    int32 default_min_stock = 8;
    int32 default_max_stock = 9;
}

message ValidateVariantsBatchResponse {
    bool success = 1;
    repeated VariantValidation validations = 2;
    string message = 3;
}
```

## Implementación Python

### Server Setup

```python
# app/grpc/server.py
import grpc
from concurrent import futures
import logging
from app.grpc import catalog_pb2_grpc
from app.grpc.servicers.catalog_servicer import CatalogServicer
from config.settings import settings

logger = logging.getLogger(__name__)

async def serve():
    """Iniciar servidor gRPC."""
    server = grpc.aio.server(
        futures.ThreadPoolExecutor(max_workers=settings.grpc_max_workers)
    )

    # Registrar servicer
    catalog_pb2_grpc.add_CatalogServiceServicer_to_server(
        CatalogServicer(),
        server
    )

    # Configurar puerto
    server.add_insecure_port(f'[::]:{settings.grpc_port}')

    # Habilitar reflection (solo desarrollo)
    if settings.grpc_reflection:
        from grpc_reflection.v1alpha import reflection
        SERVICE_NAMES = (
            catalog_pb2.DESCRIPTOR.services_by_name['CatalogService'].full_name,
            reflection.SERVICE_NAME,
        )
        reflection.enable_server_reflection(SERVICE_NAMES, server)

    await server.start()
    logger.info(f"gRPC Server started on port {settings.grpc_port}")

    await server.wait_for_termination()
```

### Catalog Servicer

```python
# app/grpc/servicers/catalog_servicer.py
import grpc
from typing import Optional
from app.grpc import catalog_pb2, catalog_pb2_grpc
from app.repositories.product_repository import ProductRepository
from app.repositories.variant_repository import VariantRepository
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

class CatalogServicer(catalog_pb2_grpc.CatalogServiceServicer):
    """Implementación del servicio gRPC Catalog."""

    def __init__(self):
        self.product_repo = ProductRepository()
        self.variant_repo = VariantRepository()

    async def ValidateVariant(
        self,
        request: catalog_pb2.ValidateVariantRequest,
        context: grpc.aio.ServicerContext
    ) -> catalog_pb2.ValidateVariantResponse:
        """
        Validar una variante de producto.

        Usado principalmente por Inventory Service al inicializar stock
        para una nueva variante.

        Args:
            request: Contiene organization_id y variant_id
            context: Contexto gRPC

        Returns:
            ValidateVariantResponse con detalles de validación
        """
        try:
            logger.info(
                f"ValidateVariant called for variant_id={request.variant_id} "
                f"org={request.organization_id}"
            )

            # Buscar variante
            variant = await self.variant_repo.get_by_id(
                variant_id=request.variant_id,
                organization_id=request.organization_id
            )

            if not variant:
                return catalog_pb2.ValidateVariantResponse(
                    exists=False,
                    is_active=False,
                    message=f"Variant {request.variant_id} not found"
                )

            # Obtener producto para verificar estado
            product = await self.product_repo.get_by_id(
                product_id=variant.product_id,
                organization_id=request.organization_id
            )

            is_active = (
                variant.status == 'active' and
                product and
                product.status == 'activa'
            )

            return catalog_pb2.ValidateVariantResponse(
                exists=True,
                is_active=is_active,
                variant_id=str(variant.id),
                product_id=str(variant.product_id),
                sku=variant.sku,
                barcode=variant.barcode or "",
                warehouse_id=variant.warehouse_id,
                track_inventory=variant.track_inventory,
                default_min_stock=variant.default_min_stock,
                default_max_stock=variant.default_max_stock,
                price=float(variant.sale_price),
                message="Variant validated successfully"
            )

        except Exception as e:
            logger.error(f"Error in ValidateVariant: {str(e)}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal error: {str(e)}")
            return catalog_pb2.ValidateVariantResponse(
                exists=False,
                is_active=False,
                message=f"Error: {str(e)}"
            )

    async def GetProductDetails(
        self,
        request: catalog_pb2.GetProductDetailsRequest,
        context: grpc.aio.ServicerContext
    ) -> catalog_pb2.GetProductDetailsResponse:
        """
        Obtener detalles completos de un producto.

        Usado por Order Service, Reports, y otros servicios que necesitan
        información detallada del producto.

        Args:
            request: Contiene product_id y flags de inclusión
            context: Contexto gRPC

        Returns:
            GetProductDetailsResponse con producto completo
        """
        try:
            logger.info(
                f"GetProductDetails called for product_id={request.product_id} "
                f"org={request.organization_id}"
            )

            # Obtener producto
            product = await self.product_repo.get_by_id(
                product_id=request.product_id,
                organization_id=request.organization_id
            )

            if not product:
                return catalog_pb2.GetProductDetailsResponse(
                    success=False,
                    message=f"Product {request.product_id} not found"
                )

            # Construir respuesta
            product_proto = await self._build_product_proto(
                product=product,
                include_variants=request.include_variants,
                include_images=request.include_images,
                organization_id=request.organization_id
            )

            return catalog_pb2.GetProductDetailsResponse(
                success=True,
                product=product_proto,
                message="Product retrieved successfully"
            )

        except Exception as e:
            logger.error(f"Error in GetProductDetails: {str(e)}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal error: {str(e)}")
            return catalog_pb2.GetProductDetailsResponse(
                success=False,
                message=f"Error: {str(e)}"
            )

    async def GetVariantsBatch(
        self,
        request: catalog_pb2.GetVariantsBatchRequest,
        context: grpc.aio.ServicerContext
    ) -> catalog_pb2.GetVariantsBatchResponse:
        """Obtener múltiples variantes en una sola llamada."""
        try:
            logger.info(
                f"GetVariantsBatch called for {len(request.variant_ids)} variants "
                f"org={request.organization_id}"
            )

            variants = await self.variant_repo.get_by_ids(
                variant_ids=list(request.variant_ids),
                organization_id=request.organization_id
            )

            found_ids = {str(v.id) for v in variants}
            not_found = [vid for vid in request.variant_ids if vid not in found_ids]

            variant_protos = [
                await self._build_variant_proto(v) for v in variants
            ]

            return catalog_pb2.GetVariantsBatchResponse(
                success=True,
                variants=variant_protos,
                not_found_ids=not_found,
                message=f"Retrieved {len(variants)} of {len(request.variant_ids)} variants"
            )

        except Exception as e:
            logger.error(f"Error in GetVariantsBatch: {str(e)}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal error: {str(e)}")
            return catalog_pb2.GetVariantsBatchResponse(
                success=False,
                message=f"Error: {str(e)}"
            )

    async def ValidateVariantsBatch(
        self,
        request: catalog_pb2.ValidateVariantsBatchRequest,
        context: grpc.aio.ServicerContext
    ) -> catalog_pb2.ValidateVariantsBatchResponse:
        """Validar múltiples variantes en una sola llamada."""
        try:
            logger.info(
                f"ValidateVariantsBatch called for {len(request.variant_ids)} variants "
                f"org={request.organization_id}"
            )

            variants = await self.variant_repo.get_by_ids(
                variant_ids=list(request.variant_ids),
                organization_id=request.organization_id
            )

            # Crear mapa de validaciones
            validations = []
            found_ids = {str(v.id): v for v in variants}

            for variant_id in request.variant_ids:
                if variant_id in found_ids:
                    v = found_ids[variant_id]
                    product = await self.product_repo.get_by_id(
                        product_id=v.product_id,
                        organization_id=request.organization_id
                    )
                    is_active = (
                        v.status == 'active' and
                        product and
                        product.status == 'activa'
                    )

                    validations.append(catalog_pb2.VariantValidation(
                        variant_id=variant_id,
                        exists=True,
                        is_active=is_active,
                        sku=v.sku,
                        barcode=v.barcode or "",
                        warehouse_id=v.warehouse_id,
                        track_inventory=v.track_inventory,
                        default_min_stock=v.default_min_stock,
                        default_max_stock=v.default_max_stock
                    ))
                else:
                    validations.append(catalog_pb2.VariantValidation(
                        variant_id=variant_id,
                        exists=False,
                        is_active=False
                    ))

            return catalog_pb2.ValidateVariantsBatchResponse(
                success=True,
                validations=validations,
                message=f"Validated {len(request.variant_ids)} variants"
            )

        except Exception as e:
            logger.error(f"Error in ValidateVariantsBatch: {str(e)}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal error: {str(e)}")
            return catalog_pb2.ValidateVariantsBatchResponse(
                success=False,
                message=f"Error: {str(e)}"
            )

    # ========================================================================
    # Helper Methods
    # ========================================================================

    async def _build_product_proto(
        self,
        product,
        include_variants: bool,
        include_images: bool,
        organization_id: str
    ) -> catalog_pb2.Product:
        """Construir mensaje Product proto desde modelo."""

        # Brand
        brand_proto = None
        if product.brand:
            brand_proto = catalog_pb2.Brand(
                brand_id=str(product.brand.id),
                name=product.brand.name,
                slug=product.brand.slug,
                description=product.brand.description or ""
            )

        # Images
        images = []
        if include_images and product.images:
            images = [
                catalog_pb2.ProductImage(
                    image_id=str(img.id),
                    url=img.url,
                    alt=img.alt or "",
                    position=img.position
                )
                for img in sorted(product.images, key=lambda x: x.position)
            ]

        # Variants
        variants = []
        if include_variants:
            variants_data = await self.variant_repo.get_by_product(
                product_id=str(product.id),
                organization_id=organization_id
            )
            variants = [
                await self._build_variant_proto(v) for v in variants_data
            ]

        # Tags
        tags = []
        if product.tags:
            tags = [
                catalog_pb2.Tag(
                    tag_id=str(tag.id),
                    name=tag.name
                )
                for tag in product.tags
            ]

        # Collections
        collections = []
        if product.collections:
            collections = [
                catalog_pb2.Collection(
                    collection_id=str(col.id),
                    name=col.name,
                    slug=col.slug
                )
                for col in product.collections
            ]

        return catalog_pb2.Product(
            product_id=str(product.id),
            organization_id=product.organization_id,
            local_id=product.local_id or "",
            title=product.title,
            sku=product.sku,
            barcode=product.barcode or "",
            description=product.description or "",
            status=product.status,
            product_type=product.product_type or "",
            unit_of_measure=product.unit_of_measure,
            alert_stock=product.alert_stock,
            brand=brand_proto,
            images=images,
            variants=variants,
            tags=tags,
            collections=collections
        )

    async def _build_variant_proto(self, variant) -> catalog_pb2.Variant:
        """Construir mensaje Variant proto desde modelo."""

        # Dimensions
        dimensions = catalog_pb2.Dimensions(
            length=float(variant.dim_length or 0),
            width=float(variant.dim_width or 0),
            height=float(variant.dim_height or 0)
        )

        # Variant images
        images = []
        if variant.images:
            images = [
                catalog_pb2.VariantImage(
                    image_id=str(img.id),
                    url=img.url,
                    alt=img.alt or "",
                    position=img.position
                )
                for img in sorted(variant.images, key=lambda x: x.position)
            ]

        return catalog_pb2.Variant(
            variant_id=str(variant.id),
            product_id=str(variant.product_id),
            sku=variant.sku,
            barcode=variant.barcode or "",
            sale_price=float(variant.sale_price),
            cost_price=float(variant.cost_price or 0),
            tax=float(variant.tax or 0),
            weight=float(variant.weight or 0),
            dimensions=dimensions,
            lot_number=variant.lot_number or "",
            stock_total=variant.stock_total,
            stock_available=variant.stock_available,
            stock_reserved=variant.stock_reserved,
            warehouse_id=variant.warehouse_id,
            vendor=variant.vendor or "",
            track_inventory=variant.track_inventory,
            default_min_stock=variant.default_min_stock,
            default_max_stock=variant.default_max_stock,
            images=images
        )
```

## Casos de Uso

### 1. Inventory Service - Validar Variante

**Escenario**: Inventory Service necesita validar que una variante existe antes de crear stock.

```python
# inventory-service/app/services/stock_service.py
from app.grpc.clients.catalog_client import CatalogClient

async def initialize_stock_for_variant(variant_id: str, organization_id: str):
    """Inicializar stock para nueva variante."""

    # Validar variante con Catalog Service
    catalog_client = CatalogClient()
    validation = await catalog_client.validate_variant(
        variant_id=variant_id,
        organization_id=organization_id
    )

    if not validation.exists:
        raise ValueError(f"Variant {variant_id} does not exist")

    if not validation.is_active:
        raise ValueError(f"Variant {variant_id} is not active")

    # Crear registro de stock con valores por defecto
    stock = await stock_repo.create(
        variant_id=variant_id,
        warehouse_id=validation.warehouse_id,
        organization_id=organization_id,
        quantity=0,
        min_stock=validation.default_min_stock,
        max_stock=validation.default_max_stock,
        track_inventory=validation.track_inventory
    )

    return stock
```

### 2. Order Service - Obtener Detalles de Producto

**Escenario**: Order Service necesita mostrar detalles del producto en el carrito.

```python
# order-service/app/services/cart_service.py
from app.grpc.clients.catalog_client import CatalogClient

async def get_cart_item_details(product_id: str, organization_id: str):
    """Obtener detalles de producto para item del carrito."""

    catalog_client = CatalogClient()
    response = await catalog_client.get_product_details(
        product_id=product_id,
        organization_id=organization_id,
        include_variants=True,
        include_images=True
    )

    if not response.success:
        raise ValueError(f"Product {product_id} not found")

    return {
        "product_id": response.product.product_id,
        "title": response.product.title,
        "sku": response.product.sku,
        "images": [img.url for img in response.product.images],
        "variants": [
            {
                "variant_id": v.variant_id,
                "sku": v.sku,
                "price": v.sale_price,
                "stock_available": v.stock_available
            }
            for v in response.product.variants
        ]
    }
```

### 3. Batch Validation

**Escenario**: Validar múltiples variantes en una sola llamada (más eficiente).

```python
# inventory-service/app/services/bulk_import_service.py
from app.grpc.clients.catalog_client import CatalogClient

async def validate_variants_for_import(
    variant_ids: list[str],
    organization_id: str
):
    """Validar lote de variantes antes de importar stock."""

    catalog_client = CatalogClient()
    response = await catalog_client.validate_variants_batch(
        variant_ids=variant_ids,
        organization_id=organization_id
    )

    # Separar válidas de inválidas
    valid_variants = []
    invalid_variants = []

    for validation in response.validations:
        if validation.exists and validation.is_active:
            valid_variants.append({
                "variant_id": validation.variant_id,
                "sku": validation.sku,
                "warehouse_id": validation.warehouse_id,
                "min_stock": validation.default_min_stock,
                "max_stock": validation.default_max_stock
            })
        else:
            invalid_variants.append(validation.variant_id)

    return valid_variants, invalid_variants
```

## gRPC Client (Consumidores)

### Configuración del Cliente

```python
# app/grpc/clients/catalog_client.py
import grpc
from app.grpc import catalog_pb2, catalog_pb2_grpc
from config.settings import settings

class CatalogClient:
    """Cliente gRPC para Catalog Service."""

    def __init__(self):
        self.channel = grpc.aio.insecure_channel(
            f'{settings.catalog_grpc_host}:{settings.catalog_grpc_port}'
        )
        self.stub = catalog_pb2_grpc.CatalogServiceStub(self.channel)

    async def validate_variant(
        self,
        variant_id: str,
        organization_id: str
    ) -> catalog_pb2.ValidateVariantResponse:
        """Validar una variante."""
        request = catalog_pb2.ValidateVariantRequest(
            organization_id=organization_id,
            variant_id=variant_id
        )
        return await self.stub.ValidateVariant(request)

    async def get_product_details(
        self,
        product_id: str,
        organization_id: str,
        include_variants: bool = True,
        include_images: bool = True
    ) -> catalog_pb2.GetProductDetailsResponse:
        """Obtener detalles de producto."""
        request = catalog_pb2.GetProductDetailsRequest(
            organization_id=organization_id,
            product_id=product_id,
            include_variants=include_variants,
            include_images=include_images
        )
        return await self.stub.GetProductDetails(request)

    async def validate_variants_batch(
        self,
        variant_ids: list[str],
        organization_id: str
    ) -> catalog_pb2.ValidateVariantsBatchResponse:
        """Validar múltiples variantes."""
        request = catalog_pb2.ValidateVariantsBatchRequest(
            organization_id=organization_id,
            variant_ids=variant_ids
        )
        return await self.stub.ValidateVariantsBatch(request)

    async def close(self):
        """Cerrar canal."""
        await self.channel.close()
```

### Configuración en Settings

```python
# Otros servicios deben configurar el host del Catalog gRPC
CATALOG_GRPC_HOST = os.getenv('CATALOG_GRPC_HOST', 'localhost')
CATALOG_GRPC_PORT = int(os.getenv('CATALOG_GRPC_PORT', '50052'))
```

## Testing

### Test del Servicer

```python
# tests/grpc/test_catalog_servicer.py
import pytest
from app.grpc.servicers.catalog_servicer import CatalogServicer
from app.grpc import catalog_pb2
from unittest.mock import AsyncMock, MagicMock

@pytest.mark.asyncio
async def test_validate_variant_success():
    """Test validación exitosa de variante."""

    # Mock repositories
    servicer = CatalogServicer()
    servicer.variant_repo = AsyncMock()
    servicer.product_repo = AsyncMock()

    # Mock variant
    variant_mock = MagicMock()
    variant_mock.id = "var_123"
    variant_mock.product_id = "prod_456"
    variant_mock.sku = "SKU-123"
    variant_mock.barcode = "1234567890"
    variant_mock.warehouse_id = "wh_01"
    variant_mock.track_inventory = True
    variant_mock.default_min_stock = 20
    variant_mock.default_max_stock = 1000
    variant_mock.sale_price = 29.99
    variant_mock.status = 'active'

    # Mock product
    product_mock = MagicMock()
    product_mock.status = 'activa'

    servicer.variant_repo.get_by_id.return_value = variant_mock
    servicer.product_repo.get_by_id.return_value = product_mock

    # Request
    request = catalog_pb2.ValidateVariantRequest(
        organization_id="org_123",
        variant_id="var_123"
    )

    context = MagicMock()

    # Execute
    response = await servicer.ValidateVariant(request, context)

    # Assertions
    assert response.exists is True
    assert response.is_active is True
    assert response.variant_id == "var_123"
    assert response.sku == "SKU-123"
    assert response.track_inventory is True
    assert response.default_min_stock == 20

@pytest.mark.asyncio
async def test_validate_variant_not_found():
    """Test variante no encontrada."""

    servicer = CatalogServicer()
    servicer.variant_repo = AsyncMock()
    servicer.variant_repo.get_by_id.return_value = None

    request = catalog_pb2.ValidateVariantRequest(
        organization_id="org_123",
        variant_id="var_999"
    )

    context = MagicMock()

    response = await servicer.ValidateVariant(request, context)

    assert response.exists is False
    assert response.is_active is False
```

## Manejo de Errores

```python
# app/grpc/interceptors/error_interceptor.py
import grpc
import logging

logger = logging.getLogger(__name__)

class ErrorInterceptor(grpc.aio.ServerInterceptor):
    """Interceptor para manejo centralizado de errores."""

    async def intercept_service(self, continuation, handler_call_details):
        try:
            return await continuation(handler_call_details)
        except ValueError as e:
            logger.warning(f"Validation error: {str(e)}")
            # Retornar error con código apropiado
            raise grpc.RpcError(grpc.StatusCode.INVALID_ARGUMENT, str(e))
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            raise grpc.RpcError(grpc.StatusCode.INTERNAL, "Internal server error")
```

## Monitoreo y Logging

```python
# app/grpc/interceptors/logging_interceptor.py
import grpc
import time
import logging

logger = logging.getLogger(__name__)

class LoggingInterceptor(grpc.aio.ServerInterceptor):
    """Interceptor para logging de llamadas gRPC."""

    async def intercept_service(self, continuation, handler_call_details):
        method = handler_call_details.method
        start_time = time.time()

        logger.info(f"gRPC call started: {method}")

        try:
            response = await continuation(handler_call_details)
            duration = time.time() - start_time
            logger.info(f"gRPC call completed: {method} ({duration:.3f}s)")
            return response
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"gRPC call failed: {method} ({duration:.3f}s) - {str(e)}")
            raise
```

## Deployment

### Dockerfile

```dockerfile
# Instalar grpcio-tools para generar código proto
RUN pip install grpcio-tools

# Generar código Python desde proto files
RUN python -m grpc_tools.protoc \
    -I./protos \
    --python_out=./app/grpc \
    --grpc_python_out=./app/grpc \
    ./protos/catalog.proto
```

### Docker Compose

```yaml
catalog-service:
  image: catalog-service:latest
  ports:
    - "8002:8002"  # HTTP
    - "50052:50052"  # gRPC
  environment:
    - GRPC_PORT=50052
    - GRPC_MAX_WORKERS=10
```

## Próximos Pasos

- [Eventos Consumidos](./eventos-consumidos)
- [Integraciones](./integraciones)
- [API REST](./api-products)
