require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const generatePDF = require('./generate');

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error('BOT_TOKEN no definido');
}

const bot = new TelegramBot(token, { polling: true });

const userData = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  userData[chatId] = { step: 'nombre' };

  bot.sendMessage(chatId, 'Nombre(s):');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const data = userData[chatId];

  if (!data) return;

  try {
    // ===== FLUJO =====

    if (data.step === 'nombre') {
      data.nombre = msg.text;
      data.step = 'apellido';
      return bot.sendMessage(chatId, 'Apellidos:');
    }

    if (data.step === 'apellido') {
      data.apellido = msg.text;
      data.step = 'curp';
      return bot.sendMessage(chatId, 'CURP:');
    }

    if (data.step === 'curp') {
      data.curp = msg.text.toUpperCase();
      data.step = 'foto';
      return bot.sendMessage(chatId, 'Envía tu foto');
    }

    if (data.step === 'foto' && msg.photo) {
      const fileId = msg.photo.pop().file_id;
      const file = await bot.getFile(fileId);

      data.foto = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

      bot.sendMessage(chatId, 'Generando PDF...');

      const pdf = await generatePDF(data);

      await bot.sendDocument(chatId, pdf);

      delete userData[chatId];
    }

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Error procesando datos');
  }
});
