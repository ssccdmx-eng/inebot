const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// ===== CONFIG =====
const 8754289463:AAE5_F4YndS-FtdbuKFr4yPSTQnEex23Aug = process.env.TOKEN;

cloudinary.config({
  dxfen4592: process.env.CLOUD_NAME,
  792593878287826: process.env.API_KEY,
  mQ_BSa_8txx5tud5s5B1_3kXj3g: process.env.API_SECRET
});

const bot = new TelegramBot(8754289463:AAE5_F4YndS-FtdbuKFr4yPSTQnEex23Aug, { polling: true });

let userData = {};

// ===== INICIO =====
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userData[chatId] = { step: 'nombre' };
  bot.sendMessage(chatId, "Nombre:");
});

// ===== FLUJO =====
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (!userData[chatId]) return;

  let step = userData[chatId].step;

  if (msg.photo) {
    try {
      const fileId = msg.photo.pop().file_id;
      const file = await bot.getFileLink(fileId);

      const res = await axios.get(file.href, { responseType: 'arraybuffer' });
      fs.writeFileSync('foto.jpg', res.data);

      // subir imagen
      const upload = await cloudinary.uploader.upload('foto.jpg');
      const imageUrl = upload.secure_url;

      await generarPDF(chatId, imageUrl);

    } catch (err) {
      console.log(err);
      bot.sendMessage(chatId, "Error procesando imagen");
    }
    return;
  }

  if (step === 'nombre') {
    userData[chatId].nombre = msg.text;
    userData[chatId].step = 'sexo';
    bot.sendMessage(chatId, "Sexo:");
  } 
  else if (step === 'sexo') {
    userData[chatId].sexo = msg.text;
    userData[chatId].step = 'domicilio';
    bot.sendMessage(chatId, "Domicilio:");
  }
  else if (step === 'domicilio') {
    userData[chatId].domicilio = msg.text;
    userData[chatId].step = 'curp';
    bot.sendMessage(chatId, "CURP:");
  }
  else if (step === 'curp') {
    userData[chatId].curp = msg.text;
    userData[chatId].step = 'clave';
    bot.sendMessage(chatId, "Clave:");
  }
  else if (step === 'clave') {
    userData[chatId].clave = msg.text;
    userData[chatId].step = 'foto';
    bot.sendMessage(chatId, "Envía la foto:");
  }
});

// ===== PHOTOPEA =====
async function generarPDF(chatId, imageUrl) {

  const data = userData[chatId];

  const script = `
  app.open("https://github.com/ssccdmx-eng/inebot/blob/main/INE%202020.psd");
  var doc = app.activeDocument;

  function setText(n,v){
    try{ doc.layers.getByName(n).textItem.contents = v }catch(e){}
  }

  setText("NOMBRE","${data.nombre}");
  setText("SEXO","${data.sexo}");
  setText("DOMICILIO","${data.domicilio}");
  setText("CURP","${data.curp}");
  setText("CLAVE","${data.clave}");

// ===== FOTO (AJUSTE PROFESIONAL) =====
var img = app.open("${imageUrl}");
var docW = doc.width;
var docH = doc.height;

// copiar imagen
img.activeLayer.duplicate(doc);
img.close();

var newLayer = doc.activeLayer;

// buscar capa destino
var target = doc.layers.getByName("perfil");

// mover encima del target
newLayer.move(target, ElementPlacement.PLACEBEFORE);

// ===== ESCALAR AUTOMÁTICO =====
var bounds = newLayer.bounds;
var w = bounds[2] - bounds[0];
var h = bounds[3] - bounds[1];

// tamaño del marco (perfil)
var tb = target.bounds;
var tw = tb[2] - tb[0];
var th = tb[3] - tb[1];

// escala tipo "cover"
var scale = Math.max(tw / w, th / h) * 100;
newLayer.resize(scale, scale);

// centrar
bounds = newLayer.bounds;
var dx = (tb[0] + tw/2) - (bounds[0] + (bounds[2]-bounds[0])/2);
var dy = (tb[1] + th/2) - (bounds[1] + (bounds[3]-bounds[1])/2);

newLayer.translate(dx, dy);

// eliminar placeholder viejo
try {
    target.remove();
} catch(e){}

// renombrar
newLayer.name = "perfil";

  // ===== EXPORT =====
  doc.saveToOE("pdf");
  `;

  const response = await axios.post("https://www.photopea.com/api/", {
    script: script
  }, { responseType: 'arraybuffer' });

  fs.writeFileSync("resultado.pdf", response.data);

  await bot.sendDocument(chatId, "resultado.pdf");
}
