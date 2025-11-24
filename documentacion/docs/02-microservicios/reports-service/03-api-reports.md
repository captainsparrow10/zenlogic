---
sidebar_position: 4
---

# API de Reportes

```http
POST   /api/v1/reports/generate
GET    /api/v1/reports/templates
GET    /api/v1/reports/executions
POST   /api/v1/reports/schedule
GET    /api/v1/reports/{executionId}/download
```

## Generar Reporte

```http
POST /api/v1/reports/generate
```

**Request:**

```json
{
  "report_type": "sales",
  "filters": {
    "date_from": "2025-11-01",
    "date_to": "2025-11-30",
    "local_id": "local_101"
  },
  "format": "json",
  "group_by": "day"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "report_type": "sales",
    "generated_at": "2025-11-24T10:00:00Z",
    "filters_applied": {
      "date_from": "2025-11-01",
      "date_to": "2025-11-30"
    },
    "summary": {
      "total_sales": 150000.00,
      "total_transactions": 1250,
      "average_ticket": 120.00
    },
    "data": [
      {
        "date": "2025-11-01",
        "sales": 5000.00,
        "transactions": 45
      }
    ]
  }
}
```

## Reporte de Ventas (PDF)

```http
POST /api/v1/reports/generate
```

**Request:**

```json
{
  "report_type": "sales",
  "filters": {
    "date_from": "2025-11-01",
    "date_to": "2025-11-30"
  },
  "format": "pdf"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "execution_id": "exec_001",
    "status": "completed",
    "file_url": "https://storage.zenlogic.com/reports/exec_001.pdf",
    "file_size_bytes": 524288,
    "expires_at": "2025-11-25T10:00:00Z"
  }
}
```

## Programar Reporte

```http
POST /api/v1/reports/schedule
```

**Request:**

```json
{
  "name": "Reporte de Ventas Semanal",
  "template_id": "tmpl_sales_001",
  "cron_expression": "0 8 * * 1",
  "format": "pdf",
  "recipients": [
    {
      "email": "gerente@example.com",
      "name": "Gerente General"
    }
  ],
  "filters": {
    "date_from": "last_week",
    "date_to": "today"
  }
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "schedule_id": "sched_001",
    "name": "Reporte de Ventas Semanal",
    "cron_expression": "0 8 * * 1",
    "next_execution_at": "2025-11-25T08:00:00Z",
    "is_active": true
  }
}
```

## Listar Templates

```http
GET /api/v1/reports/templates?category=sales
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "templates": [
      {
        "template_id": "tmpl_001",
        "name": "Ventas Diarias",
        "report_type": "sales",
        "description": "Reporte de ventas agrupado por día",
        "permissions_required": ["reports:sales:view"]
      }
    ]
  }
}
```

## Próximos Pasos

- [Eventos Consumidos](./04-eventos-consumidos.md)
- [Tipos de Reportes](./05-tipos-reportes.md)
