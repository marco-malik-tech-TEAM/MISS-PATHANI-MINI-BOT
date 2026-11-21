"use strict";
/**
 * MISS PATHANI MINI BOT - premium button UI helper.
 *
 * sendButtons() sends a WhatsApp "native flow" interactive message:
 *   - quick reply buttons   { type: "reply", text, id }
 *   - link buttons          { type: "url",   text, url }
 *   - copy-code buttons     { type: "copy",  text, code }
 *   - list (dropdown) menu  { type: "list",  text, sections: [{ title, rows: [{ title, description, id }] }] }
 *
 * When the user taps a button/row, WhatsApp sends back its `id`. The id is a normal
 * command string (for example ".play2 song name"), and events/messages.js turns that reply
 * into text, so a tap behaves exactly like typing the command.
 *
 * If WhatsApp refuses the interactive message (older client, API change ...) the helper
 * automatically falls back to a clean text menu, so the bot never goes silent.
 */
const brand = require("./brand");
const config = require("../config/config");
const settingsStore = require("./settingsStore");

let baileys = null;
function B() {
  if (!baileys) baileys = require("@whiskeysockets/baileys");
  return baileys;
}

const prefix = () => settingsStore.get("prefix", config.prefix) || ".";

function buildButton(b) {
  if (b.type === "url") {
    return { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: b.text, url: b.url, merchant_url: b.url }) };
  }
  if (b.type === "copy") {
    return { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: b.text, copy_code: b.code }) };
  }
  if (b.type === "list") {
    return {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: b.text,
        sections: (b.sections || []).map((s) => ({
          title: s.title,
          highlight_label: s.highlight || "",
          rows: (s.rows || []).map((r) => ({
            header: r.header || "",
            title: String(r.title).slice(0, 24),
            description: String(r.description || "").slice(0, 72),
            id: r.id,
          })),
        })),
      }),
    };
  }
  return { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: b.text, id: b.id }) };
}

/** Plain text version of the same menu (used when interactive messages are not accepted). */
function textFallback({ title, body, footer, buttons }) {
  const lines = [];
  if (title) lines.push("*" + title + "*", "");
  if (body) lines.push(body, "");
  for (const b of buttons || []) {
    if (b.type === "list") {
      for (const s of b.sections || []) {
        lines.push("*" + s.title + "*");
        for (const r of s.rows) lines.push("  ▸ " + r.id + (r.description ? "  — " + String(r.description).slice(0, 40) : ""));
        lines.push("");
      }
    } else if (b.type === "url") lines.push("🔗 " + b.text + ": " + b.url);
    else if (b.type === "copy") lines.push("📋 " + b.text + ": " + b.code);
    else lines.push("▸ " + b.text + " → " + b.id);
  }
  if (footer) lines.push("", "> _" + footer + "_");
  return lines.join("\n");
}

/**
 * opts: { image: Buffer|{url}|null, title, body, footer, buttons: [...], quoted, contextInfo }
 */
async function sendButtons(sock, jid, opts) {
  const { image, title, body, footer, buttons, quoted, contextInfo } = opts;
  try {
    const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = B();
    let header = { title: title || "", subtitle: "", hasMediaAttachment: false };
    if (image) {
      const media = await prepareWAMessageMedia({ image }, { upload: sock.waUploadToServer });
      header = { title: title || "", subtitle: "", hasMediaAttachment: true, imageMessage: media.imageMessage };
    }
    const interactiveMessage = proto.Message.InteractiveMessage.create({
      body: { text: body || " " },
      footer: { text: footer || brand.FOOTER },
      header,
      nativeFlowMessage: { buttons: (buttons || []).map(buildButton), messageParamsJson: "" },
      contextInfo: contextInfo || undefined,
    });
    const content = {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage,
        },
      },
    };
    const waMsg = generateWAMessageFromContent(jid, content, { quoted, userJid: sock.user && sock.user.id });
    const additionalNodes = [
      {
        tag: "biz",
        attrs: {},
        content: [
          { tag: "interactive", attrs: { type: "native_flow", v: "1" }, content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }] },
        ],
      },
    ];
    await sock.relayMessage(jid, waMsg.message, { messageId: waMsg.key.id, additionalNodes });
    return waMsg;
  } catch (e) {
    console.error("[UI] interactive message failed, using text fallback:", e && e.message);
    const text = textFallback({ title, body, footer, buttons });
    if (image) {
      try { return await sock.sendMessage(jid, { image, caption: text, contextInfo }, { quoted }); } catch (_) {}
    }
    return sock.sendMessage(jid, { text, contextInfo }, { quoted });
  }
}

/** Turns a tapped button / list row / template reply into the command text it carries. */
function extractReplyId(m) {
  if (!m) return "";
  try {
    const ir = m.interactiveResponseMessage;
    if (ir) {
      const raw = ir.nativeFlowResponseMessage && ir.nativeFlowResponseMessage.paramsJson;
      if (raw) {
        const j = JSON.parse(raw);
        if (j && j.id) return String(j.id);
      }
      return (ir.body && ir.body.text) || "";
    }
  } catch (_) {}
  return (
    (m.buttonsResponseMessage && m.buttonsResponseMessage.selectedButtonId) ||
    (m.listResponseMessage && m.listResponseMessage.singleSelectReply && m.listResponseMessage.singleSelectReply.selectedRowId) ||
    (m.templateButtonReplyMessage && m.templateButtonReplyMessage.selectedId) ||
    ""
  );
}

/** Commands described as "on|off" get ON / OFF buttons when used without an argument. */
function isToggle(cmd) { return !!cmd && /\bon\s*[|\/]\s*off\b/i.test(String(cmd.description || "")); }
async function sendToggle(sock, msg, cmd) {
  const p = prefix();
  const name = cmd.name;
  return sendButtons(sock, msg.key.remoteJid, {
    title: brand.BOT_NAME,
    body: "⚙️ *" + p + name + "*\n\n" + String(cmd.description || "").replace(/\s*Usage:.*$/i, "") + "\n\n👇 Choose an option:",
    footer: brand.FOOTER,
    buttons: [
      { type: "reply", text: "✅ Turn ON", id: p + name + " on" },
      { type: "reply", text: "❌ Turn OFF", id: p + name + " off" },
      { type: "reply", text: "📋 Main Menu", id: p + "menu" },
    ],
    quoted: msg,
  });
}

module.exports = { isToggle, sendToggle, sendButtons, extractReplyId, textFallback, prefix };
