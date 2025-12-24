// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

/* -------------------- Utils -------------------- */
function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return "unknown";
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clamp(s: string, max: number) {
  const t = (s || "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

function getResend() {
  const key = (process.env.RESEND_API_KEY || "").trim();
  if (!key) return null;
  return new Resend(key);
}

/* -------------------- Upstash -------------------- */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// IP: 3 / 10 min
const rlIp = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "10 m"),
      analytics: true,
      prefix: "rl:contact:ip",
    })
  : null;

// Email: 2 / 10 min
const rlEmail = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2, "10 m"),
      analytics: true,
      prefix: "rl:contact:email",
    })
  : null;

function rateLimitHeaders(limit: number, remaining: number, reset: number) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
  };
}

/* -------------------- Handler -------------------- */
const TOPICS = ["general", "incidencia", "tienda", "colaboracion", "legal"] as const;
type Topic = (typeof TOPICS)[number];

export async function POST(req: Request) {
  const ip = getClientIp(req);

  try {
    const body = (await req.json()) as {
      name?: string;
      from?: string; // ContactForm
      topic?: string; // ContactForm
      msg?: string; // ContactForm
      hp?: string; // honeypot opcional
    };

    // Honeypot -> responde OK sin hacer nada
    if (body?.hp) return NextResponse.json({ ok: true }, { status: 200 });

    const name = clamp(body?.name || "", 80);
    const email = clamp(body?.from || "", 120).toLowerCase();
    const topicRaw = (body?.topic || "general").trim().toLowerCase();
    const topic: Topic = (TOPICS.includes(topicRaw as Topic) ? (topicRaw as Topic) : "general");
    const message = (body?.msg || "").trim();

    // Validaciones
    if (!email || !message) {
      return NextResponse.json({ ok: false, error: "Email y mensaje son obligatorios" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }
    if (message.length < 20) {
      return NextResponse.json({ ok: false, error: "El mensaje es demasiado corto" }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ ok: false, error: "El mensaje es demasiado largo (máx. 2000 caracteres)" }, { status: 400 });
    }

    // Rate limit (si no hay Upstash configurado, deja pasar)
    if (rlIp) {
      const r = await rlIp.limit(`ip:${ip}`);
      if (!r.success) {
        return NextResponse.json(
          { ok: false, error: "Too many requests" },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.max(1, Math.ceil((r.reset - Date.now()) / 1000))),
              ...rateLimitHeaders(r.limit, r.remaining, r.reset),
            },
          }
        );
      }
    }
    if (rlEmail) {
      const r = await rlEmail.limit(`email:${email}`);
      if (!r.success) {
        return NextResponse.json(
          { ok: false, error: "Too many requests" },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.max(1, Math.ceil((r.reset - Date.now()) / 1000))),
              ...rateLimitHeaders(r.limit, r.remaining, r.reset),
            },
          }
        );
      }
    }

    // Envío de email
    const resend = getResend();
    if (!resend) {
      return NextResponse.json(
        { ok: false, error: "Email service not configured (RESEND_API_KEY missing)" },
        { status: 503 }
      );
    }

    const CONTACT_TO = (process.env.CONTACT_TO || "contacto@aureya.es").trim();

    // Recomendación: que exista de verdad en tu dominio (Zoho), p.ej. contacto@aureya.es
    const CONTACT_FROM = (process.env.CONTACT_FROM || "Aureya <contacto@aureya.es>").trim();

    const topicLabel: Record<Topic, string> = {
      general: "General",
      incidencia: "Incidencia / precio",
      tienda: "Soy una tienda",
      colaboracion: "Colaboración / prensa",
      legal: "Legal",
    };

    const subject = `[Contacto] ${topicLabel[topic]} — ${email}`;

    const text = [
      `De: ${name || "(sin nombre)"} <${email}>`,
      `Tema: ${topicLabel[topic]}`,
      "",
      message,
    ].join("\n");

    const html = `
      <p><strong>De:</strong> ${escapeHtml(name || "(sin nombre)")} &lt;${escapeHtml(email)}&gt;</p>
      <p><strong>Tema:</strong> ${escapeHtml(topicLabel[topic])}</p>
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
