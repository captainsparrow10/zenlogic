---
sidebar_position: 1
---

# Glosario de Términos

Definiciones de términos técnicos y conceptos utilizados en zenLogic ERP.

## A

### ADR (Architecture Decision Record)
Documento que registra una decisión de arquitectura importante, incluyendo el contexto, las alternativas consideradas y las consecuencias de la decisión.

### AMQP (Advanced Message Queuing Protocol)
Protocolo de comunicación para message brokers como RabbitMQ que permite comunicación asíncrona entre servicios.

### Async/Await
Patrón de programación asíncrona en Python que permite escribir código no-bloqueante de manera más legible.

### Audit Log
Registro inmutable de todas las acciones importantes realizadas en el sistema para auditoría y compliance.

## B

### Base Price
Precio base de un producto antes de aplicar variantes, descuentos o ajustes por local.

### Binding
Conexión entre un exchange y una queue en RabbitMQ que define qué mensajes llegan a qué queue basándose en routing keys.

## C

### Cache-Aside Pattern
Patrón de cache donde la aplicación primero busca en cache, y si no encuentra (cache miss), obtiene de la base de datos y actualiza el cache.

### Circuit Breaker
Patrón de resiliencia que previene llamadas repetidas a un servicio que está fallando, permitiendo tiempo de recuperación.

### Connection Pool
Pool de conexiones reutilizables a base de datos para mejorar performance y reducir overhead.

### Correlation ID
Identificador único que se propaga a través de todas las llamadas de un request para trazabilidad distribuida.

### CRUD
Create, Read, Update, Delete - Operaciones básicas de manipulación de datos.

### Cursor-based Pagination
Tipo de paginación que usa cursores opacos en lugar de offset/limit para mejor performance con datasets grandes.

## D

### DDD (Domain-Driven Design)
Enfoque de diseño de software que modela el sistema basándose en el dominio de negocio.

### Dead Letter Queue (DLQ)
Queue especial donde se envían mensajes que fallaron en procesarse después de múltiples intentos.

### Dependency Injection
Patrón donde las dependencias se proveen externamente en lugar de ser creadas internamente.

### DTO (Data Transfer Object)
Objeto que transporta datos entre procesos, típicamente schemas de Pydantic en zenLogic.

## E

### Event-Driven Architecture
Arquitectura donde los servicios se comunican mediante eventos asíncronos en lugar de llamadas síncronas directas.

### Event Sourcing
Patrón donde el estado se deriva de una secuencia de eventos en lugar de almacenar solo el estado actual.

### Exchange
Componente de RabbitMQ que recibe mensajes de publishers y los enruta a queues basándose en reglas de routing.

## F

### Fallback
Comportamiento alternativo cuando una operación principal falla (ej: usar REST si gRPC falla).

### FastAPI
Framework web moderno de Python para construir APIs con validación automática y documentación OpenAPI.

## G

### gRPC (gRPC Remote Procedure Call)
Framework de comunicación de alto rendimiento que usa HTTP/2 y Protocol Buffers para llamadas entre servicios.

### Graceful Degradation
Capacidad de un sistema de mantener funcionalidad limitada cuando algún componente falla.

## H

### Health Check
Endpoint que verifica el estado de salud de un servicio y sus dependencias.

### Heartbeat
Señal periódica enviada para mantener viva una conexión y detectar desconexiones.

## I

### Idempotencia
Propiedad donde una operación produce el mismo resultado sin importar cuántas veces se ejecute.

### Isolation Level
Nivel de aislamiento entre transacciones concurrentes en una base de datos.

## J

### JWT (JSON Web Token)
Estándar para crear tokens de acceso que contienen claims codificados en JSON y firmados criptográficamente.

## L

### Local
Sucursal, tienda física o punto de venta dentro de una organización en el contexto de zenLogic.

### LRU (Least Recently Used)
Política de eviction de cache que elimina los items menos recientemente usados cuando se alcanza el límite de memoria.

## M

