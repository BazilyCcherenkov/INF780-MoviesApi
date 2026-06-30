# Documentación de Pruebas - Movies API

## Resumen del Proyecto de Pruebas

Este documento describe la estrategia de pruebas implementada en Movies API, una aplicación NestJS con TypeORM y PostgreSQL, y su frontend en React + TypeScript + Vite.

## Estructura de Pruebas

```
├── src/movies/
│   ├── movies.service.spec.ts    # Pruebas unitarias del servicio
│   └── movies.controller.spec.ts # Pruebas de integración controlador
├── test/
│   └── movies.e2e-spec.ts        # Pruebas end-to-end
└── INF780-MovieFrontend/
    └── cypress/
        ├── e2e/movies.cy.ts      # Pruebas E2E del frontend
        ├── fixtures/movies.json  # Datos de prueba
        └── support/e2e.ts        # Soporte Cypress
```

## Tipos de Pruebas

### 1. Pruebas Unitarias - MoviesService

**Archivo:** `src/movies/movies.service.spec.ts`  
**Casos de prueba:** 11

| #   | Método    | Comportamiento                   | Verificación                    |
| --- | --------- | -------------------------------- | ------------------------------- |
| 1   | -         | Servicio definido                | `expect(service).toBeDefined()` |
| 2   | create()  | DTO válido crea entidad          | `create()` y `save()` invocados |
| 3   | create()  | UUID v4 asignado                 | Regex validación UUID           |
| 4   | findAll() | Retorna array de películas       | `find()` invocado               |
| 5   | findAll() | Array vacío si no hay datos      | `result === []`                 |
| 6   | findOne() | UUID existente retorna película  | `findOneBy({ id })`             |
| 7   | findOne() | UUID inexistente lanza excepción | `NotFoundException`             |
| 8   | update()  | Actualiza campos correctamente   | `merge()` y `save()`            |
| 9   | update()  | UUID inexistente lanza excepción | Antes de modificar              |
| 10  | remove()  | Elimina película existente       | `remove()` invocado             |
| 11  | remove()  | UUID inexistente lanza excepción | Antes de eliminar               |

### 2. Pruebas de Integración - MoviesController

**Archivo:** `src/movies/movies.controller.spec.ts`  
**Casos de prueba:** 18  
**Método:** Mock del servicio + ValidationPipe (422)

| #   | Endpoint           | Comportamiento esperado                        | Verificación                    | Tipo      |
| --- | ------------------ | --------------------------------------------- | ------------------------------- | --------- |
| 1   | POST /movies       | Crea una película con datos válidos          | Status 201; body tiene id y title | Éxito     |
| 2   | POST /movies       | Falta el campo title en el body             | Status 422                      | Validación |
| 3   | POST /movies       | El rating es mayor a 10                       | Status 422                      | Validación |
| 4   | POST /movies       | El rating es menor a 0                       | Status 422                      | Validación |
| 5   | POST /movies       | El year es menor a 1888                      | Status 422                      | Validación |
| 6   | POST /movies       | El genre no es un valor válido del enum       | Status 422                      | Validación |
| 7   | GET /movies        | Retorna todas las películas                  | Status 200; body es array      | Éxito     |
| 8   | GET /movies        | No existen películas registradas             | Status 200; body es []         | Éxito     |
| 9   | GET /movies/:id    | UUID válido y existente                      | Status 200; body.id coincide   | Éxito     |
| 10  | GET /movies/:id    | UUID con formato inválido                     | Status 400                      | Validación |
| 11  | GET /movies/:id    | UUID válido pero inexistente                 | Status 404                      | Error     |
| 12  | PATCH /movies/:id  | Actualiza parcialmente con DTO válido       | Status 200; body.rating cambia | Éxito     |
| 13  | PATCH /movies/:id  | UUID con formato inválido                     | Status 400                      | Validación |
| 14  | PATCH /movies/:id  | UUID válido pero inexistente                 | Status 404                      | Error     |
| 15  | PATCH /movies/:id  | Rating fuera de rango (ej: 15)               | Status 422                      | Validación |
| 16  | DELETE /movies/:id | Elimina una película existente               | Status 200                      | Éxito     |
| 17  | DELETE /movies/:id | UUID con formato inválido                    | Status 400                      | Validación |
| 18  | DELETE /movies/:id | UUID válido pero inexistente                  | Status 404                      | Error     |

