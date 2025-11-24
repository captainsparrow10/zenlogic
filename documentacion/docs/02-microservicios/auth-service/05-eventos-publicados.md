---
sidebar_position: 6
---

# Eventos Publicados

Auth Service publica eventos a RabbitMQ para notificar cambios a otros microservicios.

## Exchange Configuration

```python
exchange_name = "auth_events"
exchange_type = "topic"
durable = True
```

## Formato de Eventos

Todos los eventos siguen este formato estándar:

```json
{
  "event_type": "auth.user.created",
  "timestamp": "2025-11-23T10:30:00Z",
  "service": "auth-service",
  "payload": {
    "user_id": "user_001",
    "organization_id": "org_123",
    ...
  }
}
```

## Eventos de Usuarios

### auth.user.created

Publicado cuando se crea un nuevo usuario.

```json
{
  "event_type": "auth.user.created",
  "timestamp": "2025-11-23T10:30:00Z",
  "service": "auth-service",
  "payload": {
    "user_id": "user_001",
    "organization_id": "org_123",
    "email": "user@example.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "roles": ["role_admin"],
    "locals": ["local_01"],
    "active": true
  }
}
```

**Routing Key**: `auth.user.created`

**Consumidores**:
- **Audit Service**: Registra la creación
- **Notification Service**: Envía email de bienvenida

### auth.user.updated

```json
{
  "event_type": "auth.user.updated",
  "timestamp": "2025-11-23T10:35:00Z",
  "service": "auth-service",
  "payload": {
    "user_id": "user_001",
    "organization_id": "org_123",
    "changes": {
      "email": {"old": "old@example.com", "new": "new@example.com"},
      "roles": {"added": ["role_manager"], "removed": []}
    }
  }
}
```

**Routing Key**: `auth.user.updated`

### auth.user.deactivated

```json
{
  "event_type": "auth.user.deactivated",
  "timestamp": "2025-11-23T10:40:00Z",
  "service": "auth-service",
  "payload": {
    "user_id": "user_001",
    "organization_id": "org_123",
    "reason": "manual"  // "manual", "too_many_attempts"
  }
}
```

**Routing Key**: `auth.user.deactivated`

**Consumidores**:
- **Todos los servicios**: Invalidan cache de usuario
- **Order Service**: Cancela órdenes pendientes del usuario

### auth.user.deleted

```json
{
  "event_type": "auth.user.deleted",
  "timestamp": "2025-11-23T10:45:00Z",
  "service": "auth-service",
  "payload": {
    "user_id": "user_001",
    "organization_id": "org_123"
  }
}
```

**Routing Key**: `auth.user.deleted`

### auth.user.password_changed

```json
{
  "event_type": "auth.user.password_changed",
  "timestamp": "2025-11-23T10:50:00Z",
  "service": "auth-service",
  "payload": {
    "user_id": "user_001",
    "organization_id": "org_123",
    "changed_by": "user_001"  // self-change
  }
}
```

**Routing Key**: `auth.user.password_changed`

**Consumidores**:
- **Audit Service**: Registra el cambio
- **Notification Service**: Envía notificación de seguridad

## Eventos de Roles

### auth.role.created

```json
{
  "event_type": "auth.role.created",
  "timestamp": "2025-11-23T11:00:00Z",
  "service": "auth-service",
  "payload": {
    "role_id": "role_custom_01",
    "organization_id": "org_123",
    "name": "Gerente de Ventas",
    "permissions": ["catalog:read", "orders:create"]
  }
}
```

**Routing Key**: `auth.role.created`

### auth.role.permissions_changed

```json
{
  "event_type": "auth.role.permissions_changed",
  "timestamp": "2025-11-23T11:05:00Z",
  "service": "auth-service",
  "payload": {
    "role_id": "role_custom_01",
    "organization_id": "org_123",
    "permissions": {
      "added": ["catalog:edit"],
      "removed": []
    }
  }
}
```

**Routing Key**: `auth.role.permissions_changed`

**Consumidores**:
- **Todos los servicios**: Invalidan cache de permisos

## Eventos de Organizaciones

### auth.organization.created

