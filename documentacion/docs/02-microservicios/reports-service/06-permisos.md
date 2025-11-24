---
sidebar_position: 7
---

# Permisos de Reportes

## Sistema de Permisos

Cada reporte requiere permisos específicos para generación y visualización.

## Estructura de Permisos

```
reports:{category}:{action}
```

**Ejemplos:**
- `reports:sales:view`
- `reports:sales:export`
- `reports:inventory:view`
- `reports:financial:view`

## Permisos por Categoría

### Ventas

| Permiso | Descripción |
|---------|-------------|
| `reports:sales:view` | Ver reportes de ventas |
| `reports:sales:export` | Exportar reportes |
| `reports:sales:all_locals` | Ver ventas de todos los locales |

### Inventario

| Permiso | Descripción |
|---------|-------------|
| `reports:inventory:view` | Ver reportes de inventario |
| `reports:inventory:export` | Exportar reportes |
| `reports:inventory:costs` | Ver costos de productos |

### Clientes

| Permiso | Descripción |
|---------|-------------|
| `reports:customers:view` | Ver reportes de clientes |
| `reports:customers:export` | Exportar reportes |
| `reports:customers:pii` | Ver información personal |

### Financieros

| Permiso | Descripción |
|---------|-------------|
| `reports:financial:view` | Ver reportes financieros |
| `reports:financial:export` | Exportar reportes |
| `reports:financial:confidential` | Ver datos confidenciales |

## Validación de Permisos

```python
@router.post("/reports/generate")
async def generate_report(
    report_request: ReportRequest,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("reports:sales:view"))
):
    # Usuario debe tener el permiso correspondiente
    pass
```

## Filtrado por Local

Usuarios sin permiso `all_locals` solo ven datos de sus locales asignados:

```python
def filter_by_user_locals(
    query: Query,
    user: User
) -> Query:
    if not user.has_permission("reports:sales:all_locals"):
        query = query.filter(
            local_id.in_(user.assigned_locals)
        )
    return query
```

## Roles Recomendados

### Gerente General
- Todos los permisos de reportes
- Puede ver todos los locales

### Gerente de Tienda
- `reports:sales:view`
- `reports:inventory:view`
- Solo su local

### Contador
- `reports:financial:view`
- `reports:financial:confidential`
- Todos los locales

### Cajera
- Sin acceso a reportes (solo POS)

## Próximos Pasos

- [Configuración](./07-configuracion.md)
- [API Reports](./03-api-reports.md)
