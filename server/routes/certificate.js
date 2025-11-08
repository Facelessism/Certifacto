const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateCertificates } = require('../utils/generateCertificates');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

function safeUnlink(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } 
    catch (err) { console.error(`Failed to delete ${filePath}:`, err); }
  }
}

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
    let templateFile, namesFile, fontFile, logoFile, signatureFile, zipPath;

    try {
      templateFile = req.files?.template?.[0];
      namesFile = req.files?.names?.[0];
      fontFile = req.files?.font?.[0];
      logoFile = req.files?.logo?.[0];
      signatureFile = req.files?.signature?.[0];

      if (!templateFile || !namesFile) {
        return res.status(400).json({ error: 'Template and names files are required.' });
      }

      let position = { x: 600, y: 450 };
      let fontOptions = {};
      try { if (req.body.position) position = JSON.parse(req.body.position); } 
      catch { return res.status(400).json({ error: 'Invalid position data.' }); }
      try { if (req.body.fontOptions) fontOptions = JSON.parse(req.body.fontOptions); } 
      catch { return res.status(400).json({ error: 'Invalid fontOptions data.' }); }

      const footerText = req.body.footerText || '';
      const sendEmails = req.body.sendEmails === 'true';
      let smtpConfig = null;
      if (sendEmails && req.body.smtpConfig) {
        try { smtpConfig = JSON.parse(req.body.smtpConfig); } 
        catch { return res.status(400).json({ error: 'Invalid SMTP config.' }); }
      }

      if (fontFile) {
        const fontBuffer = fs.readFileSync(fontFile.path);
        fontOptions.fontBase64 = fontBuffer.toString('base64');
        fontOptions.fontExt = path.extname(fontFile.originalname).replace('.', '') || 'ttf';
      }

      zipPath = await generateCertificates(
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

      res.download(zipPath, 'certificates.zip', (err) => {
        if (err) console.error('Download error:', err);
      });

    } catch (err) {
      console.error('Certificate generation failed:', err);
      res.status(500).json({ error: err.message || 'Certificate generation failed.' });
    } finally {
      [templateFile, namesFile, fontFile, logoFile, signatureFile].forEach(f => safeUnlink(f?.path));
      safeUnlink(zipPath);
    }
  }
);

module.exports = router;
