# zenLogic - Documentación del ERP

Documentación completa del sistema ERP multi-tenant con arquitectura de microservicios.

## 🚀 Quick Start

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Abrir en el navegador
# http://localhost:3000
```

### Build para Producción

```bash
# Construir sitio estático
npm run build

# Servir build localmente
npm run serve
```

## 📦 Deployment a GitHub Pages

### Opción 1: Deployment Automático (Recomendado)

Cada vez que hagas push a `main`, GitHub Actions desplegará automáticamente la documentación.

Solo necesitas configurar GitHub Pages:
1. Ve a **Settings > Pages** en tu repositorio
2. En **Source**, selecciona `Deploy from a branch`
3. Selecciona branch `gh-pages` y carpeta `/ (root)`
4. Click en **Save**

### Opción 2: Deployment Manual

```bash
# Actualizar docusaurus.config.js primero con tu usuario y repo
export GIT_USER=tu-usuario-github
npm run deploy
```

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones completas.

## 📚 Estructura de la Documentación

```
docs/
├── 01-arquitectura/        # Arquitectura general del sistema
├── 02-microservicios/      # Documentación de cada microservicio
│   ├── auth-service/
│   ├── catalog-service/
│   ├── inventory-service/
│   ├── order-service/
│   └── audit-service/
├── 03-adrs/                # Architecture Decision Records
├── 03-flujos-negocio/      # Flujos end-to-end
├── 04-deployment/          # Configuración de deployment
├── 04-integraciones/       # RabbitMQ, Redis, gRPC, PostgreSQL
├── 05-guias/               # Guías prácticas
├── 05-testing/             # Estrategia de testing
├── 06-anexos/              # Glosario, referencias, diagramas
├── 06-observabilidad/      # Logs, métricas, tracing
└── 07-resiliencia/         # Error handling, retry policies
```

## 🛠️ Tecnologías

- **Framework**: [Docusaurus 3](https://docusaurus.io/)
- **Diagramas**: [Mermaid](https://mermaid.js.org/)
- **Syntax Highlighting**: Prism
- **Deployment**: GitHub Pages

## 📝 Contribuir

Para agregar o modificar documentación:

1. Edita los archivos `.md` en la carpeta `docs/`
2. Los cambios se reflejan automáticamente con `npm start`
3. Haz commit y push de tus cambios
4. GitHub Actions desplegará automáticamente

### Convenciones

- Usa Markdown estándar
- Incluye diagramas Mermaid cuando sea apropiado
- Agrega ejemplos de código con syntax highlighting
- Usa enlaces relativos para referencias internas

## 🌐 URLs

- **Local**: http://localhost:3000
- **GitHub Pages**: https://TU-USUARIO.github.io/ERP/
- **Custom Domain** (si aplica): https://docs.tudominio.com

## 📖 Contenido

### Microservicios Documentados
- ✅ Auth Service (100%)
- ✅ Catalog Service (100%)
- ✅ Inventory Service (100%)
- ✅ Order Service (100%)
- ✅ Audit Service (100%)

### Documentación Operacional
- ✅ Deployment con Docker Compose
- ✅ Estrategia de Testing (Unit, Integration, E2E)
- ✅ Observabilidad (Logs, Métricas, Tracing)
- ✅ Resiliencia (Error Handling, Retry Policies)
- ✅ 7 ADRs (Architecture Decision Records)
- ✅ 2 Flujos de Negocio End-to-End

### Métricas
- **~26,200 líneas** de documentación técnica
- **109 archivos** de documentación
- **Cobertura**: 100% de los 5 microservicios

## 🔧 Scripts Disponibles

```bash
npm start              # Servidor de desarrollo
npm run build          # Build para producción
npm run serve          # Servir build localmente
npm run deploy         # Deploy a GitHub Pages
npm run clear          # Limpiar cache
npm run docusaurus     # CLI de Docusaurus
```

## 📞 Soporte

Para preguntas o issues:
- Revisa [DEPLOYMENT.md](./DEPLOYMENT.md) para problemas de deployment
- Consulta la [documentación de Docusaurus](https://docusaurus.io/docs)

---

**Proyecto**: Tesis Universitaria - Sistema ERP Multi-tenant
**Framework**: Docusaurus 3.1.0
**Última actualización**: Noviembre 2025
