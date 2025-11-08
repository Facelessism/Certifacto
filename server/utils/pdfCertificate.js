const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function generatePDFCertificate({
  templatePath,
  name,
  position,
  fontOptions = {},
  logoPath,
  signaturePath,
  footerText
}) {
  if (!fs.existsSync(templatePath)) throw new Error('Template file not found');

  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPage(0);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = fontOptions.size || 36;
  const textColor = fontOptions.color && Array.isArray(fontOptions.color) && fontOptions.color.length === 3
    ? rgb(fontOptions.color[0], fontOptions.color[1], fontOptions.color[2])
    : rgb(0, 0, 0);

  page.drawText(name, {
    x: position.x,
    y: position.y,
    size: fontSize,
    font,
    color: textColor
  });

  if (logoPath && fs.existsSync(logoPath)) {
    const logoBytes = fs.readFileSync(logoPath);
    const logoImg = logoPath.toLowerCase().endsWith('.png')
      ? await pdfDoc.embedPng(logoBytes)
      : await pdfDoc.embedJpg(logoBytes);

    page.drawImage(logoImg, {
      x: 20,
      y: page.getHeight() - 100,
      width: 80,
      height: 80
    });
  }

  if (signaturePath && fs.existsSync(signaturePath)) {
    const sigBytes = fs.readFileSync(signaturePath);
    const sigImg = signaturePath.toLowerCase().endsWith('.png')
      ? await pdfDoc.embedPng(sigBytes)
      : await pdfDoc.embedJpg(sigBytes);

    page.drawImage(sigImg, {
      x: page.getWidth() - 120,
      y: 40,
      width: 100,
      height: 50
    });
  }

  if (footerText) {
    const footerFontSize = 14;
    const textWidth = font.widthOfTextAtSize(footerText, footerFontSize);
    page.drawText(footerText, {
      x: (page.getWidth() - textWidth) / 2,
      y: 30,
      size: footerFontSize,
      font,
      color: textColor
    });
  }

  return await pdfDoc.save();
}

module.exports = { generatePDFCertificate };
