---
sidebar_position: 6
---

# ADR-005: RBAC Multi-nivel

**Estado**: Aceptado
**Fecha**: 2025-11-23
**Decisores**: Equipo de Arquitectura zenLogic

## Contexto

zenLogic es un ERP multi-tenant donde cada organización puede tener múltiples locales (tiendas, sucursales, bodegas). Los requisitos de control de acceso son:

### Requisitos

1. **Multi-tenancy**: Aislamiento total entre organizaciones
2. **Multi-local**: Usuarios pueden tener acceso a algunos locales, no todos
3. **Roles Granulares**: Diferentes permisos por módulo (catalog, orders, inventory)
4. **Jerarquía de Permisos**: Admin > Manager > Staff > Viewer
5. **Facilidad de Gestión**: Asignar roles, no permisos individuales
6. **Auditoría**: Registrar quién hizo qué y dónde

### Ejemplo Casos de Uso

```
Organización: "Retail Corp" (3 locales)
- Local A (Sucursal Centro)
- Local B (Sucursal Norte)
- Local C (Bodega)

Usuarios:
1. Juan (CEO): Acceso ADMIN a todos los locales
2. María (Manager Sucursal Centro): Acceso MANAGER solo a Local A
3. Pedro (Vendedor Local A y B): Acceso STAFF a Local A y Local B
4. Ana (Bodeguera): Acceso STAFF solo a Local C
```

**Desafío**: ¿Cómo modelar esto de forma escalable y auditable?

## Decisión

**Implementaremos RBAC (Role-Based Access Control) multi-nivel** con las siguientes características:

### Modelo de 3 Niveles

```yaml
Nivel 1: Organization (Tenant)
  - Aislamiento total entre organizaciones
  - Implementado con RLS (Row-Level Security)

Nivel 2: Local (Store/Branch)
  - Usuarios tienen acceso a subset de locales
  - Tabla: user_locals (many-to-many)

Nivel 3: Role + Permissions
  - Roles con permisos granulares
  - Formato: "module:action" (catalog:read, orders:write)
```

### Estructura de Permisos

```
Permission: "module:action"
Examples:
  - catalog:read
  - catalog:write
  - orders:create
  - orders:update
  - inventory:read
  - inventory:adjust
  - users:manage

Role: Conjunto de permissions
Examples:
  - admin: ["*:*"]  (wildcard: todos los permisos)
  - manager: ["catalog:*", "orders:*", "inventory:read"]
  - staff: ["catalog:read", "orders:create", "orders:read"]
  - viewer: ["catalog:read", "orders:read"]

User → Roles (many-to-many)
User → Locals (many-to-many)
```

## Alternativas Consideradas

### 1. ABAC (Attribute-Based Access Control)

**Modelo**:
```python
# Políticas basadas en atributos
allow if:
  user.role == "manager" AND
  user.department == resource.department AND
  time.hour >= 9 AND time.hour <= 18
```

**Pros**:
- Extremadamente flexible
- Políticas complejas (horarios, ubicación, contexto)
- No necesita pre-definir todos los roles

**Contras**:
- **Complejidad alta**: Difícil de entender y debuggear
- **Performance**: Evaluar políticas en runtime es costoso
- **Over-engineering**: No necesitamos tanta flexibilidad
- **Auditoría difícil**: "¿Por qué este usuario tiene acceso?" es complejo de responder

**Razón de rechazo**: Over-engineering. RBAC es suficiente para ERP.

### 2. ACL (Access Control Lists)

**Modelo**:
```python
# ACL por recurso
Product A:
  - User Juan: read, write
  - User María: read
  - User Pedro: read

Product B:
  - User Juan: read, write
  - User Ana: read
```

**Pros**:
- Control granular por recurso
- Fácil de entender

**Contras**:
- **No escala**: Con 10k productos, ACLs son inmanejables
- **Gestión pesadilla**: Cambiar permisos de 1 usuario = modificar miles de ACLs
- **No hay concepto de Role**: Repetir permisos para cada usuario

**Razón de rechazo**: No escala para ERP con miles de recursos.

### 3. Simple User Groups

**Modelo**:
```python
# Grupos planos
Groups:
  - admins
  - managers
  - staff

User → Group (one-to-many)
```

**Pros**:
- Súper simple
- Fácil de implementar

**Contras**:
- **No granularidad**: No puedes tener "catalog manager" y "orders viewer"
- **No composición**: Usuario necesita múltiples permisos = múltiples grupos
- **No jerarquía**: No hay concepto de permisos heredados

**Razón de rechazo**: Insuficiente para ERP complejo.

## Consecuencias

### Positivas

1. **Modelo de Datos Claro**

