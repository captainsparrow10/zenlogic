---
sidebar_position: 6
---

# Poetry - Gestión de Dependencias

Guía para configurar y usar Poetry como gestor de dependencias en todos los microservicios de zenLogic.

## Por qué Poetry

| Aspecto | pip + requirements.txt | Poetry |
|---------|------------------------|--------|
| Lock de versiones | Manual | Automático (poetry.lock) |
| Resolución de dependencias | Básica | Avanzada |
| Environments virtuales | Manual (venv) | Automático |
| Dev dependencies | Archivo separado | Integrado |
| Scripts | Makefile externo | pyproject.toml |
| Publicación | setup.py | Integrado |

## Instalación de Poetry

### macOS / Linux

```bash
# Instalación oficial (recomendado)
curl -sSL https://install.python-poetry.org | python3 -

# Verificar instalación
poetry --version

# Configurar PATH (si no se agregó automáticamente)
export PATH="$HOME/.local/bin:$PATH"
```

### Windows

```powershell
# PowerShell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
```

### Configuración Global

```bash
# Crear virtualenv dentro del proyecto (recomendado)
poetry config virtualenvs.in-project true

# Ver configuración actual
poetry config --list
```

## Estructura de pyproject.toml

```toml
[tool.poetry]
name = "auth-service"
version = "1.0.0"
description = "Authentication and Authorization Service for zenLogic ERP"
authors = ["zenLogic Team <team@zenlogic.com>"]
readme = "README.md"
packages = [{include = "app"}]

[tool.poetry.dependencies]
python = "^3.11"

# Framework
fastapi = "^0.104.1"
uvicorn = {extras = ["standard"], version = "^0.24.0"}

# Database
sqlalchemy = {extras = ["asyncio"], version = "^2.0.23"}
asyncpg = "^0.29.0"
alembic = "^1.12.1"

# Validation
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"

# Messaging
aio-pika = "^9.3.0"

# Cache
redis = "^5.0.1"

# gRPC
grpcio = "^1.59.3"
grpcio-tools = "^1.59.3"

# Auth (solo auth-service)
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
passlib = {extras = ["bcrypt"], version = "^1.7.4"}

# Observability
prometheus-client = "^0.19.0"
structlog = "^23.2.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.3"
pytest-asyncio = "^0.21.1"
pytest-cov = "^4.1.0"
httpx = "^0.25.2"
ruff = "^0.1.6"
mypy = "^1.7.0"
pre-commit = "^3.6.0"

[tool.poetry.scripts]
start = "scripts.run:main"
seed = "scripts.seed_data:main"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

# Ruff configuration
[tool.ruff]
target-version = "py311"
line-length = 100
select = ["E", "F", "I", "N", "W"]
ignore = ["E501"]

[tool.ruff.isort]
known-first-party = ["app"]

# Pytest configuration
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = "test_*.py"
python_functions = "test_*"

# MyPy configuration
[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_ignores = true
disallow_untyped_defs = true
plugins = ["pydantic.mypy"]
```

## Comandos Esenciales

### Inicializar Proyecto Nuevo

```bash
# Crear nuevo proyecto con Poetry
poetry new service-name

# O inicializar en proyecto existente
cd existing-service
poetry init
```

### Gestión de Dependencias

```bash
# Instalar todas las dependencias
poetry install

# Añadir dependencia de producción
poetry add fastapi
poetry add sqlalchemy[asyncio]

# Añadir dependencia de desarrollo
poetry add --group dev pytest pytest-asyncio

# Actualizar dependencias
poetry update

# Actualizar una específica
poetry update fastapi

# Remover dependencia
poetry remove package-name

# Ver árbol de dependencias
poetry show --tree
```

### Environment Virtual

```bash
# Activar shell dentro del virtualenv
poetry shell

# Ejecutar comando sin activar shell
poetry run python script.py
poetry run pytest
poetry run uvicorn app.main:app --reload

# Ver info del virtualenv
poetry env info

# Listar virtualenvs
poetry env list

# Eliminar virtualenv
poetry env remove python3.11
```

### Scripts Personalizados

```bash
# Definir en pyproject.toml
[tool.poetry.scripts]
start = "scripts.run:main"
seed = "scripts.seed_data:main"

# Ejecutar
poetry run start
poetry run seed
```

## Migrar de requirements.txt a Poetry

### Paso 1: Inicializar Poetry

```bash
cd services/auth-service

# Inicializar (responder preguntas interactivas)
poetry init

# O con valores por defecto
poetry init -n
```

### Paso 2: Importar dependencias

```bash
# Método automático
cat requirements.txt | xargs poetry add

# O manualmente para mejor control
poetry add fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg
poetry add --group dev pytest pytest-asyncio pytest-cov httpx ruff
```

### Paso 3: Eliminar archivos antiguos

```bash
# Después de verificar que todo funciona
rm requirements.txt requirements-dev.txt
rm -rf venv  # Si existía
```

### Paso 4: Actualizar .gitignore

```gitignore
# Poetry
.venv/
poetry.lock  # Incluir en git para lock reproducible

# NO ignorar pyproject.toml
```

## pyproject.toml por Servicio

### Auth Service

```toml
[tool.poetry]
name = "auth-service"
version = "1.0.0"
description = "Authentication and Authorization Service"

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.1"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
sqlalchemy = {extras = ["asyncio"], version = "^2.0.23"}
asyncpg = "^0.29.0"
alembic = "^1.12.1"
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
aio-pika = "^9.3.0"
redis = "^5.0.1"
grpcio = "^1.59.3"
grpcio-tools = "^1.59.3"
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
passlib = {extras = ["bcrypt"], version = "^1.7.4"}
prometheus-client = "^0.19.0"
structlog = "^23.2.0"
```

