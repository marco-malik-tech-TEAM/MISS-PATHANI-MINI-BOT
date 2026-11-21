"use strict";
/**
 * MISS PATHANI MINI BOT - Premium Menu (Variant 12)
 *
 *   .menu              -> premium card + buttons (all categories in a dropdown)
 *   .menu <category>   -> every command of that category as tappable rows
 *   .menu all          -> full text list of every command
 *
 * Switch style with .menutype button (premium, default) or .menutype list (classic text).
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const brand = require("../utils/brand");
const channel = require("../utils/channel");
const config = require("../config/config");
const settingsStore = require("../utils/settingsStore");
const ui = require("../utils/ui");

const VARIANT = "V12";

const CATEGORIES = {
  "OWNER": [
    "self",
    "public",
    "settings",
    "botpp",
    "getprefix",
    "getpfp",
    "pair",
    "pair2",
    "save",
    "save1",
    "kill",
    "kill2",
    "update",
    "updatenow",
    "eval",
    "antilinkall",
    "menutype",
    "rpp",
    "creategc",
    "antibot",
    "antitag",
    "welcomegoodbye",
    "broadcast",
    "restart",
    "block",
    "blocklist",
    "logout",
    "fetch",
    "shell",
    "getcmd",
    "getfile",
    "cat",
    "addsudo",
    "delsudo",
    "checksudo",
    "clearsudos",
    "oadmin",
    "mygroups",
    "fuelset",
    "confesslog"
  ],
  "GROUP": [
    "leavegroup",
    "demote",
    "promote",
    "antipromote",
    "antidemote",
    "groupinfo",
    "kick",
    "badword",
    "mute",
    "unmute",
    "tagall",
    "warn",
    "warnlist",
    "resetwarn",
    "add",
    "invite",
    "hijack",
    "join",
    "welcome",
    "goodbye",
    "setwelcome",
    "setgoodbye",
    "rgpp",
    "amute",
    "aunmute",
    "ban",
    "unban",
    "banlist",
    "demoteall",
    "promoteall",
    "close",
    "open",
    "desc",
    "subject",
    "link",
    "revoke",
    "icon",
    "hidetag",
    "antilink",
    "antigm",
    "setgreet",
    "tag",
    "disp-1",
    "disp-7",
    "disp-90",
    "disp-off",
    "approve",
    "reject",
    "admin",
    "vcf",
    "groupstatus",
    "foreigners",
    "antigstatus",
    "antispam",
    "antiword",
    "common",
    "gpp",
    "gstatus",
    "confessions",
    "confess",
    "vote"
  ],
  "SETTINGS": [
    "anticall",
    "antidelete",
    "gcantidelete",
    "antiedit",
    "autoreact",
    "chatbot",
    "wapresence",
    "autoread",
    "autorecording",
    "autotyping",
    "mode",
    "prefix",
    "autoview",
    "autolike",
    "autobio",
    "pdm",
    "zushi"
  ],
  "DOWNLOADS": [
    "download",
    "igstory",
    "pindl",
    "play2",
    "video",
    "video2",
    "audio",
    "spotify",
    "play",
    "tiktok",
    "ig",
    "fb",
    "twitter",
    "ytsearch",
    "song",
    "shazam",
    "lyrics",
    "lyrics2",
    "wiki"
  ],
  "AI": [
    "gemini",
    "askweb",
    "ocrai",
    "imagine",
    "vision2",
    "groq",
    "mi",
    "worm",
    "gpt",
    "dall",
    "bing",
    "upscale",
    "vision",
    "void",
    "vanta",
    "claude",
    "wormgpt",
    "tts",
    "vocalremover",
    "transcribe",
    "muslimai",
    "bibleai",
    "speechwriter"
  ],
  "USER": [
    "block",
    "unblock",
    "pp",
    "fullpp",
    "jid",
    "gjid",
    "left",
    "spam",
    "ison",
    "userinfo"
  ],
  "TOOLS": [
    "fancy",
    "webscan",
    "zip",
    "screenshot",
    "gitclone",
    "apk",
    "clearcache",
    "qr",
    "upload",
    "zodiac",
    "url",
    "define",
    "shorten",
    "color",
    "linkcheck",
    "exif",
    "encrypt",
    "decrypt",
    "hashtags",
    "igcaption",
    "mockup",
    "cv",
    "fuel",
    "worldtime"
  ],
  "FOOTBALL": [
    "livescore",
    "fixtures",
    "bundesliga",
    "epl",
    "laliga",
    "ligue1",
    "seriea",
    "ucl",
    "news",
    "playersearch",
    "teamsearch",
    "fifa",
    "fifaplayoffs",
    "euro",
    "eplscorers",
    "laligascorers",
    "bundesligascorers",
    "serieascorers",
    "ligue1scorers",
    "uclscorers",
    "nba"
  ],
  "CODING": [
    "enc",
    "gpass",
    "compile-py",
    "compile-js",
    "compile-c",
    "compile-c++",
    "base",
    "unbase"
  ],
  "MEDIA": [
    "s",
    "take",
    "photo",
    "mix",
    "smeme",
    "vv",
    "vv2",
    "removebg",
    "imagesearch",
    "similarimage",
    "remini",
    "bass",
    "deep",
    "robot",
    "chipmunk",
    "nightcore",
    "reverse",
    "slow",
    "fast",
    "earrape",
    "fliptext",
    "uuid",
    "whois",
    "geoip",
    "vidframe",
    "stitch",
    "compress",
    "crop",
    "subtitle",
    "pitch",
    "volume",
    "denoise",
    "echo"
  ],
  "EFFECTS": [
    "sketch",
    "duotone",
    "pixelart",
    "slowzoom",
    "cinema",
    "mirror",
    "loop",
    "polaroid"
  ],
  "DESIGN": [
    "logo",
    "banner",
    "intro",
    "countdown",
    "quotecard",
    "lyricsvideo"
  ],
  "FUN": [
    "autostatusreply",
    "statusdl",
    "muth",
    "aura",
    "vibe",
    "roast",
    "meme",
    "nickname",
    "glitch",
    "frame",
    "rainbow",
    "ascii"
  ],
  "WHATSAPP": [
    "poll",
    "react",
    "del",
    "setstatus",
    "status",
    "caption",
    "doc",
    "cinfo",
    "clear"
  ],
  "CONVERTER": [
    "topdf",
    "toexcel",
    "toword",
    "tovideo",
    "toviewonce",
    "toaudio",
    "toimg",
    "totext",
    "attp",
    "ocr",
    "carbon",
    "cut",
    "merge",
    "tovn"
  ],
  "GAMES": [
    "game",
    "tictactoe",
    "move",
    "ttend",
    "rps",
    "wordguess",
    "guess",
    "wgend",
    "mathquiz",
    "mans",
    "answer"
  ],
  "UTILITY": [
    "marco",
    "trt",
    "bot",
    "runtime",
    "script",
    "owner",
    "calc",
    "donate",
    "alive",
    "help",
    "joke",
    "menu",
    "ping",
    "quote",
    "user",
    "stats",
    "uptime",
    "time",
    "remind",
    "remindtone",
    "reminders",
    "unremind"
  ]
};

const META = {
  OWNER: ["👑", "Owner Control"], GROUP: ["👥", "Group Management"], SETTINGS: ["⚙️", "Bot Settings"],
  DOWNLOADS: ["📥", "Downloaders"], AI: ["🤖", "AI Tools"], USER: ["🙋", "User Tools"],
  TOOLS: ["🛠️", "Smart Tools"], FOOTBALL: ["⚽", "Football Live"], CODING: ["💻", "Coding"],
  MEDIA: ["🎬", "Media Studio"], EFFECTS: ["✨", "Effects"], DESIGN: ["🎨", "Design"],
  FUN: ["🎉", "Fun Zone"], WHATSAPP: ["💬", "WhatsApp Tools"], CONVERTER: ["🔄", "Converters"],
  GAMES: ["🎮", "Games"], UTILITY: ["🧰", "Utilities"], MORE: ["💎", "More Commands"],
};
const RISKY = new Set(["logout", "restart", "kill", "kill2", "shell", "eval", "clearsudos", "leavegroup", "hijack", "broadcast", "update", "updatenow"]);

const fmtUptime = (s) => {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return (d ? d + "d " : "") + h + "h " + m + "m";
};

/** Category -> command names that really exist; unlisted commands go to MORE. */
function buildCategories(commands) {
  const have = new Map();
  for (const cmd of new Set(commands.values())) have.set(String(cmd.name).toLowerCase(), cmd);
  const out = {};
  const used = new Set();
  for (const [cat, names] of Object.entries(CATEGORIES)) {
    const list = names.filter((n) => commands.has(n)).map((n) => commands.get(n).name.toLowerCase());
    const uniq = [...new Set(list)];
    uniq.forEach((n) => used.add(n));
    if (uniq.length) out[cat] = uniq;
  }
  const rest = [...have.keys()].filter((n) => !used.has(n)).sort();
  if (rest.length) out.MORE = rest;
  return { cats: out, have };
}

