const puppeteer = require('puppeteer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

module.exports = async function (data) {

  // 🧠 recorte inteligente (centrado tipo rostro)
  const foto = await sharp(data.fotoBuffer)
    .resize(260, 320, {
      fit: 'cover',
      position: 'centre'
    })
    .jpeg({ quality: 95 })
    .toBuffer();

  const fotoBase64 = `data:image/jpeg;base64,${foto.toString('base64')}`;

  // fondo frente
  const frontBase64 = fs.readFileSync(
    path.join(__dirname, 'front.png'),
    { encoding: 'base64' }
  );

  // fondo reverso (usa tu back.png si lo tienes)
  let backBase64 = '';
  try {
    backBase64 = fs.readFileSync(
      path.join(__dirname, 'back.png'),
      { encoding: 'base64' }
    );
  } catch {}

  let html = fs.readFileSync(
    path.join(__dirname, 'template.html'),
    'utf8'
  );

  html = html
    .replace(/{{foto}}/g, fotoBase64)
    .replace('{{nombre}}', data.nombre || '')
    .replace('{{paterno}}', data.paterno || '')
    .replace('{{materno}}', data.materno || '')
    .replace('{{curp}}', data.curp || '')
    .replace('front.png', `data:image/png;base64,${frontBase64}`)
    .replace('back.png', `data:image/png;base64,${backBase64}`);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    width: '860px',
    height: '1080px', // frente + reverso
    printBackground: true
  });

  await browser.close();

  return pdf;
};
