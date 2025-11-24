import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <img
          src={useBaseUrl('/img/logo.png')}
          alt="zenLogic Logo"
          className={styles.heroLogo}
        />
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/intro/">
            Comenzar con la Documentación 📚
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures() {
  const features = [
    {
      title: '🏗️ Arquitectura de Microservicios',
      description: (
        <>
          Sistema modular con 5 microservicios independientes: Auth, Catalog,
          Inventory, Order y Audit. Diseñado para escalabilidad y mantenibilidad.
        </>
      ),
    },
    {
      title: '📡 Event-Driven Architecture',
      description: (
        <>
          Comunicación asíncrona mediante RabbitMQ con eventos tipados.
          Desacoplamiento completo entre servicios para máxima flexibilidad.
        </>
      ),
    },
    {
      title: '🏢 Multi-tenancy',
      description: (
        <>
          Soporte nativo para múltiples organizaciones con aislamiento de datos
          mediante Row-Level Security en PostgreSQL.
        </>
      ),
    },
    {
      title: '🔐 RBAC Multinivel',
      description: (
        <>
          Control de acceso basado en roles con permisos granulares a nivel de
          organización, local y recursos individuales.
        </>
      ),
    },
    {
      title: '🚀 Stack Moderno',
      description: (
        <>
          Python 3.11+, FastAPI, PostgreSQL 15, Redis, RabbitMQ, gRPC.
          Tecnologías probadas en producción para alta performance.
        </>
      ),
    },
    {
      title: '📊 Observabilidad Completa',
      description: (
        <>
          Logging estructurado, métricas con Prometheus, distributed tracing con
          Jaeger. Monitoreo end-to-end de todo el sistema.
        </>
      ),
    },
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className={styles.featuresTitle}>Características Principales</h2>
        <div className="row">
          {features.map((feature, idx) => (
            <div key={idx} className={clsx('col col--4', styles.feature)}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomepageStats() {
  const stats = [
    { number: '5', label: 'Microservicios' },
    { number: '~26K', label: 'Líneas de Docs' },
    { number: '7', label: 'ADRs' },
    { number: '100%', label: 'Cobertura' },
  ];

  return (
    <section className={styles.stats}>
      <div className="container">
        <div className="row">
          {stats.map((stat, idx) => (
            <div key={idx} className="col col--3">
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stat.number}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomepageQuickLinks() {
  const quickLinks = [
    {
      title: '🎯 Visión General',
      description: 'Entiende la arquitectura completa del sistema',
      link: '/arquitectura/vision-general/',
    },
    {
      title: '🔧 Microservicios',
      description: 'Documentación detallada de cada servicio',
      link: '/microservicios/auth-service/overview/',
    },
    {
      title: '🚢 Deployment',
      description: 'Guía completa de deployment con Docker',
      link: '/deployment/docker-compose/',
    },
    {
      title: '🧪 Testing',
      description: 'Estrategia de testing y ejemplos',
      link: '/testing/estrategia-testing/',
    },
  ];

  return (
    <section className={styles.quickLinks}>
      <div className="container">
        <h2 className={styles.quickLinksTitle}>Acceso Rápido</h2>
        <div className="row">
          {quickLinks.map((link, idx) => (
            <div key={idx} className="col col--3">
              <Link to={link.link} className={styles.quickLinkCard}>
                <h3>{link.title}</h3>
                <p>{link.description}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Inicio`}
      description="Sistema ERP empresarial con arquitectura de microservicios - Documentación completa">
      <HomepageHeader />
      <main>
        <HomepageStats />
        <HomepageFeatures />
        <HomepageQuickLinks />

        <section className={styles.cta}>
          <div className="container">
            <h2>¿Listo para comenzar?</h2>
            <p>Explora la documentación completa y descubre cómo implementar un ERP moderno con microservicios.</p>
            <Link
              className="button button--primary button--lg"
              to="/intro/">
              Ver Documentación Completa
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
