import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  VersioningType,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // ─── Versionado de la API ───────────────────────────────────────────────
  // Tipo URI: la versión viaja en la ruta (/api/v1/...). Se elige frente a
  // versionar por header porque una URL versionada se puede abrir en el
  // navegador, compartir por chat y cachear en un proxy tal cual está.
  //
  // defaultVersion: VERSION_NEUTRAL es la clave para no romper nada. Los
  // controladores que ya existen (auth, users, badges) no declaran versión,
  // así que siguen respondiendo en /api/auth, /api/users, /api/badges — que
  // es justo lo que el frontend ya está llamando hoy.
  // Solo los controladores que declaran `version: '1'` pasan a /api/v1/...
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      // Se valida y transforma el body de la request a la clase DTO correspondiente.
      transform: true,
    }),
  );

  // ─── CORS ────────────────────────────────────────────────────────────────
  // Conviven DOS frontends contra este mismo backend:
  //   :3000 → Next.js (panel de administración y app actual)
  //   :4200 → Angular (evidencias EV01 y EV02)
  // Por eso el origen permitido es una LISTA y no un valor único: con un solo
  // origen, el navegador bloquearía todas las peticiones del otro frontend.
  //
  // credentials: true es obligatorio para que el navegador envíe la cookie de
  // sesión (ep_token) en peticiones cross-origin. Sin esto, cada petición
  // llegaría sin cookie y el backend respondería 401.
  //
  // Se conserva FRONTEND_URL por compatibilidad con el despliegue existente.
  const allowedOrigins = (
    process.env.CORS_ORIGINS ??
    process.env.FRONTEND_URL ??
    'http://localhost:3000,http://localhost:4200'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Parsea las cookies de cada request y las deja en req.cookies
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
