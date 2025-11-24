# Contexto del Proyecto zenLogic ERP

## Descripción General

**zenLogic** es un sistema ERP empresarial moderno construido con arquitectura de microservicios, diseñado para soportar múltiples organizaciones (multi-tenant) con capacidad de gestión por locales/sucursales.

## Arquitectura Técnica

### Stack Tecnológico Principal

- **Backend**: Python 3.11+ con FastAPI
- **Servidor ASGI**: Uvicorn
- **Base de Datos**: PostgreSQL 15+ con Row-Level Security (RLS)
- **Cache**: Redis 7
- **Message Broker**: RabbitMQ 3.12 (AMQP)
- **Comunicación Interna**: gRPC + Protocol Buffers
- **Comunicación Externa**: REST APIs
- **Contenedores**: Docker + Docker Compose (desarrollo) / Kubernetes (producción)
- **Documentación**: Docusaurus 3.9.2 con soporte Mermaid

### Microservicios Implementados

1. **Auth Service** (:8001)
   - Autenticación y autorización
   - Gestión de usuarios, roles y permisos
   - RBAC multi-nivel (organización → local → rol)
   - JWT con RS256
   - gRPC server para validaciones internas

2. **Catalog Service** (:8002)
   - Gestión de productos y variantes
   - Paginación cursor-based
   - Cache strategy con Redis
   - gRPC client para validar locales
   - Event-driven sync

3. **Audit Service** (:8003)
   - Event consumer para auditoría
   - Almacenamiento de logs de sistema
   - Retention policies
   - Queries especializadas para análisis

### Patrones Arquitectónicos

- **Event-Driven Architecture**: RabbitMQ con topic exchange
- **Multi-tenancy**: PostgreSQL Row-Level Security
- **RBAC**: Role-Based Access Control jerárquico
- **CQRS**: Separación de comandos y queries
- **Cache-Aside Pattern**: Redis para optimización
- **Circuit Breaker**: Resiliencia en comunicación gRPC
- **Database per Service**: Aislamiento de datos
- **API Gateway Pattern**: Load balancing y routing

## Estructura del Proyecto

```
/Users/sparrow/Universidad/ERP/
├── .claude/                           # Configuración de Claude Code
│   ├── settings.local.json           # Permisos y configuración
│   ├── PROJECT_CONTEXT.md            # Este archivo
│   └── RULES.md                      # Reglas del proyecto
│
├── documentacion/                     # Documentación Docusaurus
│   ├── docs/                         # Archivos markdown
│   │   ├── intro.md
│   │   ├── 01-arquitectura/         # 7 archivos
│   │   ├── 02-microservicios/       # 40 archivos
│   │   │   ├── auth-service/        # 14 archivos
│   │   │   ├── catalog-service/     # 18 archivos
│   │   │   └── audit-service/       # 8 archivos
│   │   ├── 03-adrs/                 # 8 archivos (ADRs)
│   │   ├── 04-integraciones/        # 5 archivos
│   │   ├── 05-guias/                # 5 archivos
│   │   └── 06-anexos/               # 4 archivos
│   ├── sidebars.js                  # Configuración sidebar
│   ├── docusaurus.config.js         # Configuración Docusaurus
│   ├── package.json
│   └── static/                      # Assets estáticos
│
└── [microservicios]/                 # Código fuente (no documentado aún)
    ├── auth-service/
    ├── catalog-service/
    └── audit-service/
```

## Estado Actual de la Documentación

### ✅ Completado (100%)

**Total: 70 archivos markdown documentados**

#### Arquitectura General (7 archivos)
- ✅ Visión general del sistema
- ✅ Stack tecnológico
- ✅ Arquitectura event-driven
- ✅ Comunicación entre microservicios
- ✅ Multi-tenancy con RLS
- ✅ Seguridad y RBAC
- ✅ Patrones de diseño

#### Microservicios (40 archivos)

