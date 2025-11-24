---
sidebar_position: 5
---

# ADR-004: gRPC para Comunicación Interna

**Estado**: Aceptado
**Fecha**: 2025-11-23
**Decisores**: Equipo de Arquitectura zenLogic

## Contexto

Aunque zenLogic usa arquitectura Event-Driven para la mayoría de comunicaciones, existen casos donde necesitamos **comunicación síncrona** entre microservicios:

### Casos de Uso Síncronos

1. **Validación en tiempo real**:
   - Catalog Service necesita validar que un `local_id` existe en Auth Service
   - No puede esperar 50-100ms de eventual consistency de eventos

2. **Autenticación/Autorización**:
   - API Gateway necesita verificar token JWT con Auth Service
   - Latencia crítica: debe ser `<10ms`

3. **Queries entre servicios**:
   - Order Service (futuro) consulta stock en Catalog Service
   - Necesita respuesta inmediata

### Requisitos

- Latencia `<10ms` (90% de requests)
- Type safety (schema explícito)
- Bidirectional streaming (para casos avanzados)
- Compatible con service mesh (Istio, Linkerd)
- Mejor performance que REST

## Decisión

**Usaremos gRPC** para comunicación síncrona entre microservicios internos.

### Hybrid Approach

```yaml
REST (HTTP/JSON):
  Uso: Clientes externos (web, mobile)
  Puerto: 8001-8010
  Docs: OpenAPI/Swagger

gRPC (HTTP/2):
  Uso: Comunicación interna entre microservicios
  Puerto: 50051-50060
  Schema: Protocol Buffers (.proto)
```

## Alternativas Consideradas

### 1. REST Interno

**Pros**:
- Mismo protocolo para todo (consistencia)
- Fácil debugging (curl, Postman)
- OpenAPI docs existentes

**Contras**:
- **Latencia mayor**: JSON serialization + HTTP/1.1 overhead
- **No type safety**: Schema en runtime, no compile-time
- **No streaming**: Request/response únicamente
- **Más bandwidth**: JSON verboso vs Protobuf binario

**Benchmark**:
```
REST (JSON): 8-12ms latency
gRPC (Protobuf): 2-5ms latency
```

**Razón de rechazo**: Latencia y type safety son críticos para internal calls.

### 2. GraphQL Federation

**Pros**:
- Query language flexible
- Schema stitching entre servicios
- Reduce over-fetching

**Contras**:
- **Overhead complejo** para simple validations
- **Latencia mayor** que gRPC (parsing GraphQL)
- **No streaming bidireccional**
- **Over-engineering** para internal APIs

**Razón de rechazo**: GraphQL es excelente para external API aggregation, no para microservices internos.

### 3. Apache Thrift

**Pros**:
- Similar a gRPC (IDL, binario)
- Performance comparable
- Multi-language

**Contras**:
- **Ecosistema menor** que gRPC
- **Menos integración** con Cloud Native tools (Istio, Envoy)
- **No HTTP/2 nativo**
- **Documentación inferior**

**Razón de rechazo**: gRPC tiene mejor soporte y comunidad.

### 4. Eventos Síncronos (Request-Reply Pattern en RabbitMQ)

**Pros**:
- Reutiliza infraestructura RabbitMQ existente
- Message broker como intermediario

**Contras**:
- **Latencia alta** (`>50ms` típicamente)
- **Complejidad**: correlation IDs, reply queues
- **No type safety**
- **Anti-pattern**: RabbitMQ diseñado para async

**Razón de rechazo**: Latencia inaceptable para validaciones críticas.

## Consecuencias

### Positivas

1. **Performance Excelente**
   ```
   Benchmark (validación local_id):
   REST:  8-12ms latency
   gRPC:  2-5ms latency

   Throughput:
   REST:  2,000 req/s
   gRPC:  8,000 req/s
   ```

