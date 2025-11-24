---
sidebar_position: 14
---

# Flujos de Negocio

Diagramas de flujos principales de Auth Service.

## Flujo de Login

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant UserRepo
    participant Crypto
    participant TokenService
    participant Redis
    participant EventPub

    Client->>API: POST /auth/login<br/>{email, password}
    API->>AuthService: login(email, password)

    AuthService->>UserRepo: get_by_email(email)
    UserRepo-->>AuthService: User

    alt Usuario no encontrado
        AuthService-->>API: InvalidCredentialsError
        API-->>Client: 401 Unauthorized
    end

    AuthService->>Crypto: verify_password(password, hash)
    Crypto-->>AuthService: valid=True

    alt Contraseña inválida
        AuthService->>Redis: INCR failed_login:user_id
        alt >= 5 intentos
            AuthService->>UserRepo: update(locked=True)
            AuthService-->>API: UserLockedError
            API-->>Client: 423 Locked
        else
            AuthService-->>API: InvalidCredentialsError
            API-->>Client: 401 Unauthorized
        end
    end

    alt Usuario inactivo
        AuthService-->>API: UserInactiveError
        API-->>Client: 403 Forbidden
    end

    AuthService->>TokenService: create_access_token(user)
    TokenService-->>AuthService: access_token

    AuthService->>TokenService: create_refresh_token(user)
    TokenService->>Redis: SETEX refresh_token
    TokenService-->>AuthService: refresh_token

    AuthService->>EventPub: publish("auth.session.created")

    AuthService-->>API: {access_token, refresh_token, user}
    API-->>Client: 200 OK + tokens
```

## Flujo de Verificación de Token (gRPC)

```mermaid
sequenceDiagram
    participant CatalogService
    participant AuthGRPC
    participant TokenService
    participant Redis
    participant UserRepo
    participant DB

    CatalogService->>AuthGRPC: VerifyToken(token)
    AuthGRPC->>TokenService: verify_token(token)

    TokenService->>Redis: EXISTS blacklist:{token}
    alt Token en blacklist
        Redis-->>TokenService: True
        TokenService-->>AuthGRPC: TokenRevokedError
        AuthGRPC-->>CatalogService: UNAUTHENTICATED
    end

    TokenService->>TokenService: jwt.decode(token, public_key)
    alt Firma inválida
        TokenService-->>AuthGRPC: InvalidTokenError
        AuthGRPC-->>CatalogService: UNAUTHENTICATED
    end

    alt Token expirado
        TokenService-->>AuthGRPC: TokenExpiredError
        AuthGRPC-->>CatalogService: UNAUTHENTICATED
    end

    TokenService->>Redis: GET user:{user_id}
    alt Cache hit
        Redis-->>TokenService: User data
    else Cache miss
        TokenService->>UserRepo: get_by_id(user_id)
        UserRepo->>DB: SELECT * FROM users
        DB-->>UserRepo: User
        UserRepo-->>TokenService: User
        TokenService->>Redis: SETEX user:{user_id}
    end

    alt Usuario inactivo
        TokenService-->>AuthGRPC: UserInactiveError
        AuthGRPC-->>CatalogService: PERMISSION_DENIED
    end

    TokenService-->>AuthGRPC: User data
    AuthGRPC-->>CatalogService: VerifyTokenResponse{...}
```

## Flujo de Creación de Usuario

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant UserService
    participant OrgService
    participant Crypto
    participant UserRepo
    participant EventPub

    Admin->>API: POST /api/v1/users<br/>{email, password, roles, locals}
    API->>UserService: create_user(data, admin)

    UserService->>OrgService: check_user_limit(org_id)
    alt Límite excedido
        OrgService-->>UserService: LimitExceededError
        UserService-->>API: Error
        API-->>Admin: 400 Bad Request
    end

    UserService->>UserRepo: get_by_email(email)
    alt Email ya existe
        UserRepo-->>UserService: User exists
        UserService-->>API: EmailAlreadyExistsError
        API-->>Admin: 409 Conflict
    end

    UserService->>Crypto: hash_password(password)
    Crypto-->>UserService: password_hash

    UserService->>UserRepo: create(user)
    UserRepo-->>UserService: User

    UserService->>UserRepo: assign_roles(user_id, role_ids)
    UserService->>UserRepo: assign_locals(user_id, local_ids)

    UserService->>EventPub: publish("auth.user.created", {...})

    UserService-->>API: User
    API-->>Admin: 201 Created + User
```

