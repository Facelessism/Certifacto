const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateCertificatesBatch(templatePath, names, position, options = {}) {
  const {
    outputDir = './output',
    fontSize = 48,
    fontColor = 'black',
    suffix = ''
  } = options;

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const generatedFiles = [];

  for (const entry of names) {
    const { name } = entry;
    const sanitizedFilename = name.replace(/\s+/g, '_') + suffix + path.extname(templatePath);
    const outputPath = path.join(outputDir, sanitizedFilename);

    const svgText = `<svg width="1200" height="900">
      <text x="${position.x}" y="${position.y}" font-size="${fontSize}" fill="${fontColor}" 
        text-anchor="middle" alignment-baseline="middle">${name}</text>
    </svg>`;

    try {
      await sharp(templatePath)
        .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
        .toFile(outputPath);

      generatedFiles.push(outputPath);
    } catch (err) {
      console.error(`Failed to generate certificate for ${name}:`, err);
    }
  }

  return generatedFiles;
}

module.exports = { generateCertificatesBatch };
