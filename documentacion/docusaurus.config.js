// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'zenLogic',
  tagline: 'Sistema ERP empresarial con arquitectura de microservicios',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://captainsparrow10.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/zenlogic/',

  // GitHub pages deployment config.
  organizationName: 'captainsparrow10',
  projectName: 'zenlogic',

  onBrokenLinks: 'warn', // Cambiar a 'warn' temporalmente para deployment
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          // Please change this to your repo.
          editUrl: 'https://github.com/your-repo/edit/main/',
        },
        blog: false, // Deshabilitar blog/changelog del navbar
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'zenLogic',
        logo: {
          alt: 'ERP Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            position: 'left',
            label: 'Documentación',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentación',
            items: [
              {
                label: 'Arquitectura',
                to: '/arquitectura/vision-general',
              },
              {
                label: 'Microservicios',
                to: '/microservicios/auth-service/overview',
              },
              {
                label: 'Decisiones de Arquitectura',
                to: '/adrs/introduccion-adrs',
              },
            ],
          },
          {
            title: 'Recursos',
            items: [
              {
                label: 'Guías',
                to: '/guias/setup-local',
              },
              {
                label: 'Anexos',
                to: '/anexos/glosario',
              },
            ],
          },
        ],
        copyright: `Universidad - Proyecto de Tesis © ${new Date().getFullYear()}. Construido con Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['python', 'protobuf', 'json', 'bash'],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
};

module.exports = config;
