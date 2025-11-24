---
sidebar_position: 6
---

# Tipos de Reportes

## Reportes de Ventas

### 1. Ventas por Período

**Descripción:** Total de ventas agrupado por día/semana/mes

**Filtros:**
- Rango de fechas
- Local
- Método de pago
- Categoría de productos

**Ejemplo:**

```json
{
  "report_type": "sales_by_period",
  "data": [
    {
      "period": "2025-11-01",
      "total_sales": 5000.00,
      "transactions_count": 45,
      "average_ticket": 111.11
    }
  ]
}
```

### 2. Productos Más Vendidos

**Descripción:** Top N productos por cantidad o valor

**Ejemplo:**

```json
{
  "report_type": "top_products",
  "data": [
    {
      "rank": 1,
      "product_name": "Coca Cola 2L",
      "quantity_sold": 500,
      "total_sales": 1250.00
    }
  ]
}
```

### 3. Ventas por Cajera/Vendedor

**Descripción:** Performance individual de cajeras

**Ejemplo:**

```json
{
  "report_type": "sales_by_cashier",
  "data": [
    {
      "cashier_name": "María García",
      "transactions_count": 120,
      "total_sales": 15000.00,
      "average_ticket": 125.00
    }
  ]
}
```

## Reportes de Inventario

### 1. Stock Actual

**Descripción:** Snapshot del inventario actual

**Filtros:**
- Local
- Categoría
- Stock mínimo/máximo

**Ejemplo:**

```json
{
  "report_type": "current_stock",
  "data": [
    {
      "product_name": "Coca Cola 2L",
      "sku": "PROD-001",
      "quantity": 150,
      "value": 3750.00,
      "status": "healthy"
    }
  ]
}
```

### 2. Movimientos de Inventario

**Descripción:** Historial de entradas/salidas

**Ejemplo:**

```json
{
  "report_type": "inventory_movements",
  "data": [
    {
      "date": "2025-11-24",
      "movement_type": "sale",
      "variant_id": "var_789",
      "quantity": -5,
      "reference": "order_123"
    }
  ]
}
```

### 3. Rotación de Inventario

**Descripción:** Velocidad de rotación por producto

**Ejemplo:**

```json
{
  "report_type": "inventory_turnover",
  "data": [
    {
      "product_name": "Coca Cola 2L",
      "turnover_rate": 8.5,
      "days_on_hand": 43,
      "status": "fast_moving"
    }
  ]
}
```

## Reportes de Clientes

### 1. Clientes por Segmento

**Descripción:** Distribución de clientes por RFM

**Ejemplo:**

```json
{
  "report_type": "customers_by_segment",
  "data": [
    {
      "segment": "champions",
      "customers_count": 50,
      "total_sales": 75000.00,
      "percentage": 10
    }
  ]
}
```

### 2. Top Clientes

**Descripción:** Mejores clientes por ventas

**Ejemplo:**

```json
{
  "report_type": "top_customers",
  "data": [
    {
      "rank": 1,
      "customer_name": "Juan Pérez",
      "total_purchases": 5000.00,
      "orders_count": 25,
      "loyalty_tier": "gold"
    }
  ]
}
```

## Reportes Financieros

### 1. Cuentas por Cobrar

**Descripción:** Créditos pendientes de cobro

**Ejemplo:**

```json
{
  "report_type": "accounts_receivable",
  "data": [
    {
      "customer_name": "Constructora ABC",
      "total_due": 5000.00,
      "overdue_amount": 1000.00,
      "days_overdue": 15
    }
  ],
  "summary": {
    "total_receivable": 50000.00,
    "total_overdue": 10000.00
  }
}
```

### 2. Rentabilidad por Producto

**Descripción:** Margen de ganancia por producto

**Ejemplo:**

```json
{
  "report_type": "product_profitability",
  "data": [
    {
      "product_name": "Coca Cola 2L",
      "total_sales": 10000.00,
      "total_cost": 6000.00,
      "gross_profit": 4000.00,
      "margin_percentage": 40.0
    }
  ]
}
```

## Próximos Pasos

- [Permisos](./06-permisos.md)
- [Configuración](./07-configuracion.md)
