const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function generatePDFCertificate({ templatePath, name, position, fontOptions, logoPath, signaturePath, footerText }) {
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  const page = pdfDoc.getPage(0);
  // Draw name
  page.drawText(name, {
    x: position.x,
    y: position.y,
    size: fontOptions.size || 36,
    font: await pdfDoc.embedFont(StandardFonts.Helvetica),
    color: rgb(0, 0, 0)
  });

  // Draw logo
  if (logoPath) {
    const logoBytes = fs.readFileSync(logoPath);
    const logoImg = await pdfDoc.embedPng(logoBytes);
    page.drawImage(logoImg, {
      x: 20,
      y: page.getHeight() - 100,
      width: 80,
      height: 80
    });
  }

  // Draw signature
  if (signaturePath) {
    const sigBytes = fs.readFileSync(signaturePath);
    const sigImg = await pdfDoc.embedPng(sigBytes);
    page.drawImage(sigImg, {
      x: page.getWidth() - 120,
      y: 40,
      width: 100,
      height: 50
    });
  }

  // Draw footer
  if (footerText) {
    page.drawText(footerText, {
      x: page.getWidth() / 2 - 100,
      y: 30,
      size: 14,
      font: await pdfDoc.embedFont(StandardFonts.Helvetica),
      color: rgb(0, 0, 0)
    });
  }

  return await pdfDoc.save();
}

module.exports = { generatePDFCertificate };