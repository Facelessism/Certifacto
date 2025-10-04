const fs = require('fs');
const sharp = require('sharp');
const archiver = require('archiver');
const path = require('path');
const { extractNames } = require('./extractNames');
const { generatePDFCertificate } = require('./pdfCertificate');
const { sendCertificateEmail } = require('./emailSender');

function getFontFaceSVG(fontOptions) {
  if (fontOptions.fontBase64 && fontOptions.family && fontOptions.fontExt) {
    return `
      <style type="text/css">
        @font-face {
          font-family: '${fontOptions.family}';
          src: url('data:font/${fontOptions.fontExt};charset=utf-8;base64,${fontOptions.fontBase64}');
        }
      </style>
    `;
  }
  return '';
}

function getSVGText({
  name,
  position,
  fontOptions,
  boxWidth = 1000,
  boxHeight = 200,
  logoUrl,
  signatureUrl,
  footerText
}) {
  const {
    family = 'Arial',
    size = 48,
    color = '#222',
    weight = 'normal',
    alignment = 'middle',
    outlineColor = 'none',
    outlineWidth = 0,
    shadow = false,
    rotation = 0,
    letterSpacing = 'normal'
  } = fontOptions;

  const letterSpacingAttr = letterSpacing === 'normal' ? '' : `letter-spacing="${letterSpacing}"`;
  const shadowFilter = shadow
    ? `<filter id="shadow"><feDropShadow dx="4" dy="4" stdDeviation="2" flood-color="#222" /></filter>`
    : '';

  let textAnchor = 'middle';
  if (alignment === 'left') textAnchor = 'start';
  if (alignment === 'right') textAnchor = 'end';

  const strokeAttr = outlineWidth > 0 ? `stroke="${outlineColor}" stroke-width="${outlineWidth}"` : '';
  const fontFamilyAttr = family ? `font-family="${family}"` : '';
  const rotateAttr = rotation
    ? `transform="rotate(${rotation},${position.x},${position.y})"`
    : '';
  const fontFace = getFontFaceSVG(fontOptions);

  // For simplicity, logo/signature/footers are not shown in preview SVG, but are drawn in final image
  return `
    <svg width="${boxWidth}" height="${boxHeight}">
      <defs>
        ${fontFace}
        ${shadowFilter}
      </defs>
      <text
        x="${position.x}"
        y="${position.y}"
        font-size="${size}"
        ${fontFamilyAttr}
        font-weight="${weight}"
        fill="${color}"
        text-anchor="${textAnchor}"
        ${strokeAttr}
        ${letterSpacingAttr}
        ${rotateAttr}
        ${shadow ? 'filter="url(#shadow)"' : ''}
        alignment-baseline="middle"
        dominant-baseline="middle"
      >${name}</text>
      <text
        x="${boxWidth / 2}"
        y="${boxHeight - 30}"
        font-size="18"
        fill="#222"
        text-anchor="middle"
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
  const names = await extractNames(namesFile);
  const ext = path.extname(templateFile.originalname).toLowerCase();

  const zipPath = path.join('uploads', `certificates_${Date.now()}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip');
  archive.pipe(output);

  for (const entry of names) {
    const { name, email } = entry;
    let certBuffer, filename;
    if (ext === '.pdf') {
      certBuffer = await generatePDFCertificate({
        templatePath: templateFile.path,
        name,
        position,
        fontOptions,
        logoPath: logoFile && logoFile.path,
        signaturePath: signatureFile && signatureFile.path,
        footerText
      });
      filename = `${name}.pdf`;
    } else {
      // PNG/JPG template
      const svgText = getSVGText({
        name,
        position,
        fontOptions,
        boxWidth: 1200,
        boxHeight: 900,
        logoUrl: logoFile && logoFile.path,
        signatureUrl: signatureFile && signatureFile.path,
        footerText
      });
      let img = sharp(templateFile.path)
        .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }]);
      if (logoFile) {
        img = img.composite([{ input: logoFile.path, top: 20, left: 20 }]);
      }
      if (signatureFile) {
        img = img.composite([{ input: signatureFile.path, top: 820, left: 1080 }]);
      }
      certBuffer = await img.png().toBuffer();
      filename = `${name}.png`;
    }

    archive.append(certBuffer, { name: filename });

    // Send email if enabled and email is provided
    if (sendEmails && email) {
      await sendCertificateEmail({
        to: email,
        name,
        certBuffer,
        filename,
        smtpConfig
      });
    }
  }

  await archive.finalize();
  return zipPath;
}

module.exports = { generateCertificates };