---
sidebar_position: 4
---

# Comunicación entre Microservicios

## Introducción

El sistema utiliza **comunicación híbrida** combinando:
- **REST** para APIs públicas (frontend ↔ backend)
- **gRPC** para comunicación interna (backend ↔ backend)
- **Eventos** para comunicación asíncrona

## Diagrama General

```mermaid
graph TB
    subgraph "Frontend"
        Web[Web App]
        Mobile[Mobile App]
    end

    subgraph "API Gateway"
        Gateway[Gateway]
    end

    subgraph "Microservicios"
        Auth[Auth Service<br/>REST + gRPC]
        Catalog[Catalog Service<br/>REST]
        Inventory[Inventory Service<br/>REST]
    end

    subgraph "Message Broker"
        MQ[RabbitMQ]
    end

    Web -->|REST| Gateway
    Mobile -->|REST| Gateway

    Gateway -->|REST| Auth
    Gateway -->|REST| Catalog

    Catalog -->|gRPC| Auth
    Inventory -->|gRPC| Auth

    Auth -->|eventos| MQ
    Catalog -->|eventos| MQ

    MQ -->|consume| Catalog
    MQ -->|consume| Inventory
```

## REST APIs

### Uso

**Para**: Comunicación externa (frontend ↔ microservicios)

**Ventajas**:
- ✅ Estándar universal
- ✅ Fácil de consumir desde navegadores
- ✅ Documentación con OpenAPI/Swagger
- ✅ Debugging simple (HTTP readable)

### Características

- **Protocolo**: HTTP/1.1
- **Formato**: JSON
- **Autenticación**: JWT en header `Authorization: Bearer <token>`
- **Versionado**: `/api/v1/...`

### Ejemplo REST

```http
POST /api/v1/products HTTP/1.1
Host: catalog-service
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "title": "Producto Nuevo",
  "sku": "PROD-001"
}
```

## gRPC

### Uso

**Para**: Comunicación interna (microservicio ↔ microservicio)

**Ventajas**:
- ✅ Alto rendimiento (binario, HTTP/2)
- ✅ Tipado fuerte (proto files)
- ✅ Streaming bidireccional
- ✅ Menor latencia que REST

### Proto File Ejemplo

```protobuf
syntax = "proto3";

package auth;

service AuthService {
  rpc VerifyToken (VerifyTokenRequest) returns (VerifyTokenResponse);
}

message VerifyTokenRequest {
  string access_token = 1;
}

message VerifyTokenResponse {
  string user_id = 1;
  string organization_id = 2;
  repeated string permissions = 3;
  repeated string locals = 4;
  bool active = 5;
}
```

### Flujo gRPC

```mermaid
sequenceDiagram
    participant Catalog
    participant Auth

    Catalog->>Auth: VerifyToken(token) [gRPC]
    Auth->>Auth: Validar y decodificar
    Auth-->>Catalog: {user_id, permissions, ...}
    Catalog->>Catalog: Autorizar operación
```

### Servicios gRPC Expuestos

| Servicio | Método gRPC | Uso |
|----------|-------------|-----|
| Auth Service | `VerifyToken` | Validar tokens desde otros servicios |

## Comunicación Asíncrona (Eventos)

### Uso

**Para**: Notificaciones, invalidación de cache, auditoría

**Ventajas**:
- ✅ Desacoplamiento temporal
- ✅ No bloquea el flujo principal
- ✅ Permite múltiples consumers

### Ejemplo

```python
# Auth Service (Producer)
await event_publisher.publish(
    event_type="auth.user.deactivated",
    payload={"user_id": "user_002"},
    organization_id="org_123"
)

# Catalog Service (Consumer)
@event_consumer.on("auth.user.deactivated")
async def handle_user_deactivated(event):
    await cache.invalidate(f"user:{event['user_id']}")
```

## Comparación REST vs gRPC

| Aspecto | REST | gRPC |
|---------|------|------|
| **Protocolo** | HTTP/1.1 | HTTP/2 |
| **Formato** | JSON (texto) | Protobuf (binario) |
| **Performance** | Medio | Alto |
| **Legibilidad** | Alta | Baja (binario) |
| **Tooling** | Curl, Postman | grpcurl, BloomRPC |
| **Uso en proyecto** | Frontend → Backend | Backend ↔ Backend |

## Política de Uso: Cuándo usar cada protocolo

### SIEMPRE usar REST

| Escenario | Razón |
|-----------|-------|
| Frontend (Web/Mobile) → API | Compatibilidad con navegadores |
| APIs públicas o externas | Estándar universal, fácil integración |
| Webhooks entrantes | Interoperabilidad |
| Documentación requerida (Swagger) | OpenAPI es REST nativo |
| Debugging frecuente | JSON legible |

### SIEMPRE usar gRPC

