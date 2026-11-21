# MISS PATHANI MINI BOT - Premium V12 changes
- Brand: every "MARCO X WAQAR ..." name is now "MISS PATHANI MINI BOT". Developer name stays "Marco Malik" (co-owner lines removed).
- Images: bot.jpg / script.jpg / thumb.jpg / telegram_start.jpg / web dp.jpg = the new Miss Pathani picture (both main bot and bot2).
- `.menu` = premium image card + buttons: "Open Menu" dropdown (all categories), Ping, Owner, Join Channel.
  Pick a category -> every command of that category appears as a tappable row. Commands not in any category go to "MORE".
  `.menu all` = full text list. `.menutype button|list` switches premium / classic.
- `.play <song>` = search -> thumbnail card with two buttons: Audio (MP3) and Video (MP4).
- Any tapped button/row is turned into a normal command (events/messages.js), so it works like typing it.
- If WhatsApp refuses interactive buttons, the bot falls back to a clean text menu automatically.
- New file: utils/ui.js (button helper).

## Update 2 - Admin panel, owner, toggles
- Owner number 923314990867 added to the default owner list (config/config.js).
- Admin panel: open https://YOUR-DOMAIN/admin  (login with the admin email + password).
  Shows page views, unique visitors, every number that asked for a pairing code, status (running / linked / not linked),
  first/last seen, activity log. Actions: Remove bot (logs the bot out of that WhatsApp + deletes session), Block / Unblock.
  Change the login with Railway variables ADMIN_EMAIL and ADMIN_PASSWORD (recommended).
- Pairing page now tells users that their number is recorded by the administrator.
- All on|off commands show ON / OFF buttons when used without an argument.
- "Waqar" / "Writes" names removed. Website link can be set with WEBSITE_URL variable.
