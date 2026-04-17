const TelegramBot = require('node-telegram-bot-api');
const generatePDF = require('./generate');
const axios = require('axios');
const token = process.env.BOT_TOKEN;

console.log("TOKEN:", token);

if (!token) {
  console.error("❌ BOT_TOKEN no definido en Railway");
  process.exit(1); // termina limpio, sin loop infinito
}

const bot = new TelegramBot(token, { polling: true });

const userData = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  userData[chatId] = {};

  bot.sendMessage(chatId, '👤 Nombre:');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (!userData[chatId] || !msg.text) return;

  const data = userData[chatId];

  if (!data.nombre) {
    data.nombre = msg.text;
    return bot.sendMessage(chatId, 'Apellido paterno:');
  }

  if (!data.paterno) {
    data.paterno = msg.text;
    return bot.sendMessage(chatId, 'Apellido materno:');
  }

  if (!data.materno) {
    data.materno = msg.text;
    return bot.sendMessage(chatId, 'CURP:');
  }

  if (!data.curp) {
    data.curp = msg.text;
    return bot.sendMessage(chatId, 'Domicilio:');
  }

  if (!data.domicilio) {
    data.domicilio = msg.text;

    // valores base
    data.sexo = 'H';
    data.estado = 'CDMX';
    data.registro = '2020';
    data.seccion = '1234';
    data.vigencia = '2030';
    data.clave = 'ABC123456';

    return bot.sendMessage(chatId, '📸 Envía tu FOTO');
  }
});

bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  if (!userData[chatId]) return;

  try {
    const photo = msg.photo[msg.photo.length - 1];
    const file = await bot.getFile(photo.file_id);

    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data).toString('base64');

    const img = `data:image/jpeg;base64,${base64}`;

    userData[chatId].foto = img;
    userData[chatId].fotoMini = img;
    userData[chatId].firma = img;

    bot.sendMessage(chatId, '⚙️ Generando INE...');

    const pdf = await generatePDF(userData[chatId]);

    await bot.sendDocument(chatId, pdf);

    delete userData[chatId];

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Error generando PDF');
  }
});
