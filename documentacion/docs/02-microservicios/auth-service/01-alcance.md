---
sidebar_position: 2
---

# Alcance del Auth Service

## ¿Qué HACE el Auth Service?

### 1. Gestión de Identidad

#### Usuarios
- ✅ Crear, leer, actualizar, eliminar usuarios
- ✅ Activar/desactivar usuarios
- ✅ Asignar roles a usuarios
- ✅ Asignar locales/sucursales a usuarios
- ✅ Cambiar contraseñas
- ✅ Validar fortaleza de contraseñas
- ✅ Bloquear usuarios por intentos fallidos

#### Organizaciones (Tenants)
- ✅ Crear organizaciones
- ✅ Actualizar información de organizaciones
- ✅ Suspender/reactivar organizaciones
- ✅ Asignar módulos a organizaciones según plan
- ✅ Gestionar límites por plan (max_users, max_locals, etc.)

#### Locales (Sucursales)
- ✅ Crear, leer, actualizar locales
- ✅ Activar/desactivar locales
- ✅ Vincular usuarios a locales

### 2. Autenticación

#### Login
- ✅ Validar credenciales (email + password)
- ✅ Verificar bcrypt hash
- ✅ Generar Access Token (JWT)
- ✅ Generar Refresh Token
- ✅ Crear sesión en Redis
- ✅ Registrar evento de login exitoso

#### Refresh Token
- ✅ Validar Refresh Token
- ✅ Generar nuevo Access Token
- ✅ Rotar Refresh Token (opcional)

#### Logout
- ✅ Invalidar sesión
- ✅ Agregar token a blacklist
- ✅ Limpiar Redis

#### Verificación de Token
- ✅ Validar firma JWT (RS256)
- ✅ Validar expiración
- ✅ Consultar en blacklist
- ✅ Retornar información del usuario

### 3. Autorización (RBAC)

#### Roles
- ✅ Crear roles por organización
- ✅ Actualizar roles
- ✅ Eliminar roles (si no están asignados)
- ✅ Asignar permisos a roles
- ✅ Remover permisos de roles

#### Permisos
- ✅ Definir permisos del sistema (`catalog:read`, `inventory:edit`, etc.)
- ✅ Listar permisos disponibles por módulo
- ✅ Validar que permiso existe antes de asignar

#### Validación de Permisos
- ✅ Verificar si usuario tiene permiso específico
- ✅ Verificar si usuario tiene acceso a local
- ✅ Verificar si módulo está habilitado para organización

### 4. Token Management

#### JWT
- ✅ Generar Access Token con RS256
- ✅ Incluir claims: user_id, org_id, permissions, locals
- ✅ Configurar TTL (15 minutos)

#### Refresh Token
- ✅ Generar Refresh Token
- ✅ Configurar TTL (7 días)
- ✅ Almacenar en Redis con metadata

#### Blacklist
- ✅ Agregar tokens revocados a blacklist
- ✅ Consultar blacklist en cada verificación
- ✅ Limpiar tokens expirados

### 5. Auditoría

#### Eventos de Seguridad
- ✅ Login exitoso
- ✅ Login fallido
- ✅ Intentos bloqueados
- ✅ Cambio de contraseña
- ✅ Usuario creado/actualizado/eliminado
- ✅ Rol creado/actualizado/eliminado
- ✅ Permisos modificados

### 6. APIs Públicas (REST)

#### Endpoints de Autenticación
```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/verify          (interno)
POST   /auth/change-password
```

#### Endpoints de Gestión
```
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id

GET    /api/v1/roles
POST   /api/v1/roles
GET    /api/v1/roles/:id
PUT    /api/v1/roles/:id
DELETE /api/v1/roles/:id

GET    /api/v1/permissions

GET    /api/v1/locals
POST   /api/v1/locals
PUT    /api/v1/locals/:id
DELETE /api/v1/locals/:id

GET    /api/v1/organizations
POST   /api/v1/organizations
PUT    /api/v1/organizations/:id
```

