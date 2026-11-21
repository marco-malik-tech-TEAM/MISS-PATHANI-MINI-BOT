/**
 * Single place for the bot's branding. Change a value here and every
 * module that imports it (menu, channel forwarding, etc.) follows.
 */
const CHANNEL_INVITE = "0029VbE1PSOGzzKS8DCvLM32";

module.exports = {
  BOT_NAME: "MISS PATHANI MINI BOT",
  DEVELOPER: "Marco Malik",
  TEAM: "Miss Pathani Mini Bot",
  TAGLINE: "Premium Experience • Fast • Secure • 24/7 Online",

  WEBSITE_URL: process.env.WEBSITE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? "https://" + process.env.RAILWAY_PUBLIC_DOMAIN + "/pair" : "https://marco-waqar-md-mini-bot-pairing.up.railway.app/pair"),
  FOOTER: "Powered by Miss Pathani Mini Bot",

  // WhatsApp channel
  CHANNEL_INVITE,
  CHANNEL_URL: `https://whatsapp.com/channel/${CHANNEL_INVITE}`,
  CHANNEL_NAME: "MISS PATHANI MINI BOT",

  // WhatsApp group
  GROUP_URL: "https://chat.whatsapp.com/IHulRNuqUf4H7Xkk5nQH9J?s=cl&p=a&iam=2",

  // Telegram bug bot
  BUG_BOT_URL: "https://t.me/MarcoXWqarBugBot",
};
