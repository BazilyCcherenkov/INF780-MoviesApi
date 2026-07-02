# AGENTS.md — INF780-MoviesApi

## Project structure

Backend NestJS + TypeORM + PostgreSQL in root, frontend Vite+React in `INF780-MovieFrontend/`.

```
src/
├── app.module.ts             # DB config, env loading (.env / .env.test), synchronize:true
├── main.ts                   # ValidationPipe(whitelist, forbidNonWhitelisted, transform, errorHttpStatusCode:422), Swagger /api
└── movies/
    ├── dto/create-movie.dto.ts   # class-validator: @IsString @MaxLength(255) @IsEnum(Genre) @IsInt @Min(1888) @Max(2030) @IsNumber(maxDecimalPlaces:1) @Min(0) @Max(10)
    ├── dto/update-movie.dto.ts   # PartialType(CreateMovieDto)
    ├── entities/movie.entity.ts  # @Entity('movies') — table name is **movies** (plural)
    ├── movies.controller.ts      # CRUD, ParseUUIDPipe, DELETE returns 200 (not 204)
    ├── movies.service.ts         # findOne throws NotFoundException, no pagination in findAll()
    ├── movies.module.ts
    ├── movies.controller.spec.ts # 18 integration tests (mock service)
    └── movies.service.spec.ts    # 11 unit tests
test/
└── movies.e2e-spec.ts            # 15 e2e tests (real DB)
jmeter/
├── scripts/movies-api-test-plan.jmx  # 5 profiles (smoke/load/stress/spike/endurance)
├── scripts/seed.mjs                  # Seeds 5000+ movies
├── data/movies.csv                   # 50 movies for CSV Data Set
└── results/                          # .jtl + dashboards (generated)
```

## Backend commands (from repo root)

| Command | Action |
|---------|--------|
| `npm run start:dev` | Dev server with hot-reload on :3000 |
| `npm run test` | Jest unit tests (.spec.ts files) |
| `npm run test:cov` | Unit tests with coverage |
| `NODE_ENV=test npm run test:e2e` | E2E tests (needs .env.test + movies_api_test DB) |
| `npm run lint` | ESLint with --fix |
| `npm run format` | Prettier |

## Frontend commands (from INF780-MovieFrontend/)

| Command | Action |
|---------|--------|
| `npm run dev` | Vite dev server (runs without tsc check) |
| `npm run build` | `tsc -b && vite build` |
| `npm run cy:open` | Cypress interactive |
| `npm run cy:run` | Cypress headless (use cy.intercept(), no backend needed) |

- Frontend uses **TypeScript 6** with project references. Run `tsc -b` (not bare `tsc`).
- Backend `tsconfig.json` must include `INF780-MovieFrontend` in `exclude` to avoid JSX errors.

## Testing quirks

- Unit tests mock the Repository; integration tests mock MoviesService; e2e tests hit a real DB.
- E2E test config: `test/jest-e2e.json` with `moduleNameMapper: { "^src/(.*)$": "<rootDir>/../src/$1" }`.
- E2E tests run with `--runInBand` and `NODE_ENV=test` (loads `.env.test`).
- Frontend Cypress tests are independent (use `cy.intercept()`, no backend required).

## Database

- PostgreSQL, database name `movies_api` (dev) / `movies_api_test` (test).
- User: `movies_user` / `123456`.
- `synchronize: true` in dev — tables created on startup. **Must be false in production.**
- Table name: `movies` (plural, defined in `@Entity('movies')`).
- GET /movies has **no pagination** — vulnerable to degradation with large catalogs.

## JMeter

- Requires manual install: download from https://dlcdn.apache.org/jmeter/binaries/apache-jmeter-5.6.3.tgz
- Must run from repo root (relative paths: `jmeter/scripts/xyz.jmx`, `jmeter/data/`, `jmeter/results/`).
- Built-in JSONPathAssertion properties: `JSON_PATH`, `EXPECTED_VALUE`, `JSONVALIDATION`, `EXPECT_NULL`.
- Run in non-GUI mode (`-n -t ... -l ... -e -o ...`).
- Seed data first: `cd jmeter/scripts && node seed.mjs`.

## Git

- `.env`, `.env.test`, and `docs/` are in `.gitignore`.
- API returns 422 for validation errors (not 400).
