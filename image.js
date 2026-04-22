const sharp = require('sharp');

module.exports.processPhoto = async (buffer) => {

  const image = sharp(buffer);
  const metadata = await image.metadata();

  const width = metadata.width;
  const height = metadata.height;

  // 🧠 recorte tipo rostro (centro vertical)
  const cropWidth = Math.min(width, height * 0.75);
  const cropHeight = cropWidth * 1.25;

  const left = (width - cropWidth) / 2;
  const top = (height - cropHeight) / 3;

  return await image
    .extract({
      left: Math.max(0, Math.floor(left)),
      top: Math.max(0, Math.floor(top)),
      width: Math.floor(cropWidth),
      height: Math.floor(cropHeight)
    })
    .resize(400, 500)
    .jpeg()
    .toBuffer();
};
