import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // credentials: true es obligatorio para que el browser envíe cookies
  // en requests cross-origin (frontend :3000 → backend :3001)
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Parsea las cookies de cada request y las deja en req.cookies
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
