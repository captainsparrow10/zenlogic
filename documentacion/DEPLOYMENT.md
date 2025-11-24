# Deployment a GitHub Pages

Esta guía te ayudará a publicar la documentación en GitHub Pages.

## Configuración Previa

### 1. Actualizar `docusaurus.config.js`

Antes de hacer deploy, actualiza estos valores en el archivo `docusaurus.config.js`:

```javascript
const config = {
  // ... otras configuraciones ...

  // Cambia estos valores:
  url: 'https://TU-USUARIO.github.io',  // Tu usuario de GitHub
  baseUrl: '/ERP/',  // Nombre de tu repositorio (ERP en este caso)

  organizationName: 'TU-USUARIO',  // Tu usuario de GitHub
  projectName: 'ERP',  // Nombre del repositorio
  deploymentBranch: 'gh-pages',  // Branch para GitHub Pages
  trailingSlash: false,
};
```

**Ejemplo real:**
Si tu usuario de GitHub es `sparrow` y el repositorio es `ERP`:
```javascript
url: 'https://sparrow.github.io',
baseUrl: '/ERP/',
organizationName: 'sparrow',
projectName: 'ERP',
```

### 2. Verificar repositorio Git

Asegúrate de que tu código está en GitHub:

```bash
# Ver remotes
git remote -v

# Si no existe el remote, agregarlo
git remote add origin https://github.com/TU-USUARIO/ERP.git

# Push de tus cambios
git push -u origin main  # o 'master' según tu branch principal
```

## Métodos de Deployment

### Opción A: Deployment Automático con npm (Recomendado)

Este método usa el comando integrado de Docusaurus:

```bash
# Navegar a la carpeta de documentación
cd documentacion

# Setear variables de entorno (opcional, para SSH)
export GIT_USER=TU-USUARIO

# Deploy automático
npm run deploy
```

Este comando:
1. Construye la documentación (`npm run build`)
2. Crea/actualiza el branch `gh-pages`
3. Hace push automáticamente a GitHub

### Opción B: Deployment Manual

Si prefieres más control:

```bash
# 1. Construir la documentación
cd documentacion
npm run build

# 2. El contenido estará en documentacion/build/

# 3. Hacer deploy manual del contenido de build/ al branch gh-pages
# Opción 3a: Usando gh-pages (instalar primero)
npm install -g gh-pages
gh-pages -d build

# Opción 3b: Manual con git
cd build
git init
git add -A
git commit -m "Deploy documentation"
git branch -M gh-pages
git remote add origin https://github.com/TU-USUARIO/ERP.git
git push -f origin gh-pages
```

### Opción C: GitHub Actions (CI/CD Automático)

Crea el archivo `.github/workflows/deploy.yml` en la raíz del repositorio:

```yaml
name: Deploy Docusaurus to GitHub Pages

on:
  push:
    branches:
      - main  # Cambia a 'master' si ese es tu branch principal
    paths:
      - 'documentacion/**'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
          cache-dependency-path: documentacion/package-lock.json

      - name: Install dependencies
        working-directory: documentacion
        run: npm ci

      - name: Build documentation
        working-directory: documentacion
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: documentacion/build

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Con esta opción, cada push a `main` desplegará automáticamente.

## Configurar GitHub Pages en el Repositorio

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Pages**
4. En **Source**, selecciona:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
5. Click en **Save**

Después de unos minutos, tu documentación estará disponible en:
```
https://TU-USUARIO.github.io/ERP/
```

## Verificación

Después del deployment:

1. Ve a la pestaña **Actions** en tu repositorio de GitHub
2. Verifica que el workflow se ejecutó correctamente
3. Ve a **Settings > Pages** para ver la URL de tu sitio
4. Abre la URL en tu navegador

## Troubleshooting

### Error: "The 'gh-pages' branch doesn't exist"

Solución: El primer deploy creará automáticamente el branch. Solo asegúrate de tener permisos de escritura.

### Error: "ENOENT: no such file or directory"

Solución: Asegúrate de estar en la carpeta `documentacion/` al ejecutar comandos.

### Assets no cargan (CSS/JS 404)

Solución: Verifica que `baseUrl` en `docusaurus.config.js` coincida con el nombre del repositorio:
```javascript
baseUrl: '/ERP/',  // Debe terminar con /
```

### Links rotos después del deployment

Solución: Todos los links internos deben ser relativos. Revisa que no uses URLs absolutas como `/docs/...`.

### Página muestra README en lugar de documentación

Solución: Asegúrate de que en Settings > Pages, el source sea el branch `gh-pages` y la carpeta `/ (root)`.

## Custom Domain (Opcional)

Si quieres usar un dominio personalizado:

1. En `docusaurus.config.js`:
```javascript
url: 'https://docs.tudominio.com',
baseUrl: '/',
```

2. Crea archivo `static/CNAME` con tu dominio:
```
docs.tudominio.com
```

3. Configura DNS en tu proveedor de dominio:
```
Type: CNAME
Name: docs (o tu subdominio)
Value: TU-USUARIO.github.io
```

## Actualizar la Documentación

Para actualizar después de cambios:

```bash
cd documentacion

# Hacer cambios en los archivos .md

# Commit y push
git add .
git commit -m "docs: actualizar documentación"
git push

# Deploy nueva versión
npm run deploy
```

Si usas GitHub Actions, solo necesitas hacer push y el deploy será automático.

## URLs de Ejemplo

- **Con repositorio ERP**: https://sparrow.github.io/ERP/
- **Con dominio custom**: https://docs.zenlogic.com/

## Recursos Adicionales

- [Docusaurus Deployment Guide](https://docusaurus.io/docs/deployment)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**¿Necesitas ayuda?** Revisa los logs de GitHub Actions o contacta al equipo de desarrollo.
