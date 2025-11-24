---
sidebar_position: 1
slug: /
---

# Introducción

Bienvenido a la documentación completa del **Sistema zenLogic**.

## 🎯 Sobre este Proyecto

Este zenLogic (Enterprise Resource Planning) está diseñado con una arquitectura de microservicios moderna, implementando patrones avanzados de software y mejores prácticas de la industria.

### Características Principales

- **Multi-tenancy**: Soporte completo para múltiples organizaciones con aislamiento de datos
- **Arquitectura de Microservicios**: Servicios independientes, escalables y mantenibles
- **Event-Driven**: Comunicación asíncrona entre servicios mediante eventos
- **RBAC Multinivel**: Control de acceso basado en roles con permisos granulares
- **API REST + gRPC**: Comunicación híbrida optimizada para cada caso de uso
- **Auditoría Completa**: Trazabilidad de todas las operaciones del sistema

## 📚 Estructura de la Documentación

Esta documentación está organizada en las siguientes secciones:

### 📐 Arquitectura General
Conceptos fundamentales, decisiones de diseño y patrones arquitectónicos del sistema.

- [Visión General](/arquitectura/vision-general)
- [Stack Tecnológico](/arquitectura/stack-tecnologico)
- [Arquitectura Event-Driven](/arquitectura/arquitectura-event-driven)
- [Comunicación entre Microservicios](/arquitectura/comunicacion-microservicios)
- [Multi-tenancy](/arquitectura/multi-tenancy)
- [Seguridad y RBAC](/arquitectura/seguridad-rbac)
- [Patrones de Diseño](/arquitectura/patrones-diseno)

### 🔧 Microservicios
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

**Audit Service** - Auditoría y trazabilidad
- [Overview](/microservicios/audit-service/overview)
- [Alcance](/microservicios/audit-service/alcance)
- [Arquitectura](/microservicios/audit-service/arquitectura)
- [API Logs](/microservicios/audit-service/api-logs)

### 📋 Decisiones de Arquitectura
Architecture Decision Records (ADRs) que documentan decisiones clave:

- [Introducción a ADRs](/03-adrs/00-introduccion-adrs)
- [ADR-001: Python y FastAPI](/03-adrs/adr-001-python-fastapi)
- [ADR-002: PostgreSQL](/03-adrs/adr-002-postgresql)
- [ADR-003: Event-Driven Architecture](/03-adrs/adr-003-event-driven)
- [ADR-004: gRPC para comunicación interna](/03-adrs/adr-004-grpc-internal)
- [ADR-005: RBAC Multinivel](/03-adrs/adr-005-rbac-multinivel)
- [ADR-006: PostgreSQL Multi-tenant](/03-adrs/adr-006-postgresql-multi-tenant)
- [ADR-007: Cursor-based Pagination](/03-adrs/adr-007-cursor-pagination)

### 🌐 Flujos de Negocio
Flujos end-to-end que integran múltiples servicios:

- [Flujo de Venta Completo](/03-flujos-negocio/01-flujo-venta-completo)
- [Flujo de Devoluciones](/03-flujos-negocio/02-flujo-devoluciones)

### 🚢 Deployment
Configuración de deployment y Docker:

- [Docker Compose](/04-deployment/01-docker-compose)

### 🧪 Testing
Estrategia completa de testing:

- [Estrategia de Testing](/05-testing/01-estrategia-testing)

### 📊 Observabilidad
Logs, métricas y tracing distribuido:

- [Guía de Observabilidad](/06-observabilidad/01-guia-observabilidad)

### 🛡️ Resiliencia
Error handling y políticas de retry:

- [Error Handling y Retry](/07-resiliencia/01-error-handling-retry)

### 🔌 Integraciones
Configuración de integraciones con servicios externos:

- [Overview de Integraciones](/04-integraciones/00-overview)
- [RabbitMQ](/04-integraciones/01-rabbitmq)
- [Redis](/04-integraciones/02-redis)
- [gRPC](/04-integraciones/03-grpc)
- [PostgreSQL](/04-integraciones/04-postgresql)

### 📖 Guías
Guías prácticas para desarrollo:

- [Setup Local](/05-guias/00-setup-local)
- [Crear Microservicio](/05-guias/01-crear-microservicio)
- [Testing](/05-guias/02-testing)
- [Deployment](/05-guias/03-deployment)
- [Troubleshooting](/05-guias/04-troubleshooting)

### 📚 Anexos
Referencias y recursos adicionales:

- [Glosario](/06-anexos/00-glosario)
- [Convenciones](/06-anexos/01-convenciones)
- [Referencias](/06-anexos/02-referencias)
- [Diagramas](/06-anexos/03-diagramas)

## 🚀 Comenzar

Si es tu primera vez aquí, te recomendamos empezar por:

### Para entender la arquitectura:
1. **[Visión General](/01-arquitectura/00-vision-general)** - Panorama completo del sistema
2. **[Stack Tecnológico](/01-arquitectura/01-stack-tecnologico)** - Tecnologías utilizadas
3. **[Event-Driven Architecture](/01-arquitectura/02-arquitectura-event-driven)** - Comunicación asíncrona
4. **[Multi-tenancy](/01-arquitectura/04-multi-tenancy)** - Aislamiento de organizaciones

### Para desarrollar:
1. **[Setup Local](/05-guias/00-setup-local)** - Configurar entorno de desarrollo
2. **[Docker Compose](/04-deployment/01-docker-compose)** - Levantar todos los servicios
3. **[Estrategia de Testing](/05-testing/01-estrategia-testing)** - Cómo hacer tests
4. **[Troubleshooting](/05-guias/04-troubleshooting)** - Solución de problemas comunes

### Para entender los microservicios:
1. **[Auth Service](/02-microservicios/auth-service/00-overview)** - Autenticación y autorización
2. **[Catalog Service](/02-microservicios/catalog-service/00-overview)** - Catálogo de productos
3. **[Inventory Service](/02-microservicios/inventory-service/01-overview)** - Gestión de inventario
4. **[Order Service](/02-microservicios/order-service/01-overview)** - Procesamiento de órdenes
5. **[Audit Service](/02-microservicios/audit-service/00-overview)** - Auditoría y logs

### Para entender flujos completos:
1. **[Flujo de Venta](/03-flujos-negocio/01-flujo-venta-completo)** - Desde carrito hasta entrega
2. **[Flujo de Devoluciones](/03-flujos-negocio/02-flujo-devoluciones)** - RMA y reembolsos

## 🎓 Contexto Académico

Este proyecto forma parte de un trabajo de tesis universitaria, demostrando la implementación de:

- Arquitecturas de microservicios en entornos empresariales
- Patrones de diseño modernos (Event-Driven, CQRS, etc.)
- Sistemas multi-tenant escalables
- Integración de tecnologías heterogéneas
- Documentación profesional de sistemas complejos

## 📞 Contacto

Para preguntas o sugerencias sobre esta documentación, por favor contacta al equipo de desarrollo.

---

**Última actualización**: Noviembre 2025