| Escenario | Razón |
|-----------|-------|
| Validación de tokens entre servicios | Alta frecuencia, baja latencia |
| Consultas de precio en POS | Rendimiento crítico |
| Verificación de stock en tiempo real | Milisegundos importan |
| Streaming de datos (logs, métricas) | HTTP/2 streaming |
| Comunicación interna frecuente | Menor overhead |

### Servicios gRPC Expuestos (Completo)

| Servicio | Método gRPC | Consumidores | Propósito |
|----------|-------------|--------------|-----------|
| **Auth Service** | `VerifyToken()` | Todos | Validar JWT |
| **Auth Service** | `GetUserPermissions()` | Todos | Obtener permisos |
| **Auth Service** | `GetOrganization()` | Todos | Info de tenant |
| **Pricing Service** | `GetPrice()` | POS, Order | Precio de venta |
| **Pricing Service** | `GetPricesBatch()` | POS, Order | Precios en lote |
| **Pricing Service** | `CheckLoyaltyPoints()` | POS, Order | Saldo de puntos |
| **Pricing Service** | `AddLoyaltyPoints()` | POS, Order | Acumular puntos |
| **Pricing Service** | `RedeemLoyaltyPoints()` | POS, Order | Canjear puntos |
| **Inventory Service** | `CheckStock()` | POS, Order | Verificar disponibilidad |
| **Inventory Service** | `ReserveStock()` | Order | Reservar stock |
| **Inventory Service** | `ReleaseStock()` | Order | Liberar reserva |
| **Customer Service** | `GetCustomer()` | POS, Order | Info de cliente |
| **Customer Service** | `GetCustomerLoyaltyTier()` | POS, Pricing | Tier de lealtad |
| **Customer Service** | `CheckCreditAvailability()` | Order | Validar crédito |

### Decisión por tipo de operación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ÁRBOL DE DECISIÓN                                     │
│                                                                              │
│  ¿Es una llamada desde el frontend?                                         │
│     → SÍ → Usar REST                                                         │
│     → NO ↓                                                                   │
│                                                                              │
│  ¿Es comunicación entre microservicios?                                     │
│     → SÍ ↓                                                                   │
│                                                                              │
│  ¿Requiere respuesta inmediata y es frecuente (>100 calls/min)?            │
│     → SÍ → Usar gRPC                                                         │
│     → NO ↓                                                                   │
│                                                                              │
│  ¿Puede ser asíncrono (no necesita respuesta inmediata)?                    │
│     → SÍ → Usar Eventos (RabbitMQ)                                          │
│     → NO → Usar REST (simplicidad) o gRPC (rendimiento)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Excepciones Permitidas

1. **REST entre servicios**: Permitido para operaciones poco frecuentes o debugging
2. **gRPC con fallback a REST**: Para alta disponibilidad
3. **Eventos para operaciones síncronas**: NUNCA (usar para notificaciones, no queries)

## Circuit Breaker

Para prevenir cascading failures cuando un servicio falla:

```python
from pybreaker import CircuitBreaker

auth_breaker = CircuitBreaker(
    fail_max=5,          # Abrir después de 5 fallos
    timeout_duration=60  # Intentar de nuevo en 60s
)

@auth_breaker
async def verify_token_grpc(token):
    return await auth_grpc_client.VerifyToken(token)
```

### Estados del Circuit Breaker

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open: 5 errores consecutivos
    Open --> HalfOpen: Timeout (60s)
    HalfOpen --> Closed: Request exitoso
    HalfOpen --> Open: Request falla
```

## Timeouts y Retry

### Timeouts Configurados

| Tipo de llamada | Timeout |
|----------------|---------|
| gRPC | 2-3 segundos |
| REST interno | 3-5 segundos |
| REST externo | 10 segundos |
| Eventos | No aplica (asíncrono) |

### Estrategia de Retry

```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10)
)
async def call_external_service():
    # Llamada a servicio externo
    pass
```

## Fallback Strategies

### gRPC a REST

Si gRPC falla, hacer fallback a REST:

```python
async def verify_token(token):
    try:
        # Intentar gRPC primero
        return await auth_grpc_client.verify(token)
    except grpc.RpcError:
        # Fallback a REST
        return await auth_rest_client.verify(token)
```

## Trazabilidad (Correlation ID)

Cada request lleva un `correlation_id` para rastrear:

```
Request ID: req_9912ABCD

Auth Service: req_9912ABCD - Verificando token
Catalog Service: req_9912ABCD - Creando producto
RabbitMQ: req_9912ABCD - Publicando evento
Audit Service: req_9912ABCD - Registrando auditoría
```

## Próximos Pasos

- [Auth Service - gRPC Server](/microservicios/auth-service/grpc-server)
- [Catalog Service - gRPC Client](/microservicios/catalog-service/auth-client-grpc)
- [ADR-004: gRPC Internal Communication](/adrs/adr-004-grpc-internal)
- [Integraciones - gRPC](/integraciones/grpc)