```sql
-- Tabla: roles
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- Tabla: permissions (predefinidos)
CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,  -- "catalog:read"
    module VARCHAR(50) NOT NULL,        -- "catalog"
    action VARCHAR(50) NOT NULL,        -- "read"
    description TEXT
);

-- Tabla: role_permissions
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Tabla: user_roles
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Tabla: user_locals (multi-local)
CREATE TABLE user_locals (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    local_id UUID REFERENCES locals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, local_id)
);
```

2. **Verificación Eficiente**

```python
# app/services/authorization.py
from typing import Set

class AuthorizationService:
    async def check_permission(
        self,
        user_id: str,
        organization_id: str,
        local_id: str,
        required_permission: str  # "catalog:write"
    ) -> bool:
        # 1. Verificar que usuario pertenece a organización
        user = await self.user_repo.get_by_id(user_id)
        if user.organization_id != organization_id:
            return False

        # 2. Verificar acceso al local
        has_local_access = await self.user_repo.has_local_access(
            user_id, local_id
        )
        if not has_local_access:
            return False

        # 3. Verificar permiso
        user_permissions = await self.get_user_permissions(user_id)

        # Wildcard support: "catalog:*" matches "catalog:write"
        module, action = required_permission.split(':')

        if "*:*" in user_permissions:  # Admin
            return True
        if f"{module}:*" in user_permissions:
            return True
        if required_permission in user_permissions:
            return True

        return False

    async def get_user_permissions(self, user_id: str) -> Set[str]:
        """Obtener todos los permisos del usuario (union de sus roles)."""
        query = """
        SELECT DISTINCT p.name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN roles r ON rp.role_id = r.id
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = :user_id
        """
        result = await db.execute(query, {"user_id": user_id})
        return {row["name"] for row in result}
```

3. **Middleware de Autorización**

```python
# app/middleware/authorization.py
from fastapi import Request, HTTPException, Depends

async def require_permission(
    required_permission: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
    auth_service: AuthorizationService = Depends()
):
    """Middleware para verificar permisos."""

    # Extraer local_id del request
    local_id = request.headers.get("X-Local-ID")
    if not local_id:
        raise HTTPException(400, "X-Local-ID header required")

    # Verificar permiso
    has_permission = await auth_service.check_permission(
        user_id=current_user["user_id"],
        organization_id=current_user["organization_id"],
        local_id=local_id,
        required_permission=required_permission
    )

    if not has_permission:
        raise HTTPException(
            403,
            f"Permission denied: {required_permission}"
        )

# Uso en endpoints
@router.post("/products")
async def create_product(
    product: ProductCreate,
    _: None = Depends(require_permission("catalog:write"))
):
    # Usuario ya fue autorizado por middleware
    ...
```

4. **Roles Predefinidos**

```python
# app/seeds/default_roles.py

DEFAULT_PERMISSIONS = [
    ("catalog:read", "catalog", "read", "View products"),
    ("catalog:write", "catalog", "write", "Create/update products"),
    ("catalog:delete", "catalog", "delete", "Delete products"),
    ("orders:read", "orders", "read", "View orders"),
    ("orders:create", "orders", "create", "Create orders"),
    ("orders:update", "orders", "update", "Update order status"),
    ("inventory:read", "inventory", "read", "View inventory"),
    ("inventory:adjust", "inventory", "adjust", "Adjust stock levels"),
    ("users:manage", "users", "manage", "Manage users and roles"),
]

DEFAULT_ROLES = {
    "admin": {
        "description": "Full system access",
        "permissions": ["*:*"]
    },
    "manager": {
        "description": "Manage catalog and orders",
        "permissions": [
            "catalog:*",
            "orders:*",
            "inventory:read",
            "inventory:adjust"
        ]
    },
    "staff": {
        "description": "Create orders and view catalog",
        "permissions": [
            "catalog:read",
            "orders:create",
            "orders:read",
            "inventory:read"
        ]
    },
    "viewer": {
        "description": "Read-only access",
        "permissions": [
            "catalog:read",
            "orders:read",
            "inventory:read"
        ]
    }
}
```

5. **Cache de Permisos**

```python
# app/cache/permissions_cache.py
from app.cache.redis_cache import RedisCache

class PermissionsCache:
    def __init__(self, redis: RedisCache):
        self.redis = redis
        self.ttl = 300  # 5 minutos

    async def get_user_permissions(self, user_id: str) -> Optional[Set[str]]:
        """Get cached permissions."""
        key = f"permissions:{user_id}"
        cached = await self.redis.get(key)
        if cached:
            return set(cached)
        return None

    async def set_user_permissions(self, user_id: str, permissions: Set[str]):
        """Cache permissions."""
        key = f"permissions:{user_id}"
        await self.redis.set(key, list(permissions), ttl=self.ttl)

    async def invalidate_user_permissions(self, user_id: str):
        """Invalidate cache when roles change."""
        key = f"permissions:{user_id}"
        await self.redis.delete(key)
```