### 3. Pruebas End-to-End - Movies E2E

**Archivo:** `test/movies.e2e-spec.ts`  
**Casos de prueba:** 15  
**Base de datos:** `movies_api_test`  
**Estado compartido:** `createdMovieId`

| #   | Endpoint           | Comportamiento esperado                        | Verificación                                 | Tipo      |
| --- | ------------------ | --------------------------------------------- | -------------------------------------------- | --------- |
| 1   | POST /movies       | Crea película válida con estructura completa | Status 201; body tiene id, title, director, genre, year, createdAt | Éxito     |
| 2   | POST /movies       | Falta el campo title                          | Status 422                                   | Validación |
| 3   | POST /movies       | El rating es 11 (fuera de rango)              | Status 422                                   | Validación |
| 4   | POST /movies       | El genre no es un valor válido                | Status 422                                   | Validación |
| 5   | POST /movies       | El year es menor a 1888                       | Status 422                                   | Validación |
| 6   | GET /movies        | Retorna array con la película recién creada   | Status 200; body incluye elemento con createdMovieId | Éxito     |
| 7   | GET /movies/:id    | Obtiene película usando createdMovieId       | Status 200; body.id coincide                | Éxito     |
| 8   | GET /movies/:id    | UUID con formato inválido                    | Status 400                                   | Validación |
| 9   | GET /movies/:id    | UUID válido pero inexistente                 | Status 404                                   | Error     |
| 10  | PATCH /movies/:id  | Actualiza rating y synopsis con datos válidos| Status 200; body.rating=9.0; body.synopsis actualizada | Éxito     |
| 11  | PATCH /movies/:id  | UUID con formato inválido                    | Status 400                                   | Validación |
| 12  | PATCH /movies/:id  | UUID válido pero inexistente                 | Status 404                                   | Error     |
| 13  | PATCH /movies/:id  | Rating fuera de rango (ej: 15)               | Status 422                                   | Validación |
| 14  | DELETE /movies/:id | Elimina la película recién creada             | Status 200                                   | Éxito     |
| 15  | DELETE /movies/:id | Intenta obtener la película eliminada         | Status 404 (confirma eliminación real)       | Flujo     |

## Ejecución de Pruebas

```bash
# Pruebas unitarias
npm run test

# Con cobertura
npm run test:cov

# End-to-end
npm run test:e2e
```

## Configuración

- **Pruebas unitarias:** Jest con mocks del repositorio TypeORM
- **E2E:** Supertest contra la aplicación real con base de datos de prueba
- **Validación:** ValidationPipe con whitelist y forbidNonWhitelisted
- **UUID:** ParseUUIDPipe para validación de formato

## Decisiones de Diseño

1. **Mocks del repositorio:** Se usa `createMockRepository()` con `jest.fn()` para simular TypeORM
2. **Fechas:** Se ignoran en comparaciones usando propiedades específicas (id, title, etc.)
3. **Delete:** Retorna 200 en lugar de 204 (decisión del controlador)
4. **ValidationPipe:** Configurado con `errorHttpStatusCode: 422` para errores de validación

## Cobertura Esperada

- **Service:** 100% de los métodos cubiertos
- **Controller:** Todos los endpoints y casos de error
- **E2E:** Flujo completo desde HTTP hasta DB

## Resumen de Casos de Prueba

| Tipo de Prueba                  | Archivo                          | Casos |
| ------------------------------- | -------------------------------- | ----- |
| Unitarias (Service)             | `src/movies/movies.service.spec.ts` | 11    |
| Integración (Controller)        | `src/movies/movies.controller.spec.ts` | 18    |
| End-to-End (Backend)           | `test/movies.e2e-spec.ts`         | 15    |
| E2E Frontend - Smoke            | `INF780-MovieFrontend/cypress/e2e/smoke.cy.ts` | 13 |
| E2E Frontend - Funcionalidad    | `INF780-MovieFrontend/cypress/e2e/movies.cy.ts` | 28 |
| E2E Frontend - Búsqueda/Filtros | `INF780-MovieFrontend/cypress/e2e/search-filter.cy.ts` | 28 |
| **Total**                      |                                  | **113** |
