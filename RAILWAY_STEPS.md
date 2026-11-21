# Deploy on Railway (GitHub -> Railway -> pairing website + Telegram)

## 1) Upload to GitHub
1. github.com -> New repository (Private) -> create.
2. Upload ALL files of this folder. `.gitignore` keeps secrets and sessions out
   (`telegram_token.txt` is NOT uploaded, so use the variable below).

## 2) Deploy on Railway
1. railway.com -> New Project -> Deploy from GitHub repo -> choose your repo.
2. Service -> Settings -> Networking -> **Generate Domain**. That domain is your pairing website.
3. **Volume (important):** Service -> Volumes -> New Volume, Mount path `/data`.
   Variables: `DATA_DIR` = `/data`  -> every linked WhatsApp stays linked after redeploys.
4. Variables for Telegram (optional but recommended):
   `TELEGRAM_BOT_TOKEN` = your token from @BotFather
   `TELEGRAM_OWNER_ID`  = your numeric Telegram id (optional)
5. Optional: `WEB_PASSWORD`, `MAX_SESSIONS`, `BOT_PREFIX`, `TIMEZONE`.

## 3) Pair (website)
1. Open `https://YOUR-DOMAIN.up.railway.app`
2. Type your number with country code (e.g. 923001234567) -> **Get Pairing Code**.
3. Copy the code -> WhatsApp -> Settings -> Linked Devices -> Link a Device ->
   *Link with phone number instead* -> paste the code.
4. The page shows "Linked successfully", send `.menu` in WhatsApp.

## 4) Pair (Telegram)
Open your Telegram bot, send `/pair 923001234567`, enter the code in WhatsApp.
Website and Telegram use the same sessions, so both work at the same time.

## 5) Many numbers
Each number gets its own bot session. There is no "already linked" error for other numbers any more.
Remove a number from Telegram with `/unpair 923001234567`.
Each session needs about 150-250 MB RAM, so choose your Railway plan accordingly.

## 6) Downloads
`.video`, `.ig`, `.apk` - see README_DOWNLOADS.md.

## 7) Stay online 24/7 (already built in)
- The bot runs under a supervisor: if it crashes, runs out of memory or you send `.restart`, it starts again by itself.
- Lost WhatsApp connection? It reconnects forever with a growing delay. It only stops if you REMOVE the device
  from WhatsApp -> Linked devices.
- Railway restart policy is set to ALWAYS (railway.json).
- IMPORTANT: add the Volume + `DATA_DIR=/data` (step 2.3). Without it every redeploy erases the login.
- The "started running" message is now sent only once, right after pairing (no more spam in your chat).
- Optional: `BOT_MAX_MB` = memory limit in MB after which the bot restarts itself cleanly.

## 8) New / fixed commands
- `.play`, `.play2`, `.song`, `.audio` : several download sources + local yt-dlp fallback (no more "status code 503").
- `.vv` (reply to a view-once photo/video/voice) and `.vv2` (sends it to your own chat) : rebuilt.
- `.gcantidelete on|off` : in that group, every deleted text / photo / video / voice / sticker / file is sent again in the same group.
- `.welcome on|off`, `.goodbye on|off`, `.setwelcome <text>`, `.setgoodbye <text>` (use @user {group} {count} {desc}).
- `.menu` always uses `assets/bot.jpg` (replace that file to change the menu picture).
