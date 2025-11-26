# zenLogic ERP

Sistema ERP empresarial moderno construido con arquitectura de microservicios, diseñado para soportar múltiples organizaciones (multi-tenant) con capacidad de gestión por locales/sucursales.

## Características Principales

- **Multi-tenancy**: Soporte para múltiples organizaciones con aislamiento de datos mediante PostgreSQL Row-Level Security
- **Arquitectura de Microservicios**: 10 servicios independientes con responsabilidades bien definidas
- **Event-Driven**: Comunicación asíncrona mediante RabbitMQ con eventos estandarizados
- **RBAC Jerárquico**: Control de acceso basado en roles a nivel de organización, local y usuario
- **API Gateway**: Envoy Proxy con 84 endpoints documentados
- **GraphQL Federation**: Queries complejas multi-servicio con Strawberry

## Stack Tecnológico

### Backend
- **Lenguaje**: Python 3.11+
- **Framework**: FastAPI
- **ORM**: SQLAlchemy 2.0 (async)
- **Validación**: Pydantic v2
- **Servidor ASGI**: Uvicorn

### Infraestructura
- **Base de Datos**: PostgreSQL 15+ con Row-Level Security (RLS)
- **Cache**: Redis 7
- **Message Broker**: RabbitMQ 3.12
- **API Gateway**: Envoy Proxy
- **GraphQL**: Strawberry (Federation)
- **Comunicación Interna**: gRPC + Protocol Buffers
- **Comunicación Externa**: REST APIs
- **Contenedores**: Docker + Docker Compose (desarrollo) / Kubernetes (producción)

## Microservicios

| Servicio | Puerto | gRPC | Descripción |
|----------|--------|------|-------------|
| **Auth Service** | 8001 | 50051 | Autenticación, autorización, usuarios, roles y permisos |
| **Catalog Service** | 8002 | - | Gestión de productos, variantes y opciones |
| **Inventory Service** | 8003 | - | Stock por variante y local, movimientos, reservas |
| **Order Service** | 8004 | - | Órdenes, pedidos, fulfillment |
| **POS Service** | 8005 | - | Punto de venta, cajas registradoras |
| **Audit Service** | 8006 | - | Auditoría de eventos, logs inmutables |
| **Customer Service** | 8007 | - | Gestión de clientes, historial |
| **Pricing Service** | 8008 | - | Reglas de precios, promociones |
| **Procurement Service** | 8009 | - | Órdenes de compra, proveedores |
| **Reports Service** | 8010 | - | Reportes, dashboards, exportación |

## Arquitectura

### Patrones Implementados

- **Event-Driven Architecture**: RabbitMQ con topic exchange (`erp.events`)
- **Multi-tenancy**: PostgreSQL Row-Level Security
- **RBAC**: Role-Based Access Control jerárquico
- **CQRS**: Separación de comandos y queries
- **Cache-Aside Pattern**: Redis para optimización
- **Circuit Breaker**: Resiliencia en comunicación gRPC
- **Database per Service**: Aislamiento de datos
- **API Gateway Pattern**: Envoy para routing y load balancing
- **GraphQL Federation**: Strawberry para queries complejas

### Formato de Eventos

Todos los eventos siguen un formato estandarizado:

```json
{
  "event": "{servicio}.{entidad}.{accion}",
  "timestamp": "2025-11-25T12:00:00Z",
  "service": "{nombre-servicio}",
  "version": "1.0",
  "organization_id": "org_xxx",
  "data": {
    // Campos específicos del evento
  }
}
```

**Ejemplos de routing keys**:
- `auth.user.created`
- `catalog.product.updated`
- `order.order.completed`
- `inventory.stock.reserved`

## Estructura del Proyecto

