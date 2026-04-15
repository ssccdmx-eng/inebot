const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

module.exports = async function generarPDF(data) {

  let html = fs.readFileSync('./template_full.html', 'utf8');

  html = html
    .replace('{{foto}}', data.foto || '')
    .replace('{{fotoMini}}', data.fotoMini || '')
    .replace('{{firma}}', data.firma || '')
    .replace('{{paterno}}', data.paterno || '')
    .replace('{{materno}}', data.materno || '')
    .replace('{{nombre}}', data.nombre || '')
    .replace('{{domicilio}}', data.domicilio || '')
    .replace('{{curp}}', data.curp || '')
    .replace('{{clave}}', data.clave || '')
    .replace('{{sexo}}', data.sexo || '')
    .replace('{{estado}}', data.estado || '')
    .replace('{{registro}}', data.registro || '')
    .replace('{{seccion}}', data.seccion || '')
    .replace('{{vigencia}}', data.vigencia || '')
    .replace(/{{qr}}/g, '')
    .replace('{{barcode}}', '')
    .replace('{{mrz}}', '');

  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  await page.setContent(html, {
  waitUntil: 'networkidle0'
});

await page.evaluate(() => {
  document.querySelectorAll('img').forEach(img => {
    img.src = img.src;
  });
});

  const filePath = path.join(__dirname, `output.pdf`);

  await page.pdf({
    path: filePath,
    width: '1000px',
    height: '630px',
    printBackground: true
  });

  await browser.close();

  return filePath;
};