6. **Auditoría de Permisos**

```python
# Evento publicado cuando cambian permisos
await event_publisher.publish(
    "auth.role.permissions_changed",
    {
        "role_id": role_id,
        "role_name": role.name,
        "organization_id": org_id,
        "changes": {
            "added": ["catalog:write"],
            "removed": ["orders:delete"]
        },
        "modified_by": current_user_id
    }
)

# Audit Service registra evento
# Timeline muestra quién cambió qué permisos y cuándo
```

### Negativas

1. **N+1 Queries sin Cache**
   - Verificar permisos = query a DB
   - Con 1000 req/s, muchas queries
   - **Mitigación**:
     - Cache Redis con TTL 5min
     - Lazy loading de permisos en JWT
     ```python
     # Incluir permisos en JWT (refresh cuando expira)
     access_token_payload = {
         "user_id": user.id,
         "organization_id": user.organization_id,
         "permissions": await get_user_permissions(user.id),
         "locals": await get_user_locals(user.id)
     }
     ```

2. **Cambios en Roles No Son Inmediatos**
   - Admin cambia permisos de rol "manager"
   - Usuarios con ese rol tienen cache
   - **Mitigación**:
     - Invalidar cache cuando cambian roles
     - TTL corto (5min) limita inconsistencia
     - JWT expira cada 15min (refresh forzado)

3. **Wildcard Evaluation Overhead**
   - Verificar "catalog:*" requiere string matching
   - **Mitigación**: Minimal, modern CPUs son rápidos
     ```python
     # Benchmark: 100k permission checks
     # Sin wildcard: 0.5s
     # Con wildcard: 0.7s
     # Overhead: 40% pero absolutamente aceptable
     ```

### Riesgos

1. **Privilege Escalation si Hay Bugs**
   - Bug en `check_permission()` podría dar acceso indebido
   - **Mitigación**:
     - Tests comprehensivos de autorización
     - Principio de "deny by default"
     - Auditoría de todos los cambios de permisos

2. **Gestión de Roles Complicada para Admins**
   - Con 50 permisos, crear roles custom es tedioso
   - **Mitigación**:
     - Roles predefinidos cubren 90% casos
     - UI de gestión de roles en frontend
     - Templates de roles por industria

## Ejemplo Completo

### Crear Usuario con Roles

```python
# 1. Crear usuario
user = await user_service.create_user(
    email="maria@example.com",
    organization_id=org_id
)

# 2. Asignar rol "manager"
manager_role = await role_repo.get_by_name(org_id, "manager")
await user_repo.assign_role(user.id, manager_role.id)

# 3. Asignar acceso a locales específicos
await user_repo.assign_local(user.id, local_a_id)
await user_repo.assign_local(user.id, local_b_id)

# Resultado:
# María tiene permisos de "manager" (catalog:*, orders:*)
# Solo en Local A y Local B
# No tiene acceso a Local C
```

### Verificar Acceso en Request

```python
@router.post("/products", dependencies=[Depends(require_permission("catalog:write"))])
async def create_product(
    product: ProductCreate,
    local_id: str = Header(..., alias="X-Local-ID"),
    current_user: dict = Depends(get_current_user)
):
    # Middleware ya verificó:
    # 1. User pertenece a organización
    # 2. User tiene acceso a local_id
    # 3. User tiene permiso "catalog:write"

    # Crear producto en local específico
    new_product = await product_service.create(
        product_data=product,
        organization_id=current_user["organization_id"],
        local_id=local_id,
        created_by=current_user["user_id"]
    )

    return new_product
```

## Monitoreo

```python
from prometheus_client import Counter, Histogram

authorization_checks = Counter(
    "authorization_checks_total",
    "Total authorization checks",
    ["permission", "result"]
)

authorization_duration = Histogram(
    "authorization_check_seconds",
    "Authorization check duration",
    ["permission"]
)

# Uso
with authorization_duration.labels(permission="catalog:write").time():
    result = await check_permission(...)
    authorization_checks.labels(
        permission="catalog:write",
        result="allowed" if result else "denied"
    ).inc()
```

## Revisión Futura

Este ADR debe revisarse si:

1. Performance de autorización supera 10ms p99
2. Necesitamos políticas más complejas (ABAC)
3. Gestión de roles se vuelve inmanejable (`>100 roles custom`)

**Fecha de próxima revisión**: 2026-11-23 (1 año)

## Referencias

- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Authz: RBAC vs ABAC](https://www.osohq.com/post/rbac-vs-abac)

## Próximos Pasos

- [Auth Service - RBAC](/microservicios/auth-service/overview)
- [Auth Service - API Roles](/microservicios/auth-service/api-roles)
- [Auth Service - API Permissions](/microservicios/auth-service/api-permissions)
- [Seguridad y RBAC](/arquitectura/seguridad-rbac)
