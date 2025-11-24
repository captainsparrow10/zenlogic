---
sidebar_position: 7
---

# gRPC Server - Inventory Service

Definición completa del servidor gRPC del Inventory Service para comunicación síncrona con otros servicios.

## Overview

El Inventory Service expone los siguientes métodos gRPC para que Order Service pueda:
- Verificar disponibilidad de stock
- Reservar stock temporalmente
- Confirmar reservas (cuando el pago es exitoso)
- Liberar reservas (cuando el pago falla o timeout)

## Puerto gRPC

```
GRPC_PORT=50053
```

## Proto File Definition

```protobuf
syntax = "proto3";

package inventory.v1;

// Inventory Service
service InventoryService {
    // Verifica disponibilidad de stock
    rpc CheckAvailability(CheckAvailabilityRequest) returns (CheckAvailabilityResponse);

    // Verifica disponibilidad de múltiples variantes
    rpc CheckBulkAvailability(CheckBulkAvailabilityRequest) returns (CheckBulkAvailabilityResponse);

    // Reserva stock temporalmente
    rpc ReserveStock(ReserveStockRequest) returns (ReserveStockResponse);

    // Confirma una reserva (pago exitoso)
    rpc ConfirmReservation(ConfirmReservationRequest) returns (ConfirmReservationResponse);

    // Libera una reserva (pago fallido o timeout)
    rpc ReleaseReservation(ReleaseReservationRequest) returns (ReleaseReservationResponse);

    // Obtiene información de stock
    rpc GetStockInfo(GetStockInfoRequest) returns (GetStockInfoResponse);
}

// ==================== Check Availability ====================

message CheckAvailabilityRequest {
    string organization_id = 1;
    string variant_id = 2;
    string warehouse_id = 3;  // Opcional, si no se envía verifica en todos los warehouses
    int32 quantity = 4;
}

message CheckAvailabilityResponse {
    bool available = 1;
    int32 available_quantity = 2;
    string warehouse_id = 3;
    string message = 4;
}

// ==================== Check Bulk Availability ====================

message CheckBulkAvailabilityRequest {
    string organization_id = 1;
    repeated AvailabilityItem items = 2;
}

message AvailabilityItem {
    string variant_id = 1;
    string warehouse_id = 2;  // Opcional
    int32 quantity = 3;
}

message CheckBulkAvailabilityResponse {
    bool all_available = 1;
    repeated AvailabilityResult results = 2;
}

message AvailabilityResult {
    string variant_id = 1;
    string warehouse_id = 2;
    bool available = 3;
    int32 available_quantity = 4;
    int32 requested_quantity = 5;
    string message = 6;
}

// ==================== Reserve Stock ====================

message ReserveStockRequest {
    string organization_id = 1;
    string order_id = 2;
    repeated ReservationItem items = 3;
    int32 ttl_minutes = 4;  // Tiempo de vida de la reserva (default: 15)
}

message ReservationItem {
    string variant_id = 1;
    string warehouse_id = 2;  // Preferido, si no se especifica se elige automáticamente
    int32 quantity = 3;
}

message ReserveStockResponse {
    bool success = 1;
    string reservation_id = 2;
    repeated ReservedItem reserved_items = 3;
    string expires_at = 4;  // ISO 8601 timestamp
    string message = 5;
}

message ReservedItem {
    string reservation_item_id = 1;
    string variant_id = 2;
    string warehouse_id = 3;
    string stock_id = 4;
    int32 quantity = 5;
    int32 stock_before = 6;
    int32 stock_after = 7;
}

// ==================== Confirm Reservation ====================

message ConfirmReservationRequest {
    string organization_id = 1;
    string reservation_id = 2;
    string order_id = 3;
}

message ConfirmReservationResponse {
    bool success = 1;
    string message = 2;
    string confirmed_at = 3;  // ISO 8601 timestamp
}

// ==================== Release Reservation ====================

message ReleaseReservationRequest {
    string organization_id = 1;
    string reservation_id = 2;
    string reason = 3;  // payment_failed, timeout, cancelled
}

message ReleaseReservationResponse {
    bool success = 1;
    string message = 2;
    int32 items_released = 3;
    int32 total_quantity_released = 4;
}

// ==================== Get Stock Info ====================

message GetStockInfoRequest {
    string organization_id = 1;
    string variant_id = 2;
    string warehouse_id = 3;  // Opcional
}

message GetStockInfoResponse {
    repeated StockInfo stock_info = 1;
}

message StockInfo {
    string stock_id = 1;
    string variant_id = 2;
    string warehouse_id = 3;
    string warehouse_name = 4;
    int32 total_quantity = 5;
    int32 available_quantity = 6;
    int32 reserved_quantity = 7;
    int32 damaged_quantity = 8;
    int32 in_transit_quantity = 9;
    int32 min_stock = 10;
    int32 max_stock = 11;
    string stock_status = 12;  // in_stock, low_stock, out_of_stock
}
```

