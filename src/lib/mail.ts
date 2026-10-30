import nodemailer from 'nodemailer';

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_FROM);
}

export function isDevCodeDisplayEnabled() {
  return process.env.AUTH_DEV_SHOW_CODE === 'true';
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendLoginCodeEmail(to: string, code: string) {
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Код входа в Архив города Н.: ${code}`,
    text: `Ваш код входа: ${code}\n\nКод действует 10 минут. Если вы не запрашивали вход, просто проигнорируйте это письмо.`,
    html: `<p>Ваш код входа в Архив города Н.:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>Код действует 10 минут. Если вы не запрашивали вход, просто проигнорируйте это письмо.</p>`,
  });
}
