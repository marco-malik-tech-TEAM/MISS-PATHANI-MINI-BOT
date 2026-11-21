"use strict";
const audioFetch = require("../utils/audioFetch");
module.exports = {
  name: "audio",
  aliases: [],
  description: "Search and download audio from YouTube. Usage: .audio <song name or link>",
  async execute(sock, msg, args) {
    return audioFetch.run(sock, msg, (args || []).join(" "), "song", "🎵 *MISS PATHANI MINI BOT AUDIO*\n\nExample:\n.audio Shape of You");
  },
};
