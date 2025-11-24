---
sidebar_position: 12
---

# API Options

Endpoints REST para gestión de opciones de productos (Color, Talla, etc.).

## Base URL

```
GET    /api/v1/options
POST   /api/v1/options
GET    /api/v1/options/{id}
PUT    /api/v1/options/{id}
DELETE /api/v1/options/{id}
```

## Listar Opciones

### `GET /api/v1/options`

**Response 200 OK**:
```json
{
  "data": [
    {
      "id": "option-uuid",
      "organization_id": "org-uuid",
      "name": "Talla",
      "values": ["XS", "S", "M", "L", "XL"],
      "created_at": "2025-11-23T14:00:00Z"
    }
  ]
}
```

## Crear Opción

### `POST /api/v1/options`

**Request Body**:
```json
{
  "name": "Color",
  "values": ["Rojo", "Azul", "Verde", "Negro"]
}
```

**Response 201 Created**: Opción creada

## Próximos Pasos

- [API Products](/microservicios/catalog-service/api-products)
- [Modelo de Datos](/microservicios/catalog-service/modelo-datos)
