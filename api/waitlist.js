const fallbackWebhookBase64 =
  "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTUzODE2ODgwNjE4OTMxMDAyMy9QaVpLRTg0eWpjV01hNlp5MzNyeTBlSkpmOTlfcjdFX3EyU0xuWXoxdG1qOG5YWDltSnZZMDloV2t0cHlWc29kWmlZZQ==";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validSources = new Set([
  "automatic-modal",
  "appstore-header",
  "appstore-footer",
  "camera-modal",
  "googleplay-header",
  "googleplay-footer",
  "manual-modal",
]);

async function readJsonBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  if (typeof request.body === "string" || Buffer.isBuffer(request.body)) {
    return JSON.parse(request.body.toString());
  }

  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 10_000) throw new Error("Request body is too large.");
  }

  return JSON.parse(body || "{}");
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function getWebhookUrl() {
  const encodedWebhook =
    process.env.DISCORD_WAITLIST_WEBHOOK_BASE64 || fallbackWebhookBase64;
  const webhookUrl = Buffer.from(encodedWebhook, "base64").toString("utf8");
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

export default async function waitlistHandler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const source = typeof body.source === "string" ? body.source.trim() : "";

    if (!email || email.length > 254 || !emailPattern.test(email)) {
      sendJson(response, 400, { error: "Please enter a valid email address." });
      return;
    }

    if (!validSources.has(source)) {
      sendJson(response, 400, { error: "Unknown waitlist signup source." });
      return;
    }

    const discordResponse = await fetch(getWebhookUrl(), {
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
              { name: "Offer", value: "3 months free Fitroom Pro", inline: true },
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

    sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error("Waitlist submission failed:", error.message);
    sendJson(response, 502, {
      error: "Unable to join right now. Please try again in a moment.",
    });
  }
}