## Implementación del Servidor

### Server Setup

```python
import grpc
from concurrent import futures
import logging

from generated import inventory_pb2
from generated import inventory_pb2_grpc
from app.services.inventory_grpc_service import InventoryGRPCService
from app.config.settings import settings

logger = logging.getLogger(__name__)

def serve():
    """Start gRPC server."""
    server = grpc.aio.server(
        futures.ThreadPoolExecutor(max_workers=10),
        options=[
            ('grpc.max_send_message_length', 50 * 1024 * 1024),
            ('grpc.max_receive_message_length', 50 * 1024 * 1024),
        ]
    )

    inventory_pb2_grpc.add_InventoryServiceServicer_to_server(
        InventoryGRPCService(), server
    )

    server.add_insecure_port(f'[::]:{settings.grpc_port}')

    await server.start()
    logger.info(f"gRPC Server started on port {settings.grpc_port}")

    await server.wait_for_termination()

if __name__ == '__main__':
    serve()
```

### Service Implementation

```python
import grpc
from datetime import datetime, timedelta
from typing import List

from generated import inventory_pb2
from generated import inventory_pb2_grpc
from app.repositories.stock_repository import StockRepository
from app.repositories.reservation_repository import ReservationRepository
from app.services.stock_service import StockService

class InventoryGRPCService(inventory_pb2_grpc.InventoryServiceServicer):
    """Implementation of Inventory gRPC Service."""

    def __init__(self):
        self.stock_repo = StockRepository()
        self.reservation_repo = ReservationRepository()
        self.stock_service = StockService()

    async def CheckAvailability(
        self,
        request: inventory_pb2.CheckAvailabilityRequest,
        context: grpc.aio.ServicerContext
    ) -> inventory_pb2.CheckAvailabilityResponse:
        """Check if stock is available for a variant."""
        try:
            # Buscar stock
            stock = await self.stock_repo.find_by_variant_and_warehouse(
                organization_id=request.organization_id,
                variant_id=request.variant_id,
                warehouse_id=request.warehouse_id if request.warehouse_id else None
            )

            if not stock:
                return inventory_pb2.CheckAvailabilityResponse(
                    available=False,
                    available_quantity=0,
                    message="Stock not found"
                )

            is_available = stock.available_quantity >= request.quantity

            return inventory_pb2.CheckAvailabilityResponse(
                available=is_available,
                available_quantity=stock.available_quantity,
                warehouse_id=stock.warehouse_id,
                message="Available" if is_available else "Insufficient stock"
            )

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Error checking availability: {str(e)}")
            raise

    async def CheckBulkAvailability(
        self,
        request: inventory_pb2.CheckBulkAvailabilityRequest,
        context: grpc.aio.ServicerContext
    ) -> inventory_pb2.CheckBulkAvailabilityResponse:
        """Check availability for multiple items."""
        try:
            results = []
            all_available = True

            for item in request.items:
                stock = await self.stock_repo.find_by_variant_and_warehouse(
                    organization_id=request.organization_id,
                    variant_id=item.variant_id,
                    warehouse_id=item.warehouse_id if item.warehouse_id else None
                )

                if not stock:
                    results.append(inventory_pb2.AvailabilityResult(
                        variant_id=item.variant_id,
                        available=False,
                        available_quantity=0,
                        requested_quantity=item.quantity,
                        message="Stock not found"
                    ))
                    all_available = False
                    continue

                is_available = stock.available_quantity >= item.quantity

                results.append(inventory_pb2.AvailabilityResult(
                    variant_id=item.variant_id,
                    warehouse_id=stock.warehouse_id,
                    available=is_available,
                    available_quantity=stock.available_quantity,
                    requested_quantity=item.quantity,
                    message="Available" if is_available else "Insufficient stock"
                ))

                if not is_available:
                    all_available = False

            return inventory_pb2.CheckBulkAvailabilityResponse(
                all_available=all_available,
                results=results
            )

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Error checking bulk availability: {str(e)}")
            raise

    async def ReserveStock(
        self,
        request: inventory_pb2.ReserveStockRequest,
        context: grpc.aio.ServicerContext
    ) -> inventory_pb2.ReserveStockResponse:
        """Reserve stock for an order."""
        try:
            # Validar TTL
            ttl_minutes = request.ttl_minutes if request.ttl_minutes > 0 else 15
            expires_at = datetime.utcnow() + timedelta(minutes=ttl_minutes)

            # Crear reservación
            reservation = await self.reservation_repo.create(
                organization_id=request.organization_id,
                order_id=request.order_id,
                status='active',
                expires_at=expires_at
            )

            reserved_items = []

            for item in request.items:
                # Buscar stock
                stock = await self.stock_repo.find_available_stock(
                    organization_id=request.organization_id,
                    variant_id=item.variant_id,
                    warehouse_id=item.warehouse_id if item.warehouse_id else None,
                    quantity_needed=item.quantity
                )

                if not stock:
                    # Rollback reservación
                    await self.reservation_repo.cancel(reservation.reservation_id)

                    context.set_code(grpc.StatusCode.FAILED_PRECONDITION)
                    context.set_details(f"Insufficient stock for variant {item.variant_id}")
                    raise grpc.RpcError()

                # Reservar stock
                stock_before = stock.available_quantity
                stock_after = stock_before - item.quantity

                # Actualizar stock
                await self.stock_repo.update_quantities(
                    stock_id=stock.stock_id,
                    available_quantity=stock_after,
                    reserved_quantity=stock.reserved_quantity + item.quantity
                )

                # Crear reservation item
                res_item = await self.reservation_repo.create_item(
                    reservation_id=reservation.reservation_id,
                    stock_id=stock.stock_id,
                    variant_id=item.variant_id,
                    warehouse_id=stock.warehouse_id,
                    quantity=item.quantity,
                    stock_before=stock_before,
                    stock_after=stock_after
                )

                reserved_items.append(inventory_pb2.ReservedItem(
                    reservation_item_id=str(res_item.reservation_item_id),
                    variant_id=item.variant_id,
                    warehouse_id=stock.warehouse_id,
                    stock_id=str(stock.stock_id),
                    quantity=item.quantity,
                    stock_before=stock_before,
                    stock_after=stock_after
                ))

            return inventory_pb2.ReserveStockResponse(
                success=True,
                reservation_id=str(reservation.reservation_id),
                reserved_items=reserved_items,
                expires_at=expires_at.isoformat(),
                message="Stock reserved successfully"
            )

        except grpc.RpcError:
            raise
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Error reserving stock: {str(e)}")
            raise

    async def ConfirmReservation(
        self,
        request: inventory_pb2.ConfirmReservationRequest,
        context: grpc.aio.ServicerContext
    ) -> inventory_pb2.ConfirmReservationResponse:
        """Confirm a reservation (payment succeeded)."""
        try:
            # Actualizar estado de reservación
            reservation = await self.reservation_repo.confirm(
                reservation_id=request.reservation_id,
                organization_id=request.organization_id
            )

            if not reservation:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details("Reservation not found")
                raise grpc.RpcError()

            return inventory_pb2.ConfirmReservationResponse(
                success=True,
                message="Reservation confirmed",
                confirmed_at=datetime.utcnow().isoformat()
            )

        except grpc.RpcError:
            raise
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Error confirming reservation: {str(e)}")
            raise

    async def ReleaseReservation(
        self,
        request: inventory_pb2.ReleaseReservationRequest,
        context: grpc.aio.ServicerContext
    ) -> inventory_pb2.ReleaseReservationResponse:
        """Release a reservation (payment failed or timeout)."""
        try:
            # Liberar reservación
            result = await self.reservation_repo.release(
                reservation_id=request.reservation_id,
                organization_id=request.organization_id,
                reason=request.reason
            )

            return inventory_pb2.ReleaseReservationResponse(
                success=True,
                message="Reservation released",
                items_released=result['items_count'],
                total_quantity_released=result['total_quantity']
            )

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Error releasing reservation: {str(e)}")
            raise

    async def GetStockInfo(
        self,
        request: inventory_pb2.GetStockInfoRequest,
        context: grpc.aio.ServicerContext
    ) -> inventory_pb2.GetStockInfoResponse:
        """Get stock information for a variant."""
        try:
            stocks = await self.stock_repo.find_all_by_variant(
                organization_id=request.organization_id,
                variant_id=request.variant_id,
                warehouse_id=request.warehouse_id if request.warehouse_id else None
            )

            stock_info_list = []

            for stock in stocks:
                # Determinar stock status
                if stock.available_quantity == 0:
                    stock_status = "out_of_stock"
                elif stock.available_quantity <= stock.min_stock:
                    stock_status = "low_stock"
                else:
                    stock_status = "in_stock"

                stock_info_list.append(inventory_pb2.StockInfo(
                    stock_id=str(stock.stock_id),
                    variant_id=stock.variant_id,
                    warehouse_id=stock.warehouse_id,
                    warehouse_name=stock.warehouse.name,
                    total_quantity=stock.total_quantity,
                    available_quantity=stock.available_quantity,
                    reserved_quantity=stock.reserved_quantity,
                    damaged_quantity=stock.damaged_quantity,
                    in_transit_quantity=stock.in_transit_quantity,
                    min_stock=stock.min_stock,
                    max_stock=stock.max_stock,
                    stock_status=stock_status
                ))

            return inventory_pb2.GetStockInfoResponse(
                stock_info=stock_info_list
            )

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Error getting stock info: {str(e)}")
            raise
```

