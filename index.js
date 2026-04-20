const TelegramBot = require('node-telegram-bot-api');
const generatePDF = require('./generate');
const axios = require('axios');

const token = process.env.BOT_TOKEN;

console.log("TOKEN:", token);

if (!token) {
  console.error("❌ BOT_TOKEN no definido");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const userData = {};
const TIMEOUT = 5 * 60 * 1000; // 5 min

function resetUser(chatId) {
  delete userData[chatId];
}

// ===== START =====
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  userData[chatId] = {
    step: 'nombre',
    ts: Date.now()
  };

  bot.sendMessage(chatId, '👤 Nombre:');
});

// ===== MENSAJES =====
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (!userData[chatId]) return;

  const data = userData[chatId];

  // ⏱ timeout
  if (Date.now() - data.ts > TIMEOUT) {
    resetUser(chatId);
    return bot.sendMessage(chatId, "⏰ Sesión expirada. Escribe /start");
  }

  data.ts = Date.now();

  // ⚠️ IMPORTANTE: ignorar fotos aquí
  if (!msg.text) return;

  try {

    if (data.step === 'nombre') {
      data.nombre = msg.text;
      data.step = 'paterno';
      return bot.sendMessage(chatId, 'Apellido paterno:');
    }

    if (data.step === 'paterno') {
      data.paterno = msg.text;
      data.step = 'materno';
      return bot.sendMessage(chatId, 'Apellido materno:');
    }

    if (data.step === 'materno') {
      data.materno = msg.text;
      data.step = 'curp';
      return bot.sendMessage(chatId, 'CURP:');
    }

    if (data.step === 'curp') {
      data.curp = msg.text.toUpperCase();
      data.step = 'domicilio';
      return bot.sendMessage(chatId, 'Domicilio:');
    }

    if (data.step === 'domicilio') {
      data.domicilio = msg.text;

      // valores base
      data.sexo = 'H';
      data.estado = 'CDMX';
      data.registro = '2020';
      data.seccion = '1234';
      data.vigencia = '2030';
      data.clave = 'ABC123456';

      data.step = 'foto';

      return bot.sendMessage(chatId, '📸 Envía tu FOTO');
    }

  } catch (err) {
    console.error("ERROR MESSAGE:", err);
    bot.sendMessage(chatId, "❌ Error procesando datos");
  }
});

// ===== FOTO =====
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;

  console.log("📸 FOTO RECIBIDA");

  if (!userData[chatId]) return;

  const data = userData[chatId];

  if (data.step !== 'foto') {
    return bot.sendMessage(chatId, "Primero completa los datos con /start");
  }

  try {
    const photo = msg.photo[msg.photo.length - 1];

    const file = await bot.getFile(photo.file_id);

    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    console.log("Descargando imagen...");

    const response = await axios.get(url, { responseType: 'arraybuffer' });

    const base64 = Buffer.from(response.data).toString('base64');

    const img = `data:image/jpeg;base64,${base64}`;

    data.foto = img;
    data.fotoMini = img;
    data.firma = img;

    console.log("Generando PDF...");

    bot.sendMessage(chatId, '⚙️ Generando PDF...');

    const filePath = await generatePDF(data);

    await bot.sendDocument(chatId, filePath);

    console.log("PDF enviado");

    resetUser(chatId);

  } catch (err) {
    console.error("ERROR FOTO:", err);
    bot.sendMessage(chatId, "❌ Error procesando la imagen");
  }
});
