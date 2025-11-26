---
sidebar_position: 8
---

# API Gateway con Envoy

Documentación del API Gateway usando Envoy Proxy para enrutar tráfico externo hacia los microservicios.

## Arquitectura

```
                                    ┌─────────────────┐
                                    │   Frontend      │
                                    │  (Web/Mobile)   │
                                    └────────┬────────┘
                                             │
                                             │ HTTPS
                                             ▼
                                    ┌─────────────────┐
                                    │  Envoy Proxy    │
                                    │  (API Gateway)  │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
           ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
           │ Auth Service  │       │Catalog Service│       │  POS Service  │
           │   (REST)      │       │   (REST)      │       │   (REST)      │
           │   :8001       │       │   :8002       │       │   :8004       │
           └───────────────┘       └───────────────┘       └───────────────┘
```

## Por qué Envoy

| Característica | Envoy | Kong | Nginx |
|---------------|-------|------|-------|
| Performance | Muy Alta | Alta | Alta |
| Config dinámica | Hot reload | DB | Reload |
| gRPC nativo | Sí | Plugin | Limitado |
| Observabilidad | Built-in | Plugin | Plugin |
| Service mesh ready | Sí | No | No |
| Complejidad | Media | Alta | Baja |

**Elegimos Envoy por**:
- Soporte nativo de gRPC y HTTP/2
- Hot reload de configuración
- Métricas Prometheus integradas
- Futuro path a service mesh (Istio)

## Configuración de Envoy

### envoy.yaml Base

```yaml
# envoy/envoy.yaml
admin:
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901

static_resources:
  listeners:
    - name: http_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                access_log:
                  - name: envoy.access_loggers.stdout
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.access_loggers.stream.v3.StdoutAccessLog
                http_filters:
                  - name: envoy.filters.http.cors
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.cors.v3.Cors
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: backend
                      domains: ["*"]
                      cors:
                        allow_origin_string_match:
                          - prefix: "*"
                        allow_methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
                        allow_headers: "*"
                        max_age: "1728000"
                      routes:
                        # Auth Service
                        - match:
                            prefix: "/api/v1/auth"
                          route:
                            cluster: auth_service
                            timeout: 10s
                            retry_policy:
                              retry_on: 5xx
                              num_retries: 2

                        # Users, Roles, Permissions
                        - match:
                            prefix: "/api/v1/users"
                          route:
                            cluster: auth_service
                        - match:
                            prefix: "/api/v1/roles"
                          route:
                            cluster: auth_service
                        - match:
                            prefix: "/api/v1/organizations"
                          route:
                            cluster: auth_service
                        - match:
                            prefix: "/api/v1/locals"
                          route:
                            cluster: auth_service

                        # Catalog Service
                        - match:
                            prefix: "/api/v1/products"
                          route:
                            cluster: catalog_service
                        - match:
                            prefix: "/api/v1/variants"
                          route:
                            cluster: catalog_service
                        - match:
                            prefix: "/api/v1/categories"
                          route:
                            cluster: catalog_service
                        - match:
                            prefix: "/api/v1/brands"
                          route:
                            cluster: catalog_service

                        # Inventory Service
                        - match:
                            prefix: "/api/v1/stock"
                          route:
                            cluster: inventory_service
                        - match:
                            prefix: "/api/v1/warehouses"
                          route:
                            cluster: inventory_service
                        - match:
                            prefix: "/api/v1/movements"
                          route:
                            cluster: inventory_service
                        - match:
                            prefix: "/api/v1/transfers"
                          route:
                            cluster: inventory_service

                        # POS Service
                        - match:
                            prefix: "/api/v1/transactions"
                          route:
                            cluster: pos_service
                        - match:
                            prefix: "/api/v1/receipts"
                          route:
                            cluster: pos_service

                        # Order Service
                        - match:
                            prefix: "/api/v1/orders"
                          route:
                            cluster: order_service

                        # Pricing Service
                        - match:
                            prefix: "/api/v1/prices"
                          route:
                            cluster: pricing_service
                        - match:
                            prefix: "/api/v1/discounts"
                          route:
                            cluster: pricing_service

                        # Audit Service (read-only)
                        - match:
                            prefix: "/api/v1/audit"
                          route:
                            cluster: audit_service

  clusters:
    - name: auth_service
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: auth_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: auth-service
                      port_value: 8001
      health_checks:
        - timeout: 5s
          interval: 10s
          unhealthy_threshold: 3
          healthy_threshold: 2
          http_health_check:
            path: /health

    - name: catalog_service
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: catalog_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: catalog-service
                      port_value: 8002
      health_checks:
        - timeout: 5s
          interval: 10s
          http_health_check:
            path: /health

    - name: inventory_service
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: inventory_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: inventory-service
                      port_value: 8003
      health_checks:
        - timeout: 5s
          interval: 10s
          http_health_check:
            path: /health

    - name: pos_service
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: pos_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: pos-service
                      port_value: 8004
      health_checks:
        - timeout: 5s
          interval: 10s
          http_health_check:
            path: /health

    - name: order_service
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: order_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: order-service
                      port_value: 8005
      health_checks:
        - timeout: 5s
          interval: 10s
          http_health_check:
            path: /health

    - name: pricing_service
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: pricing_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: pricing-service
                      port_value: 8006
      health_checks:
        - timeout: 5s
          interval: 10s
          http_health_check:
            path: /health

    - name: audit_service
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: audit_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: audit-service
                      port_value: 8007
      health_checks:
        - timeout: 5s
          interval: 10s
          http_health_check:
            path: /health
```