function image() {
  const a = path.join(__dirname, "../assets/bot.jpg");
  const b = path.join(__dirname, "../assets/script.jpg");
  if (fs.existsSync(a)) return fs.readFileSync(a);
  if (fs.existsSync(b)) return fs.readFileSync(b);
  return null;
}

function now() {
  const d = new Date();
  const date = new Intl.DateTimeFormat("en-GB", { timeZone: config.timezone, day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: config.timezone, hour: "2-digit", minute: "2-digit", hour12: true }).format(d);
  return { date, time };
}

function mainCaption(msg, p, total, catCount) {
  const { date, time } = now();
  const totalGb = os.totalmem() / 1073741824, freeGb = os.freemem() / 1073741824;
  const mode = String(settingsStore.get("mode", config.WORK_TYPE) || "public").toUpperCase();
  const name = (msg.pushName || "User").slice(0, 24);
  return [
    "╭━━━━━━━━━━━━━━━━━━━━━╮",
    "   👑 *" + brand.BOT_NAME + "* 👑",
    "╰━━━━━━━━━━━━━━━━━━━━━╯",
    "",
    "✨ _Welcome,_ *" + name + "* 💜",
    "",
    "╭─❖ 🤖 *BOT INFO* ❖─",
    "│ 👨‍💻 *Developer:* " + brand.DEVELOPER,
    "│ 💎 *Edition:* Premium " + VARIANT,
    "│ 🟢 *Status:* Online 24/7",
    "│ ⚙️ *Mode:* " + mode,
    "│ 🔰 *Prefix:* [ " + p + " ]",
    "│ 📦 *Commands:* " + total + " in " + catCount + " categories",
    "╰────────────────",
    "",
    "╭─❖ 📊 *SYSTEM* ❖─",
    "│ 🕒 *Time:* " + time,
    "│ 📅 *Date:* " + date,
    "│ ⏳ *Uptime:* " + fmtUptime(process.uptime()),
    "│ 💾 *RAM:* " + (totalGb - freeGb).toFixed(1) + " / " + totalGb.toFixed(1) + " GB",
    "╰────────────────",
    "",
    "👇 *Tap* _📂 Open Menu_ *below and pick a category.*",
  ].join("\n");
}

