// app/api/contact/route.ts
import { NextResponse } from "next/server";

// Opción A: Resend (recomendada por simplicidad)
// npm i resend
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const CONTACT_TO = process.env.CONTACT_TO || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contacto@aureya.es";
const CONTACT_FROM = process.env.CONTACT_FROM || "Aureya <noreply@aureya.es>"; // debe estar verificado en Resend

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const { name, from, topic, msg } = await req.json();

    // Validaciones sencillas
    if (!from || !/.+@.+\..+/.test(from)) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }
    if (!msg || String(msg).trim().length < 5) {
      return NextResponse.json({ ok: false, error: "Mensaje demasiado corto" }, { status: 400 });
    }

    const subject = `[Aureya] ${topic || "consulta"} — ${name || "Sin nombre"}`;

    if (!resend) {
      return NextResponse.json({ ok: false, error: "RESEND_API_KEY no configurada" }, { status: 500 });
    }

    // Contenido del email (texto y HTML muy simple)
    const text = `Nombre: ${name || "-"}\nEmail: ${from}\nMotivo: ${topic || "-"}\n\n${msg}`;
    const html = `
      <table style="font-family:Inter,system-ui,Arial,sans-serif;font-size:14px;color:#0b0b0b">
        <tr><td style="padding:4px 0"><strong>Nombre:</strong></td><td>${name || "-"}</td></tr>
        <tr><td style="padding:4px 0"><strong>Email:</strong></td><td>${from}</td></tr>
        <tr><td style="padding:4px 0"><strong>Motivo:</strong></td><td>${topic || "-"}</td></tr>
      </table>
      <hr style="border:none;height:1px;background:linear-gradient(90deg,transparent, #c7a247, transparent);" />
      <pre style="white-space:pre-wrap;line-height:1.5;margin-top:8px">${(msg || "").replace(/</g,"&lt;")}</pre>
    `;

    const r = await resend.emails.send({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      replyTo: from,
      subject,
      text,
      html,
    });

    if (r.error) {
      return NextResponse.json({ ok: false, error: r.error.message || "Error enviando email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error inesperado" }, { status: 500 });
  }
}

/* ============================================
   Opción B: SMTP con Nodemailer (alternativa)
   --------------------------------------------
   npm i nodemailer
   Descomenta y usa esto en lugar de Resend:
-----------------------------------------------
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
});

... dentro del POST:
await transporter.sendMail({
  from: CONTACT_FROM,
  to: CONTACT_TO,
  replyTo: from,
  subject,
  text,
  html,
});
=============================================*/