## Flujo de Asignación de Permisos a Rol

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant RoleService
    participant PermRepo
    participant RoleRepo
    participant EventPub
    participant Cache

    Admin->>API: PUT /api/v1/roles/:id<br/>{permission_ids: [...]}
    API->>RoleService: update_role_permissions(role_id, permissions)

    RoleService->>RoleRepo: get_by_id(role_id)
    RoleRepo-->>RoleService: Role

    loop Para cada permission_id
        RoleService->>PermRepo: get_by_id(permission_id)
        alt Permiso no existe
            PermRepo-->>RoleService: None
            RoleService-->>API: PermissionNotFoundError
            API-->>Admin: 404 Not Found
        end
    end

    RoleService->>RoleRepo: get_current_permissions(role_id)
    RoleRepo-->>RoleService: current_permissions

    RoleService->>RoleService: calculate_diff(current, new)
    Note over RoleService: added = new - current<br/>removed = current - new

    RoleService->>RoleRepo: remove_permissions(role_id, removed)
    RoleService->>RoleRepo: add_permissions(role_id, added)

    RoleService->>EventPub: publish("auth.role.permissions_changed", {...})

    loop Para cada microservicio
        EventPub->>Cache: Invalidar cache de permisos
    end

    RoleService-->>API: Role
    API-->>Admin: 200 OK + Role
```

## Flujo de Logout

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant Redis
    participant SessionRepo
    participant EventPub

    Client->>API: POST /auth/logout<br/>Bearer {access_token}<br/>{refresh_token}
    API->>AuthService: logout(user_id, refresh_token)

    AuthService->>Redis: SETEX blacklist:{access_token}<br/>TTL = token exp time

    AuthService->>Redis: GET session:{refresh_token}
    Redis-->>AuthService: session_id

    AuthService->>SessionRepo: delete(session_id)

    AuthService->>Redis: DEL session:{refresh_token}
    AuthService->>Redis: DEL user:{user_id}

    AuthService->>EventPub: publish("auth.session.revoked", {...})

    AuthService-->>API: Success
    API-->>Client: 200 OK
```

## Flujo de Cambio de Plan de Organización

```mermaid
sequenceDiagram
    participant SysAdmin
    participant API
    participant OrgService
    participant OrgRepo
    participant EventPub
    participant AllServices

    SysAdmin->>API: PUT /api/v1/organizations/:id<br/>{plan: "enterprise", modules: [...]}
    API->>OrgService: update_organization(org_id, data)

    OrgService->>OrgRepo: get_by_id(org_id)
    OrgRepo-->>OrgService: Organization

    OrgService->>OrgService: validate_plan_change(old_plan, new_plan)

    OrgService->>OrgRepo: update(org_id, {plan, modules})
    OrgRepo-->>OrgService: Organization

    alt Nuevos módulos habilitados
        loop Para cada módulo nuevo
            OrgService->>EventPub: publish("auth.organization.module_enabled", {...})
            EventPub->>AllServices: Notificar
        end
    end

    alt Módulos deshabilitados
        loop Para cada módulo removido
            OrgService->>EventPub: publish("auth.organization.module_disabled", {...})
            EventPub->>AllServices: Notificar
        end
    end

    OrgService-->>API: Organization
    API-->>SysAdmin: 200 OK
```

## Próximos Pasos

- [Catalog Service](/microservicios/catalog-service/overview)
- [Seguridad y RBAC](/arquitectura/seguridad-rbac)
