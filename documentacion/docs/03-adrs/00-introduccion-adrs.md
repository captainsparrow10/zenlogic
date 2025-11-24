---
sidebar_position: 1
---

# Introducción a ADRs

Architecture Decision Records (ADRs) para zenLogic.

## ¿Qué son los ADRs?

Los **Architecture Decision Records** son documentos que capturan decisiones arquitectónicas importantes, incluyendo el contexto, las alternativas consideradas y las consecuencias de cada decisión.

## Formato de ADR

Cada ADR sigue esta estructura:

```markdown
# ADR-NNN: Título de la Decisión

**Estado**: Aceptado | Propuesto | Deprecated | Superseded
**Fecha**: YYYY-MM-DD
**Decisores**: Equipo de arquitectura

## Contexto

¿Qué problema estamos tratando de resolver?
¿Qué fuerzas están en juego?

## Decisión

¿Qué decisión tomamos?

## Alternativas Consideradas

1. Alternativa 1
2. Alternativa 2
3. Alternativa 3

## Consecuencias

### Positivas
- Beneficio 1
- Beneficio 2

### Negativas
- Trade-off 1
- Trade-off 2

### Riesgos
- Riesgo 1
- Riesgo 2
```

## Índice de ADRs

### Tecnologías Core

- [ADR-001: Python + FastAPI](/adrs/adr-001-python-fastapi) - Stack base del backend
- [ADR-002: PostgreSQL como Base de Datos Principal](/adrs/adr-002-postgresql) - Almacenamiento relacional

### Arquitectura

- [ADR-003: Arquitectura Event-Driven](/adrs/adr-003-event-driven) - Comunicación asíncrona
- [ADR-004: gRPC para Comunicación Interna](/adrs/adr-004-grpc-internal) - Comunicación síncrona entre servicios

### Seguridad y Multi-tenancy

- [ADR-005: RBAC Multi-nivel](/adrs/adr-005-rbac-multinivel) - Control de acceso granular
- [ADR-006: PostgreSQL Row-Level Security para Multi-tenancy](/adrs/adr-006-postgresql-multi-tenant) - Aislamiento de datos

### API Design

- [ADR-007: Cursor-based Pagination](/adrs/adr-007-cursor-pagination) - Paginación escalable

## Proceso de ADR

### 1. Creación

Cuando se identifica una decisión arquitectónica importante:

1. Crear nuevo archivo `adr-NNN-titulo.md`
2. Usar el template estándar
3. Completar todas las secciones
4. Estado inicial: **Propuesto**

### 2. Revisión

1. Review por equipo de arquitectura
2. Discusión de alternativas
3. Evaluación de trade-offs

### 3. Aprobación

1. Consenso del equipo
2. Cambiar estado a **Aceptado**
3. Fecha de aprobación

### 4. Implementación

1. Seguir la decisión documentada
2. Actualizar ADR si hay cambios significativos
3. Si se depreca: Estado **Deprecated** + link al ADR sucesor

## Principios

### Inmutabilidad

Los ADRs son **inmutables**. Si una decisión cambia:

1. Marcar ADR original como **Deprecated** o **Superseded**
2. Crear nuevo ADR con la nueva decisión
3. Referenciar ADR original

### Contexto sobre Detalles

Enfocarse en **por qué** tomamos la decisión, no solo **qué** decidimos.

### Trade-offs Honestos

Documentar **consecuencias negativas** y riesgos, no solo beneficios.

## Ejemplo Rápido

```markdown
# ADR-001: Python + FastAPI

**Estado**: Aceptado
**Fecha**: 2025-11-23

## Contexto
Necesitamos elegir un stack backend para un sistema ERP con alta concurrencia...

## Decisión
Usar Python 3.11+ con FastAPI para todos los microservicios.

## Alternativas Consideradas
1. Node.js + Express
2. Go + Gin
3. Java + Spring Boot

## Consecuencias
**Positivas**: Type hints, async nativo, rápido desarrollo
**Negativas**: Performance menor que Go, GIL en CPython
```

## Recursos

- [ADR GitHub Template](https://github.com/joelparkerhenderson/architecture-decision-record)
- [ThoughtWorks ADR Tools](https://github.com/npryce/adr-tools)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)

## Próximos Pasos

Revisar cada ADR específico para entender las decisiones arquitectónicas de zenLogic:

- [ADR-001: Python + FastAPI](/adrs/adr-001-python-fastapi)
- [ADR-003: Arquitectura Event-Driven](/adrs/adr-003-event-driven)
- [ADR-005: RBAC Multi-nivel](/adrs/adr-005-rbac-multinivel)
