const fs = require('fs');
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

module.exports = async function generatePDF(data) {

  const qr = await QRCode.toDataURL(JSON.stringify(data));

  const barcode = await bwipjs.toBuffer({
    bcid: 'code128',
    text: data.curp,
    scale: 3,
    height: 10
  });

  const barcodeBase64 = `data:image/png;base64,${barcode.toString('base64')}`;

  let html = fs.readFileSync('./template.html', 'utf8');

  html = html
    .replace('{{nombre}}', data.nombre)
    .replace('{{paterno}}', data.paterno)
    .replace('{{materno}}', data.materno)
    .replace('{{fechaNacimiento}}', data.fechaNacimiento)
    .replace('{{sexo}}', data.sexo)
    .replace('{{curp}}', data.curp)
    .replace('{{domicilio}}', data.domicilio)
    .replace('{{seccion}}', data.seccion)
    .replace('{{registro}}', data.registro)
    .replace('{{vigencia}}', data.vigencia)
    .replace('{{foto}}', data.foto)
    .replace('{{firma}}', data.firma)
    .replace('{{qr}}', qr)
    .replace('{{barcode}}', barcodeBase64);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html);

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true
  });

  await browser.close();

  return pdf;
};
