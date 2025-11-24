---
sidebar_position: 5
---

# Troubleshooting

Guía de resolución de problemas comunes en zenLogic.

## Database Issues

### Error: Connection Refused

**Síntoma**: `sqlalchemy.exc.OperationalError: connection refused`

**Causas**:
- PostgreSQL no está corriendo
- URL de conexión incorrecta
- Firewall bloqueando puerto

**Solución**:
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs
docker-compose logs postgres

# Verificar conexión manualmente
psql -h localhost -U erp_user -d auth_db

# Reiniciar
docker-compose restart postgres
```

### Error: Too Many Connections

**Síntoma**: `FATAL: sorry, too many clients already`

**Causa**: Connection pool agotado

**Solución**:
```python
# Reducir pool_size en database.py
engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,  # Reducir de 20
    max_overflow=5  # Reducir de 10
)
```

```sql
-- Ver conexiones activas
SELECT count(*) FROM pg_stat_activity;

-- Matar conexiones idle
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_changed < NOW() - INTERVAL '10 minutes';
```

## RabbitMQ Issues

### Error: Messages Not Consumed

**Síntoma**: Mensajes en queue pero no se procesan

**Causas**:
- Consumer no está corriendo
- Routing key incorrecto
- Excepción en handler

**Solución**:
```bash
# Ver queues
curl -u admin:admin123 http://localhost:15672/api/queues

# Ver consumers
curl -u admin:admin123 http://localhost:15672/api/consumers

# Purgar queue si es necesario
curl -u admin:admin123 -X DELETE \
  http://localhost:15672/api/queues/%2F/catalog.events/contents
```

```python
# Verificar handler está registrado
event_handlers = {
    "auth.user.created": handle_user_created,  # ✅
    # "auth.user.updated": handle_user_updated,  # ❌ Falta
}
```

### Error: Memory Alarm

**Síntoma**: `{resource_limit_alarm,disk,node}`

**Solución**:
```bash
# Ver alarmas
rabbitmqctl status

# Liberar memoria
rabbitmqctl set_vm_memory_high_watermark 0.6

# Purgar dead letter queue
rabbitmqctl purge_queue dlq.events
```

## Redis Issues

### Error: Connection Timeout

**Síntoma**: `redis.exceptions.TimeoutError`

**Solución**:
```python
# Aumentar timeout
redis = aioredis.from_url(
    REDIS_URL,
    socket_timeout=10.0,  # Aumentar de 5s
    socket_connect_timeout=10.0
)
```

### Error: Out of Memory

**Síntoma**: `OOM command not allowed`

**Solución**:
```bash
# Ver memoria usada
redis-cli INFO memory

# Ver claves más grandes
redis-cli --bigkeys

# Configurar eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Limpiar claves expiradas
redis-cli --scan --pattern "session:*" | xargs redis-cli DEL
```

## gRPC Issues

### Error: Deadline Exceeded

**Síntoma**: `grpc.RpcError: Deadline Exceeded`

**Solución**:
```python
# Aumentar timeout
response = await stub.ValidateLocal(
    request,
    timeout=10.0  # Aumentar de 5s
)
```

### Error: Connection Refused

**Síntoma**: `grpc._channel._InactiveRpcError`

**Causas**:
- gRPC server no está corriendo
- Puerto incorrecto
- Firewall

**Solución**:
```bash
# Verificar puerto
netstat -an | grep 50051

# Ver si proceso está corriendo
ps aux | grep uvicorn

# Test conexión
grpcurl -plaintext localhost:50051 list
```

## Performance Issues

### Slow Queries

**Síntoma**: Requests lentos (mayor a 1s)

**Solución**:
```sql
-- Ver queries lentos
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- >1s
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Verificar índices
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;  -- Índices no usados
```

```python
# Añadir índices faltantes
CREATE INDEX idx_products_org_sku ON products(organization_id, sku);
```

### High Memory Usage

**Solución**:
```bash
# Ver uso de memoria
docker stats

# Limitar memoria de container
docker-compose.yml:
  services:
    auth-service:
      deploy:
        resources:
          limits:
            memory: 512M
```

## JWT Issues

### Error: Invalid Token

**Síntoma**: `401 Unauthorized: Invalid token`

**Causas**:
- Token expirado
- Clave pública/privada incorrecta
- Token mal formado

**Solución**:
```python
# Verificar token manualmente
import jwt
decoded = jwt.decode(token, public_key, algorithms=["RS256"])
print(decoded)  # Ver claims
```

```bash
# Regenerar claves RSA
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

## Multi-tenancy Issues

### Error: RLS Blocks All Data

**Síntoma**: Queries no retornan nada

**Causa**: `app.current_tenant` no configurado

**Solución**:
```python
# Verificar tenant está configurado
@app.middleware("http")
async def tenant_middleware(request: Request, call_next):
    # Extraer org_id del JWT
    org_id = request.state.user.get("organization_id")

    if not org_id:
        raise HTTPException(400, "Missing organization_id")

    # Configurar en DB session
    async with get_db() as db:
        await db.execute(
            text("SET LOCAL app.current_tenant = :tid"),
            {"tid": org_id}
        )

    response = await call_next(request)
    return response
```

## Docker Issues

### Error: Port Already in Use

**Síntoma**: `bind: address already in use`

**Solución**:
```bash
# Ver qué proceso usa el puerto
lsof -i :8001

# Matar proceso
kill -9 <PID>

# O cambiar puerto en docker-compose.yml
ports:
  - "8011:8001"  # Usar puerto diferente
```

### Error: Out of Disk Space

**Solución**:
```bash
# Limpiar containers parados
docker container prune

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar volúmenes
docker volume prune

# Ver uso de espacio
docker system df
```

## Alembic Migration Issues

### Error: Target Database Not Up to Date

**Solución**:
```bash
# Ver estado actual
alembic current

# Ver historial
alembic history

# Forzar upgrade
alembic upgrade head

# Si falla, rollback y reintentar
alembic downgrade -1
alembic upgrade head
```

## Logging y Debugging

### Habilitar Debug Logs

```python
# app/main.py
import logging

if settings.debug:
    logging.basicConfig(level=logging.DEBUG)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
```

### Structured Logging

```python
import structlog

logger = structlog.get_logger()

logger.info(
    "user_created",
    user_id=user.id,
    organization_id=user.organization_id
)
```

## Health Check Failures

```python
@app.get("/health")
async def health_check():
    health = {"status": "healthy", "checks": {}}

    # Check DB
    try:
        await db.execute(text("SELECT 1"))
        health["checks"]["postgres"] = "ok"
    except Exception as e:
        health["checks"]["postgres"] = f"error: {e}"
        health["status"] = "unhealthy"

    # Check Redis
    try:
        await redis.ping()
        health["checks"]["redis"] = "ok"
    except Exception as e:
        health["checks"]["redis"] = f"error: {e}"
        health["status"] = "degraded"

    status_code = 200 if health["status"] == "healthy" else 503
    return JSONResponse(health, status_code=status_code)
```

## Common Error Codes

| Error | Causa | Solución |
|-------|-------|----------|
| 500 Internal Server Error | Excepción no manejada | Ver logs, añadir try/catch |
| 503 Service Unavailable | Dependencia caída (DB, Redis) | Verificar health checks |
| 429 Too Many Requests | Rate limit excedido | Implementar backoff |
| 504 Gateway Timeout | Request muy lento | Optimizar query, añadir timeout |

## Próximos Pasos

- [Setup Local](/guias/setup-local)
- [Testing](/guias/testing)
- [Deployment](/guias/deployment)