## Rate Limiting

```yaml
# Agregar rate limiting local
http_filters:
  - name: envoy.filters.http.local_ratelimit
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
      stat_prefix: http_local_rate_limiter
      token_bucket:
        max_tokens: 100
        tokens_per_fill: 100
        fill_interval: 1s
      filter_enabled:
        runtime_key: local_rate_limit_enabled
        default_value:
          numerator: 100
          denominator: HUNDRED
      filter_enforced:
        runtime_key: local_rate_limit_enforced
        default_value:
          numerator: 100
          denominator: HUNDRED
```

## JWT Validation en Gateway

```yaml
# Validación JWT en Envoy
http_filters:
  - name: envoy.filters.http.jwt_authn
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.jwt_authn.v3.JwtAuthentication
      providers:
        auth_service:
          issuer: zenlogic-erp
          audiences:
            - zenlogic-api
          local_jwks:
            filename: /etc/envoy/jwks.json
          from_headers:
            - name: Authorization
              value_prefix: "Bearer "
      rules:
        - match:
            prefix: /api/v1/
          requires:
            provider_name: auth_service
        # Rutas públicas (sin JWT)
        - match:
            prefix: /api/v1/auth/login
        - match:
            prefix: /api/v1/auth/register
        - match:
            prefix: /health
```

## Headers Propagation

```yaml
# Propagar headers de tenant
route:
  cluster: catalog_service
  request_headers_to_add:
    - header:
        key: X-Request-ID
        value: "%REQ(X-REQUEST-ID)%"
    - header:
        key: X-Forwarded-For
        value: "%DOWNSTREAM_REMOTE_ADDRESS_WITHOUT_PORT%"
```

## Docker Compose

```yaml
# docker-compose.yml
services:
  envoy:
    image: envoyproxy/envoy:v1.28-latest
    ports:
      - "8080:8080"   # API Gateway
      - "9901:9901"   # Admin interface
    volumes:
      - ./envoy/envoy.yaml:/etc/envoy/envoy.yaml:ro
      - ./envoy/jwks.json:/etc/envoy/jwks.json:ro
    command: /usr/local/bin/envoy -c /etc/envoy/envoy.yaml
    depends_on:
      - auth-service
      - catalog-service
      - inventory-service
    networks:
      - erp-network

networks:
  erp-network:
    driver: bridge
```