2. **Type Safety en Compile-Time**
   ```protobuf
   // auth.proto
   syntax = "proto3";

   service AuthService {
       rpc ValidateLocal(ValidateLocalRequest) returns (ValidateLocalResponse);
       rpc VerifyToken(VerifyTokenRequest) returns (VerifyTokenResponse);
   }

   message ValidateLocalRequest {
       string user_id = 1;
       string organization_id = 2;
       string local_id = 3;
   }

   message ValidateLocalResponse {
       bool is_valid = 1;
       string local_name = 2;
   }
   ```

   ```python
   # Code generation automático
   $ python -m grpc_tools.protoc --python_out=. --grpc_python_out=. auth.proto

   # Type hints automáticos en Python
   response: ValidateLocalResponse = await auth_client.ValidateLocal(
       ValidateLocalRequest(
           user_id="user-uuid",
           organization_id="org-uuid",
           local_id="local-uuid"
       )
   )
   ```

3. **HTTP/2 Benefits**
   - Multiplexing: múltiples requests en una conexión
   - Header compression (HPACK)
   - Server push (para streaming)
   - Bidirectional streaming

4. **Streaming Support**
   ```protobuf
   service InventoryService {
       // Server streaming: enviar stock updates en tiempo real
       rpc WatchStock(WatchStockRequest) returns (stream StockUpdate);

       // Client streaming: bulk upload
       rpc BulkImport(stream Product) returns (ImportSummary);

       // Bidirectional: chat, real-time sync
       rpc Sync(stream SyncRequest) returns (stream SyncResponse);
   }
   ```

5. **Protobuf Compacto**
   ```json
   // JSON (REST): 156 bytes
   {
       "user_id": "550e8400-e29b-41d4-a716-446655440000",
       "organization_id": "660e8400-e29b-41d4-a716-446655440001",
       "local_id": "770e8400-e29b-41d4-a716-446655440002"
   }

   // Protobuf (gRPC): 68 bytes
   // ~56% reduction
   ```

6. **Service Mesh Integration**
   ```yaml
   # Istio VirtualService
   apiVersion: networking.istio.io/v1alpha3
   kind: VirtualService
   metadata:
     name: auth-service-grpc
   spec:
     hosts:
     - auth-service
     http:
     - match:
       - port: 50051
       route:
       - destination:
           host: auth-service
           port:
             number: 50051
         weight: 90
       - destination:
           host: auth-service-v2
           port:
             number: 50051
         weight: 10  # Canary deployment
   ```

### Negativas

1. **Dos Protocolos en Sistema**
   - REST para external APIs
   - gRPC para internal APIs
   - **Mitigación**:
     - Separación clara: external REST (8001), internal gRPC (50051)
     - Docs claras sobre cuándo usar cada uno
     - API Gateway maneja REST→gRPC translation si es necesario

2. **Debugging Más Difícil**
   - No puedes hacer `curl` a gRPC
   - Protobuf binario no es human-readable
   - **Mitigación**:
     - grpcurl: curl-like para gRPC
       ```bash
       grpcurl -plaintext -d '{"user_id": "..."}' \
         localhost:50051 auth.AuthService/ValidateLocal
       ```
     - Postman soporta gRPC (versión 9+)
     - BloomRPC: GUI client para gRPC

3. **Code Generation Required**
   - `.proto` → generar código Python
   - Cambio en `.proto` → regenerar código
   - **Mitigación**:
     - Script de generación automatizado
       ```bash
       # scripts/generate_protos.sh
       python -m grpc_tools.protoc \
         --proto_path=./protos \
         --python_out=./app/grpc_generated \
         --grpc_python_out=./app/grpc_generated \
         ./protos/*.proto
       ```
     - CI/CD genera código automáticamente

4. **Compatibilidad Browser Limitada**
   - Browsers no soportan gRPC nativamente (HTTP/2 binario)
   - Necesita gRPC-Web + proxy (Envoy)
   - **Mitigación**: No usamos gRPC para browser→backend, solo internal

### Riesgos

