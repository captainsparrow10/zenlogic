---
sidebar_position: 17
---

# Errores Comunes

Catálogo completo de códigos de error del Inventory Service con causas, soluciones y ejemplos de respuesta.

## Formato de Respuesta de Error

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Stock insuficiente para completar la operación",
    "details": {
      "variant_id": "var_789",
      "warehouse_id": "wh_101",
      "requested": 50,
      "available": 30
    },
    "field": "quantity",
    "suggestion": "Reduzca la cantidad o seleccione otra bodega"
  },
  "timestamp": "2025-11-23T15:00:00Z",
  "path": "/api/v1/movements",
  "requestId": "req_abc123"
}
```

---

## Errores de Stock (1xxx)

### INV-1001: INSUFFICIENT_STOCK

**HTTP Status:** `400 Bad Request`

**Descripción:** No hay stock suficiente para completar la operación solicitada.

**Causas Comunes:**

- Intentar reservar más cantidad de la disponible
- Crear movimiento de salida sin stock suficiente
- Stock disponible reducido por reservas previas

**Ejemplo de Respuesta:**

```json
{
  "status": "error",
  "statusCode": 400,
  "error": {
    "code": "INV-1001",
    "type": "INSUFFICIENT_STOCK",
    "message": "Stock insuficiente en la bodega seleccionada",
    "details": {
      "variant_id": "var_789",
      "sku": "PROD-001-RED-M",
      "warehouse_id": "wh_101",
      "warehouse_name": "Bodega Principal",
      "requested_quantity": 50,
      "available_quantity": 30,
      "reserved_quantity": 15,
      "total_quantity": 45,
      "shortage": 20
    },
    "alternatives": [
      {
        "warehouse_id": "wh_102",
        "warehouse_name": "Bodega Sucursal Este",
        "available_quantity": 75
      }
    ]
  }
}
```

**Soluciones:**

1. Reducir la cantidad solicitada a la disponible
2. Seleccionar una bodega alternativa con stock
3. Esperar a que se liberen reservas o lleguen nuevos ingresos
4. Crear una transferencia desde otra bodega

---

### INV-1002: STOCK_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** No existe registro de stock para la combinación variante-bodega.

**Causas Comunes:**

- Variante no inicializada en esa bodega
- Bodega o variante no existe
- Error en IDs proporcionados

**Solución:** Verificar que la variante esté registrada y que la bodega esté activa.

---

### INV-1003: STOCK_BELOW_MINIMUM

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** La operación dejaría el stock por debajo del mínimo configurado.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-1003",
    "type": "STOCK_BELOW_MINIMUM",
    "details": {
      "current_stock": 25,
      "requested_out": 10,
      "resulting_stock": 15,
      "min_stock": 20,
      "violation": 5
    }
  }
}
```

**Solución:** Ajustar la cantidad o actualizar el nivel mínimo de stock.

---

### INV-1004: STOCK_EXCEEDS_MAXIMUM

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** La operación superaría la capacidad máxima de stock configurada.

**Causas Comunes:**

- Ingreso masivo excede capacidad de bodega
- Límite de stock máximo muy bajo

**Solución:** Distribuir el ingreso en múltiples bodegas o ajustar el stock máximo.

---

### INV-1005: STOCK_ALREADY_RESERVED

**HTTP Status:** `409 Conflict`

**Descripción:** El stock ya está reservado y no puede ser modificado.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-1005",
    "type": "STOCK_ALREADY_RESERVED",
    "details": {
      "stock_id": "stock_456",
      "reserved_quantity": 25,
      "reservation_id": "res_123",
      "reserved_for": "order_789",
      "expires_at": "2025-11-23T15:30:00Z"
    }
  }
}
```

**Solución:** Esperar a que expire o se libere la reserva, o liberar manualmente la reserva existente.

---

### INV-1006: NEGATIVE_STOCK_NOT_ALLOWED

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** La operación resultaría en stock negativo, lo cual no está permitido.

**Causas Comunes:**

- Error en cálculo de cantidad
- Movimientos concurrentes no sincronizados
- Intento de restar más de lo existente

**Solución:** Verificar el stock actual antes de realizar la operación. Implementar bloqueos optimistas si hay concurrencia.

---

### INV-1007: STOCK_NOT_ZERO_FOR_DELETION

**HTTP Status:** `409 Conflict`

**Descripción:** No se puede eliminar/archivar un registro con stock mayor a cero.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-1007",
    "type": "STOCK_NOT_ZERO_FOR_DELETION",
    "message": "No se puede eliminar variante con stock existente",
    "details": {
      "variant_id": "var_789",
      "total_stock": 45,
      "warehouses_affected": [
        {"warehouse_id": "wh_101", "quantity": 30},
        {"warehouse_id": "wh_102", "quantity": 15}
      ]
    }
  }
}
```

