# Guía de Inicio - Frontend (INF780-MovieFrontend)

## Descripción

Frontend en React + TypeScript + Vite para la gestión de películas (CRUD). Se comunica con la API REST backend en `http://localhost:3000`.

## Requisitos previos

- Node.js v18 o superior
- npm v9 o superior
- Backend Movies API corriendo en `http://localhost:3000`

## Instalación

```bash
cd INF780-MovieFrontend
npm install
```

## Ejecución

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Pruebas E2E con Cypress

Cypress se agregó como dependencia de desarrollo. La configuración completa está en `cypress.config.ts`.

Las pruebas usan `cy.intercept()` para mockear la API, por lo que NO requieren el backend funcionando.

### Estructura de pruebas

```
cypress/
├── e2e/
│   ├── smoke.cy.ts           # Pruebas de humo: carga de página, assets, DOM
│   ├── movies.cy.ts          # Pruebas funcionales, rendimiento, validación
│   └── search-filter.cy.ts   # Pruebas de búsqueda y filtro (28 casos)
├── fixtures/
│   └── movies.json           # Datos de prueba para intercepts
└── support/
    └── e2e.ts                # Archivo de soporte
cypress.config.ts              # Configuración de Cypress
```

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run cy:open` | Abre el Test Runner interactivo de Cypress |
| `npm run cy:run` | Ejecuta todas las pruebas en modo headless |

### Ejecución

```bash
# 1. Instalar binario de Cypress (solo primera vez)
npx cypress install

# 2. Sin backend (usa intercepts mock)
npm run cy:run

# O modo interactivo
npm run cy:open
```

> **Nota:** Si `npx cypress install` falla por timeout, ejecutar manualmente:
> ```bash
> CYPRESS_INSTALL_BINARY=https://download.cypress.io/desktop/15.17.0 npx cypress install
> ```

### Casos de prueba implementados

**Smoke Tests (13 casos)** — `cypress/e2e/smoke.cy.ts`

| # | Caso |
|---|------|
| 1 | Página responde con status 200 |
| 2 | Content-Type text/html y charset UTF-8 |
| 3 | Título de página correcto |
| 4 | Meta viewport configurado |
| 5 | Favicon .svg cargado |
| 6 | Script main.tsx presente |
| 7 | div#root existe y no vacío |
| 8 | Header Movies API visible |
| 9 | Botón nueva película visible |
| 10 | Estilos CSS aplicados (.app-header) |
| 11 | Filtros visibles |
| 12 | Películas desde fixture se cargan |
| 13 | Título de película visible en tarjeta |

**Funcionalidad + Rendimiento (28 casos)** — `cypress/e2e/movies.cy.ts`

| # | Categoría | Caso |
|---|-----------|------|
| 1 | Performance | GET /movies < 500ms |
| 2 | Performance | POST /movies < 500ms |
| 3 | Performance | Renderizado lista con 10 items < 2s |
| 4 | CRUD | Muestra lista de películas |
| 5 | CRUD | Abre formulario de creación |
| 6 | CRUD | Crea película vía POST |
| 7 | CRUD | Edita película vía PATCH |
| 8 | CRUD | Elimina película vía DELETE |
| 9 | Validación | Botón Crear presente en formulario |
| 10 | Validación | Campo Título requerido |
| 11 | Validación | Cancelar cierra formulario |
| 12 | Validación | Rating acepta decimales |
| 13 | Validación | Año min=1888 y max=2030 |
| 14 | Filtros | Búsqueda por título parcial |
| 15 | Filtros | Búsqueda por director |
| 16 | Filtros | Mensaje sin resultados |
| 17 | Filtros | Filtro por género |
| 18 | Filtros | Búsqueda + género combinados |
| 19 | Filtros | "Todos los géneros" restaura lista |
| 20 | Eliminar | Diálogo de confirmación visible |
| 21 | Eliminar | Cancelar eliminación cierra diálogo |
| 22 | Eliminar | Confirmar eliminación elimina tarjeta |
| 23 | HTTP | Verifica método GET al cargar |
| 24 | HTTP | Verifica método POST al crear |
| 25 | HTTP | Verifica método PATCH al editar |
| 26 | HTTP | Verifica método DELETE al eliminar |
| 27 | Error | Mensaje de error si GET falla |
| 28 | Error | Botones siguen visibles aunque falle |

**Búsqueda y Filtros (28 casos)** — `cypress/e2e/search-filter.cy.ts`

| # | Categoría | Caso |
|---|-----------|------|
| 1 | Título | Escribe en input y verifica valor capturado |
| 2 | Título | Búsqueda exacta devuelve 1 resultado |
| 3 | Título | Búsqueda parcial ("Inc") |
| 4 | Título | Búsqueda parcial ("The") múltiples resultados |
| 5 | Título | Case-insensitive |
| 6 | Título | Espacios al inicio no afectan |
| 7 | Título | Borrar texto restaura lista completa |
| 8 | Título | Filtro carácter por carácter |
| 9 | Título | Búsqueda con números en título |
| 10 | Título | Placeholder del input correcto |
| 11 | Director | Buscar por nombre completo |
| 12 | Director | Buscar por apellido |
| 13 | Género | Seleccionar "Ciencia Ficción" (3 resultados) |
| 14 | Género | Seleccionar "Drama" (2 resultados) |
| 15 | Género | Seleccionar "Acción" (1 resultado) |
| 16 | Género | "Todos los géneros" restaura lista |
| 17 | Combinado | Título "The" + género "Drama" |
| 18 | Combinado | Director "Nolan" + género "Acción" |
| 19 | Combinado | Sin match + género activo = vacío |
| 20 | Visual | Cada tarjeta contiene texto buscado |
| 21 | Visual | Badge género coincide con filtro |
| 22 | Visual | Cambiar género actualiza resultados |
| 23 | Visual | Limpiar texto respeta filtro género activo |
| 24 | Límite | Lista vacía muestra mensaje |
| 25 | Límite | Caracteres especiales no rompen |
| 26 | Límite | Títulos con acentos y Unicode |
| 27 | Límite | Valor por defecto "Todos los géneros" |
| 28 | Límite | Cambiar géneros rápidamente no causa errores |

### Intercepts usados

| Método | Ruta | Respuesta |
|--------|------|-----------|
| GET | `/movies` | Array de movies desde fixture |
| POST | `/movies` | Película creada mock (201) |
| PATCH | `/movies/:id` | Película actualizada mock (200) |
| DELETE | `/movies/:id` | Status 200 vacío |

## Configuración

### Proxy

Las peticiones a `/movies` se redirigen automáticamente al backend (`http://localhost:3000`) mediante proxy configurado en `vite.config.ts`.

```ts
server: {
  proxy: {
    '/movies': 'http://localhost:3000',
  },
},
```

## Estructura

```
src/
├── api/           # Cliente HTTP para la API
├── components/    # Componentes React (MovieCard, MovieForm, Modal)
├── hooks/         # Custom hooks
├── types/         # Tipos TypeScript
├── App.tsx        # Componente raíz
└── main.tsx       # Punto de entrada
```
