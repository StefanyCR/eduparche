# EduParche

> Descripción del proyecto (completar cuando el equipo lo defina)

---

## Stack tecnológico

| Capa | Tecnología | Para qué sirve |
|------|-----------|----------------|
| Frontend | Next.js 16 + React 19 | Interfaz de usuario |
| Estilos | Tailwind CSS v4 | Utilidades CSS sin escribir CSS manual |
| Estado global | Zustand | Manejo de estado del cliente |
| HTTP cliente | Axios | Llamadas al backend desde el frontend |
| Backend | NestJS 11 | API REST estructurada con TypeScript |
| ORM | Prisma 7 | Acceso a la base de datos con tipado automático |
| Base de datos | PostgreSQL 16 | Base de datos relacional principal |
| Cache | Redis 7 | Cache y sesiones rápidas |
| Infraestructura | Docker | Corre PostgreSQL y Redis sin instalarlos localmente |
| Admin DB | pgAdmin 4 | Interfaz visual para explorar la base de datos |

---

## Estructura del proyecto

```
eduparche/                          ← Raíz del monorepo (npm workspaces)
├── .env                            ← Variables de entorno (NO se sube a Git)
├── .env.example                    ← Plantilla local (SÍ se sube, sin valores reales)
├── .env.production.example         ← Plantilla de producción (SÍ se sube, sin valores reales)
├── .gitignore
├── docker-compose.yml              ← Infraestructura de desarrollo (DB, Redis, pgAdmin)
├── docker-compose.prod.yml         ← Infraestructura de producción (todo incluido)
├── package.json                    ← Workspaces + scripts raíz
├── package-lock.json               ← Lock file único para todo el monorepo
├── scripts/
│   └── dev-start.sh                ← Levanta Docker y espera que la DB esté lista
├── docs/
│   └── sesion-01-setup.md          ← Historial detallado del setup inicial
├── README.md
│
├── backend/                        ← API REST (NestJS) — puerto 3001
│   ├── src/
│   │   ├── main.ts                 ← Carga .env y arranca el servidor
│   │   ├── app.module.ts           ← Módulo raíz
│   │   ├── app.controller.ts       ← Rutas HTTP
│   │   └── app.service.ts          ← Lógica de negocio
│   ├── prisma/
│   │   └── schema.prisma           ← Define las tablas de la base de datos
│   ├── Dockerfile                  ← Imagen Docker de producción (multi-etapa)
│   ├── .env                        ← Variables del backend (NO se sube)
│   ├── .env.example                ← Plantilla del backend
│   └── package.json
│
└── frontend/                       ← Interfaz de usuario (Next.js) — puerto 3000
    ├── app/
    │   ├── layout.tsx              ← Layout principal
    │   ├── page.tsx                ← Página de inicio (ruta "/")
    │   └── globals.css             ← Estilos globales con @import "tailwindcss"
    ├── public/                     ← Assets estáticos
    ├── Dockerfile                  ← Imagen Docker de producción (standalone)
    ├── next.config.ts              ← Configuración de Next.js + Turbopack
    └── package.json
```

---

## Prerrequisitos