## Ejemplos de Uso desde Order Service

### Python Client

```python
import grpc
from generated import inventory_pb2
from generated import inventory_pb2_grpc

class InventoryClient:
    """Client for Inventory gRPC Service."""

    def __init__(self, host='localhost', port=50053):
        self.channel = grpc.aio.insecure_channel(f'{host}:{port}')
        self.stub = inventory_pb2_grpc.InventoryServiceStub(self.channel)

    async def check_availability(
        self,
        organization_id: str,
        variant_id: str,
        warehouse_id: str,
        quantity: int
    ):
        """Check if stock is available."""
        request = inventory_pb2.CheckAvailabilityRequest(
            organization_id=organization_id,
            variant_id=variant_id,
            warehouse_id=warehouse_id,
            quantity=quantity
        )

        response = await self.stub.CheckAvailability(request)
        return response

    async def reserve_stock(
        self,
        organization_id: str,
        order_id: str,
        items: list,
        ttl_minutes: int = 15
    ):
        """Reserve stock for an order."""
        reservation_items = [
            inventory_pb2.ReservationItem(
                variant_id=item['variant_id'],
                warehouse_id=item.get('warehouse_id', ''),
                quantity=item['quantity']
            )
            for item in items
        ]

        request = inventory_pb2.ReserveStockRequest(
            organization_id=organization_id,
            order_id=order_id,
            items=reservation_items,
            ttl_minutes=ttl_minutes
        )

        response = await self.stub.ReserveStock(request)
        return response

    async def confirm_reservation(
        self,
        organization_id: str,
        reservation_id: str,
        order_id: str
    ):
        """Confirm a reservation."""
        request = inventory_pb2.ConfirmReservationRequest(
            organization_id=organization_id,
            reservation_id=reservation_id,
            order_id=order_id
        )

        response = await self.stub.ConfirmReservation(request)
        return response

    async def release_reservation(
        self,
        organization_id: str,
        reservation_id: str,
        reason: str
    ):
        """Release a reservation."""
        request = inventory_pb2.ReleaseReservationRequest(
            organization_id=organization_id,
            reservation_id=reservation_id,
            reason=reason
        )

        response = await self.stub.ReleaseReservation(request)
        return response

# Uso
client = InventoryClient(host='localhost', port=50053)

# Check availability
response = await client.check_availability(
    organization_id='org_123',
    variant_id='var_789',
    warehouse_id='wh_101',
    quantity=5
)
print(f"Available: {response.available}, Quantity: {response.available_quantity}")

# Reserve stock
response = await client.reserve_stock(
    organization_id='org_123',
    order_id='order_456',
    items=[
        {'variant_id': 'var_789', 'warehouse_id': 'wh_101', 'quantity': 2},
        {'variant_id': 'var_456', 'quantity': 1}  # Auto-select warehouse
    ],
    ttl_minutes=15
)
print(f"Reservation ID: {response.reservation_id}")
print(f"Expires at: {response.expires_at}")
```

