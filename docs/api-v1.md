# API pública EduParche · v1

Contrato de integración para sistemas externos. Todo se entrega en `application/json`.

- **Base:** `http://localhost:3001/api/v1` (desarrollo)
- **Autenticación:** header `X-API-Key`
- **Versión:** `v1` — ver [Estrategia de versionado](#estrategia-de-versionado)

---

## 1. Qué datos se exponen y por qué

El esquema tiene 24 modelos. No todos pueden salir de la plataforma. La clasificación que aplica esta API:

### 🟢 Comercializable — se expone sin restricción

| Modelo | Valor para un tercero |
|---|---|
| `Course`, `CourseCategory` | Catálogo formativo. Es el activo vendible: un aliado puede listar y promocionar tu oferta. |
| `Module`, `Lesson` (solo estructura) | El temario es el gancho comercial: convence sin regalar el producto. |
| `Skill`, `CourseSkill` | Permite cruzar cursos con vacantes ("quién sabe JavaScript"). Muy valioso para bolsas de empleo. |
| `Event` | Talleres, charlas y networking. Interesa a apps de egresados y empleabilidad. |
| `Badge`, `Challenge` | Catálogo de gamificación, reutilizable por apps de motivación. |
| Métricas agregadas | Totales y porcentajes. Muestran el tamaño de la plataforma sin identificar a nadie. |

### 🟡 Restringido — solo con consentimiento del titular

`Enrollment`, `LessonProgress`, `Grade`, `Certificate`, `Submission`. Es el historial académico de una persona: sirve para certificaciones y portafolios, pero le pertenece al estudiante, no a la plataforma.

### 🔴 Nunca sale

| Campo | Motivo |
|---|---|
| `User.passwordHash`, `User.googleId` | Credenciales. |
| `User.email`, `Profile.phone` | Datos de contacto identificables. |
| `Profile.documentNumber`, `documentType` | Documento de identidad. |
| `MinorApprovalRequest.*` | Datos de menores de edad — categoría de protección reforzada. |
| `Material.content`, `Material.fileUrl` | Es el producto que se vende, no la vitrina. |
| `TutorReview.comment`, `ForumPost.content` | Opiniones atribuibles a personas. |

> **Marco legal.** En Colombia rige la **Ley 1581 de 2012** (Habeas Data) y su decreto reglamentario 1377 de 2013: tratar datos personales exige autorización **previa, expresa e informada** del titular, y los datos de menores tienen protección reforzada. Por eso `POST /public/enrollments` obliga a enviar `consentGiven: true` y ningún endpoint devuelve correos.
>
> **Cuidado con los agregados.** Un promedio deja de ser anónimo cuando el grupo es diminuto: "1 inscrito en el curso X" más cualquier dato público puede bastar para identificarlo. Por eso `/public/stats` solo publica totales de toda la plataforma, nunca desagregados por curso.

---

## 2. Endpoints

### Lectura

| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| `GET` | `/public/courses` | Catálogo paginado y filtrable | 200, 400, 401 |
| `GET` | `/public/courses/:slug` | Detalle + temario | 200, 401, 404 |
| `GET` | `/public/categories` | Categorías con conteo | 200, 401 |
| `GET` | `/public/stats` | Métricas agregadas | 200, 401 |

**Parámetros de `/public/courses`** (todos opcionales, van en query string):

| Parámetro | Tipo | Por defecto | Notas |
|---|---|---|---|
| `page` | entero ≥ 1 | `1` | |
| `pageSize` | entero 1–100 | `20` | El tope de 100 es un límite de seguridad |
| `q` | texto ≤ 100 | — | Busca en título y descripción, sin distinguir mayúsculas |
| `level` | `BASIC` \| `INTERMEDIATE` \| `ADVANCED` | — | Un valor inválido da 400, no una lista vacía |
| `categorySlug` | texto | — | |
| `skillSlug` | texto | — | |
| `sortBy` | `createdAt` \| `title` \| `startDate` | `createdAt` | |
| `order` | `asc` \| `desc` | `desc` | |

### Escritura

| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| `POST` | `/public/enrollments` | Inscribe a un estudiante en un curso | 201, 400, 401, 404, 409, 422 |

### Administración interna (JWT, no para terceros)

| Método | Ruta | Rol |
|---|---|---|
| `GET` | `/courses` | ADMIN, TUTOR |
| `GET` | `/courses/:id` | ADMIN, TUTOR |
| `POST` | `/courses` | ADMIN |
| `PUT` | `/courses/:id` | ADMIN |
| `PATCH` | `/courses/:id` | ADMIN |

---

## 3. Elección de método HTTP

El verbo no es decorativo: comunica garantías que quien consume la API usa para decidir si puede reintentar, cachear o precargar.

| Verbo | Cuándo | ¿Seguro? | ¿Idempotente? | Uso aquí |
|---|---|---|---|---|
| `GET` | Consultar | Sí | Sí | Todo el catálogo |
| `POST` | Crear cuando el servidor asigna el id | No | **No** | Inscripciones |
| `PUT` | Reemplazar el recurso completo | No | Sí | Editar curso desde el formulario completo |
| `PATCH` | Modificar unos campos | No | No necesariamente | Publicar un curso: `{"status":"ACTIVE"}` |

**PUT vs PATCH, en concreto.** `PUT /courses/:id` exige el estado completo: los campos opcionales que omitas quedan en `null`. Por eso repetir la misma petición diez veces deja el curso idéntico — eso es ser idempotente, y permite al cliente reintentar sin miedo tras un timeout. `PATCH` toca solo lo que mandás.

**Por qué `POST` no es idempotente.** Reintentar `POST /public/enrollments` no crea una segunda inscripción: devuelve `409`. Preferimos un conflicto honesto antes que fingir éxito, porque el aliado necesita saber que la primera petición sí entró.

**Regla que se respeta en todas las rutas:** nunca hay verbos en la URL. No existe `/getCourses` ni `/courses/search` — buscar no es un recurso, es un filtro sobre la colección: `/courses?q=python`.

---

## 4. Formato de las respuestas

Toda respuesta —exitosa o no— viaja en el mismo sobre. Así, quien integra escribe **un solo** parser para toda la API en lugar de uno por endpoint.

### Éxito con listado

```json
{
  "success": true,
  "data": [
    {
      "id": "cmoysx6u5000cqhlhp8nqay0h",
      "slug": "intro-python",
      "title": "Introducción a la Programación con Python",
      "description": "Aprende los fundamentos de la programación usando Python…",
      "thumbnail": null,
      "level": "BASIC",
      "onlineHours": 20,
      "autonomousHours": 10,
      "startDate": null,
      "endDate": null,
      "createdAt": "2026-05-09T20:33:33.917Z",
      "category": { "name": "Programación", "slug": "programacion" },
      "skills": [],
      "enrolledCount": 1
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 5,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "timestamp": "2026-08-06T23:21:31.378Z"
}
```

`hasNextPage` está calculado a propósito: sin él, cada cliente repite la misma división y alguno la hace mal.

### Éxito con recurso único

```json
{
  "success": true,
  "data": { "id": "…", "slug": "intro-python", "modules": [ … ] },
  "timestamp": "2026-08-06T23:21:56.187Z"
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos",
    "details": [
      "level debe ser BASIC, INTERMEDIATE o ADVANCED",
      "pageSize no puede ser mayor a 100"
    ]
  },
  "timestamp": "2026-08-06T23:21:56.233Z",
  "path": "/api/v1/public/courses?pageSize=999&level=NOEXISTE"
}
```

`error.code` es un identificador **estable**: el texto de `message` puede cambiar con una traducción o una corrección de redacción, así que nadie debe programar contra él. `details` trae **todos** los errores de una vez, no el primero — así el cliente corrige todo en un solo intento.

| `error.code` | HTTP |
|---|---|
| `VALIDATION_ERROR` | 400 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `RESOURCE_NOT_FOUND` | 404 |
| `RESOURCE_CONFLICT` | 409 |
| `UNPROCESSABLE_ENTITY` | 422 |
| `INTERNAL_ERROR` | 500 |

---

## 5. Estrategia de versionado

Versionado **por URI** (`/api/v1/...`), configurado en `backend/src/main.ts`:

```ts
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: VERSION_NEUTRAL,
});
```

**Por qué URI y no header.** Una URL versionada se abre en el navegador, se pega en un chat y se cachea en un proxy tal cual está. Versionar por header (`Accept: application/vnd.eduparche.v1+json`) es más purista, pero obliga a herramientas especiales para algo tan simple como mirar una respuesta.

**Por qué `VERSION_NEUTRAL` por defecto.** Es lo que evita romper lo que ya funciona: los controladores existentes (`auth`, `users`, `badges`) no declaran versión y siguen respondiendo en `/api/auth`, `/api/users`, `/api/badges`, que es justo lo que el frontend llama hoy. Solo los controladores que declaran `version: '1'` se mueven a `/api/v1/...`. Verificado en el arranque:

```
BadgesController {/api/badges} (version: Neutral)
CoursesController {/api/courses} (version: 1)
PublicCatalogController {/api/public} (version: 1)
```

**Qué obliga a una v2.** Solo los cambios que rompen a quien ya integró:

| Cambio | ¿Rompe? | Acción |
|---|---|---|
| Agregar un campo a la respuesta | No | Va en v1 |
| Agregar un filtro opcional | No | Va en v1 |
| Agregar un endpoint | No | Va en v1 |
| **Quitar o renombrar un campo** | Sí | v2 |
| **Cambiar el tipo de un campo** | Sí | v2 |
| **Volver obligatorio un parámetro** | Sí | v2 |

Cuando llegue: se crea el controlador con `version: '2'`, ambas conviven, se anuncia la fecha de retiro de v1 y recién ahí se borra. Nunca se apaga una versión sin aviso.

---

## 6. Escalabilidad y eficiencia

Decisiones tomadas en el código, con el motivo:

**Paginación obligatoria con tope de 100.** Sin límite, el tiempo de respuesta crece con la tabla y un `?pageSize=999999` tumba la base. Con tope, el costo por petición es constante.

**`$transaction` para contar y listar.** El `count` y el `findMany` viajan juntos:

```ts
const [total, courses] = await this.prisma.$transaction([
  this.prisma.course.count({ where }),
  this.prisma.course.findMany({ where, skip, take: pageSize }),
]);
```

Dos `await` separados duplican la latencia de red y —peor— pueden devolver un `total` que no corresponde a la página si alguien inserta una fila entre ambas consultas.

**Agregaciones en la base, no en JavaScript.** `/public/stats` usa `groupBy` y `count`. Traer todos los cursos para contarlos en memoria funciona con 20 filas y se cae con 200.000.

**Proyección explícita de columnas.** Los `select` viven en `course.selects.ts`. No es solo estética: si mañana el modelo `Course` gana un campo interno, no se filtra a la API por el mero hecho de existir. Hay que agregarlo ahí a propósito.

**`Cache-Control` por endpoint.** El catálogo cambia pocas veces al día:

| Endpoint | `max-age` | Motivo |
|---|---|---|
| `/public/courses` | 300 s | Un aliado que refresca cada 30 s pasa de 10 consultas a 1 |
| `/public/categories` | 3600 s | Cambian muy rara vez |
| `/public/stats` | 600 s | Es el endpoint más pesado |

Se marcan `public` porque no contienen datos de ninguna persona: un proxy o CDN puede guardarlos sin riesgo.

**Índices pendientes.** Prisma indexa las claves foráneas y los `@unique`, pero no los campos por los que filtramos. Antes de que el catálogo crezca conviene agregar en el schema:

```prisma
model Course {
  // …
  @@index([status, level])
  @@index([status, createdAt])
}
```

Y para que `q` no haga un recorrido completo de la tabla, un índice GIN con `pg_trgm` vía migración SQL manual.

---

## 7. Pruebas en Postman

### Importar

1. Postman → **Import** → `docs/postman/EduParche-API-v1.postman_collection.json`
2. Importar también `EduParche-Local.postman_environment.json`
3. Seleccionar el entorno **EduParche - Local** arriba a la derecha

### Preparar el entorno

```bash
docker compose up -d db      # levanta PostgreSQL
npm run dev:backend          # levanta el backend en :3001
```

Ajustá en el entorno `studentEmail` (alguien NO inscrito) y `enrolledStudentEmail` (alguien YA inscrito), o los escenarios 409 y 201 no darán lo esperado.

### Qué valida cada petición

Tres pruebas corren en **todas** (definidas a nivel de colección): `Content-Type` correcto, tiempo bajo 800 ms y presencia del campo `success`. Además cada una valida su código y su forma específica.

### Resultados medidos

Ejecución real contra `localhost:3001`, PostgreSQL 16 en Docker:

| # | Escenario | Esperado | Obtenido | Tiempo |
|---|---|---|---|---|
| 1 | GET catálogo sin `X-API-Key` | 401 | ✅ 401 | 13.9 ms |
| 2 | GET catálogo con clave inválida | 401 | ✅ 401 | 2.5 ms |
| 3 | GET catálogo paginado | 200 | ✅ 200 | 137.7 ms |
| 4 | GET detalle por slug | 200 | ✅ 200 | 54.6 ms |
| 5 | GET slug inexistente | 404 | ✅ 404 | 13.8 ms |
| 6 | GET con `pageSize=999` y `level` inválido | 400 | ✅ 400 | 4.7 ms |
| 7 | GET estadísticas | 200 | ✅ 200 | 19.6 ms |
| 8 | GET categorías | 200 | ✅ 200 | 7.3 ms |
| 9 | POST sin consentimiento | 400 | ✅ 400 | 26.2 ms |
| 10 | POST correo inexistente | 404 | ✅ 404 | 31.3 ms |
| 11 | POST ya inscrito | 409 | ✅ 409 | 19.4 ms |
| 12 | POST cuenta no activa | 422 | ✅ 422 | 5.7 ms |
| 13 | POST con campo ajeno al DTO | 400 | ✅ 400 | 4.2 ms |
| 14 | POST inscripción válida | 201 | ✅ 201 | 33.5 ms |

Los 137.7 ms del escenario 3 son el **arranque en frío**: primera consulta, con el pool de conexiones de Prisma todavía sin abrir. Las siguientes lecturas bajan a 5–55 ms. Al medir rendimiento hay que descartar la primera petición o la media queda distorsionada.

### Reporte automático con Newman

Para generar evidencia sin ir clic por clic:

```bash
npm install -g newman newman-reporter-htmlextra

newman run docs/postman/EduParche-API-v1.postman_collection.json \
  -e docs/postman/EduParche-Local.postman_environment.json \
  -r cli,htmlextra \
  --reporter-htmlextra-export docs/postman/reporte.html
```

El HTML trae el tiempo de cada petición, el detalle de cada aserción y el resumen de fallos.

> ⚠️ El escenario 14 **escribe** en la base. Al repetir la colección devuelve 409 (correcto para un POST). Para volver a probar el 201, borrá la inscripción o cambiá `studentEmail`.
