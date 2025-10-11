// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

// --- Rate limit en memoria (micro) ---
const WINDOW_MS = 60 * 60 * 1000; // 10 minutos
const MAX_PER_WINDOW = 5;         // 5 peticiones / ventana / IP
const ipHits = new Map<string, number[]>(); // ip -> timestamps (ms)

function getClientIp(req: Request) {
  // Vercel / proxies comunes
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  // fallback
  return "unknown";
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const arr = ipHits.get(ip) || [];
  // Limpia hits fuera de ventana
  const recent = arr.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    // Cuánto falta para poder volver a intentar
    const oldest = recent[0];
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    return { allowed: false, retryAfterSec, remaining: 0 };
  }
  recent.push(now);
  ipHits.set(ip, recent);
  return {
    allowed: true,
    retryAfterSec: 0,
    remaining: Math.max(0, MAX_PER_WINDOW - recent.length),
  };
}

// --- Handler ---
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfterSec),
          "X-RateLimit-Limit": String(MAX_PER_WINDOW),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  }

  try {
    const { name, email, subject, message } = await req.json();

    // Validación mínima + honeypot (opcional si añades un campo oculto "hp" en el form)
    if (!email || !message) {
      return NextResponse.json({ ok: false, error: "Email y mensaje son obligatorios" }, { status: 400 });
    }
    if (typeof email !== "string" || typeof message !== "string") {
      return NextResponse.json({ ok: false, error: "Formato inválido" }, { status: 400 });
    }

    const CONTACT_TO = process.env.CONTACT_TO!;
    const CONTACT_FROM = process.env.CONTACT_FROM || "Aureya <noreply@aureya.es>";

    const safeName = (typeof name === "string" && name.slice(0, 200)) || "";
    const safeSubject = (typeof subject === "string" && subject.slice(0, 200)) || "";

    const text = [
      `De: ${safeName || "(sin nombre)"} <${email}>`,
      `Asunto: ${safeSubject || "(sin asunto)"}`,
      "",
      message,
    ].join("\n");

    const html = `
      <p><strong>De:</strong> ${escapeHtml(safeName || "(sin nombre)")} &lt;${escapeHtml(email)}&gt;</p>
      <p><strong>Asunto:</strong> ${escapeHtml(safeSubject || "(sin asunto)")}</p>
      <hr/>
      <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${escapeHtml(
        message || ""
      )}</pre>
      <p style="margin-top:12px;color:#999;">IP: ${escapeHtml(ip)}</p>
    `;

    // Enviar con Resend
    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      replyTo: email,
      subject: safeSubject || "Nuevo mensaje de contacto",
      text,
      html,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": String(MAX_PER_WINDOW),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}

// util sencillo para evitar HTML injection en el correo
function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
