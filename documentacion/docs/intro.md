---
sidebar_position: 1
slug: /intro
---

# Introducción

Bienvenido a la documentación completa del **Sistema zenLogic**.

## Sobre este Proyecto

Este zenLogic (Enterprise Resource Planning) está diseñado con una arquitectura de microservicios moderna, implementando patrones avanzados de software y mejores prácticas de la industria.

### Características Principales

- **Multi-tenancy**: Soporte completo para múltiples organizaciones con aislamiento de datos
- **Arquitectura de Microservicios**: Servicios independientes, escalables y mantenibles
- **Event-Driven**: Comunicación asíncrona entre servicios mediante eventos
- **RBAC Multinivel**: Control de acceso basado en roles con permisos granulares
- **API REST + gRPC**: Comunicación híbrida optimizada para cada caso de uso
- **Auditoría Completa**: Trazabilidad de todas las operaciones del sistema

## Estructura de la Documentación

Esta documentación está organizada en las siguientes secciones:

### Arquitectura General
Conceptos fundamentales, decisiones de diseño y patrones arquitectónicos del sistema.

- [Visión General](/arquitectura/vision-general)
- [Stack Tecnológico](/arquitectura/stack-tecnologico)
- [Arquitectura Event-Driven](/arquitectura/arquitectura-event-driven)
- [Comunicación entre Microservicios](/arquitectura/comunicacion-microservicios)
- [Multi-tenancy](/arquitectura/multi-tenancy)
- [Seguridad y RBAC](/arquitectura/seguridad-rbac)
- [Patrones de Diseño](/arquitectura/patrones-diseno)
- [API Gateway](/arquitectura/api-gateway)

### Microservicios
Documentación detallada de cada microservicio:

**Auth Service** - Identidad, autenticación y autorización
- [Overview](/microservicios/auth-service/overview)
- [Alcance](/microservicios/auth-service/alcance)
- [Arquitectura](/microservicios/auth-service/arquitectura)
- [Modelo de Datos](/microservicios/auth-service/modelo-datos)
- [API Auth](/microservicios/auth-service/api-auth)
- [API Users](/microservicios/auth-service/api-users)
- [Flujos de Negocio](/microservicios/auth-service/flujos-negocio)

**Catalog Service** - Gestión del catálogo de productos
- [Overview](/microservicios/catalog-service/overview)
- [Alcance](/microservicios/catalog-service/alcance)
- [Arquitectura](/microservicios/catalog-service/arquitectura)
- [API Products](/microservicios/catalog-service/api-products)
- [Paginación con Cursor](/microservicios/catalog-service/paginacion-cursor)

**Inventory Service** - Gestión de inventario
- [Overview](/microservicios/inventory-service/overview)
- [Arquitectura](/microservicios/inventory-service/arquitectura)
- [Modelo de Datos](/microservicios/inventory-service/modelo-datos)

**Order Service** - Procesamiento de órdenes
- [Overview](/microservicios/order-service/overview)
- [Modelo de Datos](/microservicios/order-service/modelo-datos)
- [State Machine](/microservicios/order-service/state-machine)

**Audit Service** - Auditoría y trazabilidad
- [Overview](/microservicios/audit-service/overview)
- [Alcance](/microservicios/audit-service/alcance)
- [Arquitectura](/microservicios/audit-service/arquitectura)
- [API Logs](/microservicios/audit-service/api-logs)

**POS Service** - Punto de venta
- [Overview](/microservicios/pos-service/overview)
- [Arquitectura](/microservicios/pos-service/arquitectura)
- [Modo Offline](/microservicios/pos-service/modo-offline)

**Customer Service** - Gestión de clientes
- [Overview](/microservicios/customer-service/overview)
- [API Customers](/microservicios/customer-service/api-customers)
- [API Loyalty](/microservicios/customer-service/api-loyalty)

**Pricing Service** - Precios y promociones
- [Overview](/microservicios/pricing-service/overview)
- [API Promotions](/microservicios/pricing-service/api-promotions)
- [Tipos de Promociones](/microservicios/pricing-service/tipos-promociones)

**Procurement Service** - Compras y proveedores
- [Overview](/microservicios/procurement-service/overview)
- [API Suppliers](/microservicios/procurement-service/api-suppliers)
- [API Purchases](/microservicios/procurement-service/api-purchases)

**Reports Service** - Reportes y analytics
- [Overview](/microservicios/reports-service/overview)
- [API Reports](/microservicios/reports-service/api-reports)
- [Tipos de Reportes](/microservicios/reports-service/tipos-reportes)