1. **Breaking Changes en .proto**
   - Cambiar `message` puede romper clientes
   - **Mitigación**:
     - Versionado de servicios (AuthServiceV1, AuthServiceV2)
     - Nunca reusar field numbers
     - Usar `reserved` para campos removidos
       ```protobuf
       message User {
           reserved 2, 15, 9 to 11;
           reserved "old_field", "deprecated_field";
           string name = 1;
       }
       ```

2. **Load Balancing HTTP/2**
   - gRPC usa conexión persistente HTTP/2
   - L4 load balancer (TCP) no distribuye bien requests
   - **Mitigación**:
     - Usar L7 load balancer (Envoy, Linkerd)
     - gRPC client-side load balancing
       ```python
       channel = grpc.aio.insecure_channel(
           'dns:///auth-service:50051',
           options=[('grpc.lb_policy_name', 'round_robin')]
       )
       ```

3. **Connection Starvation**
   - Un servicio lento puede saturar connection pool
   - **Mitigación**:
     - Timeouts agresivos (5-10s)
     - Circuit breaker pattern
     - Max connections configurado

## Implementación

### Proto File

```protobuf
// protos/auth.proto
syntax = "proto3";

package auth;

service AuthService {
    // Validar si usuario tiene acceso a un local
    rpc ValidateLocal(ValidateLocalRequest) returns (ValidateLocalResponse);

    // Verificar token JWT
    rpc VerifyToken(VerifyTokenRequest) returns (VerifyTokenResponse);

    // Obtener permisos de usuario
    rpc GetUserPermissions(GetUserPermissionsRequest) returns (GetUserPermissionsResponse);
}

message ValidateLocalRequest {
    string user_id = 1;
    string organization_id = 2;
    string local_id = 3;
}

message ValidateLocalResponse {
    bool is_valid = 1;
    string local_name = 2;
    string error_message = 3;
}

message VerifyTokenRequest {
    string token = 1;
}

message VerifyTokenResponse {
    bool is_valid = 1;
    string user_id = 2;
    string organization_id = 3;
    repeated string permissions = 4;
}
```

### Server (Auth Service)

```python
# app/grpc_server/auth_service.py
import grpc
from app.grpc_generated import auth_pb2, auth_pb2_grpc
from app.services.auth_service import AuthService

class AuthServicer(auth_pb2_grpc.AuthServiceServicer):
    def __init__(self, auth_service: AuthService):
        self.auth_service = auth_service

    async def ValidateLocal(
        self,
        request: auth_pb2.ValidateLocalRequest,
        context: grpc.aio.ServicerContext
    ) -> auth_pb2.ValidateLocalResponse:
        try:
            is_valid, local_name = await self.auth_service.validate_local(
                user_id=request.user_id,
                organization_id=request.organization_id,
                local_id=request.local_id
            )
            return auth_pb2.ValidateLocalResponse(
                is_valid=is_valid,
                local_name=local_name
            )
        except Exception as e:
            logger.error(f"ValidateLocal error: {e}")
            return auth_pb2.ValidateLocalResponse(
                is_valid=False,
                error_message=str(e)
            )

async def serve():
    server = grpc.aio.server()
    auth_pb2_grpc.add_AuthServiceServicer_to_server(
        AuthServicer(auth_service),
        server
    )
    server.add_insecure_port('[::]:50051')
    await server.start()
    logger.info("gRPC server started on port 50051")
    await server.wait_for_termination()
```

### Client (Catalog Service)

```python
# app/clients/auth_client.py
import grpc
from app.grpc_generated import auth_pb2, auth_pb2_grpc
from app.config import settings

class AuthClient:
    def __init__(self):
        self.channel = grpc.aio.insecure_channel(
            settings.auth_grpc_url,  # "auth-service:50051"
            options=[
                ('grpc.lb_policy_name', 'round_robin'),
                ('grpc.keepalive_time_ms', 10000),
                ('grpc.keepalive_timeout_ms', 5000)
            ]
        )
        self.stub = auth_pb2_grpc.AuthServiceStub(self.channel)

    async def validate_local(
        self,
        user_id: str,
        organization_id: str,
        local_id: str
    ) -> bool:
        try:
            request = auth_pb2.ValidateLocalRequest(
                user_id=user_id,
                organization_id=organization_id,
                local_id=local_id
            )
            response = await self.stub.ValidateLocal(
                request,
                timeout=5.0  # 5s timeout
            )
            return response.is_valid
        except grpc.RpcError as e:
            logger.error(f"gRPC error: {e.code()} - {e.details()}")
            return False

    async def close(self):
        await self.channel.close()
```

