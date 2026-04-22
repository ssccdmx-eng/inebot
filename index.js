const TelegramBot = require('node-telegram-bot-api');
const generatePDF = require('./generate');
const axios = require('axios');

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error('BOT_TOKEN no definido');
}

const bot = new TelegramBot(token, { polling: true });

const userState = {};
const userData = {};

const steps = [
  'nombre',
  'paterno',
  'materno',
  'fechaNacimiento',
  'sexo',
  'curp',
  'domicilio',
  'seccion',
  'registro',
  'vigencia',
  'foto',
  'firma'
];

const questions = {
  nombre: 'Nombre:',
  paterno: 'Apellido paterno:',
  materno: 'Apellido materno:',
  fechaNacimiento: 'Fecha nacimiento (DD/MM/AAAA):',
  sexo: 'Sexo (H/M):',
  curp: 'CURP:',
  domicilio: 'Domicilio completo:',
  seccion: 'Sección:',
  registro: 'Año de registro:',
  vigencia: 'Vigencia:',
  foto: 'Envía FOTO:',
  firma: 'Envía FIRMA:'
};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  userState[chatId] = 0;
  userData[chatId] = {};

  bot.sendMessage(chatId, 'Iniciando registro...\n' + questions[steps[0]]);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (!userState.hasOwnProperty(chatId)) return;

  const stepIndex = userState[chatId];
  const currentStep = steps[stepIndex];

  if (msg.text && currentStep !== 'foto' && currentStep !== 'firma') {
    userData[chatId][currentStep] = msg.text;
    userState[chatId]++;

    if (userState[chatId] < steps.length) {
      bot.sendMessage(chatId, questions[steps[userState[chatId]]]);
    }
  }

  if (msg.photo && (currentStep === 'foto' || currentStep === 'firma')) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFile(fileId);

    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    const base64 = Buffer.from(response.data).toString('base64');

    userData[chatId][currentStep] = `data:image/jpeg;base64,${base64}`;

    userState[chatId]++;

    if (userState[chatId] < steps.length) {
      bot.sendMessage(chatId, questions[steps[userState[chatId]]]);
    } else {
      bot.sendMessage(chatId, 'Generando credencial...');

      try {
        const pdf = await generatePDF(userData[chatId]);

        await bot.sendDocument(chatId, pdf, {}, {
          filename: 'credencial.pdf',
          contentType: 'application/pdf'
        });

        delete userState[chatId];
        delete userData[chatId];

      } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, 'Error generando PDF');
      }
    }
  }
});