### Message Broker
Infraestructura que facilita comunicación asíncrona entre servicios mediante mensajes (ej: RabbitMQ).

### Microservicio
Servicio pequeño, independiente y desplegable que implementa una capacidad de negocio específica.

### Migration
Script de base de datos que define cambios de schema de manera versionada y reproducible (usando Alembic).

### Multi-tenancy
Arquitectura donde una única instancia de software sirve a múltiples tenants (organizaciones) con datos aislados.

## N

### NACK (Negative Acknowledgement)
Señal a RabbitMQ de que un mensaje no pudo ser procesado exitosamente.

### Namespace
Prefijo usado en keys de Redis para organizar y evitar colisiones (ej: `product:{id}`).

## O

### ORM (Object-Relational Mapping)
Técnica que mapea objetos de programación a tablas de base de datos (SQLAlchemy en zenLogic).

### Organization
Entidad de más alto nivel en zenLogic que representa una empresa o cliente.

## P

### Payload
Datos de negocio contenidos en un evento o mensaje.

### Permissions
Acciones específicas que un usuario puede realizar (ej: `products.create`, `users.delete`).

### Prefetch
Número de mensajes que RabbitMQ envía a un consumer antes de esperar ACK.

### Protocol Buffer (protobuf)
Formato de serialización binario usado por gRPC para definir interfaces de servicio.

### Pub/Sub (Publish-Subscribe)
Patrón de mensajería donde publishers envían mensajes a topics y subscribers reciben mensajes de topics de interés.

## Q

### Queue
Estructura de datos FIFO (First-In-First-Out) que almacena mensajes en RabbitMQ hasta que son consumidos.

### QoS (Quality of Service)
Configuración de RabbitMQ que controla cuántos mensajes no-acknowledged puede tener un consumer.

## R

### RBAC (Role-Based Access Control)
Sistema de control de acceso basado en roles asignados a usuarios.

### Redis
Base de datos en memoria usada para cache, sesiones y estructuras de datos de alta velocidad.

### Repository Pattern
Patrón que abstrae el acceso a datos, separando la lógica de negocio de la capa de persistencia.

### RLS (Row-Level Security)
Feature de PostgreSQL que restringe qué filas puede ver o modificar un usuario basándose en políticas.

### Role
Conjunto de permisos agrupados que se asignan a usuarios (ej: Admin, Vendedor, Cajero).

### Routing Key
String usado por RabbitMQ para enrutar mensajes desde exchanges a queues (ej: `auth.user.created`).

## S

### Saga Pattern
Patrón para transacciones distribuidas que coordina múltiples servicios con compensaciones.

### Schema
Modelo de datos que define la estructura y validación de inputs/outputs (Pydantic schemas).

### Seed Data
Datos iniciales cargados en la base de datos para desarrollo o testing.

### Service Layer
Capa que contiene la lógica de negocio de la aplicación.

### SKU (Stock Keeping Unit)
Código único que identifica un producto en el inventario.

### SQLAlchemy
ORM de Python usado para interactuar con PostgreSQL de manera asíncrona.

## T

### Tenant
Organización o cliente en un sistema multi-tenant. En zenLogic, corresponde a `organization_id`.

### Topic Exchange
Tipo de exchange en RabbitMQ que enruta mensajes basándose en patrones de routing key.

### TTL (Time To Live)
Tiempo de vida de un item en cache o mensaje en queue antes de ser eliminado automáticamente.

## U

### UUID (Universally Unique Identifier)
Identificador de 128 bits usado como primary key en todas las tablas de zenLogic.

### Uvicorn
Servidor ASGI de alto rendimiento usado para ejecutar aplicaciones FastAPI.

## V

### Variant
Variación de un producto con atributos específicos (ej: talla, color) y precio propio.

### Virtual Environment
Entorno aislado de Python con sus propias dependencias.

## W

### Write-Through Cache
Patrón de cache donde los datos se escriben simultáneamente en cache y base de datos.

## Referencias

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [gRPC Documentation](https://grpc.io/docs/)
