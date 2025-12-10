import React, { useState, useRef, useEffect } from "react";
import CertificatePreview from "./CertificatePreview";
import './CertificateForm.css';

const fontFamilies = ["Arial", "Times New Roman", "Georgia", "Verdana", "Cursive", "Comic Sans MS", "Courier New"];
const fontWeights = ["normal", "bold", "lighter"];

export default function CertificateForm() {
  const [template, setTemplate] = useState(null);
  const [namesFile, setNamesFile] = useState(null);
  const [fontFile, setFontFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [footerText, setFooterText] = useState("");
  const [sendEmails, setSendEmails] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({ host: "", port: 587, user: "", pass: "" });
  const [position, setPosition] = useState({ x: 600, y: 450 });
  const [fontOptions, setFontOptions] = useState({
    family: "Arial",
    size: 48,
    color: "#e0e0e0",
    weight: "normal",
    alignment: "center",
    outlineColor: "#ffffff",
    outlineWidth: 0,
    shadow: false,
    rotation: 0,
    letterSpacing: "normal"
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewImages, setPreviewImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadLink, setDownloadLink] = useState("");
  const canvasRef = useRef();

  const handleFileChange = (setter) => (e) => {
    const file = e.target.files[0];
    setter(file);
    if (setter === setTemplate && file) {
      if (file.type === "application/pdf") {
        alert("PDF templates cannot be previewed. Upload PNG/JPG.");
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      return () => URL.revokeObjectURL(url);
    }

    };

  const handleCanvasClick = (e) => {
    setPosition({
      x: Math.round(e.nativeEvent.offsetX),
      y: Math.round(e.nativeEvent.offsetY)
    });
  };

  const handleFontOptionChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFontOptions(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSmtpChange = (e) => {
    const { name, value } = e.target;
    setSmtpConfig(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !previewUrl) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.save();
      if (fontOptions.rotation) {
        ctx.translate(position.x, position.y);
        ctx.rotate((fontOptions.rotation * Math.PI) / 180);
      }

      ctx.font = `${fontOptions.weight} ${fontOptions.size}px ${fontOptions.family}`;
      ctx.fillStyle = fontOptions.color;
      ctx.textAlign = fontOptions.alignment;
      ctx.textBaseline = "middle";
      if (fontOptions.outlineWidth > 0) {
        ctx.strokeStyle = fontOptions.outlineColor;
        ctx.lineWidth = fontOptions.outlineWidth;
        ctx.strokeText("NAME HERE", position.x, position.y);
      }
      if (fontOptions.shadow) {
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
      }
      if (fontOptions.letterSpacing === "normal") {
        ctx.fillText("NAME HERE", 0, 0);
      } else {
        let x = position.x;
        const spacing = Number(fontOptions.letterSpacing);
        "NAME HERE".split("").forEach(char => {
          ctx.fillText(char, x, position.y);
          x += ctx.measureText(char).width + spacing;
        });
      }

      ctx.restore();

      if (logoFile) {
        const logoImg = new Image();
        logoImg.src = URL.createObjectURL(logoFile);
        logoImg.onload = () => ctx.drawImage(logoImg, 20, 20, 80, 80);
      }
      if (signatureFile) {
        const sigImg = new Image();
        sigImg.src = URL.createObjectURL(signatureFile);
        sigImg.onload = () => ctx.drawImage(sigImg, 1080, 820, 100, 50);
      }

      if (footerText) {
        ctx.font = "18px Arial";
        ctx.fillStyle = "#e0e0e0";
        ctx.textAlign = "center";
        ctx.fillText(footerText, canvas.width / 2, canvas.height - 30);
      }
    };
  }, [previewUrl, position, fontOptions, logoFile, signatureFile, footerText]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!template || !namesFile) return alert("Template and names file are required.");
    setIsGenerating(true);

    const formData = new FormData();
    formData.append("template", template);
    formData.append("names", namesFile);
    fontFile && formData.append("font", fontFile);
    logoFile && formData.append("logo", logoFile);
    signatureFile && formData.append("signature", signatureFile);
    formData.append("position", JSON.stringify(position));
    formData.append("fontOptions", JSON.stringify(fontOptions));
    formData.append("footerText", footerText);
    formData.append("sendEmails", sendEmails);
    formData.append("smtpConfig", JSON.stringify({
      host: smtpConfig.host,
      port: Number(smtpConfig.port),
      auth: { user: smtpConfig.user, pass: smtpConfig.pass }
    }));

    try {
      const res = await fetch("http://localhost:3001/api/certificate/generate", { method: "POST", body: formData });
      if (res.ok) {
        const blob = await res.blob();
        setDownloadLink(window.URL.createObjectURL(blob));
      } else {
        alert("Certificate generation failed. Check your files and backend logs.");
      }
    } catch {
      alert("Error connecting to backend.");
    }

    setIsGenerating(false);
  };

  return (
    <form className="certificate-form" onSubmit={handleGenerate} aria-label="Certificate Generator Form">
      <div className="form-group">
        <label>Certificate Template (PNG/JPG/PDF):
          <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={handleFileChange(setTemplate)} required />
        </label>
      </div>

      {previewUrl && (
        <div className="canvas-wrapper" onClick={handleCanvasClick}>
          <canvas ref={canvasRef} width={1200} height={900} aria-label="Certificate Preview Canvas" />
        </div>
      )}

      <div className="form-group">
        <label>Name List (CSV, TXT, JSON, XLS/XLSX/ODS):
          <input type="file" accept=".csv,.txt,.json,.xls,.xlsx,.ods" onChange={handleFileChange(setNamesFile)} required />
        </label>
      </div>

      <div className="form-group">
        <label>Custom Font (TTF/OTF, optional):
          <input type="file" accept=".ttf,.otf" onChange={handleFileChange(setFontFile)} />
        </label>
      </div>

      <div className="form-group">
        <label>Logo/Image (PNG/JPG, optional):
          <input type="file" accept="image/png,image/jpeg" onChange={handleFileChange(setLogoFile)} />
        </label>
      </div>

      <div className="form-group">
        <label>Signature (PNG/JPG, optional):
          <input type="file" accept="image/png,image/jpeg" onChange={handleFileChange(setSignatureFile)} />
        </label>
      </div>

      <div className="form-group">
        <label>Footer Text:
          <input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} />
        </label>
      </div>

      <fieldset className="advanced-options">
        <legend>Advanced Styling</legend>
        <div className="option-row">
          <label>Font Family:
            <select name="family" value={fontOptions.family} onChange={handleFontOptionChange}>
              {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label>Font Weight:
            <select name="weight" value={fontOptions.weight} onChange={handleFontOptionChange}>
              {fontWeights.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </label>
          <label>Font Size:
            <input name="size" type="number" value={fontOptions.size} min={12} max={200} onChange={handleFontOptionChange} />
          </label>
          <label>Font Color:
            <input name="color" type="color" value={fontOptions.color} onChange={handleFontOptionChange} />
          </label>
          <label>Alignment:
            <select name="alignment" value={fontOptions.alignment} onChange={handleFontOptionChange}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
        <div className="option-row">
          <label>Outline Color:
            <input name="outlineColor" type="color" value={fontOptions.outlineColor} onChange={handleFontOptionChange} />
          </label>
          <label>Outline Width:
            <input name="outlineWidth" type="number" value={fontOptions.outlineWidth} min={0} max={20} onChange={handleFontOptionChange} />
          </label>
          <label>Shadow:
            <input name="shadow" type="checkbox" checked={fontOptions.shadow} onChange={handleFontOptionChange} />
          </label>
          <label>Rotation (deg):
            <input name="rotation" type="number" value={fontOptions.rotation} min={0} max={360} onChange={handleFontOptionChange} />
          </label>
          <label>Letter Spacing (px):
            <input name="letterSpacing" type="number" value={fontOptions.letterSpacing === "normal" ? 0 : fontOptions.letterSpacing} min={0} max={50} onChange={e => handleFontOptionChange({ target: { name: "letterSpacing", value: e.target.value === "0" ? "normal" : e.target.value } })} />
          </label>
        </div>
      </fieldset>

      <div className="form-group">
        <label>Bulk Email Sending:
          <input type="checkbox" checked={sendEmails} onChange={e => setSendEmails(e.target.checked)} />
        </label>
        {sendEmails && (
          <fieldset className="smtp-config">
            <legend>SMTP Config</legend>
            <label>SMTP Host: <input name="host" type="text" value={smtpConfig.host} onChange={handleSmtpChange} required /></label>
            <label>Port: <input name="port" type="number" value={smtpConfig.port} onChange={handleSmtpChange} required /></label>
            <label>Username: <input name="user" type="text" value={smtpConfig.user} onChange={handleSmtpChange} required /></label>
            <label>Password: <input name="pass" type="password" value={smtpConfig.pass} onChange={handleSmtpChange} required /></label>
          </fieldset>
        )}
      </div>

      <button type="submit" disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Generate Certificates"}
      </button>

      {previewImages.length > 0 && <CertificatePreview previews={previewImages} />}
      {downloadLink && (
        <div className="download-link">
          <a href={downloadLink} download="certificates.zip">Download Certificates ZIP</a>
        </div>
      )}
    </form>
  );
}