**Auth Service (14 archivos)**
- ✅ Overview y alcance
- ✅ Arquitectura y modelo de datos
- ✅ Configuración
- ✅ Eventos publicados
- ✅ gRPC server
- ✅ APIs REST (auth, users, roles, permissions, locals, organizations)
- ✅ Flujos de negocio

**Catalog Service (18 archivos)**
- ✅ Overview y alcance
- ✅ Arquitectura y modelo de datos
- ✅ Configuración
- ✅ Eventos publicados/consumidos
- ✅ Validación de locales
- ✅ gRPC client
- ✅ APIs REST (products, variants, options)
- ✅ Paginación cursor-based
- ✅ Cache strategy
- ✅ Flujos de negocio
- ✅ Testing
- ✅ Errores comunes
- ✅ Migraciones

**Audit Service (8 archivos)**
- ✅ Overview y alcance
- ✅ Arquitectura y modelo de datos
- ✅ Event consumer
- ✅ API de logs
- ✅ Retention policy
- ✅ Queries comunes

#### ADRs - Decisiones de Arquitectura (8 archivos)
- ✅ ADR-001: Python y FastAPI
- ✅ ADR-002: PostgreSQL como BD principal
- ✅ ADR-003: Event-Driven Architecture
- ✅ ADR-004: gRPC para comunicación interna
- ✅ ADR-005: RBAC multi-nivel
- ✅ ADR-006: PostgreSQL Multi-tenant con RLS
- ✅ ADR-007: Cursor-based Pagination

#### Integraciones (5 archivos)
- ✅ Overview de integraciones
- ✅ RabbitMQ (message broker)
- ✅ Redis (cache y sessions)
- ✅ gRPC (comunicación interna)
- ✅ PostgreSQL (base de datos)

#### Guías (5 archivos)
- ✅ Setup local (Docker Compose)
- ✅ Crear nuevo microservicio
- ✅ Testing (unit, integration, e2e)
- ✅ Deployment (Docker + Kubernetes)
- ✅ Troubleshooting

#### Anexos (4 archivos)
- ✅ Glosario de términos
- ✅ Convenciones de código
- ✅ Referencias externas
- ✅ Diagramas de arquitectura (20+ diagramas Mermaid)

### Problemas Resueltos

1. **Sidebar Navigation Issues**
   - Problema: Rutas con prefijos numéricos no coincidían con IDs de Docusaurus
   - Solución: Docusaurus strips numeric prefixes automáticamente, actualizado sidebars.js

2. **Mermaid Diagram Cycle Error**
   - Problema: Conflicto de nombres en diagrama Kubernetes (subgraph "Ingress" + node "Ingress")
   - Solución: Renombrado subgraph a "Ingress Layer"
   - Ubicación: `docs/06-anexos/03-diagramas.md:444`

3. **MDX Compilation Errors**
   - Problema: Caracteres < y > interpretados como JSX
   - Solución: Usar backticks para valores como `<1ms>`, `>100ms`

## Convenciones del Proyecto

### Código Python

- **Estilo**: PEP 8 con Black (line-length 100)
- **Imports**: isort con profile black
- **Linting**: flake8
- **Type Hints**: Obligatorio en todas las funciones
- **Naming**:
  - Variables/funciones: `snake_case`
  - Clases: `PascalCase`
  - Constantes: `UPPER_SNAKE_CASE`
  - Privados: prefijo `_`

### Base de Datos

- **Tablas**: plural, `snake_case` (ej: `users`, `product_variants`)
- **Columnas**: `snake_case`, descriptivo
- **Constraints**: `fk_{tabla}_{referencia}`, `uq_{tabla}_{columnas}`
- **Índices**: `idx_{tabla}_{columnas}`

### APIs REST

- **Endpoints**: plural, sin verbos en URL
  - `GET /api/v1/products`
  - `POST /api/v1/products`
  - `GET /api/v1/products/{id}`