## Manejo de Errores

### Error Codes

| gRPC Code | Descripción | Cuándo ocurre |
|-----------|-------------|---------------|
| `OK` | Success | Operación exitosa |
| `NOT_FOUND` | No encontrado | Stock o reservación no existe |
| `FAILED_PRECONDITION` | Precondición fallida | Stock insuficiente |
| `INVALID_ARGUMENT` | Argumento inválido | Datos de entrada incorrectos |
| `DEADLINE_EXCEEDED` | Timeout | Operación tardó demasiado |
| `INTERNAL` | Error interno | Error inesperado del servidor |
| `UNAVAILABLE` | Servicio no disponible | Servidor caído o mantenimiento |

### Retry Strategy

```python
from grpc import StatusCode
import asyncio

async def call_with_retry(func, max_retries=3, backoff=1):
    """Call gRPC function with retry logic."""
    for attempt in range(max_retries):
        try:
            return await func()
        except grpc.RpcError as e:
            if e.code() in [StatusCode.UNAVAILABLE, StatusCode.DEADLINE_EXCEEDED]:
                if attempt < max_retries - 1:
                    await asyncio.sleep(backoff * (2 ** attempt))
                    continue
            raise

# Uso
response = await call_with_retry(
    lambda: client.check_availability('org_123', 'var_789', 'wh_101', 5)
)
```