- **Node.js 20+** → [nodejs.org](https://nodejs.org) *(se recomienda v22 por compatibilidad con Prisma 7)*
- **Docker Desktop** → [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- **Git** → [git-scm.com](https://git-scm.com)

```bash
node --version   # v20.x o superior
docker --version # Docker version 24.x o superior
git --version    # git version 2.x
```

---

## Configuración inicial (solo la primera vez)

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/eduparche.git
cd eduparche
```

### 2. Crear los archivos de variables de entorno
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

### 3. Instalar todas las dependencias
```bash
npm install
```

Este proyecto usa **npm workspaces**: un solo `npm install` desde la raíz instala las dependencias de la raíz, el backend y el frontend al mismo tiempo. No hace falta entrar a cada carpeta por separado.

### 4. Levantar la infraestructura y crear las tablas
```bash
npm run docker:up
npm run prisma:migrate
```

---

## Correr el proyecto

### Un solo comando (recomendado)
```bash
npm run dev
```

Este comando hace tres cosas en orden:
1. Levanta Docker (PostgreSQL + Redis + pgAdmin) si no está corriendo
2. Espera a que PostgreSQL esté completamente listo
3. Arranca backend (puerto `3001`) y frontend (puerto `3000`) en la misma terminal con colores distintos

### Por separado (para depurar un servicio específico)
```bash
npm run dev:backend    # Solo NestJS  → http://localhost:3001
npm run dev:frontend   # Solo Next.js → http://localhost:3000
```

---

## Acceder a los servicios

| Servicio | URL | Descripción |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Aplicación web |
| Backend API | http://localhost:3001 | API REST |
| pgAdmin | http://localhost:5050 | Interfaz visual de PostgreSQL |
| Prisma Studio | http://localhost:5555 | Explorador de BD (solo al correr `prisma:studio`) |

**Credenciales de pgAdmin:**
- Email: `admin@eduparche.co` / Password: `admin123`
- Conectar al servidor: Host `db` · Puerto `5432` · Usuario `eduparche_user` · Contraseña `eduparche_pass`

---

## Entornos (development / staging / production)

| Entorno | Dónde corre | Para qué |
|---------|------------|----------|
| `development` | Tu PC local | Desarrollo día a día |
| `staging` | Servidor de prueba | Testear antes de lanzar |
| `production` | Servidor real | Usuarios reales |

La variable `NODE_ENV` indica el entorno activo. NestJS y Next.js la gestionan automáticamente según el comando que uses (`start:dev` → development, `build` → production).

### Variables de entorno

```
.env                     ← desarrollo local (gitignored)
.env.production          ← producción (gitignored, se configura en el servidor)
.env.example             ← plantilla local pública (commiteada)
.env.production.example  ← plantilla de producción pública (commiteada)
```

**Regla de oro:** los archivos `.env` nunca van a Git. Los `.example` sí, porque no tienen valores reales.

**Para Next.js:** las variables que el browser necesita ver llevan el prefijo `NEXT_PUBLIC_`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001   ← visible en el browser
DATABASE_URL=postgresql://...              ← solo en el servidor
```

---

## Inspeccionar la base de datos

### Prisma Studio (más simple)
```bash
npm run prisma:studio
# Abre http://localhost:5555 — explorador visual de tablas y registros
```

### pgAdmin (más completo)
Abre [http://localhost:5050](http://localhost:5050) con las credenciales de arriba.

### Terminal directa
```bash
docker compose exec db psql -U eduparche_user -d eduparche_dev
\dt          # listar tablas
\q           # salir
```

---

## Git: flujo de trabajo

### Subir el proyecto a GitHub (primera vez)

1. Crear el repo en [github.com/new](https://github.com/new) **sin** README ni .gitignore
2. Conectar y subir:

```bash
git remote add origin https://github.com/tu-usuario/eduparche.git
git add .
git commit -m "feat: initial project setup"
git push -u origin main
```

### Flujo de trabajo diario

```bash
# Crear rama para cada funcionalidad
git checkout -b feature/nombre-de-la-feature

# Trabajar y commitear
git add .
git commit -m "feat: descripción del cambio"

# Subir y abrir Pull Request en GitHub
git push origin feature/nombre-de-la-feature

# Después del merge, volver a main
git checkout main && git pull
```

**Convención de commits:**
```
feat:     nueva funcionalidad
fix:      corrección de bug
docs:     cambios en documentación
refactor: reorganización sin cambiar comportamiento
test:     agregar o modificar tests
chore:    mantenimiento (deps, config, etc.)
```

---

## Docker

```
Desarrollo:
  Docker → [ PostgreSQL | Redis | pgAdmin ]   ← infraestructura
  Local  → [ NestJS (hot-reload) | Next.js (hot-reload) ]  ← apps

Producción:
  Docker → [ PostgreSQL | Redis | Backend | Frontend ]   ← todo
```

### Comandos de infraestructura
```bash
npm run docker:up     # levanta DB + Redis + pgAdmin
npm run docker:down   # detiene los contenedores
npm run docker:reset  # borra todos los datos y reinicia (¡cuidado!)
npm run docker:logs   # ver logs en tiempo real
```

### Producción completa en Docker
```bash
# Crear .env.production con los valores reales, luego:
docker compose -f docker-compose.prod.yml up --build
```

---

## npm workspaces

Este proyecto usa **npm workspaces**, configurado en el `package.json` raíz:

```json
{
  "workspaces": ["backend", "frontend"]
}
```

**Qué significa:** npm instala todas las dependencias de los tres `package.json` (raíz, backend, frontend) en una sola carpeta `node_modules/` en la raíz, compartida por todos. Esto:

- Elimina instalaciones duplicadas de paquetes que usan ambos proyectos
- Resuelve problemas de resolución de módulos en monorepos (como Tailwind CSS con Next.js)
- Mantiene un solo `package-lock.json` para todo el proyecto

**Si necesitás reinstalar todo desde cero:**
```bash
rm -rf node_modules backend/node_modules frontend/node_modules
rm -f package-lock.json
npm install
```

---

## Despliegue (Vercel + Railway)

```
GitHub → main branch
    ├── frontend/ → Vercel    (gratis, detecta Next.js automáticamente)
    └── backend/  → Railway   (tier gratuito, usa el Dockerfile)

Base de datos → Neon (PostgreSQL serverless, 500MB gratis)
Redis         → Upstash (serverless, tier gratuito)
```

**Frontend en Vercel:**
1. [vercel.com](https://vercel.com) → "Import Project" → seleccionar el repo
2. "Root Directory" → `frontend`
3. Agregar variables de entorno del `.env.production.example`
4. Cada `push` a `main` despliega automáticamente

**Backend en Railway:**
1. [railway.app](https://railway.app) → "New Project" → "Deploy from GitHub"
2. "Root Directory" → `backend` → Railway detecta el `Dockerfile`
3. Configurar variables de entorno en el panel

---

## Comandos de referencia

```bash
# ─── Instalación ────────────────────────────────────────────
npm install              # instala TODO (raíz + backend + frontend)

# ─── Proyecto ───────────────────────────────────────────────
npm run dev              # levanta Docker + backend + frontend
npm run dev:backend      # solo NestJS
npm run dev:frontend     # solo Next.js

# ─── Docker ─────────────────────────────────────────────────
npm run docker:up        # levanta PostgreSQL, Redis y pgAdmin
npm run docker:down      # detiene los contenedores
npm run docker:reset     # reinicia borrando todos los datos
npm run docker:logs      # logs en tiempo real

# ─── Base de datos ──────────────────────────────────────────
npm run prisma:migrate   # aplica migraciones (crea/modifica tablas)
npm run prisma:studio    # explorador visual en localhost:5555
npm run prisma:generate  # regenera el cliente de Prisma
npm run prisma:reset     # borra y recrea toda la BD

# ─── Tests y calidad (correr desde backend/) ────────────────
cd backend
npm run test             # tests unitarios
npm run test:e2e         # tests de integración
npm run lint             # revisión con ESLint
```

---

## Errores comunes

**`EADDRINUSE: address already in use :::3000`**  
El backend intenta usar el puerto 3000 (del frontend). Causa: `dotenv` no está cargando el `.env`.  
Verificar que `backend/.env` existe y tiene `PORT=3001`, y que `main.ts` tiene `import 'dotenv/config'` en la primera línea.

**`Can't resolve 'tailwindcss'`**  
Next.js busca Tailwind en `node_modules` raíz en vez de en `frontend/node_modules`.  
Solución: asegurarse de que npm workspaces está activo (`"workspaces"` en `package.json` raíz) y correr `npm install` desde la raíz.

**`WARN: the attribute 'version' is obsolete`**  
El `docker-compose.yml` tiene `version:` que Docker Compose v2+ ya no necesita. Eliminar esa línea.

**`EBADENGINE: @prisma/streams-local requires node >=22`**  
Warning de Prisma 7 con Node 20. No interrumpe el funcionamiento por ahora. Si Prisma falla, actualizar Node a v22 desde [nodejs.org](https://nodejs.org).

**`pg_isready: connection refused` al iniciar**  
PostgreSQL aún está levantando. El script `dev-start.sh` espera automáticamente. Si persiste, revisar logs con `npm run docker:logs`.