- **Status Codes**: usar códigos HTTP apropiados
  - 200 OK, 201 Created, 204 No Content
  - 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
  - 409 Conflict, 500 Internal Server Error

### Eventos

- **Routing Keys**: `{service}.{entity}.{action}`
  - `auth.user.created`
  - `catalog.product.updated`
- **Payload**: estructura consistente con event_id, timestamp, service, version, payload, metadata

### Git

- **Commits**: imperativo, descriptivo
  - ✅ "Add product creation endpoint"
  - ✅ "Fix SKU validation for special characters"
  - ❌ "changes", "fix bug"
- **Branches**: `{tipo}/{descripción}`
  - `feature/user-authentication`
  - `bugfix/sku-validation`
  - `hotfix/cache-invalidation`

## Tecnologías y Herramientas

### Desarrollo

- Python 3.11+
- FastAPI
- SQLAlchemy (async ORM)
- Alembic (migraciones)
- Pydantic (validación)
- pytest + pytest-asyncio

### Infraestructura

- Docker + Docker Compose
- Kubernetes (producción)
- PostgreSQL 15+
- Redis 7
- RabbitMQ 3.12

### Observabilidad (planificado)

- Prometheus (métricas)
- Grafana (dashboards)
- Loki (logs)
- Jaeger (tracing)

## URLs y Recursos

### Documentación Local

- **Docusaurus**: http://localhost:3000/
- **Comando**: `cd documentacion && npm start`

### Servicios (cuando estén corriendo)

- Auth Service: http://localhost:8001
- Catalog Service: http://localhost:8002
- Audit Service: http://localhost:8003
- RabbitMQ Management: http://localhost:15672
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Próximos Pasos

### Código Fuente (Pendiente)

1. Implementar Auth Service
2. Implementar Catalog Service
3. Implementar Audit Service
4. Configurar Docker Compose para desarrollo
5. Setup de infraestructura compartida (PostgreSQL, Redis, RabbitMQ)

### Documentación (Completada)

✅ Toda la documentación está completa y funcionando
✅ Sidebar navigation corregida
✅ Mermaid diagrams funcionando correctamente
✅ Server compilando sin errores

## Notas Importantes

### Docusaurus

- **Versión**: 3.9.2
- **Plugin Mermaid**: @docusaurus/theme-mermaid
- **ID Generation**: Docusaurus automáticamente elimina prefijos numéricos (01-, 02-, etc.) de nombres de carpetas/archivos al generar document IDs
- **Sidebar Paths**: Usar IDs sin prefijos (ej: `arquitectura/vision-general` NO `01-arquitectura/vision-general`)

### Multi-tenancy

- PostgreSQL Row-Level Security (RLS) es fundamental
- SET LOCAL app.current_tenant en cada request
- Políticas RLS aplicadas automáticamente
- Aislamiento garantizado incluso con bugs en queries

### Eventos

- Publisher: Auth Service, Catalog Service
- Consumer: Catalog Service, Audit Service
- Dead Letter Queue configurada para manejo de errores
- Event versioning para compatibilidad

### Seguridad

- JWT con RS256 (asimétrico)
- Refresh tokens con rotación
- RBAC jerárquico (org → local → rol → permisos)
- RLS en PostgreSQL para multi-tenancy
- Validación en múltiples capas (Pydantic, DB constraints)

## Historial de Cambios

### 2025-11-23

- ✅ Completada sección Guías (5 archivos)
- ✅ Corregida navegación sidebar (paths sin prefijos numéricos)
- ✅ Corregido error Mermaid en diagrama Kubernetes
- ✅ Eliminado directorio vacío `03-decisiones-arquitectura/`
- ✅ Verificadas todas las 70 páginas de documentación
- ✅ Servidor Docusaurus compilando exitosamente sin errores
- ✅ Creados archivos de contexto y reglas en `.claude/`

---

**Última actualización**: 2025-11-23
**Estado**: Documentación completa y funcional
**Próximo objetivo**: Implementación del código fuente de microservicios