## Circuit Breaker

```python
from datetime import datetime, timedelta

class CircuitBreaker:
    """Circuit breaker pattern for gRPC calls."""

    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = 'closed'  # closed, open, half_open

    async def call(self, func):
        if self.state == 'open':
            if datetime.now() - self.last_failure_time > timedelta(seconds=self.timeout):
                self.state = 'half_open'
            else:
                raise Exception("Circuit breaker is OPEN")

        try:
            result = await func()
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise

    def on_success(self):
        self.failures = 0
        self.state = 'closed'

    def on_failure(self):
        self.failures += 1
        self.last_failure_time = datetime.now()
        if self.failures >= self.failure_threshold:
            self.state = 'open'
```

## Health Check

```python
from grpc_health.v1 import health_pb2
from grpc_health.v1 import health_pb2_grpc

# Server side
async def check_health():
    """Check if service is healthy."""
    # Verificar conexión a DB
    # Verificar Redis
    # etc.
    return health_pb2.HealthCheckResponse.SERVING

# Client side
health_stub = health_pb2_grpc.HealthStub(channel)
response = await health_stub.Check(
    health_pb2.HealthCheckRequest(service='InventoryService')
)
print(response.status)  # SERVING, NOT_SERVING, UNKNOWN
```

## Próximos Pasos

- [Configuración](./configuracion)
- [Modelo de Datos](./modelo-datos)
- [Integraciones](./integraciones)
- [Eventos Publicados](./eventos-publicados)