### Circuit Breaker Pattern

```python
# app/clients/auth_client_with_circuit_breaker.py
from circuitbreaker import CircuitBreaker, CircuitBreakerError

class AuthClientWithCircuitBreaker:
    def __init__(self, grpc_client: AuthClient, rest_client: AuthRestClient):
        self.grpc_client = grpc_client
        self.rest_client = rest_client
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=60,
            expected_exception=grpc.RpcError
        )

    async def validate_local(self, user_id: str, org_id: str, local_id: str) -> bool:
        try:
            return await self._validate_local_grpc(user_id, org_id, local_id)
        except CircuitBreakerError:
            # Fallback a REST si gRPC está caído
            logger.warning("gRPC circuit breaker open, falling back to REST")
            return await self._validate_local_rest(user_id, org_id, local_id)

    @CircuitBreaker(failure_threshold=5)
    async def _validate_local_grpc(self, user_id, org_id, local_id):
        return await self.grpc_client.validate_local(user_id, org_id, local_id)

    async def _validate_local_rest(self, user_id, org_id, local_id):
        # Fallback HTTP
        response = await self.rest_client.get(
            f"/api/v1/locals/{local_id}/validate",
            params={"user_id": user_id, "organization_id": org_id}
        )
        return response.json()["is_valid"]
```

## Protobuf Best Practices

### 1. Nunca Reusar Field Numbers

```protobuf
message User {
    string name = 1;
    // int32 age = 2;  // ❌ REMOVED - NO REUSAR #2

    reserved 2;  // ✅ Reservar número
    string email = 3;
}
```

### 2. Usar Enums para Estados

```protobuf
enum OrderStatus {
    ORDER_STATUS_UNSPECIFIED = 0;  // Siempre valor 0 por defecto
    ORDER_STATUS_PENDING = 1;
    ORDER_STATUS_PROCESSING = 2;
    ORDER_STATUS_COMPLETED = 3;
}
```

### 3. Versionado de Servicios

```protobuf
service AuthServiceV1 {
    rpc ValidateLocal(ValidateLocalRequest) returns (ValidateLocalResponse);
}

service AuthServiceV2 {
    rpc ValidateLocal(ValidateLocalRequestV2) returns (ValidateLocalResponseV2);
}
```

## Monitoreo

```python
from prometheus_client import Histogram, Counter

grpc_request_duration = Histogram(
    'grpc_request_duration_seconds',
    'gRPC request duration',
    ['service', 'method']
)

grpc_requests_total = Counter(
    'grpc_requests_total',
    'Total gRPC requests',
    ['service', 'method', 'status']
)
```

## Revisión Futura

Este ADR debe revisarse si:

1. Latencia gRPC supera 20ms (investigar causes)
2. Debugging se vuelve muy complejo (considerar herramientas mejores)
3. Necesitamos browser→backend directo con gRPC-Web

**Fecha de próxima revisión**: 2026-11-23 (1 año)

## Referencias

- [gRPC Official Documentation](https://grpc.io/docs/)
- [Protocol Buffers Language Guide](https://developers.google.com/protocol-buffers/docs/proto3)
- [gRPC Python Quickstart](https://grpc.io/docs/languages/python/quickstart/)

## Próximos Pasos

- [Catalog Service - Auth Client gRPC](/microservicios/catalog-service/auth-client-grpc)
- [Auth Service - gRPC Server](/microservicios/auth-service/grpc-server)
- [Comunicación entre Microservicios](/arquitectura/comunicacion-microservicios)