## gRPC Interno vs REST Externo

### Flujo de Comunicación

```
┌──────────┐     REST/HTTP     ┌─────────────┐     gRPC      ┌──────────────┐
│ Frontend │ ────────────────► │   Envoy     │ ◄───────────► │ Auth Service │
│          │                   │  Gateway    │               │  (internal)  │
└──────────┘                   └──────┬──────┘               └──────────────┘
                                      │
                                      │ REST/HTTP
                                      ▼
                               ┌──────────────┐     gRPC      ┌──────────────┐
                               │   Catalog    │ ─────────────► │ Auth Service │
                               │   Service    │               │  (validate)  │
                               └──────────────┘               └──────────────┘
```

### Reglas de Comunicación

| Desde | Hacia | Protocolo | Puerto |
|-------|-------|-----------|--------|
| Frontend | Envoy Gateway | REST/HTTPS | 443 |
| Envoy | Microservicios | REST/HTTP | 800X |
| Microservicio | Auth Service | gRPC | 50051 |
| Microservicio | Catalog Service | gRPC | 50052 |
| Microservicio | Inventory Service | gRPC | 50053 |

### Ejemplo: Catalog validando con Auth via gRPC

```python
# catalog-service/app/clients/auth_grpc_client.py
import grpc
from app.protos import auth_pb2, auth_pb2_grpc

class AuthGrpcClient:
    def __init__(self):
        # Conexión interna al servicio Auth
        self.channel = grpc.aio.insecure_channel('auth-service:50051')
        self.stub = auth_pb2_grpc.AuthServiceStub(self.channel)

    async def validate_token(self, token: str) -> dict:
        """Validar token JWT via gRPC."""
        request = auth_pb2.VerifyTokenRequest(token=token)
        response = await self.stub.VerifyToken(request, timeout=2.0)

        return {
            "user_id": response.user_id,
            "organization_id": response.organization_id,
            "permissions": list(response.permissions)
        }

    async def validate_local_access(
        self,
        user_id: str,
        org_id: str,
        local_id: str
    ) -> bool:
        """Validar si usuario tiene acceso a local."""
        request = auth_pb2.ValidateLocalRequest(
            user_id=user_id,
            organization_id=org_id,
            local_id=local_id
        )
        response = await self.stub.ValidateLocal(request, timeout=2.0)
        return response.is_valid
```

## Métricas y Observabilidad

### Prometheus Metrics

Envoy expone métricas en `:9901/stats/prometheus`:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'envoy'
    metrics_path: /stats/prometheus
    static_configs:
      - targets: ['envoy:9901']
