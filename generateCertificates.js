const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
async function generateCertificates({
  templatePath,
  names,
  position = { x: 600, y: 450 },
  fontOptions = { family: 'Arial', size: 48, color: '#000000', weight: 'normal' },
  logoPath = null,
  signaturePath = null,
  footerText = '',
  outputDir = './output'
}) 
{
  if (!fs.existsSync(templatePath)) throw new Error('Template not found');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const generatedFiles = [];

  for (const entry of names) {
    const { name } = entry;
    const sanitizedFilename = name.replace(/\s+/g, '_') + path.extname(templatePath);
    const outputPath = path.join(outputDir, sanitizedFilename);

    let svgContent = `<svg width="1200" height="900">
      <style>
        .name { 
          font-family: '${fontOptions.family}'; 
          font-size: ${fontOptions.size}px; 
          fill: ${fontOptions.color}; 
          font-weight: ${fontOptions.weight};
          text-anchor: middle;
          dominant-baseline: middle;
        }
        .footer {
          font-family: '${fontOptions.family}'; 
          font-size: 18px; 
          fill: ${fontOptions.color}; 
          text-anchor: middle;
        }
      </style>
      <text x="${position.x}" y="${position.y}" class="name">${name}</text>`;

    if (footerText) {
      svgContent += `<text x="600" y="880" class="footer">${footerText}</text>`;
    }

    svgContent += `</svg>`;

    try {
      let image = sharp(templatePath);

      if (logoPath && fs.existsSync(logoPath)) {
        const logoBuffer = await sharp(logoPath).resize(80, 80).toBuffer();
        image = image.composite([{ input: logoBuffer, top: 20, left: 20 }]);
      }

      if (signaturePath && fs.existsSync(signaturePath)) {
        const sigBuffer = await sharp(signaturePath).resize(100, 50).toBuffer();
        image = image.composite([{ input: sigBuffer, top: 820, left: 1080 }]);
      }

      image = image.composite([{ input: Buffer.from(svgContent), top: 0, left: 0 }]);
      await image.toFile(outputPath);
      generatedFiles.push(outputPath);
    } catch (err) {
      console.error(`Failed to generate certificate for ${name}:`, err);
    }
  }

  return generatedFiles;
}


module.exports = { generateCertificates };
