const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');

module.exports = async function generatePDF(data) {
  const doc = new PDFDocument({
    size: [1016, 640], // tamaño horizontal tipo credencial escalada
    margin: 0
  });

  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  // ===== CARGAR FONDOS =====
  const front = fs.readFileSync('./front.png');
  const back = fs.readFileSync('./back.png');

  // ===== FOTO =====
  const response = await axios.get(data.foto, { responseType: 'arraybuffer' });
  const foto = Buffer.from(response.data);

  // ===== QR (LIGERO) =====
  const qrData = `${data.curp}|${data.nombre}`;
  const qr = await QRCode.toBuffer(qrData, { width: 140 });

  // =========================
  // 🪪 FRENTE
  // =========================
  doc.image(front, 0, 0, { width: 1016 });

  // FOTO PRINCIPAL
  doc.image(foto, 80, 200, {
    width: 220,
    height: 260
  });

  // TEXTO
  doc.fillColor('black');

  doc.fontSize(32).text(data.apellido || '', 340, 260);
  doc.fontSize(32).text(data.nombre || '', 340, 300);

  doc.fontSize(22).text(`CURP: ${data.curp}`, 340, 360);

  // FOTO MINI
  doc.image(foto, 720, 200, {
    width: 120,
    height: 140
  });

  // =========================
  // 🪪 PARTE TRASERA
  // =========================
  doc.addPage({ size: [1016, 640], margin: 0 });

  doc.image(back, 0, 0, { width: 1016 });

  // QR
  doc.image(qr, 120, 220, { width: 180 });

  // TEXTO GENÉRICO
  doc.fontSize(18)
     .fillColor('black')
     .text(data.nombre || '', 350, 260);

  doc.text(data.curp || '', 350, 300);

  // MARCA DE SEGURIDAD
  doc.fillColor('red')
     .fontSize(50)
     .rotate(-20, { origin: [300, 300] })
     .text('DOCUMENTO DEMO', 200, 300, {
       opacity: 0.3
     });

  doc.end();

  return await new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
};