### Catalog Service

```toml
[tool.poetry]
name = "catalog-service"
version = "1.0.0"
description = "Product Catalog Management Service"

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.1"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
sqlalchemy = {extras = ["asyncio"], version = "^2.0.23"}
asyncpg = "^0.29.0"
alembic = "^1.12.1"
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
aio-pika = "^9.3.0"
redis = "^5.0.1"
grpcio = "^1.59.3"
prometheus-client = "^0.19.0"
structlog = "^23.2.0"
pillow = "^10.1.0"  # Para procesamiento de imágenes
```

### Inventory Service

```toml
[tool.poetry]
name = "inventory-service"
version = "1.0.0"
description = "Inventory and Stock Management Service"

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.1"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
sqlalchemy = {extras = ["asyncio"], version = "^2.0.23"}
asyncpg = "^0.29.0"
alembic = "^1.12.1"
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
aio-pika = "^9.3.0"
redis = "^5.0.1"
grpcio = "^1.59.3"
prometheus-client = "^0.19.0"
structlog = "^23.2.0"
```

### Audit Service

```toml
[tool.poetry]
name = "audit-service"
version = "1.0.0"
description = "Audit Logging and Compliance Service"

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.1"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
sqlalchemy = {extras = ["asyncio"], version = "^2.0.23"}
asyncpg = "^0.29.0"
alembic = "^1.12.1"
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
aio-pika = "^9.3.0"
prometheus-client = "^0.19.0"
structlog = "^23.2.0"
# Sin Redis - Audit no necesita cache
# Sin gRPC - Solo recibe eventos
```

## Dockerfile con Poetry

```dockerfile
# Dockerfile
FROM python:3.11-slim as builder

# Install Poetry
ENV POETRY_VERSION=1.7.1
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VENV=/opt/poetry-venv
ENV POETRY_CACHE_DIR=/opt/.cache

RUN python3 -m venv $POETRY_VENV \
    && $POETRY_VENV/bin/pip install -U pip setuptools \
    && $POETRY_VENV/bin/pip install poetry==${POETRY_VERSION}

# Build stage
FROM python:3.11-slim as runtime

COPY --from=builder /opt/poetry-venv /opt/poetry-venv
ENV PATH="/opt/poetry-venv/bin:$PATH"

WORKDIR /app

# Copy poetry files
COPY pyproject.toml poetry.lock ./

# Install dependencies (without dev)
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root --only main

# Copy application
COPY . .

# Install the project itself
RUN poetry install --no-interaction --no-ansi --only-root

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## Dockerfile Multi-stage Optimizado

```dockerfile
# Dockerfile.optimized
FROM python:3.11-slim as base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Builder stage
FROM base as builder

RUN pip install poetry==1.7.1

WORKDIR /app
COPY pyproject.toml poetry.lock ./

# Export to requirements.txt for faster builds
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes

# Runtime stage
FROM base as runtime

WORKDIR /app

COPY --from=builder /app/requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## CI/CD con Poetry

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, development]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          version: 1.7.1
          virtualenvs-create: true
          virtualenvs-in-project: true

      - name: Load cached venv
        id: cached-poetry-dependencies
        uses: actions/cache@v3
        with:
          path: .venv
          key: venv-${{ runner.os }}-${{ hashFiles('**/poetry.lock') }}

      - name: Install dependencies
        if: steps.cached-poetry-dependencies.outputs.cache-hit != 'true'
        run: poetry install --no-interaction --no-root

      - name: Install project
        run: poetry install --no-interaction

      - name: Run linting
        run: poetry run ruff check .

      - name: Run type checking
        run: poetry run mypy app

      - name: Run tests
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/test_db
        run: poetry run pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
```

## Scripts de Desarrollo

### scripts/run.py

```python
# scripts/run.py
import uvicorn

def main():
    """Iniciar servidor de desarrollo."""
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()
```

### Makefile (opcional)

```makefile
# Makefile
.PHONY: install dev test lint format migrate

install:
	poetry install

dev:
	poetry run uvicorn app.main:app --reload --port 8001

test:
	poetry run pytest -v

test-cov:
	poetry run pytest --cov=app --cov-report=html

lint:
	poetry run ruff check .
	poetry run mypy app

format:
	poetry run ruff format .

migrate:
	poetry run alembic upgrade head

migrate-new:
	poetry run alembic revision --autogenerate -m "$(msg)"
```

## Troubleshooting

### Error: "Poetry could not find a pyproject.toml"

```bash
# Verificar que estás en el directorio correcto
ls pyproject.toml

# Si no existe, inicializar
poetry init
```

### Error: "Current Python version not compatible"

```bash
# Verificar versión de Python
python --version

# Especificar versión exacta
poetry env use python3.11

# O actualizar pyproject.toml
[tool.poetry.dependencies]
python = ">=3.11,<3.13"
```

### Error: "Unable to lock dependencies"

```bash
# Limpiar cache
poetry cache clear pypi --all

# Actualizar poetry
poetry self update

# Regenerar lock
rm poetry.lock
poetry lock
```

### Reinstalar todo limpio

```bash
# Eliminar virtualenv
poetry env remove python3.11

# Limpiar cache
poetry cache clear --all pypi

# Reinstalar
poetry install
```

## Próximos Pasos

- [Setup Local de Desarrollo](./00-setup-local.md)
- [Crear un Nuevo Microservicio](./01-crear-microservicio.md)
- [Testing](./02-testing.md)