**Solución:** Realizar ajustes o movimientos para llevar el stock a cero antes de eliminar.

---

## Errores de Movimientos (2xxx)

### INV-2001: INVALID_MOVEMENT_TYPE

**HTTP Status:** `400 Bad Request`

**Descripción:** Tipo de movimiento no válido o no soportado.

**Tipos Válidos:** `in`, `out`, `transfer`, `adjustment`

**Solución:** Usar uno de los tipos de movimiento permitidos.

---

### INV-2002: MOVEMENT_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** El movimiento especificado no existe.

**Solución:** Verificar el ID del movimiento.

---

### INV-2003: INVALID_QUANTITY

**HTTP Status:** `400 Bad Request`

**Descripción:** Cantidad de movimiento inválida (cero, negativa, o decimal cuando no se permite).

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-2003",
    "type": "INVALID_QUANTITY",
    "message": "La cantidad debe ser un número entero positivo",
    "details": {
      "provided_quantity": -5,
      "min_allowed": 1,
      "max_allowed": 99999
    }
  }
}
```

**Solución:** Proporcionar una cantidad válida mayor a cero.

---

### INV-2004: LOT_NUMBER_REQUIRED

**HTTP Status:** `400 Bad Request`

**Descripción:** La variante requiere tracking de lote pero no se proporcionó número de lote.

**Solución:** Incluir `lot_number` en el payload del movimiento.

---

### INV-2005: SERIAL_NUMBER_REQUIRED

**HTTP Status:** `400 Bad Request`

**Descripción:** La variante requiere tracking de número de serie pero no se proporcionó.

**Solución:** Incluir `serial_number` en el payload del movimiento.

---

### INV-2006: SERIAL_NUMBER_ALREADY_EXISTS

**HTTP Status:** `409 Conflict`

**Descripción:** El número de serie ya está registrado para otra unidad.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-2006",
    "type": "SERIAL_NUMBER_ALREADY_EXISTS",
    "details": {
      "serial_number": "SN-123456",
      "existing_stock_id": "stock_789",
      "warehouse_id": "wh_101"
    }
  }
}
```

**Solución:** Verificar el número de serie o usar uno diferente.

---

### INV-2007: EXPIRED_LOT_CANNOT_BE_USED

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** Intento de usar un lote que ya expiró.

**Solución:** Seleccionar un lote con fecha de vencimiento válida.

---

### INV-2008: MOVEMENT_CANNOT_BE_REVERSED

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** El movimiento no puede ser revertido porque afectaría la integridad del inventario.

**Causas Comunes:**

- Stock actual no permite la reversión
- Movimientos posteriores dependen de este
- Tiempo límite de reversión excedido

**Solución:** Crear un movimiento de ajuste en lugar de revertir.

---

### INV-2009: BATCH_MOVEMENT_PARTIAL_FAILURE

**HTTP Status:** `207 Multi-Status`

**Descripción:** Operación por lotes completada parcialmente con algunos elementos fallidos.

**Ejemplo:**

```json
{
  "status": "partial_success",
  "statusCode": 207,
  "data": {
    "total_items": 10,
    "successful": 7,
    "failed": 3,
    "results": [
      {
        "index": 2,
        "variant_id": "var_456",
        "status": "failed",
        "error": "INSUFFICIENT_STOCK"
      },
      {
        "index": 5,
        "variant_id": "var_789",
        "status": "failed",
        "error": "VARIANT_NOT_FOUND"
      }
    ]
  }
}
```

**Solución:** Revisar elementos fallidos y corregir los datos.

---

## Errores de Warehouse (3xxx)

### INV-3001: WAREHOUSE_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** La bodega especificada no existe.

