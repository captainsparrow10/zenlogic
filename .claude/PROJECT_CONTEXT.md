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
- **API Gateway**: Envoy Proxy
- **GraphQL**: Strawberry (Federation)
- **Contenedores**: Docker + Docker Compose (desarrollo) / Kubernetes (producción)
- **Documentación**: Docusaurus 3.9.2 con soporte Mermaid

### Microservicios Implementados (10 servicios)

1. **Auth Service** (:8001, gRPC :50051)
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

3. **Inventory Service** (:8003)
   - Gestión de stock por variante y local
   - Movimientos de inventario
   - Reservas de stock
   - Alertas de stock bajo

4. **Order Service** (:8004)
   - Gestión de órdenes y pedidos
   - Integración con pagos
   - Fulfillment y tracking

5. **POS Service** (:8005)
   - Punto de venta
   - Gestión de cajas registradoras
   - Ventas en tiempo real

6. **Audit Service** (:8006)
   - Event consumer para auditoría
   - Almacenamiento de logs de sistema
   - Retention policies

7. **Customer Service** (:8007)
   - Gestión de clientes
   - Historial de compras
   - Segmentación

8. **Pricing Service** (:8008)
   - Reglas de precios
   - Promociones y descuentos
   - Precios por local

9. **Procurement Service** (:8009)
   - Órdenes de compra
   - Gestión de proveedores
   - Recepción de mercadería

10. **Reports Service** (:8010)
    - Generación de reportes
    - Exportación de datos
    - Dashboards

### Patrones Arquitectónicos

- **Event-Driven Architecture**: RabbitMQ con topic exchange
- **Multi-tenancy**: PostgreSQL Row-Level Security
- **RBAC**: Role-Based Access Control jerárquico
- **CQRS**: Separación de comandos y queries
- **Cache-Aside Pattern**: Redis para optimización
- **Circuit Breaker**: Resiliencia en comunicación gRPC
- **Database per Service**: Aislamiento de datos
- **API Gateway Pattern**: Envoy para routing y load balancing
- **GraphQL Federation**: Strawberry para queries complejas

## Estructura del Proyecto

```
/Users/sparrow/Universidad/ERP/
├── .claude/                           # Configuración de Claude Code
│   ├── settings.local.json           # Permisos y configuración
│   ├── PROJECT_CONTEXT.md            # Este archivo
│   ├── RULES.md                      # Reglas del proyecto
│   └── plans/                        # Planes de trabajo
│
├── documentacion/                     # Documentación Docusaurus
│   ├── docs/                         # Archivos markdown (187+ archivos)
│   │   ├── intro.md
│   │   ├── 01-arquitectura/         # 11 archivos
│   │   ├── 02-microservicios/       # 100+ archivos (10 servicios)
│   │   ├── 03-adrs/                 # 8 archivos (ADRs)
│   │   ├── 03-flujos-negocio/       # 5 archivos
│   │   ├── 04-integraciones/        # 5 archivos
│   │   ├── 05-guias/                # 6 archivos
│   │   ├── 06-anexos/               # 4 archivos
│   │   ├── 06-observabilidad/       # Métricas y logging
│   │   ├── 07-resiliencia/          # Error handling
│   │   ├── deployment/              # Docker y Kubernetes
│   │   └── testing/                 # Estrategia de testing
│   ├── sidebars.js                  # Configuración sidebar
│   ├── docusaurus.config.js         # Configuración Docusaurus
│   └── static/                      # Assets estáticos
│
└── [microservicios]/                 # Código fuente (futuro)
```

## Estado Actual de la Documentación

### Completado (100%)

**Total: 187+ archivos markdown documentados**

#### Arquitectura General (11 archivos)
- Vision general del sistema
- Stack tecnológico
- Arquitectura event-driven
- Comunicación entre microservicios
- Multi-tenancy con RLS
- Eventos y mensajería
- Patrones de diseño
- API Gateway (Envoy)
- GraphQL Gateway
- Variantes vs Stock
- Política de Precios

#### Microservicios (100+ archivos)

**Auth Service** - Completo
**Catalog Service** - Completo (23 archivos)
**Inventory Service** - Completo
**Order Service** - Completo (15 archivos)
**POS Service** - Completo
**Audit Service** - Completo
**Customer Service** - Completo
**Pricing Service** - Completo
**Procurement Service** - Completo
**Reports Service** - Completo

#### ADRs - Decisiones de Arquitectura (8 archivos)
- ADR-001: Python y FastAPI
- ADR-002: PostgreSQL como BD principal
- ADR-003: Event-Driven Architecture
- ADR-004: gRPC para comunicación interna
- ADR-005: RBAC multi-nivel
- ADR-006: PostgreSQL Multi-tenant con RLS
- ADR-007: Cursor-based Pagination

#### Flujos de Negocio (5 archivos)
- Flujo de venta completo
- Flujo de devoluciones
- Flujo de compras
- Sistema de pagos

#### Integraciones (5 archivos)
- RabbitMQ (message broker)
- Redis (cache y sessions)
- gRPC (comunicación interna)
- PostgreSQL (base de datos)

#### Guías (6 archivos)
- Setup local (Docker Compose)
- Crear nuevo microservicio
- Testing (unit, integration, e2e)
- Deployment (Docker + Kubernetes)
- Troubleshooting
- Poetry Setup

## Convenciones del Proyecto

### Formato de Eventos (Estandarizado)

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

**Ejemplos de Routing Keys**:
- `auth.user.created`
- `catalog.product.updated`
- `order.order.completed`
- `inventory.stock.reserved`

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

### Git

- **Commits**: imperativo, descriptivo
  - `Add product creation endpoint`
  - `Fix SKU validation for special characters`
- **Branches**: `{tipo}/{descripción}`
  - `feature/user-authentication`
  - `bugfix/sku-validation`

## URLs y Recursos

### Documentación Local

- **Docusaurus**: http://localhost:3000/ o http://localhost:3001/
- **Comando**: `cd documentacion && npm start`

### Servicios (cuando estén corriendo)

- Auth Service: http://localhost:8001
- Catalog Service: http://localhost:8002
- Inventory Service: http://localhost:8003
- Order Service: http://localhost:8004
- POS Service: http://localhost:8005
- Audit Service: http://localhost:8006
- Customer Service: http://localhost:8007
- Pricing Service: http://localhost:8008
- RabbitMQ Management: http://localhost:15672
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Historial de Cambios

### 2025-11-25 (FASE 10 Completada)

- Estandarización completa de formato de eventos (`event` + `data`)
- 49 archivos modificados, +8,462 líneas
- 14 archivos nuevos creados
- 10 microservicios con documentación completa
- API Gateway y GraphQL Gateway documentados
- Flujos de negocio expandidos

### 2025-11-23

- Completada sección Guías
- Corregida navegación sidebar
- Corregido error Mermaid en diagrama Kubernetes
- Verificadas todas las páginas de documentación

---

**Última actualización**: 2025-11-25
**Estado**: Documentación completa y funcional
**Commit**: `485571d` en branch `development`