```

### Métricas Importantes

| Métrica | Descripción |
|---------|-------------|
| `envoy_cluster_upstream_rq_total` | Total de requests por cluster |
| `envoy_cluster_upstream_rq_time` | Latencia de requests |
| `envoy_cluster_upstream_cx_total` | Conexiones totales |
| `envoy_cluster_health_check_success` | Health checks exitosos |
| `envoy_http_downstream_rq_total` | Requests recibidos |

### Dashboard Grafana

```json
{
  "panels": [
    {
      "title": "Requests por Servicio",
      "targets": [
        {
          "expr": "sum(rate(envoy_cluster_upstream_rq_total[5m])) by (envoy_cluster_name)"
        }
      ]
    },
    {
      "title": "Latencia P99",
      "targets": [
        {
          "expr": "histogram_quantile(0.99, sum(rate(envoy_cluster_upstream_rq_time_bucket[5m])) by (le, envoy_cluster_name))"
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Ver logs de Envoy

```bash
# En docker
docker logs envoy -f

# Logs de acceso
docker exec envoy cat /dev/stdout
```

### Admin Interface

```bash
# Stats
curl http://localhost:9901/stats

# Clusters
curl http://localhost:9901/clusters

# Config dump
curl http://localhost:9901/config_dump

# Health check
curl http://localhost:9901/ready
```

### Debugging rutas

```bash
# Test routing
curl -v http://localhost:8080/api/v1/products

# Con headers
curl -H "Authorization: Bearer <token>" \
     -H "X-Organization-ID: org_123" \
     http://localhost:8080/api/v1/products
```

## Catálogo de Endpoints por Servicio

### Leyenda de Estado

| Estado | Significado |
|--------|-------------|
| **Core** | Endpoint crítico, usado en flujos principales |
| **Soporte** | Endpoint de apoyo, usado ocasionalmente |
| **Admin** | Endpoint administrativo, uso interno |
| **Futuro** | Planificado pero no implementado |

### Auth Service (`/api/v1/auth`, `/api/v1/users`, etc.)

| Endpoint | Método | Estado | Flujo Principal |
|----------|--------|--------|-----------------|
| `/auth/login` | POST | Core | Login |
| `/auth/logout` | POST | Core | Logout |
| `/auth/refresh` | POST | Core | Refresh token |
| `/auth/me` | GET | Core | Info usuario actual |
| `/users` | GET | Admin | Listar usuarios |
| `/users` | POST | Admin | Crear usuario |
| `/users/{id}` | GET | Soporte | Obtener usuario |
| `/users/{id}` | PATCH | Admin | Actualizar usuario |
| `/users/{id}` | DELETE | Admin | Eliminar usuario |
| `/roles` | GET | Admin | Listar roles |
| `/roles` | POST | Admin | Crear rol |
| `/organizations` | GET | Admin | Listar organizaciones |
| `/organizations/{id}` | GET | Soporte | Info organización |
| `/locals` | GET | Soporte | Listar locales |
| `/locals` | POST | Admin | Crear local |

### Catalog Service (`/api/v1/products`, `/api/v1/variants`, etc.)

| Endpoint | Método | Estado | Flujo Principal |
|----------|--------|--------|-----------------|
| `/products` | GET | Core | Listar productos |
| `/products` | POST | Core | Crear producto |
| `/products/{id}` | GET | Core | Obtener producto |
| `/products/{id}` | PATCH | Core | Actualizar producto |
| `/products/{id}` | DELETE | Soporte | Eliminar producto |
| `/variants` | GET | Core | Listar variantes |
| `/variants` | POST | Core | Crear variante |
| `/variants/{id}` | GET | Core | Obtener variante |
| `/variants/by-sku/{sku}` | GET | Core | Buscar por SKU |
| `/variants/by-barcode/{barcode}` | GET | Core | Buscar por código de barras |
| `/categories` | GET | Core | Listar categorías |
| `/categories` | POST | Admin | Crear categoría |
| `/brands` | GET | Soporte | Listar marcas |

### Inventory Service (`/api/v1/stock`, `/api/v1/warehouses`, etc.)

| Endpoint | Método | Estado | Flujo Principal |
|----------|--------|--------|-----------------|
| `/stock` | GET | Core | Consultar stock |
| `/stock/{variantId}` | GET | Core | Stock de variante |
| `/stock/check` | POST | Core | Verificar disponibilidad |
| `/warehouses` | GET | Core | Listar almacenes |
| `/warehouses` | POST | Admin | Crear almacén |
| `/warehouses/{id}` | GET | Soporte | Info almacén |
| `/movements` | GET | Soporte | Listar movimientos |
| `/movements` | POST | Core | Registrar movimiento |
| `/transfers` | GET | Soporte | Listar transferencias |
| `/transfers` | POST | Admin | Crear transferencia |
| `/transfers/{id}/approve` | POST | Admin | Aprobar transferencia |
| `/transfers/{id}/receive` | POST | Admin | Recibir transferencia |
| `/adjustments` | GET | Soporte | Listar ajustes |
| `/adjustments` | POST | Admin | Crear ajuste |

### POS Service (`/api/v1/pos/*`)

| Endpoint | Método | Estado | Flujo Principal |
|----------|--------|--------|-----------------|
| `/pos/transactions` | POST | Core | Crear transacción |
| `/pos/transactions/{id}` | GET | Core | Obtener transacción |
| `/pos/transactions/{id}/items` | POST | Core | Agregar item |
| `/pos/transactions/{id}/items/{itemId}` | DELETE | Core | Eliminar item |
| `/pos/transactions/{id}/complete` | POST | Core | Completar venta |
| `/pos/transactions/{id}/void` | POST | Soporte | Anular transacción |
| `/pos/returns` | POST | Soporte | Procesar devolución |
| `/pos/drawers/open` | POST | Core | Abrir caja |
| `/pos/drawers/close` | POST | Core | Cerrar caja |
| `/pos/drawers/current` | GET | Core | Caja actual |
| `/pos/drawers/{id}` | GET | Soporte | Info de caja |
| `/pos/drawers/{id}/movements` | POST | Soporte | Movimiento de caja |

### Order Service (`/api/v1/orders`)

| Endpoint | Método | Estado | Flujo Principal |
|----------|--------|--------|-----------------|
| `/orders` | POST | Core | Crear orden |
| `/orders` | GET | Core | Listar órdenes |
| `/orders/{id}` | GET | Core | Obtener orden |
| `/orders/{id}/cancel` | POST | Core | Cancelar orden |
| `/orders/{id}/timeline` | GET | Soporte | Timeline de orden |
| `/orders/from-cart` | POST | Core | Orden desde carrito |
| `/orders/credit/pending` | GET | Soporte | Créditos pendientes |
| `/credit-payments` | POST | Soporte | Pagar crédito |

### Pricing Service (`/api/v1/pricing/*`)

| Endpoint | Método | Estado | Flujo Principal |
|----------|--------|--------|-----------------|
| `/pricing/price` | GET | Core | Obtener precio |
| `/pricing/prices/batch` | POST | Core | Precios en lote |
| `/pricing/promotions` | GET | Soporte | Listar promociones |
| `/pricing/promotions` | POST | Admin | Crear promoción |
| `/pricing/promotions/{id}` | GET | Soporte | Info promoción |
| `/pricing/promotions/{id}/activate` | POST | Admin | Activar promoción |
| `/pricing/loyalty/points` | GET | Core | Saldo de puntos |
| `/pricing/loyalty/redeem` | POST | Core | Canjear puntos |

### Customer Service (`/api/v1/customers`)

| Endpoint | Método | Estado | Flujo Principal |
|----------|--------|--------|-----------------|
| `/customers` | GET | Core | Listar clientes |
| `/customers` | POST | Core | Crear cliente |
| `/customers/{id}` | GET | Core | Obtener cliente |
| `/customers/{id}` | PATCH | Soporte | Actualizar cliente |
| `/customers/{id}/credit-summary` | GET | Soporte | Resumen de crédito |
| `/customers/search` | GET | Core | Buscar cliente |
| `/customers/{id}/addresses` | GET | Soporte | Direcciones |

### Audit Service (`/api/v1/audit`)

| Endpoint | Método | Estado | Flujo Principal |
|----------|--------|--------|-----------------|
| `/audit/logs` | GET | Admin | Listar logs |
| `/audit/logs/{eventId}` | GET | Admin | Detalle de log |
| `/audit/integrity/{orgId}` | GET | Admin | Verificar integridad |
| `/audit/verify/{eventId}` | GET | Admin | Verificar evento |

### Resumen de Endpoints

| Servicio | Core | Soporte | Admin | Total |
|----------|------|---------|-------|-------|
| Auth | 4 | 3 | 8 | 15 |
| Catalog | 10 | 2 | 2 | 14 |
| Inventory | 5 | 5 | 5 | 15 |
| POS | 8 | 4 | 0 | 12 |
| Order | 5 | 3 | 0 | 8 |
| Pricing | 4 | 3 | 2 | 9 |
| Customer | 4 | 3 | 0 | 7 |
| Audit | 0 | 0 | 4 | 4 |
| **TOTAL** | **40** | **23** | **21** | **84** |

## Seguridad

### HTTPS/TLS Termination

```yaml
# Para producción, agregar TLS termination
listeners:
  - name: https_listener
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 443
    filter_chains:
      - filters:
          - name: envoy.filters.network.http_connection_manager
            # ... same as http_listener
        transport_socket:
          name: envoy.transport_sockets.tls
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
            common_tls_context:
              tls_certificates:
                - certificate_chain:
                    filename: /etc/envoy/certs/fullchain.pem
                  private_key:
                    filename: /etc/envoy/certs/privkey.pem
```

### Headers de Seguridad

```yaml
# Security headers
response_headers_to_add:
  - header:
      key: "X-Content-Type-Options"
      value: "nosniff"
  - header:
      key: "X-Frame-Options"
      value: "DENY"
  - header:
      key: "X-XSS-Protection"
      value: "1; mode=block"
  - header:
      key: "Strict-Transport-Security"
      value: "max-age=31536000; includeSubDomains"
```

### IP Whitelisting (Admin)

```yaml
# Restringir acceso a endpoints admin
- match:
    prefix: "/api/v1/admin"
  route:
    cluster: admin_service
  typed_per_filter_config:
    envoy.filters.http.rbac:
      "@type": type.googleapis.com/envoy.extensions.filters.http.rbac.v3.RBACPerRoute
      rbac:
        rules:
          action: ALLOW
          policies:
            allow_internal:
              permissions:
                - any: true
              principals:
                - remote_ip:
                    address_prefix: 10.0.0.0
                    prefix_len: 8
```

## Escalabilidad

### Múltiples Réplicas

```yaml
# docker-compose.prod.yml
services:
  envoy:
    image: envoyproxy/envoy:v1.28-latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
      update_config:
        parallelism: 1
        delay: 10s
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9901/ready"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Load Balancing Externo

```yaml
# Nginx como load balancer externo a Envoy
upstream envoy_gateways {
    least_conn;
    server envoy1:8080 weight=3;
    server envoy2:8080 weight=3;
    server envoy3:8080 weight=3;
}

server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://envoy_gateways;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Circuit Breaker en Envoy

```yaml
# Configuración de circuit breaker por cluster
clusters:
  - name: catalog_service
    circuit_breakers:
      thresholds:
        - priority: DEFAULT
          max_connections: 100
          max_pending_requests: 100
          max_requests: 1000
          max_retries: 3
        - priority: HIGH
          max_connections: 200
          max_pending_requests: 200
          max_requests: 2000
          max_retries: 5
    outlier_detection:
      consecutive_5xx: 5
      interval: 10s
      base_ejection_time: 30s
      max_ejection_percent: 50
```

## Logging Avanzado

```yaml
# Access log format personalizado
access_log:
  - name: envoy.access_loggers.file
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
      path: /var/log/envoy/access.log
      log_format:
        json_format:
          timestamp: "%START_TIME%"
          method: "%REQ(:METHOD)%"
          path: "%REQ(X-ENVOY-ORIGINAL-PATH?:PATH)%"
          response_code: "%RESPONSE_CODE%"
          response_flags: "%RESPONSE_FLAGS%"
          duration: "%DURATION%"
          upstream_service_time: "%RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)%"
          upstream_cluster: "%UPSTREAM_CLUSTER%"
          request_id: "%REQ(X-REQUEST-ID)%"
          organization_id: "%REQ(X-ORGANIZATION-ID)%"
          user_agent: "%REQ(USER-AGENT)%"
          client_ip: "%DOWNSTREAM_REMOTE_ADDRESS_WITHOUT_PORT%"
```

## Próximos Pasos

- [Comunicación entre Microservicios](./comunicacion-microservicios)
- [gRPC - Comunicación Interna](/integraciones/grpc)
- [GraphQL Gateway](./graphql-gateway)