**Solución:** Verificar el ID de la bodega o crear una nueva.

---

### INV-3002: WAREHOUSE_INACTIVE

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** La bodega está inactiva y no puede usarse para operaciones.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-3002",
    "type": "WAREHOUSE_INACTIVE",
    "details": {
      "warehouse_id": "wh_105",
      "warehouse_name": "Bodega Sur",
      "status": "inactive",
      "deactivated_at": "2025-11-01T00:00:00Z",
      "reason": "Mantenimiento programado"
    }
  }
}
```

**Solución:** Activar la bodega o usar una bodega activa alternativa.

---

### INV-3003: WAREHOUSE_AT_CAPACITY

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** La bodega ha alcanzado su capacidad máxima.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-3003",
    "type": "WAREHOUSE_AT_CAPACITY",
    "details": {
      "warehouse_id": "wh_101",
      "max_capacity": 10000,
      "current_capacity": 9950,
      "available_capacity": 50,
      "requested": 100
    }
  }
}
```

**Solución:** Usar otra bodega o incrementar la capacidad máxima.

---

### INV-3004: WAREHOUSE_CODE_DUPLICATE

**HTTP Status:** `409 Conflict`

**Descripción:** El código de bodega ya existe en la organización.

**Solución:** Usar un código único para la bodega.

---

### INV-3005: WAREHOUSE_HAS_STOCK

**HTTP Status:** `409 Conflict`

**Descripción:** No se puede eliminar/desactivar una bodega con stock existente.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-3005",
    "type": "WAREHOUSE_HAS_STOCK",
    "details": {
      "warehouse_id": "wh_102",
      "total_variants": 45,
      "total_stock_quantity": 1250,
      "variants_with_stock": [
        {"variant_id": "var_123", "quantity": 50},
        {"variant_id": "var_456", "quantity": 30}
      ]
    }
  }
}
```

**Solución:** Transferir todo el stock a otras bodegas antes de eliminar.

---

### INV-3006: LOCATION_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** La ubicación física especificada no existe.

**Solución:** Verificar el ID de la ubicación o crearla.

---

### INV-3007: LOCATION_CODE_DUPLICATE

**HTTP Status:** `409 Conflict`

**Descripción:** El código de ubicación ya existe en la bodega.

**Solución:** Usar un código único dentro de la bodega.

---

### INV-3008: LOCATION_HIERARCHY_INVALID

**HTTP Status:** `400 Bad Request`

**Descripción:** La jerarquía de ubicación no es válida.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-3008",
    "type": "LOCATION_HIERARCHY_INVALID",
    "message": "Nivel de jerarquía incorrecto",
    "details": {
      "provided_level": 3,
      "parent_level": 0,
      "expected_level": 1,
      "hierarchy": "Zone(0) -> Aisle(1) -> Rack(2) -> Shelf(3) -> Bin(4)"
    }
  }
}
```

**Solución:** Respetar la jerarquía: Zone → Aisle → Rack → Shelf → Bin.

---

## Errores de Transferencias (4xxx)

### INV-4001: TRANSFER_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** La transferencia especificada no existe.

**Solución:** Verificar el ID de la transferencia.

---

### INV-4002: TRANSFER_INVALID_STATE

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** No se puede realizar la acción en el estado actual de la transferencia.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-4002",
    "type": "TRANSFER_INVALID_STATE",
    "message": "No se puede enviar una transferencia cancelada",
    "details": {
      "transfer_id": "trans_123",
      "current_state": "cancelled",
      "requested_action": "ship",
      "allowed_states": ["approved"]
    }
  }
}
```

**Estados Válidos:** `pending → approved → in_transit → received`

**Solución:** Verificar el estado actual antes de realizar acciones.

---

### INV-4003: TRANSFER_SAME_WAREHOUSE

**HTTP Status:** `400 Bad Request`

**Descripción:** No se puede transferir entre la misma bodega de origen y destino.

**Solución:** Seleccionar bodegas diferentes para origen y destino.

---

### INV-4004: TRANSFER_INSUFFICIENT_STOCK

**HTTP Status:** `400 Bad Request`

**Descripción:** No hay stock suficiente en la bodega de origen para la transferencia.

**Solución:** Reducir la cantidad o esperar a tener más stock.

---

### INV-4005: TRANSFER_APPROVAL_REQUIRED

**HTTP Status:** `403 Forbidden`

**Descripción:** La transferencia requiere aprobación antes de ser enviada.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-4005",
    "type": "TRANSFER_APPROVAL_REQUIRED",
    "details": {
      "transfer_id": "trans_123",
      "requires_approval": true,
      "approval_threshold": 1000,
      "transfer_value": 1500,
      "approvers": ["manager_role", "inventory_admin"]
    }
  }
}
```

