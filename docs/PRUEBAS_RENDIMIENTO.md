# Guía de Pruebas de Rendimiento — Movies API

## 1. Objetivo

Caracterizar el comportamiento de Movies API bajo distintos perfiles de carga usando Apache JMeter, localizar sus límites con evidencia objetiva y documentar hallazgos y recomendaciones para producción.

## 2. Estructura del Plan de Pruebas

```
jmeter/
├── data/
│   └── movies.csv              # 50 películas base para parametrización
├── results/                    # Resultados .jtl y dashboards HTML
│   └── (generados al ejecutar)
└── scripts/
    ├── movies-api-test-plan.jmx # Plan de pruebas JMeter (5 tipos)
    └── seed.mjs                 # Script Node.js para sembrar 5000+ películas
```

## 3. Preparación

### 3.1 Requisitos

- Apache JMeter 5.6+ instalado ([descarga](https://jmeter.apache.org/download_jmeter.cgi))
- Node.js v18+
- Backend Movies API corriendo en `http://localhost:3000`
- Base de datos PostgreSQL vacía (synchronize: true la crea automáticamente)

### 3.2 Iniciar el backend

```bash
# Desde la raíz del proyecto
npm install
npm run start:dev
```

Verificar que la API responde:
```bash
curl http://localhost:3000/movies
# → []
```

### 3.3 Sembrar datos de prueba (5000+ películas)

```bash
cd jmeter/scripts
node seed.mjs
```

Este script genera 5000 películas únicas con valores aleatorios dentro de las restricciones de validación. Reporta progreso cada 100 y guarda el resultado en `results/seed-result.json`.

> **Nota:** Si se requiere limpiar la base de datos, ejecutar `TRUNCATE movies CASCADE` desde `psql`.

### 3.4 Configurar el plan de JMeter

El plan está parametrizado con:
- **CSV Data Set Config** → `jmeter/data/movies.csv` (título, director, género, año, rating, sinopsis)
- **JSON Extractor** → captura `$.id` de POST /movies en `${MOVIE_ID}`
- **Variables aleatorias** → `${RND_TITLE}` para títulos únicos

## 4. Perfiles de Carga

### 4.1 Smoke Test
**Objetivo:** Validar que el plan funciona y la API responde sin errores.

| Parámetro | Valor |
|-----------|-------|
| Usuarios | 1 |
| Ramp-up | 1s |
| Duración | 1 ciclo CRUD |
| Mezcla | POST → GET/:id → PATCH → DELETE |

**SLA:** 0% error, respuesta < 2s por endpoint.

### 4.2 Load Test (Carga esperada)
**Objetivo:** Medir throughput y percentiles bajo carga normal.

| Parámetro | Valor |
|-----------|-------|
| Usuarios | 80 |
| Ramp-up | 60s |
| Duración | 8 min |
| Mezcla | 50% GET /movies, 25% GET /movies/:id, 15% POST, 5% PATCH, 5% DELETE |

**SLA:** p95 < 3s, error < 1%.

### 4.3 Stress Test (Punto de quiebre)
**Objetivo:** Encontrar el límite de usuarios concurrentes.

| Parámetro | Valor |
|-----------|-------|
| Usuarios | 400 (escalonado) |
| Ramp-up | 360s (~100 usuarios/min) |
| Duración | 10 min |
| Mezcla | 70% GET /movies, 20% GET /movies/:id, 10% POST |

**SLA:** Identificar a qué número de hilos aumentan los errores > 5%.

### 4.4 Spike Test (Subida súbita)
**Objetivo:** Medir latencia y recuperación ante pico repentino.

| Parámetro | Valor |
|-----------|-------|
| Usuarios | 300 |
| Ramp-up | 15s |
| Duración | 2 min |
| Operación | 100% GET /movies |

**SLA:** p99 < 5s, recuperación en < 30s.

### 4.5 Endurance / Resistance Test
**Objetivo:** Detectar degradación con el tiempo y crecimiento del catálogo.

| Parámetro | Valor |
|-----------|-------|
| Usuarios | 40 |
| Ramp-up | 30s |
| Duración | 20 min |
| Mezcla | 60% POST, 20% GET /movies, 20% GET /movies/:id |

**SLA:** throughput y latencia no deben degradarse > 20% respecto al inicio.

## 5. Ejecución

### 5.1 Modo No-GUI (obligatorio)

Cada prueba debe ejecutarse en línea de comandos. Los resultados desde la interfaz gráfica **no son válidos**.

```bash
# Smoke Test
jmeter -n -t jmeter/scripts/movies-api-test-plan.jmx \
  -Jthreads.smoke=1 -Jduration.smoke=60 \
  -l jmeter/results/smoke.jtl \
  -e -o jmeter/results/smoke-dashboard/

# Load Test
jmeter -n -t jmeter/scripts/movies-api-test-plan.jmx \
  -l jmeter/results/load.jtl \
  -e -o jmeter/results/load-dashboard/

# Stress Test
jmeter -n -t jmeter/scripts/movies-api-test-plan.jmx \
  -l jmeter/results/stress.jtl \
  -e -o jmeter/results/stress-dashboard/

# Spike Test
jmeter -n -t jmeter/scripts/movies-api-test-plan.jmx \
  -l jmeter/results/spike.jtl \
  -e -o jmeter/results/spike-dashboard/

# Endurance Test
jmeter -n -t jmeter/scripts/movies-api-test-plan.jmx \
  -l jmeter/results/endurance.jtl \
  -e -o jmeter/results/endurance-dashboard/
```

### 5.2 Monitoreo durante la ejecución

```bash
# Monitorear logs de la API
tail -f /var/log/postgresql/postgresql.log

# Monitorear recursos del sistema (otra terminal)
htop
```

## 6. Análisis de Métricas

### 6.1 Dashboard HTML

Cada ejecución genera un dashboard en `jmeter/results/<tipo>-dashboard/`. Abrir `index.html` en el navegador.

### 6.2 Métricas clave por endpoint

| Métrica | Descripción | Cómo se lee |
|---------|-------------|-------------|
| Throughput | Solicitudes por segundo (req/s) | APDEX / Summary |
| Average | Tiempo de respuesta promedio (ms) | Summary > Average |
| Median | Percentil 50 (ms) | Summary > Median |
| p90 | 90% de las solicitudes están por debajo | Percentiles Graph |
| p95 | 95% de las solicitudes están por debajo | Percentiles Graph |
| p99 | 99% de las solicitudes están por debajo | Percentiles Graph |
| Error % | Porcentaje de solicitudes con error | Summary > Error % |

### 6.3 Interpretación esperada

| Endpoint | Comportamiento esperado |
|----------|------------------------|
| GET /movies | Más lento a medida que crece el catálogo (sin paginación) |
| GET /movies/:id | Consulta por PK, debería ser constante O(1) |
| POST /movies | Depende del índice de la tabla |
| PATCH /movies/:id | Similar a GET + UPDATE |
| DELETE /movies/:id | Similar a GET + DELETE |

## 7. Identificación de Cuellos de Botella

Se deben identificar al menos 3 limitaciones. Guía para encontrarlas:

### 7.1 Sin paginación en GET /movies
**Evidencia esperada:** El throughput de GET /movies disminuye y la latencia aumenta a medida que el catálogo crece (5000+ registros). En Endurance Test, GETs serán más lentos al final que al inicio.
**Componente:** `MoviesService.findAll()` → `this.movieRepository.find()` (carga toda la tabla).
**Recomendación:** Implementar paginación con `skip/take` y ordenación.

### 7.2 N+1 en listados sin relaciones
**Evidencia esperada:** En Stress Test con alta concurrencia sobre GET /movies, los errores de conexión a BD aparecen primero.
**Componente:** `synchronize: true` genera overhead en cada inicio; la conexión pool por defecto puede saturarse.
**Recomendación:** Configurar `maxQueryExecutionTime` y pool de TypeORM; deshabilitar `synchronize` en producción.

### 7.3 Validaciones en cada request
**Evidencia esperada:** POST/PATCH con datos inválidos responden 422, pero el ValidationPipe procesa el cuerpo completo incluso si falla.
**Componente:** `ValidationPipe` con `whitelist: true, forbidNonWhitelisted: true`.
**Recomendación:** Evaluar si `transform: true` agrega overhead significativo. Considerar validación temprana con DTOs planos.

### 7.4 Sin caché
**Evidencia esperada:** SPIKE Test muestra latencias altas en GET /movies porque cada request consulta BD.
**Componente:** Sin capa de caché.
**Recomendación:** Agregar caché en memoria (cache-manager) o Redis para GET /movies y GET /movies/:id.

## 8. Rúbrica de Evaluación

| # | Criterio | Puntos |
|---|----------|--------|
| 1 | Estructura y configuración del Test Plan: defaults, header manager, correlación del id, parametrización por CSV y aserciones (SLA) bien definidas | 15 |
| 2 | Sembrado del dataset e implementación correcta de los 5 tipos de prueba con perfiles de carga adecuados y justificados | 25 |
| 3 | Ejecución en modo no-GUI y generación de los dashboards HTML (incluidos como evidencia en el PDF) | 10 |
| 4 | Análisis de métricas: throughput, tiempos, percentiles p90/p95/p99 y % de error, leídos correctamente | 15 |
| 5 | Identificación y correlación de cuellos de botella con el código (mínimo 3, con evidencia) | 15 |
| 6 | PDF de respuestas: claridad, evidencias, recomendaciones accionables y conclusiones | 10 |
| 7 | Defensa oral: dominio del trabajo y respuestas a las preguntas del docente | 10 |
| **TOTAL** |  | **100** |

## 9. Entregables

Para la evaluación se debe presentar:

1. **Plan de pruebas JMeter** (`jmeter/scripts/movies-api-test-plan.jmx`)
2. **Dashboards HTML** de cada prueba (5 carpetas en `jmeter/results/`)
3. **Archivos .jtl** de cada ejecución
4. **PDF de respuestas** con:
   - Métricas por endpoint y tipo de prueba (tabla)
   - Identificación de 3+ cuellos de botella con evidencia
   - Correlación con el código fuente
   - Recomendaciones accionables
   - Conclusiones
5. **Defensa oral** del trabajo

## 10. Notas importantes

- El modo no-GUI es **obligatorio** para todas las mediciones válidas.
- `synchronize: true` está habilitado solo para desarrollo. En producción debe ser `false`.
- Sin paginación, GET /movies es el endpoint más vulnerable a degradación.
- Los timers (100ms constant + 50-200ms random) simulan think time realista.
- View Results Tree debe estar deshabilitado durante las pruebas de carga para no consumir memoria.