### Decisiones de Arquitectura
Architecture Decision Records (ADRs) que documentan decisiones clave:

- [Introducción a ADRs](/adrs/introduccion-adrs)
- [ADR-001: Python y FastAPI](/adrs/adr-001-python-fastapi)
- [ADR-002: PostgreSQL](/adrs/adr-002-postgresql)
- [ADR-003: Event-Driven Architecture](/adrs/adr-003-event-driven)
- [ADR-004: gRPC para comunicación interna](/adrs/adr-004-grpc-internal)
- [ADR-005: RBAC Multinivel](/adrs/adr-005-rbac-multinivel)
- [ADR-006: PostgreSQL Multi-tenant](/adrs/adr-006-postgresql-multi-tenant)
- [ADR-007: Cursor-based Pagination](/adrs/adr-007-cursor-pagination)

### Flujos de Negocio
Flujos end-to-end que integran múltiples servicios:

- [Flujo de Venta Completo](/flujos-negocio/flujo-venta-completo)
- [Flujo de Compras](/flujos-negocio/flujo-compras)
- [Flujo de Devoluciones](/flujos-negocio/flujo-devoluciones)
- [Sistema de Pagos](/flujos-negocio/sistema-pagos)

### Deployment
Configuración de deployment y Docker:

- [Docker Compose](/deployment/docker-compose)

### Testing
Estrategia completa de testing:

- [Estrategia de Testing](/testing/estrategia-testing)

### Integraciones
Configuración de integraciones con servicios externos:

- [Overview de Integraciones](/integraciones/overview)
- [RabbitMQ](/integraciones/rabbitmq)
- [Redis](/integraciones/redis)
- [gRPC](/integraciones/grpc)
- [PostgreSQL](/integraciones/postgresql)

### Guías
Guías prácticas para desarrollo:

- [Setup Local](/guias/setup-local)
- [Crear Microservicio](/guias/crear-microservicio)
- [Testing](/guias/testing)
- [Deployment](/guias/deployment)
- [Troubleshooting](/guias/troubleshooting)

### Anexos
Referencias y recursos adicionales:

- [Glosario](/anexos/glosario)
- [Convenciones](/anexos/convenciones)
- [Referencias](/anexos/referencias)
- [Diagramas](/anexos/diagramas)

## Comenzar

Si es tu primera vez aquí, te recomendamos empezar por:

### Para entender la arquitectura:
1. **[Visión General](/arquitectura/vision-general)** - Panorama completo del sistema
2. **[Stack Tecnológico](/arquitectura/stack-tecnologico)** - Tecnologías utilizadas
3. **[Event-Driven Architecture](/arquitectura/arquitectura-event-driven)** - Comunicación asíncrona
4. **[Multi-tenancy](/arquitectura/multi-tenancy)** - Aislamiento de organizaciones

### Para desarrollar:
1. **[Setup Local](/guias/setup-local)** - Configurar entorno de desarrollo
2. **[Docker Compose](/deployment/docker-compose)** - Levantar todos los servicios
3. **[Estrategia de Testing](/testing/estrategia-testing)** - Cómo hacer tests
4. **[Troubleshooting](/guias/troubleshooting)** - Solución de problemas comunes

### Para entender los microservicios:
1. **[Auth Service](/microservicios/auth-service/overview)** - Autenticación y autorización
2. **[Catalog Service](/microservicios/catalog-service/overview)** - Catálogo de productos
3. **[Inventory Service](/microservicios/inventory-service/overview)** - Gestión de inventario
4. **[Order Service](/microservicios/order-service/overview)** - Procesamiento de órdenes
5. **[Audit Service](/microservicios/audit-service/overview)** - Auditoría y logs

### Para entender flujos completos:
1. **[Flujo de Venta](/flujos-negocio/flujo-venta-completo)** - Desde carrito hasta entrega
2. **[Flujo de Devoluciones](/flujos-negocio/flujo-devoluciones)** - RMA y reembolsos

## Contexto Académico

Este proyecto forma parte de un trabajo de tesis universitaria, demostrando la implementación de:

- Arquitecturas de microservicios en entornos empresariales
- Patrones de diseño modernos (Event-Driven, CQRS, etc.)
- Sistemas multi-tenant escalables
- Integración de tecnologías heterogéneas
- Documentación profesional de sistemas complejos

## Contacto

Para preguntas o sugerencias sobre esta documentación, por favor contacta al equipo de desarrollo.

---

**Última actualización**: Noviembre 2025
