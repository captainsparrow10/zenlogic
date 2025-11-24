---
sidebar_position: 8
---

# Configuración

## Variables de Entorno

```bash
# Service
SERVICE_NAME=reports-service
PORT=8010

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/reports_db

# Redis
REDIS_URL=redis://localhost:6379/10
CACHE_TTL_REPORTS=3600

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/

# File Storage
STORAGE_TYPE=s3  # 's3' or 'minio'
S3_BUCKET=zenlogic-reports
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=us-east-1
FILE_EXPIRATION_DAYS=7

# gRPC Clients
ORDER_SERVICE_GRPC=localhost:50003
INVENTORY_SERVICE_GRPC=localhost:50002
CUSTOMER_SERVICE_GRPC=localhost:50007
POS_SERVICE_GRPC=localhost:50006

# Report Generation
MAX_ROWS_PER_REPORT=100000
PDF_ENGINE=wkhtmltopdf
EXCEL_ENGINE=openpyxl
ENABLE_SCHEDULED_REPORTS=true

# Email (for scheduled reports)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=reports@zenlogic.com
SMTP_PASSWORD=your-password
EMAIL_FROM=reports@zenlogic.com
```

## Docker Compose

```yaml
version: '3.8'

services:
  reports-service:
    build: .
    ports:
      - "8010:8010"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/reports_db
      - REDIS_URL=redis://redis:6379/10
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
      - ORDER_SERVICE_GRPC=order-service:50003
      - INVENTORY_SERVICE_GRPC=inventory-service:50002
      - CUSTOMER_SERVICE_GRPC=customer-service:50007
      - POS_SERVICE_GRPC=pos-service:50006
      - S3_BUCKET=zenlogic-reports
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
    depends_on:
      - postgres
      - redis
      - rabbitmq
    networks:
      - erp-network

  # MinIO (alternativa a S3)
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - erp-network

volumes:
  minio_data:

networks:
  erp-network:
    external: true
```

## Settings

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Service
    service_name: str = "reports-service"
    port: int = 8010

    # Database
    database_url: str

    # Redis
    redis_url: str
    cache_ttl_reports: int = 3600

    # RabbitMQ
    rabbitmq_url: str

    # Storage
    storage_type: str = "s3"
    s3_bucket: str
    s3_access_key: str
    s3_secret_key: str
    s3_region: str = "us-east-1"
    file_expiration_days: int = 7

    # gRPC Clients
    order_service_grpc: str
    inventory_service_grpc: str
    customer_service_grpc: str
    pos_service_grpc: str

    # Report Generation
    max_rows_per_report: int = 100000
    pdf_engine: str = "wkhtmltopdf"
    excel_engine: str = "openpyxl"
    enable_scheduled_reports: bool = True

    # Email
    smtp_host: str
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    email_from: str

    class Config:
        env_file = ".env"

settings = Settings()
```

## Cron Jobs

Para reportes programados, usar Celery Beat:

```python
# celery_config.py

from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    'reports',
    broker=settings.rabbitmq_url,
    backend=settings.redis_url
)

celery_app.conf.beat_schedule = {
    'generate-scheduled-reports': {
        'task': 'reports.tasks.generate_scheduled_reports',
        'schedule': crontab(minute='*/5'),  # Cada 5 minutos
    },
}
```

## Próximos Pasos

- [Overview](./00-overview.md)
- [API Reports](./03-api-reports.md)
- [Tipos de Reportes](./05-tipos-reportes.md)