```
/Users/sparrow/Universidad/ERP/
├── .claude/                           # Configuración de Claude Code
│   ├── PROJECT_CONTEXT.md            # Contexto del proyecto
│   ├── RULES.md                      # Reglas y convenciones
│   ├── PROJECT_STATE.md              # Estado actual
│   └── STANDARDS.md                  # Estándares de documentación
│
├── documentacion/                     # Documentación Docusaurus (187+ archivos)
│   ├── docs/
│   │   ├── 01-arquitectura/         # Arquitectura general (11 archivos)
│   │   ├── 02-microservicios/       # Documentación de servicios (100+ archivos)
│   │   ├── 03-adrs/                 # Architecture Decision Records (8 archivos)
│   │   ├── 03-flujos-negocio/       # Flujos de negocio (5 archivos)
│   │   ├── 04-integraciones/        # RabbitMQ, Redis, gRPC, PostgreSQL (5 archivos)
│   │   ├── 05-guias/                # Setup, testing, deployment (6 archivos)
│   │   └── 06-anexos/               # Glosario, convenciones, referencias (4 archivos)
│   ├── sidebars.js
│   └── docusaurus.config.js
│
└── [microservicios]/                 # Código fuente (futuro)
    ├── auth-service/
    ├── catalog-service/
    ├── inventory-service/
    ├── order-service/
    ├── pos-service/
    ├── audit-service/
    ├── customer-service/
    ├── pricing-service/
    ├── procurement-service/
    └── reports-service/
```

## Documentación

La documentación completa del proyecto está construida con **Docusaurus 3.9.2** y contiene **187+ archivos markdown**.

### Ver Documentación Localmente

```bash
cd documentacion
npm install
npm start
```

Accede a: http://localhost:3000

### Contenido de la Documentación

- **Arquitectura General**: 11 documentos sobre visión general, stack, eventos, multi-tenancy, API Gateway, GraphQL
- **Microservicios**: 100+ documentos con detalles de cada servicio (modelos, APIs, eventos, configuración)
- **ADRs**: 8 Architecture Decision Records documentando decisiones técnicas clave
- **Flujos de Negocio**: 5 documentos sobre ventas, devoluciones, compras, pagos
- **Integraciones**: Guías de RabbitMQ, Redis, gRPC, PostgreSQL
- **Guías**: Setup local, crear microservicio, testing, deployment, troubleshooting

## Quick Start

### Requisitos Previos

- Python 3.11+
- Docker y Docker Compose
- Node.js 18+ (para documentación)

### Iniciar Infraestructura

```bash
docker-compose up -d postgres redis rabbitmq
```

### Servicios Disponibles

- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Convenciones del Proyecto

### Código Python

- **Estilo**: PEP 8 con Black (line-length 100)
- **Imports**: isort con profile black
- **Type Hints**: Obligatorio
- **Naming**: `snake_case` para funciones/variables, `PascalCase` para clases

### Base de Datos

- **Tablas**: plural, `snake_case` (ej: `users`, `product_variants`)
- **Foreign Keys**: `fk_{tabla}_{referencia}`
- **Índices**: `idx_{tabla}_{columnas}`

### APIs REST

- **Endpoints**: `/api/v1/{recurso-plural}`
- **Métodos**: GET, POST, PUT, PATCH, DELETE
- **Status Codes**: Usar códigos HTTP semánticamente correctos

### Git

- **Commits**: Imperativo, descriptivo
  - ✅ `feat: add product creation endpoint`
  - ✅ `fix: correct SKU validation`
- **Branches**: `{tipo}/{descripción}`
  - `feature/user-authentication`
  - `bugfix/sku-validation`

## Seguridad

- **Autenticación**: JWT con RS256
- **Access Token**: 15 minutos
- **Refresh Token**: 7 días
- **Multi-tenancy**: PostgreSQL Row-Level Security (RLS)
- **RBAC**: Jerárquico (organización → local → rol → permisos)

## Estado del Proyecto

### Documentación: ✅ Completa (100%)

- 187+ archivos markdown
- 10 microservicios documentados
- Arquitectura completa
- Guías de desarrollo
- ADRs y decisiones técnicas

### Implementación: 🚧 Pendiente

El código fuente de los microservicios está pendiente de implementación.

## Contribuir

1. Leer la documentación en `documentacion/`
2. Revisar convenciones en `.claude/RULES.md`
3. Seguir estándares en `.claude/STANDARDS.md`

## Recursos

- **Documentación**: http://localhost:3000 (local)
- **Branch principal**: `main`
- **Branch desarrollo**: `development`

## Licencia

[Por definir]

---

**Última actualización**: 2025-11-25
**Estado**: Documentación completa, código en desarrollo
