const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const archiver = require('archiver');
const { extractNames } = require('./extractNames');
const { generatePDFCertificate } = require('./pdfCertificate');
const { sendCertificateEmail } = require('./emailSender');

function getSVGText({ name, position, fontOptions, boxWidth = 1200, boxHeight = 900, footerText }) {
  const family = fontOptions?.family || 'Arial';
  const size = fontOptions?.size || 48;
  const color = fontOptions?.color || '#222';
  const weight = fontOptions?.weight || 'normal';
  const alignment = fontOptions?.alignment || 'middle';
  const outlineColor = fontOptions?.outlineColor || 'none';
  const outlineWidth = fontOptions?.outlineWidth || 0;

  const textAnchor = alignment === 'left' ? 'start' : alignment === 'right' ? 'end' : 'middle';
  const strokeAttr = outlineWidth > 0 ? `stroke="${outlineColor}" stroke-width="${outlineWidth}"` : '';

  return `
    <svg width="${boxWidth}" height="${boxHeight}">
      <text 
        x="${position.x}" y="${position.y}" 
        font-size="${size}" font-family="${family}" font-weight="${weight}" fill="${color}" 
        text-anchor="${textAnchor}" ${strokeAttr} alignment-baseline="middle" dominant-baseline="middle"
      >${name}</text>
      <text 
        x="${boxWidth / 2}" y="${boxHeight - 30}" 
        font-size="18" fill="#222" text-anchor="middle"
      >${footerText || ''}</text>
    </svg>
  `;
}

async function generateCertificates(
  templateFile,
  namesFile,
  position,
  fontOptions,
  logoFile,
  signatureFile,
  footerText,
  sendEmails,
  smtpConfig
) {
  if (!fs.existsSync(templateFile.path)) throw new Error('Template file not found');
  if (!fs.existsSync(namesFile.path)) throw new Error('Names file not found');

  const names = await extractNames(namesFile);
  if (!names?.length) throw new Error('No valid names found in uploaded file');

  const ext = path.extname(templateFile.originalname).toLowerCase();
  const zipPath = path.join('uploads', `certificates_${Date.now()}.zip`);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip');

  archive.pipe(output);

  for (const { name, email } of names) {
    if (!name?.trim()) continue;

    let certBuffer, filename;

    try {
      if (ext === '.pdf') {
        certBuffer = await generatePDFCertificate({
          templatePath: templateFile.path,
          name,
          position,
          fontOptions,
          logoPath: logoFile?.path,
          signaturePath: signatureFile?.path,
          footerText
        });
        filename = `${name}.pdf`;
      } else {
        const svgText = getSVGText({ name, position, fontOptions, footerText });

        let img = sharp(templateFile.path).composite([
          { input: Buffer.from(svgText), top: 0, left: 0 }
        ]);

        if (logoFile?.path && fs.existsSync(logoFile.path)) {
          img = img.composite([{ input: logoFile.path, top: 20, left: 20 }]);
        }

        if (signatureFile?.path && fs.existsSync(signatureFile.path)) {
          img = img.composite([{ input: signatureFile.path, top: 820, left: 1080 }]);
        }

        certBuffer = await img.png().toBuffer();
        filename = `${name}.png`;
      }

      if (!certBuffer || !certBuffer.length) {
        console.warn(`Skipped empty certificate for ${name}`);
        continue;
      }

      console.log("Appending:", filename, certBuffer.length);

      archive.append(certBuffer, { name: filename });

      if (sendEmails && email?.trim()) {
        try {
          await sendCertificateEmail({
            to: email,
            name,
            certBuffer,
            filename,
            smtpConfig
          });
        } catch (err) {
          console.error(`Failed to send email to ${email}:`, err);
        }
      }

    } catch (err) {
      console.error(`Failed to generate certificate for ${name}:`, err);
    }
  }

  await new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
    archive.finalize();
  });

  return zipPath;
}

module.exports = { generateCertificates };