function mainButtons(cats, p) {
  const rows = Object.entries(cats).map(([cat, list]) => ({
    title: (META[cat] ? META[cat][0] : "📁") + " " + cat,
    description: (META[cat] ? META[cat][1] : cat) + " • " + list.length + " cmds",
    id: p + "menu " + cat.toLowerCase(),
  }));
  return [
    { type: "list", text: "📂 Open Menu", sections: [{ title: "💎 " + brand.BOT_NAME + " — Categories", highlight: "PREMIUM", rows }] },
    { type: "reply", text: "⚡ Ping", id: p + "ping" },
    { type: "reply", text: "👑 Owner", id: p + "owner" },
    { type: "url", text: "📢 Join Channel", url: brand.CHANNEL_URL },
  ];
}

function categoryButtons(cat, list, have, p) {
  const sections = [];
  for (let i = 0; i < list.length; i += 10) {
    const chunk = list.slice(i, i + 10);
    sections.push({
      title: (META[cat] ? META[cat][0] : "📁") + " " + cat + (list.length > 10 ? " (" + (Math.floor(i / 10) + 1) + "/" + Math.ceil(list.length / 10) + ")" : ""),
      rows: chunk.map((n) => {
        const d = String((have.get(n) && have.get(n).description) || "Tap to run").replace(/\s+/g, " ");
        return { title: p + n, description: (RISKY.has(n) ? "⚠️ " : "") + d, id: p + n };
      }),
    });
  }
  return [
    { type: "list", text: "📋 Select Command", sections },
    { type: "reply", text: "⬅️ Back to Menu", id: p + "menu" },
    { type: "reply", text: "👑 Owner", id: p + "owner" },
  ];
}

