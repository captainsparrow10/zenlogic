/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    'intro',
    {
      type: 'category',
      label: '📐 Arquitectura General',
      collapsed: false,
      items: [
        'arquitectura/vision-general',
        'arquitectura/stack-tecnologico',
        'arquitectura/arquitectura-event-driven',
        'arquitectura/comunicacion-microservicios',
        'arquitectura/multi-tenancy',
        'arquitectura/seguridad-rbac',
        'arquitectura/patrones-diseno',
      ],
    },
    {
      type: 'category',
      label: '🔧 Microservicios',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Auth Service',
          collapsed: true,
          items: [
            'microservicios/auth-service/overview',
            'microservicios/auth-service/alcance',
            'microservicios/auth-service/arquitectura',
            'microservicios/auth-service/modelo-datos',
            'microservicios/auth-service/configuracion',
            'microservicios/auth-service/eventos-publicados',
            'microservicios/auth-service/grpc-server',
            'microservicios/auth-service/api-auth',
            'microservicios/auth-service/api-users',
            'microservicios/auth-service/api-roles',
            'microservicios/auth-service/api-permissions',
            'microservicios/auth-service/api-locals',
            'microservicios/auth-service/api-organizations',
            'microservicios/auth-service/flujos-negocio',
          ],
        },
        {
          type: 'category',
          label: 'Catalog Service',
          collapsed: true,
          items: [
            'microservicios/catalog-service/overview',
            'microservicios/catalog-service/alcance',
            'microservicios/catalog-service/arquitectura',
            'microservicios/catalog-service/modelo-datos',
            'microservicios/catalog-service/configuracion',
            'microservicios/catalog-service/eventos-publicados',
            'microservicios/catalog-service/eventos-consumidos',
            'microservicios/catalog-service/validacion-locales',
            'microservicios/catalog-service/auth-client-grpc',
            'microservicios/catalog-service/api-products',
            'microservicios/catalog-service/api-variants',
            'microservicios/catalog-service/api-options',
            'microservicios/catalog-service/api-brands',
            'microservicios/catalog-service/api-collections',
            'microservicios/catalog-service/api-tags',
            'microservicios/catalog-service/api-price-tiers',
            'microservicios/catalog-service/api-images',
            'microservicios/catalog-service/paginacion-cursor',
            'microservicios/catalog-service/cache-strategy',
            'microservicios/catalog-service/flujos-negocio',
            'microservicios/catalog-service/testing',
            'microservicios/catalog-service/errores-comunes',
            'microservicios/catalog-service/migraciones',
          ],
        },
        {
          type: 'category',
          label: 'Inventory Service',
          collapsed: true,
          items: [
            'microservicios/inventory-service/overview',
            'microservicios/inventory-service/arquitectura',
            'microservicios/inventory-service/modelo-datos',
            'microservicios/inventory-service/api-stock',
            'microservicios/inventory-service/api-movements',
            'microservicios/inventory-service/api-warehouses',
            'microservicios/inventory-service/api-transfers',
            'microservicios/inventory-service/api-adjustments',
            'microservicios/inventory-service/api-locations',
            'microservicios/inventory-service/eventos-publicados',
            'microservicios/inventory-service/eventos-consumidos',
            'microservicios/inventory-service/integraciones',
            'microservicios/inventory-service/errores-comunes',
            'microservicios/inventory-service/flujos-negocio',
          ],
        },
        {
          type: 'category',
          label: 'Order Service',
          collapsed: true,
          items: [
            'microservicios/order-service/overview',
            'microservicios/order-service/modelo-datos',
            'microservicios/order-service/api-orders',
            'microservicios/order-service/api-cart',
            'microservicios/order-service/state-machine',
            'microservicios/order-service/eventos-publicados',
            'microservicios/order-service/errores-comunes',
          ],
        },
        {
          type: 'category',
          label: 'Audit Service',
          collapsed: true,
          items: [
            'microservicios/audit-service/overview',
            'microservicios/audit-service/alcance',
            'microservicios/audit-service/arquitectura',
            'microservicios/audit-service/modelo-datos',
            'microservicios/audit-service/event-consumer',
            'microservicios/audit-service/api-logs',
            'microservicios/audit-service/retention-policy',
            'microservicios/audit-service/queries-comunes',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '📋 Decisiones de Arquitectura (ADRs)',
      collapsed: false,
      items: [
        'adrs/introduccion-adrs',
        'adrs/adr-001-python-fastapi',
        'adrs/adr-002-postgresql',
        'adrs/adr-003-event-driven',
        'adrs/adr-004-grpc-internal',
        'adrs/adr-005-rbac-multinivel',
        'adrs/adr-006-postgresql-multi-tenant',
        'adrs/adr-007-cursor-pagination',
      ],
    },
    {
      type: 'category',
      label: '🔌 Integraciones',
      collapsed: false,
      items: [
        'integraciones/overview',
        'integraciones/rabbitmq',
        'integraciones/redis',
        'integraciones/grpc',
        'integraciones/postgresql',
      ],
    },
    {
      type: 'category',
      label: '🚢 Deployment',
      collapsed: false,
      items: [
        'deployment/docker-compose',
      ],
    },
    {
      type: 'category',
      label: '🧪 Testing',
      collapsed: false,
      items: [
        'testing/estrategia-testing',
      ],
    },
    {
      type: 'category',
      label: '📚 Guías',
      collapsed: false,
      items: [
        'guias/setup-local',
        'guias/crear-microservicio',
        'guias/testing',
        'guias/deployment',
        'guias/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: '📎 Anexos',
      collapsed: false,
      items: [
        'anexos/glosario',
        'anexos/convenciones',
        'anexos/referencias',
        'anexos/diagramas',
      ],
    },
  ],
};

module.exports = sidebars;
