// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return "unknown";
}

function escapeHtml(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// ---- Upstash rate limit ----
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// 5 envíos / 10 minutos por IP
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "10 m"),
      analytics: true,
      prefix: "rl:contact",
    })
  : null;

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Rate limit (si no está configurado, deja pasar pero avisa en header)
  if (ratelimit) {
    const { success, limit, remaining, reset } = await ratelimit.limit(`ip:${ip}`);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
          },
        }
      );
    }
  }

  try {
    const body = (await req.json()) as {
      name?: string;
      from?: string;   // viene de tu ContactForm
      topic?: string;  // viene de tu ContactForm
      msg?: string;    // viene de tu ContactForm
      hp?: string;     // honeypot opcional
    };

    // Honeypot
    if (body.hp) return NextResponse.json({ ok: true }, { status: 200 });

    const name = (body.name || "").trim();
    const email = (body.from || "").trim();
    const topic = (body.topic || "consulta").trim();
    const message = (body.msg || "").trim();

    if (!email || !message) {
      return NextResponse.json({ ok: false, error: "Email y mensaje son obligatorios" }, { status: 400 });
    }

    // Validación simple email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json(
        { ok: false, error: "Email service not configured (RESEND_API_KEY missing)" },
        { status: 503 }
      );
    }

    const CONTACT_TO = process.env.CONTACT_TO || "contacto@aureya.es";
    const CONTACT_FROM = process.env.CONTACT_FROM || "Aureya <noreply@aureya.es>";

    const subject = `Contacto (${topic}) · Aureya`;

    const text = [
      `De: ${name || "(sin nombre)"} <${email}>`,
      `Tema: ${topic}`,
      `IP: ${ip}`,
      "",
      message,
    ].join("\n");

    const html = `
      <p><strong>De:</strong> ${escapeHtml(name || "(sin nombre)")} &lt;${escapeHtml(email)}&gt;</p>
      <p><strong>Tema:</strong> ${escapeHtml(topic)}</p>
      <p style="color:#999"><strong>IP:</strong> ${escapeHtml(ip)}</p>
      <hr/>
      <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${escapeHtml(
        message
      )}</pre>
    `;

    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      replyTo: email,
      subject,
      text,
      html,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