**Solución:** Solicitar aprobación de un usuario con permisos.

---

### INV-4006: TRANSFER_DISCREPANCY_TOO_HIGH

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** La discrepancia entre cantidad enviada y recibida excede el límite permitido.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-4006",
    "type": "TRANSFER_DISCREPANCY_TOO_HIGH",
    "details": {
      "transfer_id": "trans_123",
      "sent_quantity": 100,
      "received_quantity": 85,
      "discrepancy": 15,
      "discrepancy_percentage": 15.0,
      "max_allowed_percentage": 5.0,
      "action_required": "Requiere investigación y aprobación de gerencia"
    }
  }
}
```

**Solución:** Investigar la discrepancia y obtener aprobación para procesar la recepción.

---

### INV-4007: TRANSFER_ALREADY_RECEIVED

**HTTP Status:** `409 Conflict`

**Descripción:** La transferencia ya fue recibida previamente.

**Solución:** Verificar el estado de la transferencia.

---

## Errores de Ajustes (5xxx)

### INV-5001: ADJUSTMENT_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** El ajuste especificado no existe.

**Solución:** Verificar el ID del ajuste.

---

### INV-5002: ADJUSTMENT_APPROVAL_REQUIRED

**HTTP Status:** `403 Forbidden`

**Descripción:** El ajuste requiere aprobación antes de ser aplicado.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-5002",
    "type": "ADJUSTMENT_APPROVAL_REQUIRED",
    "details": {
      "adjustment_id": "adj_123",
      "quantity_change": -50,
      "current_stock": 100,
      "percentage_change": 50.0,
      "approval_threshold": 10.0,
      "requires_approval_from": ["inventory_manager", "admin"]
    }
  }
}
```

**Solución:** Enviar el ajuste para aprobación de un supervisor.

---

### INV-5003: ADJUSTMENT_ALREADY_APPLIED

**HTTP Status:** `409 Conflict`

**Descripción:** El ajuste ya fue aplicado al inventario.

**Solución:** Crear un nuevo ajuste si es necesario realizar otro cambio.

---

### INV-5004: ADJUSTMENT_REJECTED

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** El ajuste fue rechazado y no puede ser aplicado.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-5004",
    "type": "ADJUSTMENT_REJECTED",
    "details": {
      "adjustment_id": "adj_123",
      "rejected_by": "user_manager",
      "rejected_at": "2025-11-23T14:00:00Z",
      "rejection_reason": "Falta evidencia fotográfica del daño"
    }
  }
}
```

**Solución:** Crear un nuevo ajuste con la evidencia requerida.

---

### INV-5005: ADJUSTMENT_EXCESSIVE_CHANGE

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** El ajuste representa un cambio excesivo que requiere mayor nivel de aprobación.

**Solución:** Dividir en múltiples ajustes menores o solicitar aprobación de nivel superior.

---

### INV-5006: ADJUSTMENT_INVALID_REASON

**HTTP Status:** `400 Bad Request`

**Descripción:** Motivo de ajuste no válido o no permitido.

**Motivos Válidos:** `damaged`, `expired`, `lost`, `found`, `audit`, `other`

**Solución:** Usar uno de los motivos permitidos.

---

## Errores de Reservas (6xxx)

### INV-6001: RESERVATION_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** La reserva especificada no existe.

**Solución:** Verificar el ID de la reserva.

---

### INV-6002: RESERVATION_EXPIRED

**HTTP Status:** `410 Gone`

**Descripción:** La reserva ha expirado y fue liberada automáticamente.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-6002",
    "type": "RESERVATION_EXPIRED",
    "details": {
      "reservation_id": "res_123",
      "order_id": "order_456",
      "created_at": "2025-11-23T14:00:00Z",
      "expired_at": "2025-11-23T14:15:00Z",
      "ttl_minutes": 15,
      "stock_released": true
    }
  }
}
```

