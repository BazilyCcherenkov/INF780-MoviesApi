# Movies API

API REST para la gestión de un catálogo de películas, construida con **NestJS**, **TypeORM** y **PostgreSQL**.

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [npm](https://www.npmjs.com/) v9 o superior
- [PostgreSQL](https://www.postgresql.org/) v14 o superior

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la base de datos

Crea las bases de datos en PostgreSQL:

```sql
CREATE USER movies_user WITH PASSWORD '123456';

CREATE DATABASE movies_api OWNER movies_user;
CREATE DATABASE movies_api_test OWNER movies_user;

GRANT ALL PRIVILEGES ON DATABASE movies_api TO movies_user;
GRANT ALL PRIVILEGES ON DATABASE movies_api_test TO movies_user;
```

### 3. Configurar variables de entorno

El proyecto incluye dos archivos de entorno de ejemplo que debes modificar a:

- `.env` — para el entorno de desarrollo/producción
- `.env.test` — para el entorno de pruebas

Contenido esperado de `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=movies_user
DB_PASSWORD=123456
DB_NAME=movies_api
```

Contenido esperado de `.env.test`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=movies_user
DB_PASSWORD=123456
DB_NAME=movies_api_test
```

> El esquema de la base de datos se sincroniza automáticamente al iniciar la aplicación (`synchronize: true`).

## Uso

### Modo desarrollo (con recarga automática)

```bash
npm run start:dev
```

### Modo producción

```bash
npm run build
npm run start:prod
```

La API queda disponible en: `http://localhost:3000`

### Documentación interactiva (Swagger)

Una vez iniciada la aplicación, accede a:

```
http://localhost:3000/api
```

## Endpoints disponibles

| Método | Ruta          | Descripción                          |
| ------ | ------------- | ------------------------------------ |
| POST   | `/movies`     | Crear una nueva película             |
| GET    | `/movies`     | Obtener todas las películas          |
| GET    | `/movies/:id` | Obtener una película por UUID        |
| PATCH  | `/movies/:id` | Actualizar parcialmente una película |
| DELETE | `/movies/:id` | Eliminar una película                |

### Campos de una película

| Campo      | Tipo    | Requerido | Descripción                                                                                                |
| ---------- | ------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| `title`    | string  | Sí        | Título de la película (máx. 255 caracteres)                                                                |
| `director` | string  | Sí        | Director (máx. 150 caracteres)                                                                             |
| `genre`    | enum    | Sí        | Género: `action`, `comedy`, `drama`, `horror`, `sci-fi`, `thriller`, `romance`, `documentary`, `animation` |
| `year`     | integer | Sí        | Año de estreno (1888–2030)                                                                                 |
| `rating`   | number  | Sí        | Puntuación de 0.0 a 10.0 (un decimal)                                                                      |
| `synopsis` | string  | No        | Sinopsis de la película                                                                                    |

### Ejemplo: crear una película

```bash
curl -X POST http://localhost:3000/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Inception",
    "director": "Christopher Nolan",
    "genre": "sci-fi",
    "year": 2010,
    "rating": 8.8,
    "synopsis": "A thief who steals corporate secrets through the use of dream-sharing technology."
  }'
```

## Pruebas

### Pruebas unitarias

```bash
npm run test
```

### Pruebas unitarias con cobertura

```bash
npm run test:cov
```

### Pruebas de integración (end-to-end)

Requieren que la base de datos `movies_api_test` esté disponible (configurada en `.env.test`).

```bash
npm run test:e2e
```

### Documentación de pruebas

La documentación detallada de los casos de prueba se encuentra en `docs/PRUEBAS.md`. Este archivo incluye:

- **Pruebas unitarias (MoviesService):** 11 casos de prueba cubriendo todos los métodos del servicio
- **Pruebas de integración (MoviesController):** Tests con mock del servicio
- **Pruebas E2E:** Tests completos contra la base de datos real

## Pruebas de rendimiento con JMeter

### Requisitos

- Apache JMeter 5.6.3 instalado ([ver guía](docs/GUIA_HERRAMIENTAS.md))
- Backend corriendo en `http://localhost:3000`
- Base de datos sembrada con al menos 5000 películas

### Planes de prueba

Se incluyen 4 planes JMX que corresponden a los escenarios solicitados:

| Archivo | Perfil | Usuarios | Ramp-up | Duración |
|---------|--------|----------|---------|----------|
| `jmeter/scripts/smoke.jmx` | Smoke / Baseline | 1 | 1s | 5 loops |
| `jmeter/scripts/carga.jmx` | Carga (Load) | 50 | 30s | 10 loops |
| `jmeter/scripts/estres.jmx` | Estrés (Stress) | 100/200/400 | 60s | 2 min c/u |
| `jmeter/scripts/picos.jmx` | Picos (Spike) | 200 | 5s | 1 loop |

### Preparación

```bash
# 1. Iniciar el backend
npm run start:dev

# 2. Sembrar 5000+ películas
cd jmeter/scripts && node seed.mjs && cd ../..

# 3. Extraer IDs de películas para los tests
cd jmeter/scripts && node extract-ids.mjs && cd ../..
```

### Reset completo (para repetir pruebas desde cero)

```bash
cd jmeter/scripts && node reset.mjs && cd ../..
```

Este comando:
1. Limpia todos los archivos `.jtl` y dashboards anteriores
2. Trunca la tabla `movies` vía `psql` (vuelve a 0 registros)
3. Vuelve a sembrar 5000 películas frescas
4. Re-extrae los UUIDs a `jmeter/data/movie-ids.csv`

> **Requisito:** El usuario de PostgreSQL (`movies_user`) debe tener permisos de escritura. La contraseña está configurada en el script como `123456`.

### Ejecución (modo no-GUI)

Todos los comandos desde la raíz del proyecto:

```bash
# Smoke Test — verificar que el plan funciona
jmeter -n -t jmeter/scripts/smoke.jmx \
  -l jmeter/results/smoke.jtl \
  -e -o jmeter/results/smoke-dashboard/

# Load Test — 50 usuarios, mezcla GET + POST
jmeter -n -t jmeter/scripts/carga.jmx \
  -l jmeter/results/carga.jtl \
  -e -o jmeter/results/carga-dashboard/

# Stress Test — 3 niveles parametrizados
# Nivel 1: 100 usuarios
jmeter -n -t jmeter/scripts/estres.jmx -Jthreads=100 -Jrampup=30 -Jduration=120 \
  -l jmeter/results/estres-100.jtl \
  -e -o jmeter/results/estres-100-dashboard/

# Nivel 2: 200 usuarios
jmeter -n -t jmeter/scripts/estres.jmx -Jthreads=200 -Jrampup=60 -Jduration=120 \
  -l jmeter/results/estres-200.jtl \
  -e -o jmeter/results/estres-200-dashboard/

# Nivel 3: 400 usuarios
jmeter -n -t jmeter/scripts/estres.jmx -Jthreads=400 -Jrampup=120 -Jduration=120 \
  -l jmeter/results/estres-400.jtl \
  -e -o jmeter/results/estres-400-dashboard/

# Spike Test — 200 usuarios en 5s con aserciones
jmeter -n -t jmeter/scripts/picos.jmx \
  -l jmeter/results/picos.jtl \
  -e -o jmeter/results/picos-dashboard/
```

### Estructura de resultados

```
jmeter/results/
├── smoke.jtl / smoke-dashboard/     # Smoke Test
├── carga.jtl / carga-dashboard/     # Load Test
├── estres-100.jtl / estres-100-dashboard/  # Stress 100
├── estres-200.jtl / estres-200-dashboard/  # Stress 200
├── estres-400.jtl / estres-400-dashboard/  # Stress 400
└── picos.jtl / picos-dashboard/     # Spike Test
```

Cada dashboard HTML se abre con `jmeter/results/<nombre>/index.html` en el navegador.

### Documentación relacionada

- `docs/PRUEBAS_RENDIMIENTO.md` — Guía detallada de perfiles y análisis
- `docs/GUIA_HERRAMIENTAS.md` — Instalación y configuración de JMeter + Cypress
- `docs/GUIA_JMETER.md` — Referencia del plan de pruebas
- `docs/GUIA_JMETER_GUI.md` — Cómo usar la interfaz gráfica
- `docs/GUIA_HERRAMIENTAS.md` — Solución de problemas comunes

## Estructura del proyecto

```
src/
├── app.module.ts               # Módulo raíz (configuración DB y módulos)
├── main.ts                     # Punto de entrada, configuración Swagger
└── movies/
    ├── dto/
    │   ├── create-movie.dto.ts # DTO para creación con validaciones
    │   └── update-movie.dto.ts # DTO para actualización parcial
    ├── entities/
    │   └── movie.entity.ts     # Entidad TypeORM (tabla `movies`)
    ├── movies.controller.ts    # Controlador REST
    ├── movies.service.ts       # Lógica de negocio
    ├── movies.module.ts        # Módulo de películas
    ├── movies.controller.spec.ts
    └── movies.service.spec.ts
test/
└── movies.e2e-spec.ts          # Pruebas end-to-end
```

## Scripts disponibles

| Comando              | Descripción                                 |
| -------------------- | ------------------------------------------- |
| `npm run start`      | Inicia la aplicación                        |
| `npm run start:dev`  | Inicia en modo desarrollo con hot-reload    |
| `npm run start:prod` | Inicia la versión compilada                 |
| `npm run build`      | Compila el proyecto                         |
| `npm run test`       | Ejecuta pruebas unitarias                   |
| `npm run test:cov`   | Ejecuta pruebas con reporte de cobertura    |
| `npm run test:e2e`   | Ejecuta pruebas end-to-end                  |
| `npm run lint`       | Ejecuta el linter con corrección automática |
| `npm run format`     | Formatea el código con Prettier             |
