---
sidebar_position: 1
---

# Setup Local de Desarrollo

Guía completa para configurar el entorno de desarrollo local de zenLogic.

## Prerequisitos

### Software Requerido

```bash
# Versiones mínimas
Python: 3.11+
Node.js: 18+
Docker: 20.10+
Docker Compose: 2.0+
Git: 2.30+
```

### Instalación de Herramientas

```bash
# macOS (con Homebrew)
brew install python@3.11
brew install node
brew install docker
brew install git

# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-venv
sudo apt install nodejs npm
sudo apt install docker.io docker-compose
sudo apt install git

# Verificar instalaciones
python3.11 --version
node --version
docker --version
git --version
```

## Clonar Repositorio

```bash
# Clonar proyecto
git clone https://github.com/tu-org/zenlogic-erp.git
cd zenlogic-erp

# Estructura del proyecto
zenlogic-erp/
├── services/
│   ├── auth-service/
│   ├── catalog-service/
│   └── audit-service/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Configuración de Infraestructura

### 1. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: erp_password
      POSTGRES_DB: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-dbs.sql:/docker-entrypoint-initdb.d/init-dbs.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

### 2. Inicializar Bases de Datos

```sql
-- init-dbs.sql
CREATE DATABASE auth_db;
CREATE DATABASE catalog_db;
CREATE DATABASE audit_db;

\c auth_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c catalog_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

\c audit_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3. Levantar Infraestructura

```bash
# Iniciar servicios
docker-compose up -d

# Verificar que estén corriendo
docker-compose ps

# Ver logs
docker-compose logs -f

# Estado esperado:
# postgres    Up      5432/tcp
# redis       Up      6379/tcp
# rabbitmq    Up      5672/tcp, 15672/tcp
```

## Configuración de Auth Service

### 1. Crear Virtual Environment

```bash
cd services/auth-service

# Crear virtualenv
python3.11 -m venv venv

# Activar
source venv/bin/activate  # Linux/macOS
# o
venv\Scripts\activate     # Windows

# Actualizar pip
pip install --upgrade pip
```

### 2. Instalar Dependencias

```bash
# Instalar desde requirements.txt
pip install -r requirements.txt

# O instalar manualmente las principales
pip install fastapi==0.104.1
pip install uvicorn[standard]==0.24.0
pip install sqlalchemy[asyncio]==2.0.23
pip install asyncpg==0.29.0
pip install alembic==1.12.1
pip install pydantic==2.5.0
pip install pydantic-settings==2.1.0
pip install python-jose[cryptography]==3.3.0
pip install passlib[bcrypt]==1.7.4
pip install aio-pika==9.3.0
pip install aioredis==2.0.1
pip install grpcio==1.59.3
pip install grpcio-tools==1.59.3
pip install prometheus-client==0.19.0
```

### 3. Configurar Variables de Entorno

```bash
# Copiar template
cp .env.example .env

# Editar .env
nano .env
```

```bash
# .env - Auth Service
SERVICE_NAME=auth-service
API_PORT=8001
GRPC_PORT=50051

# Database
DATABASE_URL=postgresql+asyncpg://erp_user:erp_password@localhost:5432/auth_db

# Redis
REDIS_URL=redis://localhost:6379/0

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672/
RABBITMQ_EXCHANGE=erp.events

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=RS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Debug
DEBUG=true
LOG_LEVEL=INFO
```

### 4. Generar Claves RSA (para JWT)

```bash
# Generar clave privada
openssl genrsa -out private_key.pem 2048

# Generar clave pública
openssl rsa -in private_key.pem -pubout -out public_key.pem

# Mover a carpeta de secrets
mkdir -p secrets
mv private_key.pem public_key.pem secrets/
```

### 5. Ejecutar Migraciones

```bash
# Inicializar Alembic (si no está inicializado)
alembic init alembic

# Generar migración inicial
alembic revision --autogenerate -m "initial schema"

# Aplicar migraciones
alembic upgrade head

# Verificar en PostgreSQL
psql -U erp_user -d auth_db -c "\dt"
```

### 6. Seed de Datos Iniciales

```bash
# Ejecutar seed script
python scripts/seed_data.py
```

