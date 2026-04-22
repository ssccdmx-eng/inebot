const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const generatePDF = require('./generate');
const { processPhoto } = require('./image');
const { validateCURP } = require('./validate');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const steps = [
  'nombre','paterno','materno','fechaNacimiento',
  'sexo','curp','domicilio','foto','firma'
];

const user = {};

bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  user[id] = { step: 0, data: {} };
  bot.sendMessage(id, 'Nombre:');
});

bot.on('message', async (msg) => {
  const id = msg.chat.id;
  if (!user[id]) return;

  const step = steps[user[id].step];

  try {

    if (msg.text && step !== 'foto' && step !== 'firma') {

      if (step === 'curp' && !validateCURP(msg.text)) {
        return bot.sendMessage(id, 'CURP inválida');
      }

      user[id].data[step] = msg.text;
      user[id].step++;

      const next = steps[user[id].step];
      return bot.sendMessage(id, `Ingresa ${next}`);
    }

    if (msg.photo && (step === 'foto' || step === 'firma')) {

      const fileId = msg.photo.pop().file_id;
      const file = await bot.getFile(fileId);

      const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const res = await axios.get(url, { responseType: 'arraybuffer' });

      if (step === 'foto') {
        user[id].data.foto = await processPhoto(res.data);
      } else {
        user[id].data.firma = res.data;
      }

      user[id].step++;

      if (user[id].step >= steps.length) {
        const pdf = await generatePDF(user[id].data);
        await bot.sendDocument(id, pdf);
        delete user[id];
      } else {
        bot.sendMessage(id, `Ingresa ${steps[user[id].step]}`);
      }
    }

  } catch (e) {
    console.error(e);
    bot.sendMessage(id, 'Error');
  }
});
