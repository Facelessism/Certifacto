# Free Certificate Generator

Generate personalized certificates from image(png) or PDF templates and name lists. Supports advanced styling, bulk email sending, logos, signatures, responsive UI, and more!

## Features

- Upload image(png)/PDF templates
- Upload name lists (CSV, TXT, JSON, XLS/XLSX/ODS)
- Advanced styling: font, color, outline, shadow, rotation, etc.
- Add logo, signature, and footer
- Preview certificates before download
- Bulk email sending (SMTP)
- Responsive and accessible UI
- Open source

## Getting Started

Follow these steps to run the project locally.

### 1. Clone your forked repository

```bash
git clone https://github.com/your-name/Certifacto.git
cd Certifacto
```
### 2. Install frontend dependencies
```bash
cd client
npm install
```
### 3. Install backend dependencies
```bash
cd server
npm install
```
### 4. Start the server
```bash
npm start
```
### 5. Start frontend side in another terminal 
```bash
cd client
npm start
```

---

## Project Structure 
```bash
├── CODE_OF_CONDUCT.md
├── LICENSE
├── README.md
├── certificate_pdf.py
├── client
│   ├── package-lock.json
│   ├── package.json
│   ├── public
│   │   └── index.html
│   └── src
│       ├── App.js
│       ├── CertificateForm.css
│       ├── CertificateForm.js
│       ├── CertificatePreview.js
│       ├── MobileStyles.css
│       └── index.js
├── generateCertificates.js
├── name.txt
├── server
│   ├── package-lock.json
│   ├── package.json
│   ├── routes
│   │   └── certificate.js
│   ├── server.js
│   ├── uploads
│   │   ├── certificates_1765379569095.zip
│   │   ├── certificates_1765379593391.zip
│   │   └── certificates_1765379759767.zip
│   └── utils
│       ├── emailSender.js
│       ├── extractNames.js
│       ├── generateCertificates.js
│       └── pdfCertificate.js
└── template.png
```

## License

MIT License 