```python
# scripts/seed_data.py
import asyncio
from app.database import get_db
from app.models import Organization, User, Role, Permission
from app.services.auth_service import AuthService

async def seed():
    """Seed datos iniciales."""

    async with get_db() as db:
        # Crear organización demo
        org = Organization(
            name="Demo Organization",
            is_active=True
        )
        db.add(org)
        await db.commit()

        # Crear rol admin
        admin_role = Role(
            organization_id=org.id,
            name="admin",
            description="Administrator role",
            is_system_role=True
        )
        db.add(admin_role)
        await db.commit()

        # Crear usuario admin
        auth_service = AuthService(db)
        admin_user = await auth_service.create_user(
            email="admin@demo.com",
            password="admin123",
            organization_id=org.id
        )

        # Asignar rol
        admin_user.roles.append(admin_role)
        await db.commit()

        print("Seed completed!")
        print(f"Admin user: admin@demo.com / admin123")

if __name__ == "__main__":
    asyncio.run(seed())
```

### 7. Iniciar Servidor

```bash
# Desarrollo (con hot reload)
uvicorn app.main:app --reload --port 8001

# O con script
python run.py
```

```python
# run.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
```

## Configuración de Catalog Service

```bash
cd ../catalog-service

# Mismo proceso que Auth Service
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Editar .env
nano .env
```

```bash
# .env - Catalog Service
SERVICE_NAME=catalog-service
API_PORT=8002

DATABASE_URL=postgresql+asyncpg://erp_user:erp_password@localhost:5432/catalog_db
REDIS_URL=redis://localhost:6379/1
RABBITMQ_URL=amqp://admin:admin123@localhost:5672/

# Auth Service gRPC
AUTH_GRPC_URL=localhost:50051

DEBUG=true
```

```bash
# Migraciones
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload --port 8002
```

## Configuración de Audit Service

```bash
cd ../audit-service

python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

```bash
# .env - Audit Service
SERVICE_NAME=audit-service
API_PORT=8003

DATABASE_URL=postgresql+asyncpg://erp_user:erp_password@localhost:5432/audit_db
RABBITMQ_URL=amqp://admin:admin123@localhost:5672/

DEBUG=true
```

```bash
# Migraciones
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload --port 8003
```

## Verificación

### Health Checks

```bash
# Auth Service
curl http://localhost:8001/health

# Catalog Service
curl http://localhost:8002/health

# Audit Service
curl http://localhost:8003/health
```

### API Docs

Abrir en navegador:
- Auth: http://localhost:8001/docs
- Catalog: http://localhost:8002/docs
- Audit: http://localhost:8003/docs

### RabbitMQ Management

- URL: http://localhost:15672
- User: admin
- Password: admin123

## Testing

```bash
# Instalar dependencias de testing
pip install pytest pytest-asyncio pytest-cov httpx

# Ejecutar tests
pytest

# Con coverage
pytest --cov=app --cov-report=html

# Tests específicos
pytest tests/test_auth.py -v
```

## Troubleshooting

### Error: Connection refused (PostgreSQL)

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres
```

### Error: ModuleNotFoundError

```bash
# Verificar que virtualenv esté activado
which python  # Debe apuntar a venv/bin/python

# Reinstalar dependencias
pip install -r requirements.txt
```

### Error: Alembic migration failed

```bash
# Rollback
alembic downgrade -1

# Revisar logs
alembic history

# Regenerar migración
alembic revision --autogenerate -m "fix migration"
```

## Scripts Útiles

### Start All Services

```bash
#!/bin/bash
# scripts/start-all.sh

# Start infrastructure
docker-compose up -d

# Wait for services
sleep 5

# Start Auth Service
cd services/auth-service
source venv/bin/activate
uvicorn app.main:app --reload --port 8001 &

# Start Catalog Service
cd ../catalog-service
source venv/bin/activate
uvicorn app.main:app --reload --port 8002 &

# Start Audit Service
cd ../audit-service
source venv/bin/activate
uvicorn app.main:app --reload --port 8003 &

echo "All services started!"
```

### Stop All

```bash
#!/bin/bash
# scripts/stop-all.sh

# Stop Python services
pkill -f uvicorn

# Stop infrastructure
docker-compose down

echo "All services stopped!"
```

## Próximos Pasos

- [Crear un Nuevo Microservicio](/guias/crear-microservicio)
- [Testing](/guias/testing)
- [Deployment](/guias/deployment)