```json
{
  "event_type": "auth.organization.created",
  "timestamp": "2025-11-23T11:10:00Z",
  "service": "auth-service",
  "payload": {
    "organization_id": "org_456",
    "name": "Nueva Empresa S.A.",
    "slug": "nueva-empresa",
    "plan": "pro",
    "modules_enabled": ["catalog", "inventory", "orders"]
  }
}
```

**Routing Key**: `auth.organization.created`

### auth.organization.module_enabled

```json
{
  "event_type": "auth.organization.module_enabled",
  "timestamp": "2025-11-23T11:15:00Z",
  "service": "auth-service",
  "payload": {
    "organization_id": "org_123",
    "module_id": "module_pricing",
    "module_name": "Precios"
  }
}
```

**Routing Key**: `auth.organization.module_enabled`

### auth.organization.suspended

```json
{
  "event_type": "auth.organization.suspended",
  "timestamp": "2025-11-23T11:20:00Z",
  "service": "auth-service",
  "payload": {
    "organization_id": "org_123",
    "reason": "payment_failure"
  }
}
```

**Routing Key**: `auth.organization.suspended`

**Consumidores**:
- **Todos los servicios**: Rechazan requests de esta organización

## Eventos de Locales

### auth.local.created

```json
{
  "event_type": "auth.local.created",
  "timestamp": "2025-11-23T11:25:00Z",
  "service": "auth-service",
  "payload": {
    "local_id": "local_03",
    "organization_id": "org_123",
    "name": "Sucursal Norte",
    "code": "SN-03"
  }
}
```

**Routing Key**: `auth.local.created`

**Consumidores**:
- **Inventory Service**: Inicializa stock para nuevo local

## Eventos de Sesiones

### auth.session.created

```json
{
  "event_type": "auth.session.created",
  "timestamp": "2025-11-23T11:30:00Z",
  "service": "auth-service",
  "payload": {
    "user_id": "user_001",
    "organization_id": "org_123",
    "session_id": "session_abc123",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  }
}
```

**Routing Key**: `auth.session.created`

**Consumidores**:
- **Audit Service**: Registra inicio de sesión

### auth.session.revoked

```json
{
  "event_type": "auth.session.revoked",
  "timestamp": "2025-11-23T12:00:00Z",
  "service": "auth-service",
  "payload": {
    "user_id": "user_001",
    "organization_id": "org_123",
    "session_id": "session_abc123",
    "reason": "logout"  // "logout", "expired", "revoked"
  }
}
```

**Routing Key**: `auth.session.revoked`

## Consumo de Eventos

### Ejemplo: Catalog Service

```python
import pika
import json

def callback(ch, method, properties, body):
    event = json.loads(body)

    if event["event_type"] == "auth.user.deactivated":
        user_id = event["payload"]["user_id"]
        # Invalidar cache
        await cache.delete(f"user:{user_id}")
        logger.info(f"Cache invalidated for user {user_id}")

    ch.basic_ack(delivery_tag=method.delivery_tag)

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# Declarar exchange
channel.exchange_declare(
    exchange='auth_events',
    exchange_type='topic',
    durable=True
)

# Crear queue
channel.queue_declare(queue='catalog_auth_events', durable=True)

# Bind a eventos específicos
channel.queue_bind(
    exchange='auth_events',
    queue='catalog_auth_events',
    routing_key='auth.user.*'
)
channel.queue_bind(
    exchange='auth_events',
    queue='catalog_auth_events',
    routing_key='auth.organization.*'
)

# Consumir
channel.basic_consume(
    queue='catalog_auth_events',
    on_message_callback=callback
)

channel.start_consuming()
```

## Tabla de Routing Keys

| Evento | Routing Key | Consumidores Típicos |
|--------|-------------|---------------------|
| user.created | `auth.user.created` | Audit, Notification |
| user.updated | `auth.user.updated` | Audit, Cache |
| user.deactivated | `auth.user.deactivated` | Todos los servicios |
| role.permissions_changed | `auth.role.permissions_changed` | Todos los servicios |
| organization.suspended | `auth.organization.suspended` | Todos los servicios |
| local.created | `auth.local.created` | Inventory |
| session.created | `auth.session.created` | Audit |

## Próximos Pasos

- [gRPC Server](/microservicios/auth-service/grpc-server)
- [Arquitectura Event-Driven](/arquitectura/arquitectura-event-driven)
