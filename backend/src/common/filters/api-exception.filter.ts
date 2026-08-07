import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/** Forma única de todo error de la API pública. */
export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
}

/**
 * Traduce el status HTTP a un código de error estable y legible.
 *
 * ¿Por qué un código propio si ya existe el status HTTP?
 * El número (404) le dice a quien consume QUÉ pasó a nivel de protocolo, pero
 * no POR QUÉ. Además el texto del mensaje puede cambiar (traducciones, ajustes
 * de redacción) y no se debe programar contra un string que cambia. El `code`
 * es un identificador estable contra el cual el cliente puede hacer `switch`.
 */
const STATUS_TO_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
  [HttpStatus.CONFLICT]: 'RESOURCE_CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Ocurrió un error inesperado';
    let details: unknown;

    if (isHttp) {
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const parsed = body as { message?: string | string[] };

        // El ValidationPipe devuelve `message` como array de strings
        if (Array.isArray(parsed.message)) {
          message = 'Los datos enviados no son válidos';
          details = parsed.message;
        } else if (typeof parsed.message === 'string') {
          message = parsed.message;
        }
      }
    } else {
      // Error no controlado: se registra completo en el servidor, pero al
      // cliente solo le llega un mensaje genérico. 
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const payload: ApiErrorEnvelope = {
      success: false,
      error: {
        code: STATUS_TO_CODE[status] ?? 'UNKNOWN_ERROR',
        message,
        ...(details !== undefined ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(payload);
  }
}
