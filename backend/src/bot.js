const { Telegraf, Markup } = require('telegraf');
const token = process.env.TELEGRAM_TOKEN || process.env.BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_TOKEN is missing in environment variables!');
}

const bot = new Telegraf(token);

const WEB_APP_URL = 'https://focus-delta-ten.vercel.app';

// Helper to escape MarkdownV2 special characters
const escapeMarkdown = (text) => {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};

bot.use(async (ctx, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📩 Bot received message: ${ctx.message?.text || 'non-text'}`);
  }
  return next();
});

bot.start((ctx) => {
  console.log('✅ /start command received');
  const welcomeMessage = 
    `Welcome to *Focus*\\. 🕊️\n\n` +
    `Your journey to a more organized and intentional life starts here\\. Focus is more than just a to\\-do list — it's your personal sanctuary for productivity\\.\n\n` +
    `*What you can do here:*\n` +
    `• ✨ Organize tasks in a beautiful Bento\\-style layout\\.\n` +
    `• 🛡️ Stay secure with email\\-verified account management\\.\n` +
    `• 🌙 Switch between Light and Dark modes for your comfort\\.\n` +
    `• 📱 Sync your tasks across all your devices\\.\n\n` +
    `Click the button below to launch the *Focus Web App* and start your productive day\\!`;

  ctx.replyWithMarkdownV2(
    welcomeMessage,
    Markup.inlineKeyboard([
      [Markup.button.webApp('Launch Focus', WEB_APP_URL)]
    ])
  ).catch(err => console.error('❌ Error replying to /start:', err.message));
});

bot.command('app', (ctx) => {
  ctx.reply('Launch the Focus Web App:', Markup.inlineKeyboard([
    [Markup.button.webApp('Launch Focus', WEB_APP_URL)]
  ]));
});

bot.help((ctx) => {
  ctx.reply('Focus Help:\n\n/start - Get started\n/app - Launch the web app\n\nIf you have issues, contact @FocusSupport.');
});

// Start the bot using long-polling for now (easiest for Render/Vercel balance)
bot.launch()
  .then(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🤖 Telegram Bot is running...');
    }
  })
  .catch((err) => {
    console.error('⚠️ Telegram Bot failed to start:', err.message);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
