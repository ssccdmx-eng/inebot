const TelegramBot = require('node-telegram-bot-api');
const generarPDF = require('./generate');

const bot = new TelegramBot(process.env.TOKEN, { polling: true });

let userData = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userData[chatId] = {};
  bot.sendMessage(chatId, "Nombre:");
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (!userData[chatId]) return;

  const data = userData[chatId];

  if (!data.nombre) {
const partes = msg.text.split(" ");

data.nombre = partes[0] || "";
data.paterno = partes[1] || "";
data.materno = partes[2] || "";
    return bot.sendMessage(chatId, "Apellido paterno:");
  }

  if (!data.paterno) {
    data.paterno = msg.text;
    return bot.sendMessage(chatId, "Apellido materno:");
  }

  if (!data.materno) {
    data.materno = msg.text;
    return bot.sendMessage(chatId, "CURP:");
  }

  if (!data.curp) {
    data.curp = msg.text;
    return bot.sendMessage(chatId, "Clave:");
  }

  if (!data.clave) {
    data.clave = msg.text;

    // valores demo
    data.sexo = "H";
    data.estado = "CDMX";
    data.registro = "2020";
    data.seccion = "1234";
    data.vigencia = "2030";

    data.foto = "https://via.placeholder.com/200";
    data.fotoMini = data.foto;
    data.firma = data.foto;

    await generarPDF(data);

    await bot.sendDocument(chatId, "resultado.pdf");
  }
});
