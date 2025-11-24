---
sidebar_position: 2
---

# Alcance del Catalog Service

## ¿Qué HACE el Catalog Service?

### 1. Gestión de Productos

- ✅ Crear productos
- ✅ Actualizar información de productos
- ✅ Archivar/eliminar productos
- ✅ Listar productos con paginación
- ✅ Buscar productos por SKU, título
- ✅ Filtrar por categoría, estado
- ✅ Gestión de imágenes de productos

### 2. Gestión de Variantes

- ✅ Crear variantes con opciones
- ✅ Actualizar variantes
- ✅ Eliminar variantes
- ✅ Gestionar precios por variante
- ✅ SKU único por variante
- ✅ Asociar variantes a locales (warehouses)

### 3. Gestión de Opciones

- ✅ Definir tipos de opciones (Color, Talla, Material)
- ✅ Definir valores de opciones (Rojo, XL, Algodón)
- ✅ Asociar opciones a productos

### 4. Validación de Locales

- ✅ Verificar que local existe (via Auth Service)
- ✅ Validar que usuario tiene acceso al local
- ✅ Sincronizar locales desde Auth Service

### 5. Event-Driven

- ✅ Publicar eventos de cambios en catálogo
- ✅ Consumir eventos de Auth Service

## ¿Qué NO HACE el Catalog Service?

### ❌ Gestión de Inventario

Catalog Service **NO** gestiona stock ni inventario.

**Responsabilidad de Inventory Service**:
- Control de stock
- Movimientos de inventario
- Reservas de stock
- Ajustes de inventario

Catalog Service solo **define** que una variante existe y su warehouse asociado.

### ❌ Gestión de Precios Complejos

Catalog Service **NO** gestiona:
- ❌ Precios por cliente
- ❌ Descuentos y promociones
- ❌ Precios por volumen
- ❌ Listas de precios

Solo gestiona el precio base de la variante.

### ❌ Gestión de Órdenes

Catalog Service **NO** gestiona:
- ❌ Crear órdenes
- ❌ Reservar productos
- ❌ Procesar ventas

**Responsabilidad de Order Service**.

### ❌ Autenticación y Autorización

Catalog Service **NO** gestiona usuarios ni permisos.

Delega toda autenticación/autorización a **Auth Service** via gRPC.

### ❌ Análisis y Reportes

Catalog Service **NO** genera:
- ❌ Reportes de ventas
- ❌ Productos más vendidos
- ❌ Analytics

**Responsabilidad de Analytics/Reports Service**.

## Próximos Pasos

- [Arquitectura](/microservicios/catalog-service/arquitectura)
- [Modelo de Datos](/microservicios/catalog-service/modelo-datos)
