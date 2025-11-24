---
sidebar_position: 7
---

# gRPC Server

Auth Service expone un servidor gRPC para comunicación interna con otros microservicios.

## Puerto

```
grpc://localhost:50051
```

## Proto Definition

**Archivo**: `src/api/grpc/auth_service.proto`

```protobuf
syntax = "proto3";

package auth;

service AuthService {
  // Verificar token y obtener información del usuario
  rpc VerifyToken(VerifyTokenRequest) returns (VerifyTokenResponse);

  // Obtener permisos de un usuario
  rpc GetUserPermissions(GetUserPermissionsRequest) returns (GetUserPermissionsResponse);

  // Validar si usuario tiene un permiso específico
  rpc CheckPermission(CheckPermissionRequest) returns (CheckPermissionResponse);

  // Obtener información de organización
  rpc GetOrganization(GetOrganizationRequest) returns (GetOrganizationResponse);
}

// VerifyToken
message VerifyTokenRequest {
  string token = 1;
}

message VerifyTokenResponse {
  string user_id = 1;
  string organization_id = 2;
  string email = 3;
  repeated string permissions = 4;
  repeated string locals = 5;
  bool active = 6;
  string first_name = 7;
  string last_name = 8;
}

// GetUserPermissions
message GetUserPermissionsRequest {
  string user_id = 1;
  string organization_id = 2;
}

message GetUserPermissionsResponse {
  repeated string permissions = 1;
  repeated string locals = 2;
}

// CheckPermission
message CheckPermissionRequest {
  string user_id = 1;
  string organization_id = 2;
  string permission = 3;
}

message CheckPermissionResponse {
  bool has_permission = 1;
}

// GetOrganization
message GetOrganizationRequest {
  string organization_id = 1;
}

message GetOrganizationResponse {
  string id = 1;
  string name = 2;
  string plan = 3;
  string status = 4;
  repeated string modules_enabled = 5;
}
```

## Implementación del Servidor

**Archivo**: `src/api/grpc/server.py`

```python
import grpc
from concurrent import futures
import auth_pb2
import auth_pb2_grpc
from src.services.token_service import TokenService
from src.services.user_service import UserService
from src.services.organization_service import OrganizationService

class AuthServicer(auth_pb2_grpc.AuthServiceServicer):
    def __init__(
        self,
        token_service: TokenService,
        user_service: UserService,
        org_service: OrganizationService
    ):
        self.token_service = token_service
        self.user_service = user_service
        self.org_service = org_service

    async def VerifyToken(self, request, context):
        """Verificar token y retornar info del usuario"""
        try:
            user = await self.token_service.verify_token(request.token)

            return auth_pb2.VerifyTokenResponse(
                user_id=user.id,
                organization_id=user.organization_id,
                email=user.email,
                permissions=user.get_permissions(),
                locals=user.get_locals(),
                active=user.active,
                first_name=user.first_name or "",
                last_name=user.last_name or ""
            )
        except Exception as e:
            context.set_code(grpc.StatusCode.UNAUTHENTICATED)
            context.set_details(str(e))
            return auth_pb2.VerifyTokenResponse()

    async def GetUserPermissions(self, request, context):
        """Obtener permisos de un usuario"""
        try:
            user = await self.user_service.get_user(
                request.user_id,
                request.organization_id
            )

            return auth_pb2.GetUserPermissionsResponse(
                permissions=user.get_permissions(),
                locals=user.get_locals()
            )
        except Exception as e:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(str(e))
            return auth_pb2.GetUserPermissionsResponse()

    async def CheckPermission(self, request, context):
        """Verificar si usuario tiene un permiso"""
        try:
            has_permission = await self.user_service.check_permission(
                request.user_id,
                request.organization_id,
                request.permission
            )

            return auth_pb2.CheckPermissionResponse(
                has_permission=has_permission
            )
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return auth_pb2.CheckPermissionResponse(has_permission=False)

    async def GetOrganization(self, request, context):
        """Obtener información de organización"""
        try:
            org = await self.org_service.get_organization(
                request.organization_id
            )

            return auth_pb2.GetOrganizationResponse(
                id=org.id,
                name=org.name,
                plan=org.plan,
                status=org.status,
                modules_enabled=org.get_modules()
            )
        except Exception as e:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(str(e))
            return auth_pb2.GetOrganizationResponse()


async def serve():
    """Iniciar servidor gRPC"""
    server = grpc.aio.server(
        futures.ThreadPoolExecutor(max_workers=10),
        options=[
            ('grpc.max_send_message_length', 50 * 1024 * 1024),
            ('grpc.max_receive_message_length', 50 * 1024 * 1024),
        ]
    )

    auth_pb2_grpc.add_AuthServiceServicer_to_server(
        AuthServicer(token_service, user_service, org_service),
        server
    )

    server.add_insecure_port('[::]:50051')
    await server.start()
    logger.info("gRPC server started on port 50051")
    await server.wait_for_termination()
```