### 7. APIs Internas (gRPC)

```protobuf
service AuthService {
  rpc VerifyToken(VerifyTokenRequest) returns (VerifyTokenResponse);
  rpc GetUserPermissions(GetUserPermissionsRequest) returns (GetUserPermissionsResponse);
}
```

### 8. Eventos Publicados

Auth Service publica eventos a RabbitMQ para que otros servicios reaccionen:

```
auth.user.created
auth.user.updated
auth.user.deactivated
auth.user.deleted
auth.user.password_changed

auth.role.created
auth.role.updated
auth.role.deleted
auth.role.permissions_changed

auth.permission.created
auth.permission.updated
auth.permission.deleted

auth.organization.created
auth.organization.updated
auth.organization.suspended
auth.organization.reactivated
auth.organization.module_enabled
auth.organization.module_disabled

auth.local.created
auth.local.updated
auth.local.deleted

auth.session.created
auth.session.revoked
auth.token.revoked
```

## ¿Qué NO HACE el Auth Service?

### ❌ Validación de Negocio de Otros Servicios

Auth Service **NO** valida lógica de negocio específica de otros microservicios.

**Ejemplo**:
- ✅ Auth Service valida: "¿Este usuario tiene permiso `catalog:create`?"
- ❌ Auth Service NO valida: "¿Este producto tiene stock disponible?"

La validación de negocio es responsabilidad de cada servicio.

### ❌ Gestión de Datos de Dominio

Auth Service **NO** gestiona entidades de dominio de otros servicios.

**No maneja**:
- ❌ Productos (Catalog Service)
- ❌ Inventario (Inventory Service)
- ❌ Órdenes (Order Service)
- ❌ Precios (Pricing Service)

### ❌ Registro de Auditoría Completo

Auth Service publica eventos de auditoría, pero **NO** es responsable de almacenarlos a largo plazo.

**Responsabilidad de Audit Service**:
- Recibir eventos
- Almacenar logs
- Consultar historial
- Generar reportes de auditoría

Auth Service solo **publica** eventos, no los consume.

### ❌ Autenticación con Terceros (OAuth, SAML)

En esta versión, Auth Service **NO** soporta:
- ❌ Login con Google
- ❌ Login con Microsoft
- ❌ SAML SSO
- ❌ LDAP/Active Directory

Solo soporta autenticación por email/password con bcrypt.

:::info Futuro
OAuth2/OIDC y SAML se pueden agregar en futuras versiones.
:::

### ❌ Gestión de Sesiones Complejas

Auth Service **NO** maneja:
- ❌ Múltiples dispositivos por sesión
- ❌ Notificaciones de login desde nuevo dispositivo
- ❌ Geolocalización de sesiones
- ❌ Device fingerprinting

Maneja sesiones simples basadas en tokens JWT.

### ❌ Recuperación de Contraseña por Email

Auth Service **NO** envía emails.

Para recuperación de contraseña:
1. Auth Service genera token de recuperación
2. **Notification Service** (externo) envía el email

:::tip
Separación de responsabilidades: Auth gestiona tokens, Notification envía emails.
:::

### ❌ Two-Factor Authentication (2FA)

En esta versión, Auth Service **NO** soporta:
- ❌ TOTP (Google Authenticator)
- ❌ SMS OTP
- ❌ Email OTP
- ❌ Biometría

Solo autenticación de un factor (email + password).

### ❌ Rate Limiting Global

Auth Service tiene rate limiting básico en `/auth/login`, pero **NO** gestiona rate limiting global del API Gateway.

**Responsabilidad de API Gateway**:
- Rate limiting por IP
- Rate limiting por usuario
- Rate limiting por tenant

### ❌ Gestión de Planes y Billing

