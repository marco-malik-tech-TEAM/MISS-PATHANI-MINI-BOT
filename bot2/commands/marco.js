const brand = require("../utils/brand");

module.exports = {
  name: "marco",
  aliases: ["about", "team-info"],
  description: "Shows who is behind the bot.",
  async execute(sock, msg) {
    const text =
      `╭──〔 👑 ${brand.TEAM.toUpperCase()} 〕──╮\n` +
      `👨‍💻 *Developer:* ${brand.DEVELOPER}\n` +
      `   _Code • Build • Innovate_\n\n` +
      `╰──────────────────╯\n\n` +
      `📢 *Official Channel*\n${brand.CHANNEL_URL}\n\n` +
      `_${brand.TAGLINE}_`;
    await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  },
};
