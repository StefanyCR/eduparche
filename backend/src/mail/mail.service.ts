import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPasswordReset(to: string, token: string, firstName: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/recuperar-contrasena/nueva?token=${token}`;

    await this.transporter.sendMail({
      from: `"EduParche" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Restablece tu contraseña — EduParche',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
          <h2 style="color: #6c47ff;">EduParche</h2>
          <p>Hola <strong>${firstName}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p>Haz clic en el botón para crear una nueva contraseña. El enlace expira en <strong>1 hora</strong>.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}"
               style="background: #6c47ff; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Restablecer contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 13px;">
            Si no solicitaste esto, puedes ignorar este correo. Tu contraseña no cambiará.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #aaa; font-size: 12px;">© EduParche — Plataforma educativa</p>
        </div>
      `,
    });

    this.logger.log(`Email de recuperación enviado a ${to}`);
  }
}
