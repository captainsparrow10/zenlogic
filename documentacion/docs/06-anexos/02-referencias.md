---
sidebar_position: 3
---

# Referencias Externas

Recursos, documentación y herramientas utilizadas en zenLogic ERP.

## Frameworks y Librerías

### Python

**FastAPI**
- [Documentación Oficial](https://fastapi.tiangolo.com/)
- [GitHub](https://github.com/tiangolo/fastapi)
- [Tutorial Completo](https://fastapi.tiangolo.com/tutorial/)
- [Advanced User Guide](https://fastapi.tiangolo.com/advanced/)

**SQLAlchemy**
- [Documentación Oficial](https://docs.sqlalchemy.org/en/20/)
- [ORM Querying Guide](https://docs.sqlalchemy.org/en/20/orm/queryguide/)
- [Async Support](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [GitHub](https://github.com/sqlalchemy/sqlalchemy)

**Pydantic**
- [Documentación Oficial](https://docs.pydantic.dev/)
- [Settings Management](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [Validation](https://docs.pydantic.dev/latest/concepts/validators/)
- [GitHub](https://github.com/pydantic/pydantic)

**Alembic**
- [Documentación Oficial](https://alembic.sqlalchemy.org/)
- [Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [Auto Generation](https://alembic.sqlalchemy.org/en/latest/autogenerate.html)

**pytest**
- [Documentación Oficial](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [Fixtures](https://docs.pytest.org/en/stable/fixture.html)

**aio-pika**
- [Documentación](https://aio-pika.readthedocs.io/)
- [GitHub](https://github.com/mosquito/aio-pika)
- [Examples](https://aio-pika.readthedocs.io/en/latest/quick-start.html)

**redis-py**
- [Documentación](https://redis.readthedocs.io/)
- [GitHub](https://github.com/redis/redis-py)
- [Async Redis](https://redis.readthedocs.io/en/stable/examples/asyncio_examples.html)

**grpcio**
- [Documentación Python](https://grpc.io/docs/languages/python/)
- [Quick Start](https://grpc.io/docs/languages/python/quickstart/)
- [Basics Tutorial](https://grpc.io/docs/languages/python/basics/)

## Bases de Datos

### PostgreSQL

**PostgreSQL 15**
- [Documentación Oficial](https://www.postgresql.org/docs/15/)
- [Row-Level Security](https://www.postgresql.org/docs/15/ddl-rowsecurity.html)
- [Performance Tips](https://www.postgresql.org/docs/15/performance-tips.html)
- [Indexes](https://www.postgresql.org/docs/15/indexes.html)

**Tutoriales**
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Use The Index, Luke](https://use-the-index-luke.com/)
- [PostgreSQL Exercises](https://pgexercises.com/)

### Redis

**Redis 7**
- [Documentación Oficial](https://redis.io/docs/)
- [Commands Reference](https://redis.io/commands/)
- [Data Types](https://redis.io/docs/data-types/)
- [Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [Memory Optimization](https://redis.io/docs/manual/optimization/memory-optimization/)

**Patterns**
- [Redis Patterns](https://redis.io/docs/manual/patterns/)
- [Caching Patterns](https://redis.io/docs/manual/patterns/caching/)

## Message Brokers

### RabbitMQ

**RabbitMQ 3.12**
- [Documentación Oficial](https://www.rabbitmq.com/documentation.html)
- [Get Started](https://www.rabbitmq.com/getstarted.html)
- [Tutorials](https://www.rabbitmq.com/tutorials)
- [Management API](https://www.rabbitmq.com/management.html)

**Concepts**
- [AMQP Concepts](https://www.rabbitmq.com/tutorials/amqp-concepts.html)
- [Reliability Guide](https://www.rabbitmq.com/reliability.html)
- [Consumer Acknowledgements](https://www.rabbitmq.com/confirms.html)
- [Dead Letter Exchanges](https://www.rabbitmq.com/dlx.html)

## Contenedores y Orquestación

### Docker

**Docker**
- [Documentación Oficial](https://docs.docker.com/)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

### Kubernetes

**Kubernetes**
- [Documentación Oficial](https://kubernetes.io/docs/)
- [Concepts](https://kubernetes.io/docs/concepts/)
- [Tasks](https://kubernetes.io/docs/tasks/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

**Helm**
- [Documentación](https://helm.sh/docs/)
- [Charts](https://helm.sh/docs/topics/charts/)

## Arquitectura y Patrones

### Microservicios

**General**
- [Microservices.io](https://microservices.io/)
- [Martin Fowler - Microservices](https://martinfowler.com/articles/microservices.html)
- [Microsoft - Microservices Architecture](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices)

**Patterns**
- [Microservice Patterns](https://microservices.io/patterns/index.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [Database per Service](https://microservices.io/patterns/data/database-per-service.html)

### Event-Driven Architecture

**Concepts**
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS](https://martinfowler.com/bliki/CQRS.html)

### Domain-Driven Design

**Books & Resources**
- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/)
- [DDD Community](https://github.com/ddd-crew)
- [Bounded Context Canvas](https://github.com/ddd-crew/bounded-context-canvas)

### Multi-tenancy

**Patterns**
- [Multi-tenant SaaS Patterns](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/multi-tenant-considerations.html)
- [PostgreSQL Multi-tenancy](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
- [Row-Level Security Best Practices](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Seguridad

### Authentication & Authorization

**JWT**
- [JWT.io](https://jwt.io/)
- [RFC 7519 - JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)
- [JWT Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-jwt-bcp-07)

**OAuth 2.0**
- [OAuth 2.0 Framework](https://oauth.net/2/)
- [RFC 6749 - OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)

**RBAC**
- [NIST RBAC](https://csrc.nist.gov/projects/role-based-access-control)
- [RBAC in PostgreSQL](https://www.postgresql.org/docs/current/user-manag.html)

### Security Best Practices

**OWASP**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [API Security Top 10](https://owasp.org/www-project-api-security/)
- [Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

**Python Security**
- [Python Security Best Practices](https://python.readthedocs.io/en/stable/library/security_warnings.html)
- [Bandit - Security Linter](https://github.com/PyCQA/bandit)

## API Design

### REST

**Standards**
- [REST API Tutorial](https://restfulapi.net/)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [Zalando RESTful API Guidelines](https://opensource.zalando.com/restful-api-guidelines/)

**OpenAPI**
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)

### gRPC

**Protocol Buffers**
- [Protocol Buffers Documentation](https://protobuf.dev/)
- [Language Guide](https://protobuf.dev/programming-guides/proto3/)
- [Style Guide](https://protobuf.dev/programming-guides/style/)

**gRPC**
- [gRPC Core Concepts](https://grpc.io/docs/what-is-grpc/core-concepts/)
- [Performance Best Practices](https://grpc.io/docs/guides/performance/)

## Observabilidad

### Logging

**Structured Logging**
- [structlog](https://www.structlog.org/)
- [Python Logging HOWTO](https://docs.python.org/3/howto/logging.html)
- [12-Factor Logs](https://12factor.net/logs)

### Métricas

**Prometheus**
- [Documentación Oficial](https://prometheus.io/docs/)
- [Best Practices](https://prometheus.io/docs/practices/naming/)
- [Python Client](https://github.com/prometheus/client_python)

**Grafana**
- [Documentación](https://grafana.com/docs/)
- [Dashboards](https://grafana.com/grafana/dashboards/)

### Tracing

**OpenTelemetry**
- [Documentación](https://opentelemetry.io/docs/)
- [Python SDK](https://opentelemetry.io/docs/instrumentation/python/)

**Jaeger**
- [Documentación](https://www.jaegertracing.io/docs/)

## Testing

### Strategies

**Test Pyramid**
- [Martin Fowler - Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Google Testing Blog](https://testing.googleblog.com/)

**Integration Testing**
- [Testing Microservices](https://martinfowler.com/articles/microservice-testing/)
- [Contract Testing](https://pactflow.io/blog/what-is-contract-testing/)

## Performance

### Caching

**Patterns**
- [Caching Strategies](https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html)
- [Cache Invalidation](https://martinfowler.com/bliki/TwoHardThings.html)

### Database Performance

**Query Optimization**
- [PostgreSQL Query Optimization](https://www.postgresql.org/docs/current/performance-tips.html)
- [EXPLAIN Guide](https://www.postgresql.org/docs/current/using-explain.html)
- [Index Tuning](https://www.postgresql.org/docs/current/indexes-types.html)

### Python Performance

**Async Programming**
- [asyncio Documentation](https://docs.python.org/3/library/asyncio.html)
- [Python Async/Await Tutorial](https://realpython.com/async-io-python/)

## DevOps y CI/CD

### GitHub Actions

**Documentation**
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

### Automatización

**Pre-commit Hooks**
- [pre-commit](https://pre-commit.com/)
- [Hooks Examples](https://github.com/pre-commit/pre-commit-hooks)

## Herramientas de Desarrollo

### IDEs y Editores

**VS Code**
- [Python Extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
- [Docker Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)

**PyCharm**
- [FastAPI Support](https://www.jetbrains.com/help/pycharm/fastapi-project.html)

### Linting y Formatting

**Tools**
- [Black](https://black.readthedocs.io/)
- [isort](https://pycqa.github.io/isort/)
- [flake8](https://flake8.pycqa.org/)
- [mypy](https://mypy.readthedocs.io/)
- [pylint](https://pylint.pycqa.org/)

## Libros Recomendados

### Arquitectura

- **"Building Microservices"** - Sam Newman
- **"Designing Data-Intensive Applications"** - Martin Kleppmann
- **"Domain-Driven Design"** - Eric Evans
- **"Patterns of Enterprise Application Architecture"** - Martin Fowler
- **"Clean Architecture"** - Robert C. Martin

### Python

- **"Fluent Python"** - Luciano Ramalho
- **"Python Concurrency with asyncio"** - Matthew Fowler
- **"Robust Python"** - Patrick Viafore

### Databases

- **"PostgreSQL: Up and Running"** - Regina Obe & Leo Hsu
- **"High Performance PostgreSQL"** - Gregory Smith

### DevOps

- **"The Phoenix Project"** - Gene Kim
- **"Continuous Delivery"** - Jez Humble & David Farley

## Comunidades y Foros

**Stack Overflow**
- [Python Tag](https://stackoverflow.com/questions/tagged/python)
- [FastAPI Tag](https://stackoverflow.com/questions/tagged/fastapi)
- [PostgreSQL Tag](https://stackoverflow.com/questions/tagged/postgresql)

**Reddit**
- [r/Python](https://www.reddit.com/r/Python/)
- [r/PostgreSQL](https://www.reddit.com/r/PostgreSQL/)
- [r/microservices](https://www.reddit.com/r/microservices/)

**Discord**
- [FastAPI Discord](https://discord.com/invite/VQjSZaeJmf)
- [Python Discord](https://discord.gg/python)

## Blogs y Newsletters

**Engineering Blogs**
- [Netflix Tech Blog](https://netflixtechblog.com/)
- [Uber Engineering](https://www.uber.com/blog/engineering/)
- [Spotify Engineering](https://engineering.atspotify.com/)
- [Shopify Engineering](https://shopify.engineering/)

**Newsletters**
- [Python Weekly](https://www.pythonweekly.com/)
- [PostgreSQL Weekly](https://postgresweekly.com/)
- [Microservices Weekly](https://microservicesweekly.com/)

## Cursos Online

**Plataformas**
- [Real Python](https://realpython.com/)
- [TestDriven.io](https://testdriven.io/)
- [Udemy - FastAPI Courses](https://www.udemy.com/topic/fastapi/)
- [Coursera - Microservices](https://www.coursera.org/specializations/cloud-native-app-development)

## Changelog y RFCs

**Python**
- [Python Enhancement Proposals (PEPs)](https://peps.python.org/)
- [What's New in Python](https://docs.python.org/3/whatsnew/)

**PostgreSQL**
- [PostgreSQL Release Notes](https://www.postgresql.org/docs/release/)
- [PostgreSQL Wiki](https://wiki.postgresql.org/)

## Próximos Pasos

- [Glosario](/anexos/glosario)
- [Convenciones](/anexos/convenciones)
- [Diagramas](/anexos/diagramas)