## Cliente gRPC (Catalog Service)

**Archivo**: `catalog-service/src/clients/auth_client.py`

```python
import grpc
import auth_pb2
import auth_pb2_grpc
from src.config.settings import settings

class AuthClient:
    def __init__(self):
        self.channel = grpc.aio.insecure_channel(settings.AUTH_GRPC_URL)
        self.stub = auth_pb2_grpc.AuthServiceStub(self.channel)

    async def verify_token(self, token: str):
        """Verificar token"""
        request = auth_pb2.VerifyTokenRequest(token=token)

        try:
            response = await self.stub.VerifyToken(request, timeout=5.0)
            return {
                "user_id": response.user_id,
                "organization_id": response.organization_id,
                "email": response.email,
                "permissions": list(response.permissions),
                "locals": list(response.locals),
                "active": response.active
            }
        except grpc.RpcError as e:
            if e.code() == grpc.StatusCode.UNAUTHENTICATED:
                raise UnauthorizedError("Token inválido")
            raise

    async def check_permission(
        self,
        user_id: str,
        organization_id: str,
        permission: str
    ) -> bool:
        """Verificar si usuario tiene permiso"""
        request = auth_pb2.CheckPermissionRequest(
            user_id=user_id,
            organization_id=organization_id,
            permission=permission
        )

        try:
            response = await self.stub.CheckPermission(request, timeout=5.0)
            return response.has_permission
        except grpc.RpcError:
            return False

    async def close(self):
        """Cerrar canal"""
        await self.channel.close()
```

## Uso en Catalog Service

```python
from src.clients.auth_client import AuthClient

async def get_current_user(token: str):
    """Dependency para obtener usuario desde Auth Service"""
    auth_client = AuthClient()
    try:
        user_data = await auth_client.verify_token(token)
        return user_data
    finally:
        await auth_client.close()

@router.get("/products")
async def list_products(
    user = Depends(get_current_user)
):
    # user ya viene validado desde Auth Service
    products = await product_service.list_products(user["organization_id"])
    return products
```

## Códigos de Estado gRPC

| Código | Descripción | Uso |
|--------|-------------|-----|
| `OK` | Éxito | Token válido |
| `UNAUTHENTICATED` | No autenticado | Token inválido/expirado |
| `NOT_FOUND` | No encontrado | Usuario no existe |
| `PERMISSION_DENIED` | Permiso denegado | Usuario sin permiso |
| `INTERNAL` | Error interno | Error del servidor |
| `DEADLINE_EXCEEDED` | Timeout | Request muy lento |

## Performance

### Latencia Típica

```
VerifyToken: 5-15ms
CheckPermission: 3-10ms
GetOrganization: 8-20ms
```

### Cache

gRPC responses se cachean en Redis:

```python
async def verify_token_cached(token: str):
    cache_key = f"grpc:verify:{token}"

    # Intentar obtener de cache
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # Si no existe, llamar a gRPC
    result = await auth_client.verify_token(token)

    # Cachear por 5 minutos
    await redis.setex(cache_key, 300, json.dumps(result))

    return result
```

## Circuit Breaker

Para prevenir cascading failures:

```python
from pybreaker import CircuitBreaker

auth_breaker = CircuitBreaker(
    fail_max=5,
    timeout_duration=60
)

@auth_breaker
async def verify_token_with_breaker(token: str):
    return await auth_client.verify_token(token)
```

## Próximos Pasos

- [API Auth](/microservicios/auth-service/api-auth)
- [Comunicación Microservicios](/arquitectura/comunicacion-microservicios)