**Solución:** Crear una nueva reserva si todavía se requiere el stock.

---

### INV-6003: RESERVATION_ALREADY_CONFIRMED

**HTTP Status:** `409 Conflict`

**Descripción:** La reserva ya fue confirmada y no puede ser modificada.

**Solución:** Liberar la reserva existente antes de crear una nueva.

---

### INV-6004: RESERVATION_INSUFFICIENT_STOCK

**HTTP Status:** `400 Bad Request`

**Descripción:** No hay stock suficiente para crear la reserva solicitada.

**Solución:** Reducir la cantidad o seleccionar otra bodega.

---

### INV-6005: RESERVATION_ALREADY_FULFILLED

**HTTP Status:** `409 Conflict`

**Descripción:** La reserva ya fue cumplida (stock descontado).

**Solución:** Verificar el estado de la orden asociada.

---

## Errores de Validación (7xxx)

### INV-7001: VARIANT_NOT_FOUND

**HTTP Status:** `404 Not Found`

**Descripción:** La variante especificada no existe en el Catalog Service.

**Solución:** Verificar que la variante esté creada en el catálogo.

---

### INV-7002: VARIANT_NOT_TRACKED

**HTTP Status:** `422 Unprocessable Entity`

**Descripción:** La variante no tiene tracking de inventario habilitado.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-7002",
    "type": "VARIANT_NOT_TRACKED",
    "details": {
      "variant_id": "var_digital_123",
      "track_inventory": false,
      "product_type": "digital"
    }
  }
}
```

**Solución:** Habilitar tracking de inventario en la variante o no intentar gestionar su stock.

---

### INV-7003: ORGANIZATION_MISMATCH

**HTTP Status:** `403 Forbidden`

**Descripción:** Los recursos pertenecen a diferentes organizaciones.

**Solución:** Asegurar que todos los recursos pertenezcan a la misma organización.

---

### INV-7004: INVALID_DATE_RANGE

**HTTP Status:** `400 Bad Request`

**Descripción:** Rango de fechas inválido (fecha inicial mayor que final).

**Solución:** Proporcionar un rango de fechas válido.

---

### INV-7005: EXPIRY_DATE_IN_PAST

**HTTP Status:** `400 Bad Request`

**Descripción:** Fecha de vencimiento es anterior a la fecha actual.

**Solución:** Proporcionar una fecha de vencimiento futura o registrar como producto vencido.

---

### INV-7006: REQUIRED_FIELD_MISSING

**HTTP Status:** `400 Bad Request`

**Descripción:** Falta un campo requerido en la solicitud.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-7006",
    "type": "REQUIRED_FIELD_MISSING",
    "details": {
      "missing_fields": ["variant_id", "warehouse_id"],
      "provided_fields": ["quantity", "reason"]
    }
  }
}
```

**Solución:** Incluir todos los campos requeridos.

---

## Errores de Permisos (8xxx)

### INV-8001: INSUFFICIENT_PERMISSIONS

**HTTP Status:** `403 Forbidden`

**Descripción:** El usuario no tiene permisos suficientes para realizar la operación.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-8001",
    "type": "INSUFFICIENT_PERMISSIONS",
    "details": {
      "required_permission": "inventory.adjustment.approve",
      "user_permissions": ["inventory.viewer", "inventory.operator"],
      "action": "approve_adjustment"
    }
  }
}
```

**Solución:** Solicitar a un usuario con permisos adecuados o solicitar elevación de privilegios.

---

### INV-8002: WAREHOUSE_ACCESS_DENIED

**HTTP Status:** `403 Forbidden`

**Descripción:** El usuario no tiene acceso a la bodega especificada.

**Solución:** Verificar que el usuario tenga asignado acceso a la bodega.

---

### INV-8003: LOCAL_ACCESS_DENIED

**HTTP Status:** `403 Forbidden`

**Descripción:** El usuario no tiene acceso al local asociado a la operación.

**Solución:** Asignar el local al usuario o usar un local al que tenga acceso.

---

## Errores de Sistema (9xxx)

### INV-9001: DATABASE_ERROR

**HTTP Status:** `500 Internal Server Error`

**Descripción:** Error interno de base de datos.

**Solución:** Reintentar la operación. Si persiste, contactar soporte.

---

### INV-9002: CACHE_ERROR

**HTTP Status:** `500 Internal Server Error`

**Descripción:** Error al acceder al sistema de caché (Redis).

**Solución:** La operación debería funcionar sin caché. Verificar conectividad Redis.

---

### INV-9003: QUEUE_PUBLISH_FAILED

**HTTP Status:** `500 Internal Server Error`

**Descripción:** Error al publicar evento a RabbitMQ.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-9003",
    "type": "QUEUE_PUBLISH_FAILED",
    "details": {
      "event_type": "inventory.stock.updated",
      "queue": "inventory_stock_updates",
      "reason": "Connection refused"
    }
  }
}
```

