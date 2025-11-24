---
sidebar_position: 5
---

# Configuración

## Variables de Entorno

Auth Service se configura mediante variables de entorno.

### Archivo `.env`

```bash
# Application
APP_NAME=auth-service
APP_ENV=development  # development, staging, production
DEBUG=true
LOG_LEVEL=INFO

# Server
HOST=0.0.0.0
PORT=8001
GRPC_PORT=50051

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/auth_db
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=
REDIS_DB=0

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBITMQ_EXCHANGE=auth_events

# JWT
JWT_ALGORITHM=RS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Keys (en producción, usar archivos)
JWT_PRIVATE_KEY_PATH=./keys/private_key.pem
JWT_PUBLIC_KEY_PATH=./keys/public_key.pem

# Security
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=false

MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# CORS
CORS_ORIGINS=["http://localhost:3000","https://app.example.com"]
CORS_ALLOW_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_LOGIN=5/minute
RATE_LIMIT_VERIFY=1000/minute
```

## Configuración de Settings

**Archivo**: `src/config/settings.py`

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "auth-service"
    APP_ENV: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    GRPC_PORT: int = 50051

    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0

    # RabbitMQ
    RABBITMQ_HOST: str = "localhost"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: str = "guest"
    RABBITMQ_PASSWORD: str = "guest"
    RABBITMQ_VHOST: str = "/"
    RABBITMQ_EXCHANGE: str = "auth_events"

    # JWT
    JWT_ALGORITHM: str = "RS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_PRIVATE_KEY_PATH: str = "./keys/private_key.pem"
    JWT_PUBLIC_KEY_PATH: str = "./keys/public_key.pem"

    # Security
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_NUMBER: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = False
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    CORS_ALLOW_CREDENTIALS: bool = True

    # Rate Limiting
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_VERIFY: str = "1000/minute"

    @property
    def JWT_PRIVATE_KEY(self) -> str:
        with open(self.JWT_PRIVATE_KEY_PATH, "r") as f:
            return f.read()

    @property
    def JWT_PUBLIC_KEY(self) -> str:
        with open(self.JWT_PUBLIC_KEY_PATH, "r") as f:
            return f.read()

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

## Generación de Claves JWT

### RSA Key Pair

```bash
# Generar clave privada
openssl genrsa -out private_key.pem 2048

# Generar clave pública
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

### Estructura de Directorios

```
auth-service/
├── keys/
│   ├── private_key.pem  # NO versionar (añadir a .gitignore)
│   └── public_key.pem   # Puede compartirse con otros servicios
```

## Docker Compose

**Archivo**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: auth_user
      POSTGRES_PASSWORD: auth_password
      POSTGRES_DB: erp_auth
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  auth-service:
    build: .
    environment:
      DATABASE_URL: postgresql+asyncpg://auth_user:auth_password@postgres:5432/erp_auth
      REDIS_URL: redis://redis:6379/0
      RABBITMQ_HOST: rabbitmq
    ports:
      - "8001:8001"   # REST API
      - "50051:50051" # gRPC
    depends_on:
      - postgres
      - redis
      - rabbitmq
    volumes:
      - ./keys:/app/keys

volumes:
  postgres_data:
  rabbitmq_data:
```

## Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Crear usuario no-root
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Exponer puertos
EXPOSE 8001 50051

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD python -c "import requests; requests.get('http://localhost:8001/health')"

# Comando por defecto
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## Configuración de Logs

**Archivo**: `src/config/logging.py`

```python
import logging
import sys
from src.config.settings import settings

def setup_logging():
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('logs/auth-service.log')
        ]
    )

    # Configurar loggers específicos
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('uvicorn.access').setLevel(logging.INFO)
```

## Próximos Pasos

- [Eventos Publicados](/microservicios/auth-service/eventos-publicados)
- [Deployment](/guias/deployment)
