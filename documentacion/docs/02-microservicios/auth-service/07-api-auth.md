---
sidebar_position: 8
---

# API - Autenticación

Endpoints para login, refresh y logout.

## Base URL

```
POST /auth/*
```

## POST /auth/login

Autenticar usuario con credenciales.

### Request

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@empresa.com",
  "password": "SecurePassword123"
}
```

### Response 200 OK

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {
    "id": "user_001",
    "email": "admin@empresa.com",
    "first_name": "Admin",
    "last_name": "Sistema",
    "organization_id": "org_123",
    "permissions": ["catalog:read", "catalog:create"],
    "locals": ["local_01", "local_02"]
  }
}
```

### Response 401 Unauthorized

```json
{
  "detail": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email o contraseña incorrectos"
  }
}
```

### Response 423 Locked

```json
{
  "detail": {
    "code": "USER_LOCKED",
    "message": "Usuario bloqueado por múltiples intentos fallidos",
    "locked_until": "2025-11-23T11:45:00Z"
  }
}
```

## POST /auth/refresh

Renovar Access Token usando Refresh Token.

### Request

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response 200 OK

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### Response 401 Unauthorized

```json
{
  "detail": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token inválido o expirado"
  }
}
```

## POST /auth/logout

Cerrar sesión y revocar tokens.

### Request

```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response 200 OK

```json
{
  "message": "Sesión cerrada exitosamente"
}
```

## POST /auth/verify

Verificar token (uso interno entre microservicios).

### Request

```http
POST /auth/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response 200 OK

```json
{
  "user_id": "user_001",
  "organization_id": "org_123",
  "email": "admin@empresa.com",
  "permissions": ["catalog:read", "catalog:create"],
  "locals": ["local_01"],
  "active": true
}
```

## POST /auth/change-password

Cambiar contraseña de usuario actual.

### Request

```http
POST /auth/change-password
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "current_password": "OldPassword123",
  "new_password": "NewSecurePassword456"
}
```

### Response 200 OK

```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

### Response 400 Bad Request

```json
{
  "detail": {
    "code": "WEAK_PASSWORD",
    "message": "La contraseña no cumple los requisitos mínimos",
    "requirements": {
      "min_length": 8,
      "require_uppercase": true,
      "require_number": true
    }
  }
}
```

## Implementación

```python
from fastapi import APIRouter, Depends, HTTPException
from src.schemas.auth import LoginRequest, TokenResponse
from src.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    auth_service: AuthService = Depends()
):
    try:
        result = await auth_service.login(
            credentials.email,
            credentials.password
        )
        return result
    except InvalidCredentialsError:
        raise HTTPException(401, "Credenciales inválidas")
    except UserLockedError as e:
        raise HTTPException(423, str(e))

@router.post("/refresh")
async def refresh(
    refresh_data: RefreshRequest,
    auth_service: AuthService = Depends()
):
    try:
        new_access_token = await auth_service.refresh_token(
            refresh_data.refresh_token
        )
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": 900
        }
    except InvalidTokenError:
        raise HTTPException(401, "Refresh token inválido")

@router.post("/logout")
async def logout(
    logout_data: LogoutRequest,
    user = Depends(get_current_user),
    auth_service: AuthService = Depends()
):
    await auth_service.logout(
        user.id,
        logout_data.refresh_token
    )
    return {"message": "Sesión cerrada"}
```

## Próximos Pasos

- [API Users](/microservicios/auth-service/api-users)
- [API Roles](/microservicios/auth-service/api-roles)