Auth Service conoce el plan de cada organización (`basic`, `pro`, `enterprise`), pero **NO** gestiona:
- ❌ Pagos
- ❌ Facturación
- ❌ Upgrades/downgrades de plan
- ❌ Renovaciones

Eso es responsabilidad de un **Billing Service** (futuro).

### ❌ Análisis y Reportes

Auth Service publica eventos, pero **NO** genera:
- ❌ Reportes de usuarios activos
- ❌ Análisis de patrones de login
- ❌ Dashboards de seguridad

Eso es responsabilidad de **Analytics Service** o **Audit Service**.

## Matriz de Responsabilidades

| Funcionalidad | Auth Service | Otro Servicio |
|---------------|--------------|---------------|
| Crear usuario | ✅ | - |
| Validar credenciales | ✅ | - |
| Generar JWT | ✅ | - |
| Verificar JWT | ✅ | - |
| Asignar roles | ✅ | - |
| Validar permisos | ✅ | - |
| Gestionar organizaciones | ✅ | - |
| Gestionar locales | ✅ | - |
| Publicar eventos de auth | ✅ | - |
| **Almacenar logs de auditoría** | ❌ | Audit Service |
| **Validar stock de producto** | ❌ | Inventory Service |
| **Enviar emails** | ❌ | Notification Service |
| **Procesar pagos** | ❌ | Billing Service |
| **Gestionar productos** | ❌ | Catalog Service |
| **Crear órdenes** | ❌ | Order Service |
| **Rate limiting global** | ❌ | API Gateway |
| **Analytics** | ❌ | Analytics Service |

## Límites y Validaciones

### Límites por Plan

Auth Service valida límites según el plan de la organización:

```json
{
  "basic": {
    "max_users": 10,
    "max_locals": 1,
    "max_products": 1000,
    "modules": ["catalog"]
  },
  "pro": {
    "max_users": 50,
    "max_locals": 5,
    "max_products": 10000,
    "modules": ["catalog", "inventory", "orders"]
  },
  "enterprise": {
    "max_users": "unlimited",
    "max_locals": "unlimited",
    "max_products": "unlimited",
    "modules": ["all"]
  }
}
```

**Validaciones realizadas**:
- ✅ No exceder `max_users` al crear usuario
- ✅ No exceder `max_locals` al crear local
- ✅ No permitir uso de módulos no habilitados

**Validaciones NO realizadas**:
- ❌ No valida `max_products` (responsabilidad de Catalog Service)

### Validaciones de Seguridad

Auth Service valida:

1. **Contraseñas**:
   - ✅ Mínimo 8 caracteres
   - ✅ Al menos una mayúscula
   - ✅ Al menos un número
   - ✅ Al menos un carácter especial (opcional)

2. **Emails**:
   - ✅ Formato válido (regex)
   - ✅ Único por organización

3. **Tokens**:
   - ✅ Firma válida (RS256)
   - ✅ No expirado
   - ✅ No en blacklist

4. **Permisos**:
   - ✅ Permiso existe antes de asignar
   - ✅ Usuario tiene permiso antes de autorizar

5. **Locales**:
   - ✅ Usuario tiene acceso al local solicitado

## Dependencias

### Auth Service depende de:

1. **PostgreSQL**: Base de datos principal
2. **Redis**: Cache y sesiones
3. **RabbitMQ**: Publicación de eventos

### Auth Service NO depende de:

- ❌ Catalog Service
- ❌ Inventory Service
- ❌ Order Service
- ❌ Audit Service

Auth Service es **independiente** y puede funcionar sin otros microservicios.

### Otros servicios dependen de Auth Service:

Todos los microservicios dependen de Auth Service para:
- Verificar tokens
- Obtener permisos de usuario
- Validar acceso a recursos

## Próximos Pasos

- [Arquitectura](/microservicios/auth-service/arquitectura)
- [Modelo de Datos](/microservicios/auth-service/modelo-datos)
- [API Auth](/microservicios/auth-service/api-auth)
