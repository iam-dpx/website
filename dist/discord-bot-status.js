/*
  discord-bot-status.ts
  Dead Pixel — live status panel for the Discord bot project page
  Written by Dead Pixel (iamreal.dpx@gmail.com)

  Fetches from the bot's own Cloudflare Worker /info endpoint — that
  Worker is the only place the bot's token lives, so this page only ever
  sees the public info the Worker chooses to hand back.

  Points at the deployed Worker's /info endpoint.
*/
const BOT_API_BASE = "https://discord-bot.iamreal-dpx.workers.dev";
function renderStatus(container, info) {
    var _a;
    if (info.status !== "operational" || !info.username) {
        container.innerHTML = `<p class="section__body">Live bot info isn't reachable right now.</p>`;
        return;
    }
    container.innerHTML = `
    <img class="bot-status__avatar" src="${info.avatarUrl}" alt="${info.username}'s avatar" width="48" height="48" />
    <div class="bot-status__details">
      <p class="bot-status__name">${info.username}</p>
      <p class="bot-status__meta">
        <span class="bot-status__dot"></span>
        Operational · ${(_a = info.commandCount) !== null && _a !== void 0 ? _a : 0} commands available
      </p>
    </div>
  `;
}
async function initBotStatus() {
    const container = document.getElementById("botStatus");
    if (!container)
        return;
    try {
        const res = await fetch(`${BOT_API_BASE}/info`);
        const info = (await res.json());
        renderStatus(container, info);
    }
    catch {
        renderStatus(container, { status: "unavailable" });
    }
}
document.addEventListener("DOMContentLoaded", initBotStatus);
export {};
