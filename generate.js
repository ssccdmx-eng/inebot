const puppeteer = require('puppeteer');
const fs = require('fs');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

async function generarPDF(chatId, data) {

  const qr = await QRCode.toDataURL(data.curp);

  const barcode = await bwipjs.toBuffer({
    bcid: 'code128',
    text: data.curp,
    scale: 3,
    height: 10
  });

  const barcodeBase64 = `data:image/png;base64,${barcode.toString('base64')}`;

  const mrz = `${data.paterno}<<${data.materno}<<${data.nombre}<<<<${data.curp}`;

  let html = fs.readFileSync('./template_full.html', 'utf8');

  const allData = {
    ...data,
    qr,
    barcode: barcodeBase64,
    mrz
  };

  Object.keys(allData).forEach(key => {
    html = html.replaceAll(`{{${key}}}`, allData[key] || '');
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: 'resultado.pdf',
    width: '1000px',
    height: '1300px',
    printBackground: true
  });

  await browser.close();
}

module.exports = generarPDF;
