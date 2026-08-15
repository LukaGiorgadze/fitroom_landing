import {
  fallbackWebhookBase64,
  validWaitlistSources,
  waitlistEmailPattern,
} from "../../api/waitlist-config.js";

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

function sendJson(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...jsonHeaders, ...extraHeaders },
  });
}

function getWebhookUrl(env) {
  const encodedWebhook =
    env.DISCORD_WAITLIST_WEBHOOK_BASE64 || fallbackWebhookBase64;
  const webhookUrl = atob(encodedWebhook);
  const parsedUrl = new URL(webhookUrl);

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname !== "discord.com" ||
    !parsedUrl.pathname.startsWith("/api/webhooks/")
  ) {
    throw new Error("The waitlist webhook is not configured correctly.");
  }

  return webhookUrl;
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const source = typeof body.source === "string" ? body.source.trim() : "";

    if (
      !email ||
      email.length > 254 ||
      !waitlistEmailPattern.test(email)
    ) {
      return sendJson(400, { error: "Please enter a valid email address." });
    }

    if (!validWaitlistSources.has(source)) {
      return sendJson(400, { error: "Unknown waitlist signup source." });
    }

    const discordResponse = await fetch(getWebhookUrl(env), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Fitroom Waitlist",
        embeds: [
          {
            title: "New Fitroom waitlist signup",
            color: 0x111318,
            fields: [
              { name: "Email", value: email },
              {
                name: "Offer",
                value: "3 months free Fitroom Pro",
                inline: true,
              },
              { name: "Source", value: source, inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!discordResponse.ok) {
      throw new Error(`Discord returned status ${discordResponse.status}.`);
    }

    return sendJson(200, { ok: true });
  } catch (error) {
    console.error("Waitlist submission failed:", error.message);
    return sendJson(502, {
      error: "Unable to join right now. Please try again in a moment.",
    });
  }
}

export function onRequest() {
  return sendJson(
    405,
    { error: "Method not allowed." },
    { Allow: "POST" },
  );
}
