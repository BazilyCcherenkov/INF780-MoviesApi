# INF780-MoviesFrontend

Frontend de la aplicación **Movies** desarrollado con React + TypeScript + Vite.

> **Materia:** INF780 - Verificación y Validación de Software  
> **Carrera:** Ingeniería Informática  
> **Universidad:** Universidad Autónoma Tomás Frías (UATF)

---

## Descripción

Interfaz web para la gestión de películas (CRUD). Se comunica con una API REST en `http://localhost:3000` mediante un proxy configurado en Vite.

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [npm](https://www.npmjs.com/) v9 o superior
- El backend de la API corriendo en `http://localhost:3000` (ver repositorio `INF780-MoviesBackend`)

## Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd INF780-MoviesFrontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

> Las peticiones a `/movies` son redirigidas automáticamente al backend en `http://localhost:3000`.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con HMR |
| `npm run build` | Compila el proyecto para producción |
| `npm run preview` | Sirve localmente la build de producción |
| `npm run lint` | Ejecuta ESLint sobre el código fuente |

## Estructura del proyecto

```
src/
├── api/            # Cliente HTTP para la API de películas
├── components/     # Componentes React (MovieCard, MovieForm, Modal)
├── hooks/          # Custom hooks
├── types/          # Definiciones de tipos TypeScript
├── App.tsx         # Componente raíz
└── main.tsx        # Punto de entrada
```

## Tecnologías

- [React 19](https://react.dev/)
- [TypeScript 6](https://www.typescriptlang.org/)
- [Vite 8](https://vite.dev/)
