const sharp = require('sharp');

async function generateCertificate(templatePath, name, position, outputPath) {
  await sharp(templatePath)
    .composite([{
      input: Buffer.from(
        `<svg><text x="${position.x}" y="${position.y}" font-size="48" fill="black">${name}</text></svg>`
      ),
      top: 0, left: 0
    }])
    .toFile(outputPath);
}