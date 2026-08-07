# EduParche · Frontend en Angular

Aplicación web en Angular que consume la API REST de EduParche (NestJS + PostgreSQL).

---

## 1. Instalación de Angular — el paso que se graba en el video

### Requisitos previos

```bash
node -v    # debe ser 20.19 o superior
npm -v
```

Si Node es más viejo, se actualiza con nvm:

```bash
nvm install 20
nvm use 20
```

### Instalar el CLI de Angular

```bash
npm install -g @angular/cli
```

### Confirmar que quedó instalado

```bash
ng version
```

Debe aparecer el logo de Angular con la versión del CLI, la de Node y el gestor de paquetes.

> Versiones usadas en este proyecto: Angular CLI **21.2.20**, Node **20.20.2**, npm **10.8.2**.

### Cómo se creó este proyecto

```bash
ng new frontend-angular --style=css --ssr=false --skip-git
```

- `--style=css` → hojas de estilo CSS puras, sin preprocesadores.
- `--ssr=false` → sin renderizado en servidor: es una aplicación de página única (SPA) que consume una API.
- `--skip-git` → **importante**: el proyecto vive dentro del repositorio de EduParche, que ya tiene Git. Sin esta bandera, Angular crearía un repositorio anidado.

---

## 2. Poner a funcionar la aplicación

Hacen falta **tres** cosas encendidas: la base de datos, el backend y Angular.

```bash
# 1. Base de datos PostgreSQL (en la raíz del repositorio)
cd ~/proyectos/eduparche
docker compose up -d db

# 2. Backend NestJS — queda en el puerto 3001
npm run dev:backend

# 3. Angular — queda en el puerto 4200 (en otra terminal)
cd frontend-angular
npm install     # solo la primera vez
ng serve
```

Abrir <http://localhost:4200>.

### Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Estudiante | `estudiante@eduparche.co` | `Student123!` |
| Tutor | `tutor@eduparche.co` | `Tutor123!` |
| Administrador | `admin@eduparche.co` | `Admin123!` |

> Solo el rol **estudiante** puede inscribirse a cursos. Con los otros, el backend responde 403 y la tarjeta muestra un aviso en lugar del botón.

---

## 3. Qué APIs consume cada opción del menú

Cada opción del menú usa un endpoint distinto del backend. Si el trabajo se reparte entre varias personas, cada una puede defender una.

| Opción de menú | Endpoint | Verbos |
|---|---|---|
| **Autenticación** | `/api/auth/login`, `/register`, `/logout` | POST |
| **Catálogo** | `/api/v1/catalog` · `/api/v1/enrollments` | GET, POST |
| **Mis cursos** | `/api/v1/enrollments/me` | GET |
| **Perfil** | `/api/users/me` | GET, PUT |

---

## 4. Estructura del código

```
src/
├── environments/          URL del backend, distinta en desarrollo y producción
└── app/
    ├── core/              Lógica compartida, sin interfaz visual
    │   ├── models/        Interfaces que reflejan el JSON del backend
    │   ├── services/      Cuatro servicios, uno por área de la API
    │   ├── interceptors/  Cookie de sesión y traducción de errores
    │   └── guards/        Protección de las rutas privadas
    ├── features/          Una carpeta por pantalla
    │   ├── auth/          Login y registro
    │   ├── catalog/       Catálogo con inscripción
    │   ├── my-courses/    Inscripciones con progreso
    │   └── profile/       Datos personales
    └── shared/            Componentes reutilizables (menú, avisos, cargando)
```

**Por qué esta separación:** `core` guarda lo que no se ve pero todos usan; `features` es una carpeta por pantalla, así que agregar una opción de menú no obliga a tocar las demás; y `shared` evita repetir el mismo bloque de aviso en cinco pantallas.

---

## 5. Las tres decisiones técnicas que conviene explicar

### La sesión viaja en una cookie que JavaScript no puede leer

El backend guarda el token JWT en una cookie marcada `httpOnly`. Esto significa que **esta aplicación no puede leer el token** ni con `document.cookie`.

Es a propósito: si el token estuviera en `localStorage`, cualquier script inyectado en la página (ataque XSS) podría robarlo y suplantar al usuario. Con `httpOnly`, el navegador la envía sola en cada petición pero ningún script la ve.

**Consecuencia práctica:** la única forma de saber si hay sesión es preguntárselo al backend con `GET /users/me`. Eso es lo que hacen `AuthService.loadSession()` y `auth.guard.ts`.

### Un interceptor agrega la cookie a todas las peticiones

Angular corre en el puerto 4200 y el backend en el 3001: son orígenes distintos, y por defecto el navegador **no** manda cookies entre orígenes distintos. Hay que pedirlo con `withCredentials: true`.

`credentials.interceptor.ts` lo aplica a todas las peticiones de una vez. Hacerlo petición por petición sería frágil: basta olvidarlo una vez para que esa llamada devuelva 401 sin motivo aparente.

### La aplicación usa signals porque corre sin Zone.js

Angular 21 detecta los cambios mediante *signals* en lugar de revisar todo el árbol de componentes. Por eso todo el estado que se muestra en pantalla (`courses`, `loading`, `errorMessage`) está declarado con `signal()`: con variables normales, la vista no se actualizaría al llegar la respuesta del servidor.

---

## 6. Comandos disponibles

| Comando | Qué hace |
|---|---|
| `ng serve` | Servidor de desarrollo con recarga automática |
| `ng build` | Compila para producción en `dist/` |
| `ng test` | Ejecuta las pruebas unitarias |

---

## 7. Despliegue (EV02)

### Compilar

```bash
ng build
```

El resultado queda en `dist/frontend-angular/browser/` y son archivos estáticos: se pueden subir a Vercel, Netlify o cualquier hosting.

### Antes de desplegar hay que cambiar dos cosas

**1. La URL del backend** en `src/environments/environment.ts`.

**2. El atributo `sameSite` de la cookie**, en `backend/src/auth/auth.controller.ts`:

```ts
sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
secure:   process.env.NODE_ENV === 'production',   // 'none' EXIGE HTTPS
```

**Por qué:** en local funciona porque `localhost:4200` y `localhost:3001` son el mismo *sitio* (el puerto no cuenta para determinar el sitio). En producción, con Angular y el backend en dominios distintos, `sameSite: 'lax'` **impide** que el navegador envíe la cookie y todo responde 401.

**3. Autorizar el dominio del frontend** en la variable `CORS_ORIGINS` del backend:

```
CORS_ORIGINS="https://eduparche-angular.vercel.app"
```

---

## 8. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| "No se pudo conectar con el servidor" | El backend no está corriendo. Levantarlo con `npm run dev:backend`. |
| Todo responde 401 | El backend no autoriza el origen `http://localhost:4200`. Revisar `CORS_ORIGINS` en `backend/.env`. |
| Login correcto pero al recargar vuelve al login | La cookie no se está enviando. Verificar que `credentialsInterceptor` esté registrado en `app.config.ts`. |
| El catálogo aparece vacío | No hay cursos publicados. Crear uno desde el panel de administración y ponerle estado **Publicado**. |
| El botón "Inscribirme" no aparece | O ya estás inscrito en ese curso, o entraste con un rol que no es estudiante. |
