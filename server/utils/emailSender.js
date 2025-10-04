const nodemailer = require('nodemailer');

async function sendCertificateEmail({to, name, certBuffer, filename, smtpConfig}) {
  const transporter = nodemailer.createTransport(smtpConfig);

  await transporter.sendMail({
    from: smtpConfig.auth.user,
    to,
    subject: `Your Certificate`,
    text: `Hello ${name},\n\nPlease find your certificate attached.`,
    attachments: [
      {
        filename,
        content: certBuffer
      }
    ]
  });
}

module.exports = { sendCertificateEmail };