function allText(cats, p) {
  let t = "╭━━━❲〘 *" + brand.BOT_NAME + "* 〙❳━━━\n> ┃ *Developer:* " + brand.DEVELOPER + "\n> ┃ *Edition:* Premium " + VARIANT + "\n╰━━━━━━━❮ ◈ ❯━━━━━━\n\n";
  for (const [cat, list] of Object.entries(cats)) {
    t += "╭━━⟦ " + (META[cat] ? META[cat][0] : "📁") + " *" + cat + "-CMDS* ⟧\n> ╭━\n";
    list.forEach((n) => (t += "> ├⊷ " + p + n + "\n"));
    t += "> ╰━\n╰━━\n\n";
  }
  return t + "> _" + brand.FOOTER + "_";
}

module.exports = {
  name: "menu",
  aliases: ["allmenu", "commands", "cmds"],
  description: "Premium button menu (Variant 12). Usage: .menu [category|all]",
  async execute(sock, msg, args, commands) {
    const jid = msg.key.remoteJid;
    const p = ui.prefix();
    const { cats, have } = buildCategories(commands);
    const total = have.size;
    const ctx = await channel.forwardContext(sock).catch(() => undefined);
    const img = image();
    const arg = String((args && args[0]) || "").toLowerCase();

    if (arg === "all" || settingsStore.get("menutype", "button") === "list" && !arg) {
      const text = allText(cats, p);
      return img
        ? sock.sendMessage(jid, { image: img, caption: text, contextInfo: ctx }, { quoted: msg })
        : sock.sendMessage(jid, { text, contextInfo: ctx }, { quoted: msg });
    }

    const key = Object.keys(cats).find((c) => c.toLowerCase() === arg);
    if (key) {
      const list = cats[key];
      const meta = META[key] || ["📁", key];
      const body = [
        "╭━━━ " + meta[0] + " *" + key + "* ━━━╮",
        "   " + meta[1] + " • *" + list.length + "* commands",
        "╰━━━━━━━━━━━━━━━━━━╯",
        "",
        "👇 Tap *📋 Select Command* and choose any command — it runs instantly.",
      ].join("\n");
      return ui.sendButtons(sock, jid, {
        image: img, title: brand.BOT_NAME, body, footer: brand.FOOTER + " • " + VARIANT,
        buttons: categoryButtons(key, list, have, p), quoted: msg, contextInfo: ctx,
      });
    }

    return ui.sendButtons(sock, jid, {
      image: img, title: "💎 " + brand.BOT_NAME, body: mainCaption(msg, p, total, Object.keys(cats).length),
      footer: brand.FOOTER + " • Premium " + VARIANT,
      buttons: mainButtons(cats, p), quoted: msg, contextInfo: ctx,
    });
  },
};