**Solución:** Verificar conectividad con RabbitMQ. La operación puede haberse completado localmente.

---

### INV-9004: EXTERNAL_SERVICE_UNAVAILABLE

**HTTP Status:** `503 Service Unavailable`

**Descripción:** Servicio externo no disponible (Catalog, Order, etc.).

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-9004",
    "type": "EXTERNAL_SERVICE_UNAVAILABLE",
    "details": {
      "service": "catalog-service",
      "operation": "validate_variant",
      "error": "Connection timeout after 5000ms"
    }
  }
}
```

**Solución:** Reintentar después de unos momentos. Si persiste, verificar estado del servicio externo.

---

### INV-9005: CONCURRENT_MODIFICATION

**HTTP Status:** `409 Conflict`

**Descripción:** El recurso fue modificado por otro proceso simultáneamente.

**Ejemplo:**

```json
{
  "error": {
    "code": "INV-9005",
    "type": "CONCURRENT_MODIFICATION",
    "details": {
      "resource": "stock",
      "stock_id": "stock_456",
      "expected_version": 5,
      "current_version": 6,
      "message": "El stock fue modificado por otra transacción"
    }
  }
}
```

**Solución:** Recargar el recurso y reintentar la operación.

---

## Tabla Resumen de Errores

| Código | Tipo | HTTP | Descripción |
|--------|------|------|-------------|
| **Stock Errors** |
| INV-1001 | INSUFFICIENT_STOCK | 400 | Stock insuficiente |
| INV-1002 | STOCK_NOT_FOUND | 404 | Stock no encontrado |
| INV-1003 | STOCK_BELOW_MINIMUM | 422 | Bajo mínimo configurado |
| INV-1004 | STOCK_EXCEEDS_MAXIMUM | 422 | Excede máximo |
| INV-1005 | STOCK_ALREADY_RESERVED | 409 | Ya está reservado |
| INV-1006 | NEGATIVE_STOCK_NOT_ALLOWED | 422 | Stock negativo no permitido |
| INV-1007 | STOCK_NOT_ZERO_FOR_DELETION | 409 | Stock debe ser cero para eliminar |
| **Movement Errors** |
| INV-2001 | INVALID_MOVEMENT_TYPE | 400 | Tipo de movimiento inválido |
| INV-2002 | MOVEMENT_NOT_FOUND | 404 | Movimiento no encontrado |
| INV-2003 | INVALID_QUANTITY | 400 | Cantidad inválida |
| INV-2004 | LOT_NUMBER_REQUIRED | 400 | Número de lote requerido |
| INV-2005 | SERIAL_NUMBER_REQUIRED | 400 | Número de serie requerido |
| INV-2006 | SERIAL_NUMBER_ALREADY_EXISTS | 409 | Número de serie duplicado |
| INV-2007 | EXPIRED_LOT_CANNOT_BE_USED | 422 | Lote expirado |
| INV-2008 | MOVEMENT_CANNOT_BE_REVERSED | 422 | No se puede revertir |
| INV-2009 | BATCH_MOVEMENT_PARTIAL_FAILURE | 207 | Fallo parcial en lote |
| **Warehouse Errors** |
| INV-3001 | WAREHOUSE_NOT_FOUND | 404 | Bodega no encontrada |
| INV-3002 | WAREHOUSE_INACTIVE | 422 | Bodega inactiva |
| INV-3003 | WAREHOUSE_AT_CAPACITY | 422 | Capacidad máxima alcanzada |
| INV-3004 | WAREHOUSE_CODE_DUPLICATE | 409 | Código duplicado |
| INV-3005 | WAREHOUSE_HAS_STOCK | 409 | Bodega tiene stock |
| INV-3006 | LOCATION_NOT_FOUND | 404 | Ubicación no encontrada |
| INV-3007 | LOCATION_CODE_DUPLICATE | 409 | Código ubicación duplicado |
| INV-3008 | LOCATION_HIERARCHY_INVALID | 400 | Jerarquía inválida |
| **Transfer Errors** |
| INV-4001 | TRANSFER_NOT_FOUND | 404 | Transferencia no encontrada |
| INV-4002 | TRANSFER_INVALID_STATE | 422 | Estado inválido |
| INV-4003 | TRANSFER_SAME_WAREHOUSE | 400 | Misma bodega origen/destino |
| INV-4004 | TRANSFER_INSUFFICIENT_STOCK | 400 | Stock insuficiente para transferir |
| INV-4005 | TRANSFER_APPROVAL_REQUIRED | 403 | Requiere aprobación |
| INV-4006 | TRANSFER_DISCREPANCY_TOO_HIGH | 422 | Discrepancia muy alta |
| INV-4007 | TRANSFER_ALREADY_RECEIVED | 409 | Ya fue recibida |
| **Adjustment Errors** |
| INV-5001 | ADJUSTMENT_NOT_FOUND | 404 | Ajuste no encontrado |
| INV-5002 | ADJUSTMENT_APPROVAL_REQUIRED | 403 | Requiere aprobación |
| INV-5003 | ADJUSTMENT_ALREADY_APPLIED | 409 | Ya fue aplicado |
| INV-5004 | ADJUSTMENT_REJECTED | 422 | Fue rechazado |
| INV-5005 | ADJUSTMENT_EXCESSIVE_CHANGE | 422 | Cambio excesivo |
| INV-5006 | ADJUSTMENT_INVALID_REASON | 400 | Motivo inválido |
| **Reservation Errors** |
| INV-6001 | RESERVATION_NOT_FOUND | 404 | Reserva no encontrada |
| INV-6002 | RESERVATION_EXPIRED | 410 | Reserva expirada |
| INV-6003 | RESERVATION_ALREADY_CONFIRMED | 409 | Ya confirmada |
| INV-6004 | RESERVATION_INSUFFICIENT_STOCK | 400 | Stock insuficiente para reservar |
| INV-6005 | RESERVATION_ALREADY_FULFILLED | 409 | Ya fue cumplida |
| **Validation Errors** |
| INV-7001 | VARIANT_NOT_FOUND | 404 | Variante no encontrada |
| INV-7002 | VARIANT_NOT_TRACKED | 422 | No tiene tracking |
| INV-7003 | ORGANIZATION_MISMATCH | 403 | Organizaciones diferentes |
| INV-7004 | INVALID_DATE_RANGE | 400 | Rango de fechas inválido |
| INV-7005 | EXPIRY_DATE_IN_PAST | 400 | Fecha de vencimiento pasada |
| INV-7006 | REQUIRED_FIELD_MISSING | 400 | Campo requerido faltante |
| **Permission Errors** |
| INV-8001 | INSUFFICIENT_PERMISSIONS | 403 | Permisos insuficientes |
| INV-8002 | WAREHOUSE_ACCESS_DENIED | 403 | Sin acceso a bodega |
| INV-8003 | LOCAL_ACCESS_DENIED | 403 | Sin acceso a local |
| **System Errors** |
| INV-9001 | DATABASE_ERROR | 500 | Error de base de datos |
| INV-9002 | CACHE_ERROR | 500 | Error de caché |
| INV-9003 | QUEUE_PUBLISH_FAILED | 500 | Fallo al publicar evento |
| INV-9004 | EXTERNAL_SERVICE_UNAVAILABLE | 503 | Servicio externo no disponible |
| INV-9005 | CONCURRENT_MODIFICATION | 409 | Modificación concurrente |

**Total:** 52 códigos de error documentados

---

## Próximos Pasos

- [Flujos de Negocio](./flujos-negocio)
- [Arquitectura](./arquitectura)
- [API: Stock](./api-stock)
