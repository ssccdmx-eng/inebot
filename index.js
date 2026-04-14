const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const bot = new TelegramBot(TOKEN, { polling: true });

let userData = {};

// ===== START =====
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

  // ===== FOTO =====
  if (msg.photo) {
    try {
      const fileId = msg.photo.pop().file_id;

      const fileUrl = await bot.getFileLink(fileId);

      const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync('foto.jpg', res.data);

      const upload = await cloudinary.uploader.upload('foto.jpg');
      const imageUrl = upload.secure_url;

      await generarPDF(chatId, imageUrl);

    } catch (err) {
      console.log(err);
      bot.sendMessage(chatId, "Error procesando la imagen");
    }
    return;
  }

  // ===== DATOS =====
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

  const script = app.open("https://github.com/ssccdmx-eng/inebot/raw/main/INE-2020.psd");
var doc = app.activeDocument;

function setText(n,v){
  try{ doc.layers.getByName(n).textItem.contents = v }catch(e){}
}

setText("NOMBRE","${data.nombre}");
setText("SEXO","${data.sexo}");
setText("DOMICILIO","${data.domicilio}");
setText("CURP","${data.curp}");
setText("CLAVE","${data.clave}");

// ===== FOTO =====
var img = app.open("${imageUrl}");
img.activeLayer.duplicate(doc);
img.close();

var newLayer = doc.activeLayer;
var target;
try {
  target = doc.layers.getByName("perfil");
} catch(e) {
  throw "No existe capa perfil";
}

newLayer.move(target, ElementPlacement.PLACEBEFORE);

// dimensiones
var b = newLayer.bounds;
var w = b[2]-b[0];
var h = b[3]-b[1];

var tb = target.bounds;
var tw = tb[2]-tb[0];
var th = tb[3]-tb[1];

// escala tipo cover
var scale = Math.max(tw/w, th/h) * 100;
newLayer.resize(scale, scale);

// centrar
b = newLayer.bounds;
var dx = (tb[0]+tw/2) - (b[0]+(b[2]-b[0])/2);
var dy = (tb[1]+th/2) - (b[1]+(b[3]-b[1])/2);

newLayer.translate(dx, dy);

// eliminar placeholder
target.remove();
newLayer.name = "perfil";

// ===== EXPORT =====
doc.saveToOE("pdf");

  try {
const response = await axios.post(
  "https://www.photopea.com/api/",
  { script: script },
  { responseType: 'arraybuffer' }
);

// DEBUG
console.log("Respuesta Photopea:", response.data.length);

// VALIDACIÓN
if (!response.data || response.data.length < 1000) {
  console.log("Photopea no devolvió PDF válido");
  return bot.sendMessage(chatId, "Error generando PDF (Photopea falló)");
}

fs.writeFileSync("resultado.pdf", response.data);

await bot.sendDocument(chatId, "resultado.pdf");

  } catch (err) {
    console.log(err);
    bot.sendMessage(chatId, "Error generando PDF");
  }
}
