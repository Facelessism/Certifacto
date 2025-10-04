const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateCertificates } = require('../utils/generateCertificates');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post(
  '/generate',
  upload.fields([
    { name: 'template', maxCount: 1 },
    { name: 'names', maxCount: 1 },
    { name: 'font', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const templateFile = req.files.template[0];
      const namesFile = req.files.names[0];
      const fontFile = req.files.font && req.files.font[0];
      const logoFile = req.files.logo && req.files.logo[0];
      const signatureFile = req.files.signature && req.files.signature[0];
      const position = JSON.parse(req.body.position);
      const fontOptions = JSON.parse(req.body.fontOptions);
      const footerText = req.body.footerText || "";
      const sendEmails = req.body.sendEmails === "true";
      const smtpConfig = sendEmails ? JSON.parse(req.body.smtpConfig) : null;

      // Custom font upload
      if (fontFile) {
        const fontBuffer = fs.readFileSync(fontFile.path);
        fontOptions.fontBase64 = fontBuffer.toString('base64');
        fontOptions.fontExt = path.extname(fontFile.originalname).replace('.', '') || 'ttf';
      }

      const zipPath = await generateCertificates(
        templateFile,
        namesFile,
        position,
        fontOptions,
        logoFile,
        signatureFile,
        footerText,
        sendEmails,
        smtpConfig
      );

      res.download(zipPath, 'certificates.zip', () => {
        fs.unlinkSync(templateFile.path);
        fs.unlinkSync(namesFile.path);
        if (fontFile) fs.unlinkSync(fontFile.path);
        if (logoFile) fs.unlinkSync(logoFile.path);
        if (signatureFile) fs.unlinkSync(signatureFile.path);
        fs.unlinkSync(zipPath);
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Certificate generation failed.');
    }
  }
);

module.exports = router;